import mongoose from 'mongoose';
import Project from '../models/Project.js';
import { removeFileSafe } from '../middleware/uploadMiddleware.js';

/**
 * Upload Project ZIP Archive Controller
 * POST /api/projects/:id/upload
 * 
 * Invoked after authenticate and handleZipUpload middlewares have run.
 */
export const uploadProjectZip = async (req, res, next) => {
  const newFilePath = req.file?.path;

  try {
    const { id } = req.params;

    // 1. Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await removeFileSafe(newFilePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // 2. Verify project exists and belongs to the authenticated user
    // Select zipStoragePath so we can check for prior uploads
    const project = await Project.findOne({
      _id: id,
      owner: req.user._id,
    }).select('+zipStoragePath');

    if (!project) {
      await removeFileSafe(newFilePath);
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Capture previous upload path for safe replacement cleanup
    const oldFilePath = project.zipStoragePath;

    // 3. Update project metadata in MongoDB
    project.originalZipName = req.file.originalname || 'project.zip';
    project.zipFileSize = req.file.size;
    project.zipStoragePath = newFilePath;
    project.status = 'uploaded';

    await project.save();

    // 4. Safe replacement cleanup: remove the old archive if one previously existed
    if (oldFilePath && oldFilePath !== newFilePath) {
      await removeFileSafe(oldFilePath);
    }

    // 5. Build safe project response (zipStoragePath is never exposed)
    const safeProject = project.toJSON();

    return res.status(200).json({
      success: true,
      message: 'ZIP file uploaded and verified successfully',
      data: {
        project: safeProject,
      },
    });
  } catch (error) {
    // 6. On database failure, remove the uploaded file immediately to prevent orphaned files
    await removeFileSafe(newFilePath);
    next(error);
  }
};

export default {
  uploadProjectZip,
};
