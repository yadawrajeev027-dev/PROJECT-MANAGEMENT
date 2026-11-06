import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Maximum upload size: exactly 104,857,600 bytes (100 MiB)
export const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 104857600;

/**
 * Resolve absolute path to the secure upload directory
 * Resolves outside of any public/static asset folders
 */
export const getUploadDir = () => {
  const customDir = process.env.UPLOAD_DIR || 'uploads/projects';
  const resolvedPath = path.isAbsolute(customDir)
    ? customDir
    : path.resolve(__dirname, '../../', customDir);

  // Ensure storage directory exists synchronously on initialization
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  return resolvedPath;
};

/**
 * Multer Disk Storage Engine
 * Generates an unguessable UUID-based storage filename to prevent:
 * - Path traversal (e.g. ../../)
 * - File overwrite collisions
 * - Arbitrary executable extension spoofing
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const dest = getUploadDir();
      cb(null, dest);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${crypto.randomUUID()}-${Date.now()}.zip`;
    cb(null, `zip-${uniqueSuffix}`);
  },
});

/**
 * Extension-level file filter
 * Performs preliminary check that filename ends with .zip
 * Content-level magic byte verification follows after disk write
 */
const fileFilter = (req, file, cb) => {
  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();

  if (ext !== '.zip') {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    error.message = 'Only .zip archive files are permitted';
    return cb(error, false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1, // Enforce exactly 1 file limit
  },
  fileFilter,
});

export default {
  MAX_UPLOAD_SIZE,
  getUploadDir,
  upload,
};
