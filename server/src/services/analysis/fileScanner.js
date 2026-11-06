/**
 * fileScanner.js
 * Recursively scans an extraction directory, returning a list of file entries
 * with relative paths, sizes, and detected MIME/language hints.
 *
 * Security requirements enforced here:
 * - Never follows symbolic links.
 * - Skips ignored directories (node_modules, .git, dist, …).
 * - Skips binary and oversized files.
 * - Never exposes absolute server paths in returned data.
 * - Applies per-file and total-scan size limits.
 */

import fs from 'fs';
import path from 'path';

// Directories to skip entirely during scanning
export const IGNORED_DIRS = new Set([
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
  '.idea',
  '.vscode',
]);

// File extensions to skip (binary / generated / credentials)
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp', '.avif',
  '.mp4', '.mp3', '.wav', '.ogg', '.flac', '.avi', '.mov', '.mkv',
  '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o', '.a', '.lib',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.pyc', '.pyo', '.class', '.jar', '.war',
  '.lock',   // package-lock, yarn.lock — not useful for AST
  '.map',    // source maps — not source code
]);

// Files whose names indicate sensitive / credential content
const SENSITIVE_FILE_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  '.netrc',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'credentials',
  'secrets.yml',
  'secrets.yaml',
  'secret.json',
]);

// Source extensions that the analyzer actually understands
export const SUPPORTED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java',
  '.html', '.htm', '.css',
  '.json',
]);

// Per-file read limit: 5 MiB (we won't read files larger than this)
export const MAX_FILE_READ_SIZE = 5 * 1024 * 1024; // 5 MiB

// Total scan budget: 50 MiB of source content
export const MAX_TOTAL_SCAN_SIZE = 50 * 1024 * 1024; // 50 MiB

// Maximum number of files to scan
export const MAX_SCAN_FILES = 5000;

/**
 * @typedef {Object} ScannedFile
 * @property {string} relativePath  - Path relative to the extraction root
 * @property {string} extension     - Lower-cased file extension, e.g. ".js"
 * @property {number} size          - File size in bytes
 * @property {boolean} isSupported  - Whether AST/text analysis is attempted
 * @property {boolean} isOversized  - True when file exceeds MAX_FILE_READ_SIZE
 * @property {boolean} isSensitive  - True for credential / secret files
 */

/**
 * @typedef {Object} ScanResult
 * @property {ScannedFile[]} files
 * @property {string[]}      skippedDirs   - Directories skipped
 * @property {string[]}      warnings
 * @property {number}        totalFiles
 * @property {number}        scannedFiles
 * @property {number}        skippedFiles
 * @property {number}        totalSourceSize
 */

/**
 * Scan the extraction directory recursively.
 *
 * @param {string} extractionRoot  - Absolute path to the extracted project root
 * @returns {Promise<ScanResult>}
 */
export async function scanExtractedProject(extractionRoot) {
  const files = [];
  const skippedDirs = [];
  const warnings = [];
  let totalSourceSize = 0;
  let skippedFiles = 0;
  let scanBudgetExceeded = false;

  /**
   * Walk a directory entry, respecting symlink policy and limits.
   * @param {string} absDir  - Absolute directory path currently being walked
   * @param {string} relDir  - Path relative to extractionRoot
   */
  async function walk(absDir, relDir) {
    if (scanBudgetExceeded) return;

    let entries;
    try {
      entries = await fs.promises.readdir(absDir, { withFileTypes: true });
    } catch (err) {
      warnings.push(`Cannot read directory "${relDir}": ${err.message}`);
      return;
    }

    for (const entry of entries) {
      if (scanBudgetExceeded) break;

      const entryRel = relDir ? `${relDir}/${entry.name}` : entry.name;
      const entryAbs = path.join(absDir, entry.name);

      // ── Symlink rejection ──────────────────────────────────────────────────
      if (entry.isSymbolicLink()) {
        warnings.push(`Symlink skipped: "${entryRel}"`);
        skippedFiles++;
        continue;
      }

      // ── Directory handling ─────────────────────────────────────────────────
      if (entry.isDirectory()) {
        const lowerName = entry.name.toLowerCase();
        if (IGNORED_DIRS.has(lowerName)) {
          skippedDirs.push(entryRel);
          continue;
        }
        await walk(entryAbs, entryRel);
        continue;
      }

      // ── Regular file handling ──────────────────────────────────────────────
      if (!entry.isFile()) {
        // Named pipe, device file, etc. – skip
        skippedFiles++;
        continue;
      }

      // File count limit
      if (files.length + skippedFiles >= MAX_SCAN_FILES) {
        if (!scanBudgetExceeded) {
          warnings.push(`File scan limit (${MAX_SCAN_FILES}) reached; remaining files skipped.`);
          scanBudgetExceeded = true;
        }
        break;
      }

      const ext = path.extname(entry.name).toLowerCase();
      const baseName = entry.name.toLowerCase();

      // Sensitive file filter (skip; do not include in inventory)
      if (SENSITIVE_FILE_NAMES.has(baseName)) {
        warnings.push(`Sensitive file excluded from analysis: "${entryRel}"`);
        skippedFiles++;
        continue;
      }

      let stat;
      try {
        stat = await fs.promises.lstat(entryAbs); // lstat so symlinks are caught
        if (stat.isSymbolicLink()) {
          warnings.push(`Symlink skipped (via lstat): "${entryRel}"`);
          skippedFiles++;
          continue;
        }
      } catch (err) {
        warnings.push(`Cannot stat "${entryRel}": ${err.message}`);
        skippedFiles++;
        continue;
      }

      const size = stat.size;
      const isBinary = BINARY_EXTENSIONS.has(ext);
      const isSupported = SUPPORTED_EXTENSIONS.has(ext);
      const isOversized = size > MAX_FILE_READ_SIZE;

      if (isBinary) {
        skippedFiles++;
        continue;
      }

      // Track source size budget
      if (!isOversized) {
        if (totalSourceSize + size > MAX_TOTAL_SCAN_SIZE) {
          warnings.push(`Total scan size budget exceeded; skipping remaining files.`);
          scanBudgetExceeded = true;
          break;
        }
        if (isSupported) {
          totalSourceSize += size;
        }
      }

      files.push({
        relativePath: entryRel,
        extension: ext,
        size,
        isSupported,
        isOversized,
        isSensitive: false,
        absolutePath: entryAbs, // internal use only — never sent to client
      });
    }
  }

  await walk(extractionRoot, '');

  const scannedFiles = files.filter((f) => f.isSupported && !f.isOversized).length;

  return {
    files,
    skippedDirs,
    warnings,
    totalFiles: files.length + skippedFiles,
    scannedFiles,
    skippedFiles,
    totalSourceSize,
  };
}

export default { scanExtractedProject, IGNORED_DIRS, SUPPORTED_EXTENSIONS, MAX_FILE_READ_SIZE, MAX_TOTAL_SCAN_SIZE, MAX_SCAN_FILES };
