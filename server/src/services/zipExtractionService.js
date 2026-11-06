import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import yauzl from 'yauzl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurable Security Limits
export const MAX_EXTRACTED_TOTAL_SIZE = parseInt(process.env.MAX_EXTRACTED_TOTAL_SIZE, 10) || 524288000; // 500 MiB
export const MAX_EXTRACTED_FILE_SIZE = parseInt(process.env.MAX_EXTRACTED_FILE_SIZE, 10) || 52428800;   // 50 MiB
export const MAX_ARCHIVE_ENTRIES = parseInt(process.env.MAX_ARCHIVE_ENTRIES, 10) || 10000;             // 10,000 entries
export const MAX_COMPRESSION_RATIO = parseInt(process.env.MAX_COMPRESSION_RATIO, 10) || 100;           // 100:1 ratio

// Directories to skip during analysis extraction
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
]);

// Operating-system metadata files to skip
const IGNORED_FILES = new Set([
  '.ds_store',
  'thumbs.db',
  'desktop.ini',
]);

// In-memory concurrency tracker to prevent duplicate concurrent jobs
const activeExtractions = new Set();

/**
 * Acquire an atomic extraction lock for a project.
 * Returns the lock token if acquisition succeeded, otherwise null.
 */
export const acquireExtractionLock = async (projectId, lockToken) => {
  const Project = (await import('../models/Project.js')).default;
  const filter = {
    _id: projectId,
    extractionStatus: { $ne: 'extracting' },
    extractionLockToken: null,
  };
  const update = {
    extractionStatus: 'extracting',
    extractionLockToken: lockToken,
    extractionStartedAt: new Date(),
  };
  const options = { returnDocument: 'after' };
  const result = await Project.findOneAndUpdate(filter, update, options).select('+extractionLockToken +extractionStartedAt');
  return result ? lockToken : null;
};

/**
 * Release the extraction lock for a project.
 * Only clears the lock if the token matches.
 * Optionally sets a new extractionStatus (e.g., 'completed' or 'failed').
 */
export const releaseExtractionLock = async (projectId, lockToken, newStatus = null) => {
  const Project = (await import('../models/Project.js')).default;
  const filter = {
    _id: projectId,
    extractionLockToken: lockToken,
  };
  const update = {
    extractionLockToken: null,
    extractionStartedAt: null,
  };
  if (newStatus) {
    update.extractionStatus = newStatus;
  }
  await Project.updateOne(filter, update);
};

/**
 * Resolves the absolute base directory for extracted archives
 */
export const getExtractionBaseDir = () => {
  const customDir = process.env.EXTRACTION_DIR || 'uploads/extracted';
  const resolved = path.isAbsolute(customDir)
    ? customDir
    : path.resolve(__dirname, '../../', customDir);

  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true, mode: 0o755 });
  }

  return resolved;
};

/**
 * Check if an extraction is currently running for a project
 */
export const isExtractionRunning = (projectId) => {
  return activeExtractions.has(projectId.toString());
};

/**
 * Safely removes a directory and its contents
 */
export const removeDirSafe = async (dirPath) => {
  if (!dirPath) return;
  try {
    if (fs.existsSync(dirPath)) {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to clean up extraction directory ${dirPath}:`, err.message);
  }
};

/**
 * Extract a ZIP archive with comprehensive security protections:
 * - Zip Slip / Path Traversal prevention
 * - Zip Bomb / Size explosion prevention
 * - Symlink / Encrypted entry rejection
 * - Duplicate & conflicting path rejection
 * - Streaming extraction without loading archive into memory
 * - Partial output cleanup on failure
 * 
 * @param {string} zipFilePath - Full path to the uploaded ZIP file on disk
 * @param {string|ObjectId} projectId - Unique project identifier
 * @returns {Promise<{ extractedStoragePath: string, extractedFileCount: number, extractedTotalSize: number }>}
 */
export const extractProjectZip = async (zipFilePath, projectId) => {
  const idStr = projectId.toString();

  // Concurrency guard: reject if extraction is already active
  if (activeExtractions.has(idStr)) {
    const error = new Error('Extraction is already in progress for this project');
    error.statusCode = 409;
    throw error;
  }

  activeExtractions.add(idStr);

  const baseDir = getExtractionBaseDir();
  const versionFolder = `${Date.now()}-${crypto.randomUUID()}`;
  const targetDir = path.resolve(baseDir, idStr, versionFolder);

  try {
    // 1. Verify source ZIP exists on disk
    if (!fs.existsSync(zipFilePath)) {
      const error = new Error('Source ZIP file not found on server storage');
      error.statusCode = 404;
      throw error;
    }

    // 2. Create isolated extraction root for this version
    await fs.promises.mkdir(targetDir, { recursive: true, mode: 0o755 });

    const seenPaths = new Set();
    const seenDirs = new Set();
    let totalExtractedSize = 0;
    let extractedFileCount = 0;
    let entryCount = 0;

    // 3. Open archive using yauzl streaming mode (lazyEntries prevents loading all entries at once)
    const extractionResult = await new Promise((resolve, reject) => {
      let isAborted = false;

      const abort = (err) => {
        if (!isAborted) {
          isAborted = true;
          try {
            zipfile?.close();
          } catch {}
          reject(err);
        }
      };

      let zipfile = null;

      yauzl.open(zipFilePath, { lazyEntries: true, autoClose: true }, (err, openedZip) => {
        if (err) {
          const parseErr = new Error(`Invalid or corrupted ZIP archive: ${err.message}`);
          parseErr.statusCode = 400;
          return abort(parseErr);
        }

        zipfile = openedZip;

        zipfile.on('error', (zErr) => {
          const zipError = new Error(`ZIP stream error: ${zErr.message}`);
          zipError.statusCode = 400;
          abort(zipError);
        });

        zipfile.on('end', () => {
          if (!isAborted) {
            resolve({
              extractedStoragePath: targetDir,
              extractedFileCount,
              extractedTotalSize: totalExtractedSize,
            });
          }
        });

        zipfile.on('entry', async (entry) => {
          if (isAborted) return;

          try {
            entryCount++;

            // Check A: Total entry count limit
            if (entryCount > MAX_ARCHIVE_ENTRIES) {
              const err = new Error(
                `Security Error: Archive exceeds maximum allowed entry count of ${MAX_ARCHIVE_ENTRIES}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Check B: Encrypted entry rejection
            if ((entry.generalPurposeBitFlag & 0x1) !== 0) {
              const err = new Error(
                `Security Error: Encrypted archive entries are not supported: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Check C: Symlink rejection (S_IFLNK in unix mode)
            const isSymlink = ((entry.externalFileAttributes >> 16) & 0o170000) === 0o120000;
            if (isSymlink) {
              const err = new Error(
                `Security Error: Symbolic links are forbidden in project archives: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Normalize filename and check for Zip Slip traversal
            const rawFileName = (entry.fileName || '').replace(/\\/g, '/');

            // Check D: Absolute path rejection
            if (
              rawFileName.startsWith('/') ||
              /^[a-zA-Z]:/.test(rawFileName) ||
              path.isAbsolute(rawFileName)
            ) {
              const err = new Error(
                `Security Error: Absolute paths are forbidden in archive entries: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Check E: Path traversal sequences (../)
            const segments = rawFileName.split('/');
            if (segments.includes('..') || rawFileName.includes('../')) {
              const err = new Error(
                `Security Error: Path traversal (Zip Slip) detected: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            const normalized = path.normalize(rawFileName).replace(/\\/g, '/');
            const destination = path.resolve(targetDir, normalized);

            // Check F: Strict containment within extraction directory
            const relativeToRoot = path.relative(targetDir, destination);
            if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
              const err = new Error(
                `Security Error: Destination escapes extraction boundary: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Check G: Directory ignore filter (skip build/temp/system folders)
            const pathParts = normalized.split('/').filter(Boolean);
            const shouldIgnore =
              pathParts.some((p) => IGNORED_DIRS.has(p.toLowerCase())) ||
              IGNORED_FILES.has(path.basename(normalized).toLowerCase()) ||
              pathParts.some((p) => p.startsWith('__MACOSX'));

            if (shouldIgnore) {
              // Safely skip entry without extracting
              return zipfile.readEntry();
            }

            // Check H: Individual file size limit
            if (entry.uncompressedSize > MAX_EXTRACTED_FILE_SIZE) {
              const err = new Error(
                `Security Error: File exceeds maximum allowed size of ${MAX_EXTRACTED_FILE_SIZE} bytes (50 MiB): ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Check I: Cumulative archive size limit
            if (totalExtractedSize + entry.uncompressedSize > MAX_EXTRACTED_TOTAL_SIZE) {
              const err = new Error(
                `Security Error: Total extracted archive size exceeds ${MAX_EXTRACTED_TOTAL_SIZE} bytes (500 MiB)`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Check J: Compression ratio check (Zip bomb protection)
            if (entry.compressedSize > 0) {
              const ratio = entry.uncompressedSize / entry.compressedSize;
              if (ratio > MAX_COMPRESSION_RATIO && entry.uncompressedSize > 1024 * 1024) {
                const err = new Error(
                  `Security Error: Excessive compression ratio (${Math.round(ratio)}:1) exceeds 100:1 limit: ${entry.fileName}`
                );
                err.statusCode = 400;
                return abort(err);
              }
            }

            // Handle Directory Entry
            if (rawFileName.endsWith('/')) {
              if (seenPaths.has(destination)) {
                const err = new Error(
                  `Security Error: Conflicting archive path: directory conflicts with existing file: ${entry.fileName}`
                );
                err.statusCode = 400;
                return abort(err);
              }
              await fs.promises.mkdir(destination, { recursive: true, mode: 0o755 });
              seenDirs.add(destination);
              return zipfile.readEntry();
            }

            // Handle File Entry
            if (seenPaths.has(destination)) {
              const err = new Error(
                `Security Error: Duplicate archive file path detected: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            if (seenDirs.has(destination)) {
              const err = new Error(
                `Security Error: Conflicting archive path: file conflicts with existing directory: ${entry.fileName}`
              );
              err.statusCode = 400;
              return abort(err);
            }

            // Ensure parent directory exists
            const parentDir = path.dirname(destination);
            await fs.promises.mkdir(parentDir, { recursive: true, mode: 0o755 });

            // Stream file contents safely to disk
            zipfile.openReadStream(entry, (sErr, readStream) => {
              if (sErr || isAborted) {
                return abort(sErr || new Error('Stream aborted'));
              }

              // Create file with safe non-executable permissions
              const writeStream = fs.createWriteStream(destination, { mode: 0o644 });
              let fileBytes = 0;

              readStream.on('data', (chunk) => {
                fileBytes += chunk.length;
                totalExtractedSize += chunk.length;

                // Real-time runtime size enforcement
                if (fileBytes > MAX_EXTRACTED_FILE_SIZE) {
                  readStream.destroy();
                  writeStream.destroy();
                  const err = new Error(
                    `Security Error: Streamed file size exceeded ${MAX_EXTRACTED_FILE_SIZE} bytes (50 MiB)`
                  );
                  err.statusCode = 400;
                  return abort(err);
                }

                if (totalExtractedSize > MAX_EXTRACTED_TOTAL_SIZE) {
                  readStream.destroy();
                  writeStream.destroy();
                  const err = new Error(
                    `Security Error: Total streamed archive size exceeded ${MAX_EXTRACTED_TOTAL_SIZE} bytes (500 MiB)`
                  );
                  err.statusCode = 400;
                  return abort(err);
                }
              });

              readStream.on('error', (err) => {
                writeStream.destroy();
                abort(err);
              });

              writeStream.on('error', (err) => {
                readStream.destroy();
                abort(err);
              });

              writeStream.on('finish', () => {
                extractedFileCount++;
                seenPaths.add(destination);
                // Proceed to next entry in streaming pipeline
                zipfile.readEntry();
              });

              readStream.pipe(writeStream);
            });
          } catch (entryErr) {
            abort(entryErr);
          }
        });

        // Trigger first entry read
        zipfile.readEntry();
      });
    });

    return extractionResult;
  } catch (error) {
    // Clean up partial extraction directory on failure
    await removeDirSafe(targetDir);
    throw error;
  } finally {
    // Release in-memory concurrency lock
    activeExtractions.delete(idStr);
  }
};

export default {
  extractProjectZip,
  isExtractionRunning,
  getExtractionBaseDir,
  removeDirSafe,
  acquireExtractionLock,
  releaseExtractionLock,
  MAX_EXTRACTED_TOTAL_SIZE,
  MAX_EXTRACTED_FILE_SIZE,
  MAX_ARCHIVE_ENTRIES,
  MAX_COMPRESSION_RATIO,
};
