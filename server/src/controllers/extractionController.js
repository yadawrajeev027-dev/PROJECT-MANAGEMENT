import fs from 'fs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import {
  extractProjectZip,
  removeDirSafe,
  acquireExtractionLock,
  releaseExtractionLock,
} from '../services/zipExtractionService.js';

/**
 * Trigger Project ZIP Extraction
 * POST /api/projects/:id/extract
 */
export const extractProject = async (req, res, next) => {
  let lockToken = null;
  let projectId = null;

  try {
    const { id } = req.params;

    // 1. Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // 2. Verify project ownership and retrieve protected storage references
    const project = await Project.findOne({
      _id: id,
      owner: req.user._id,
    }).select('+zipStoragePath +extractedStoragePath');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    projectId = project._id;

    // 3. Confirm that a ZIP has been uploaded
    if (!project.zipStoragePath) {
      return res.status(400).json({
        success: false,
        message: 'No ZIP archive has been uploaded for this project yet',
      });
    }

    // 4. Verify stored ZIP exists on disk
    if (!fs.existsSync(project.zipStoragePath)) {
      return res.status(404).json({
        success: false,
        message: 'Stored ZIP archive file is missing from server storage',
      });
    }

    // 5. Acquire atomic extraction lock via MongoDB findOneAndUpdate.
    //    Only one request can succeed — the filter requires extractionStatus != 'extracting'
    //    AND extractionLockToken == null, so concurrent requests cannot both win.
    lockToken = crypto.randomUUID();
    const acquired = await acquireExtractionLock(projectId, lockToken);
    if (!acquired) {
      return res.status(409).json({
        success: false,
        message: 'Extraction is already in progress for this project',
      });
    }

    // Capture previous extraction path to clean up upon successful re-extraction
    const previousExtractedPath = project.extractedStoragePath;

    // 6. Clear error field (extractionStatus already set to 'extracting' by lock acquisition)
    await Project.updateOne({ _id: projectId }, { extractionError: null });

    // 7. Execute secure extraction pipeline
    let result;
    try {
      result = await extractProjectZip(project.zipStoragePath, projectId);
    } catch (extractErr) {
      // Release lock and record failure — only this token holder can release
      await releaseExtractionLock(projectId, lockToken, 'failed');
      await Project.updateOne(
        { _id: projectId },
        { extractionError: extractErr.message || 'ZIP extraction failed' }
      );
      lockToken = null; // prevent finally block from double-releasing

      const statusCode = extractErr.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: extractErr.message || 'ZIP extraction failed',
      });
    }

    // 8. On success: purge prior extraction directory if one existed
    if (previousExtractedPath && previousExtractedPath !== result.extractedStoragePath) {
      await removeDirSafe(previousExtractedPath);
    }

    // 9. Persist successful extraction metrics and release lock atomically
    await releaseExtractionLock(projectId, lockToken, 'completed');
    await Project.updateOne(
      { _id: projectId },
      {
        extractedStoragePath: result.extractedStoragePath,
        extractedFileCount: result.extractedFileCount,
        extractedTotalSize: result.extractedTotalSize,
        extractedAt: new Date(),
        extractionError: null,
      }
    );
    lockToken = null; // prevent finally block from double-releasing

    return res.status(200).json({
      success: true,
      message: 'Project archive extracted successfully',
      data: {
        extractionStatus: 'completed',
        extractedFileCount: result.extractedFileCount,
        extractedTotalSize: result.extractedTotalSize,
        extractedAt: new Date(),
      },
    });
  } catch (error) {
    // Safety net: release lock if still held after an unexpected error
    if (lockToken && projectId) {
      try {
        await releaseExtractionLock(projectId, lockToken, 'failed');
      } catch (releaseErr) {
        console.error('Failed to release extraction lock after error:', releaseErr.message);
      }
    }
    next(error);
  }
};

/**
 * Get Project Extraction Status
 * GET /api/projects/:id/extraction-status
 */
export const getExtractionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    const project = await Project.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Return safe extraction metrics without internal storage paths
    return res.status(200).json({
      success: true,
      data: {
        extractionStatus: project.extractionStatus,
        extractedFileCount: project.extractedFileCount,
        extractedTotalSize: project.extractedTotalSize,
        extractedAt: project.extractedAt,
        extractionError: project.extractionError,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  extractProject,
  getExtractionStatus,
};
