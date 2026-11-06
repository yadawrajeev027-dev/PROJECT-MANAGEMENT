/**
 * verificationController.js
 * HTTP Controller for Step 8: Requirement Verification Engine.
 *
 * Endpoints:
 *  - POST /api/projects/:id/verify-requirements
 *  - GET  /api/projects/:id/verification-status
 *  - GET  /api/projects/:id/requirements
 *
 * Security & Reliability:
 *  - Multi-tenant IDOR protection (strict ownership verification).
 *  - Atomic database-level lock on the Project document to prevent concurrent verification runs.
 *  - Safe lock release in both success and error handlers.
 *  - Zero leakage of absolute server paths or secrets.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { verifyProjectRequirements } from '../services/verification/verificationService.js';

/**
 * POST /api/projects/:id/verify-requirements
 * Trigger requirement verification against AST findings for the authenticated user's project.
 */
export const verifyRequirements = async (req, res, next) => {
  let lockToken = null;
  const { id } = req.params;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // 2. Verify ownership and project existence
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

    // 3. Ensure extraction has been completed
    if (project.extractionStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Project extraction must be completed before verification. Current extraction status: "${project.extractionStatus}"`,
      });
    }

    // 4. Ensure source analysis has been completed
    const latestReport = await AnalysisReport.findOne({
      project: id,
      status: 'completed',
      sourceAnalysis: { $ne: null },
    }).sort({ createdAt: -1 });

    if (!latestReport) {
      return res.status(400).json({
        success: false,
        message: 'No completed static source analysis found for this project. Please run source code analysis first.',
      });
    }

    // 5. Atomic Lock on Project Document
    // Prevents concurrent verification calls across parallel requests/processes
    lockToken = crypto.randomUUID();
    const lockedProject = await Project.findOneAndUpdate(
      {
        _id: id,
        owner: req.user._id,
        verificationLockToken: null,
      },
      {
        verificationLockToken: lockToken,
        verificationStartedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!lockedProject) {
      return res.status(409).json({
        success: false,
        message: 'Requirement verification is already in progress for this project',
      });
    }

    // 6. Execute verification pipeline
    let results;
    try {
      results = await verifyProjectRequirements(id);
    } catch (verifyErr) {
      // Release lock on error
      await Project.updateOne(
        { _id: id, verificationLockToken: lockToken },
        { verificationLockToken: null, verificationStartedAt: null }
      );
      lockToken = null;

      const statusCode = verifyErr.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: verifyErr.message || 'Requirement verification failed',
      });
    }

    // 7. Release lock on success
    await Project.updateOne(
      { _id: id, verificationLockToken: lockToken },
      { verificationLockToken: null, verificationStartedAt: null }
    );
    lockToken = null;

    return res.status(200).json({
      success: true,
      message: 'Requirements verified successfully against codebase AST evidence',
      data: results,
    });
  } catch (error) {
    // Safety net: release lock if error thrown
    if (lockToken) {
      try {
        await Project.updateOne(
          { _id: id, verificationLockToken: lockToken },
          { verificationLockToken: null, verificationStartedAt: null }
        );
      } catch (cleanupErr) {
        console.error('Failed to release verification lock after error:', cleanupErr.message);
      }
    }
    next(error);
  }
};

/**
 * GET /api/projects/:id/verification-status
 * Retrieve the current verification metrics, completion percentage, and status.
 */
export const getVerificationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // Verify ownership
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

    const report = await AnalysisReport.findOne({
      project: id,
      status: 'completed',
    }).sort({ createdAt: -1 });

    const totalRequirements = await Requirement.countDocuments({ project: id });
    const verifiedCount = await Requirement.countDocuments({ project: id, status: 'verified' });
    const partialCount = await Requirement.countDocuments({ project: id, status: 'partial' });
    const notFoundCount = await Requirement.countDocuments({ project: id, status: 'not_found' });
    const needsReviewCount = await Requirement.countDocuments({ project: id, status: 'needs_review' });
    const pendingCount = await Requirement.countDocuments({ project: id, status: 'pending' });

    return res.status(200).json({
      success: true,
      data: {
        projectId: id,
        isVerifying: project.verificationLockToken !== null,
        totalRequirements,
        verifiedCount,
        partialCount,
        notFoundCount,
        needsReviewCount,
        pendingCount,
        progressPercentage: report ? report.progressPercentage : 0,
        latestReportId: report ? report._id.toString() : null,
        verifiedAt: report ? report.updatedAt : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id/requirements
 * Retrieve all requirements for the project with verified AST evidence and confidence scores.
 */
export const getProjectRequirements = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // Verify ownership (IDOR Guard)
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

    const requirements = await Requirement.find({ project: id }).sort({ createdAt: 1 });

    const safeRequirements = requirements.map((r) => ({
      id: r._id.toString(),
      requirementCode: r.requirementCode,
      code: r.requirementCode,
      title: r.title,
      description: r.description,
      priority: r.priority,
      weight: r.weight,
      status: r.status,
      confidence: r.confidence || 0,
      explanation: r.explanation || '',
      verificationMethod: r.verificationMethod || '',
      verifiedAt: r.verifiedAt,
      evidence: (r.evidence || []).map((e) => ({
        filePath: e.filePath,
        lineStart: e.lineStart,
        lineEnd: e.lineEnd,
        evidenceType: e.evidenceType,
        confidence: e.confidence,
        strength: e.strength,
        explanation: e.explanation,
        snippet: e.snippet || '',
      })),
    }));

    return res.status(200).json({
      success: true,
      data: safeRequirements,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  verifyRequirements,
  getVerificationStatus,
  getProjectRequirements,
};
