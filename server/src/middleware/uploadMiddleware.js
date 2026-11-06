import fs from 'fs';
import multer from 'multer';
import { upload, MAX_UPLOAD_SIZE } from '../config/uploadConfig.js';

/**
 * Helper to safely delete a file from disk
 */
export const removeFileSafe = async (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete temporary file ${filePath}:`, err.message);
  }
};

/**
 * Validates magic numbers of the file on disk to verify authentic ZIP signature
 * 
 * Standard ZIP Magic Headers:
 * - 50 4B 03 04 (Standard local file header)
 * - 50 4B 05 06 (Empty zip archive)
 * - 50 4B 07 08 (Spanned archive)
 */
export const verifyZipSignature = async (filePath) => {
  let fileHandle = null;
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.size === 0) {
      return { valid: false, reason: 'Uploaded ZIP file is empty' };
    }

    if (stats.size < 4) {
      return { valid: false, reason: 'File is smaller than a valid ZIP header' };
    }

    fileHandle = await fs.promises.open(filePath, 'r');
    const headerBuffer = Buffer.alloc(4);
    const { bytesRead } = await fileHandle.read(headerBuffer, 0, 4, 0);

    if (bytesRead < 4) {
      return { valid: false, reason: 'Could not read file header' };
    }

    const isZip =
      headerBuffer[0] === 0x50 && // 'P'
      headerBuffer[1] === 0x4b && // 'K'
      ((headerBuffer[2] === 0x03 && headerBuffer[3] === 0x04) ||
        (headerBuffer[2] === 0x05 && headerBuffer[3] === 0x06) ||
        (headerBuffer[2] === 0x07 && headerBuffer[3] === 0x08));

    if (!isZip) {
      return {
        valid: false,
        reason: 'Invalid file signature. File is not a genuine ZIP archive.',
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err.message };
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
};

/**
 * Express middleware for secure single ZIP upload
 * 
 * 1. Enforces single file under 'file' field
 * 2. Enforces 100 MiB limit via Multer
 * 3. Inspects real file content on disk for ZIP magic bytes
 * 4. Automatically deletes invalid or rejected files from disk
 */
export const handleZipUpload = (req, res, next) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, async (err) => {
    // Handle Multer-specific errors
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds the maximum limit of ${MAX_UPLOAD_SIZE} bytes (100 MiB)`,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: err.message || 'Unexpected file field or multiple files provided. Only one ZIP is allowed under field "file".',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file upload',
      });
    }

    // Check if file was provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a ZIP archive under field name "file".',
      });
    }

    // Verify file size is not zero
    if (req.file.size === 0) {
      await removeFileSafe(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Uploaded ZIP file is empty',
      });
    }

    // Content-level verification: inspect magic bytes on disk
    const verification = await verifyZipSignature(req.file.path);
    if (!verification.valid) {
      // Remove malicious or invalid file immediately
      await removeFileSafe(req.file.path);
      return res.status(400).json({
        success: false,
        message: verification.reason,
      });
    }

    // File passed all security and signature checks
    next();
  });
};

export default handleZipUpload;
