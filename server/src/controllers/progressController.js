/**
 * progressController.js
 * Step 10: Deterministic Progress Calculation, History & Velocity HTTP Controller.
 *
 * Endpoints:
 *  - POST /api/projects/:id/calculate-progress
 *  - GET  /api/projects/:id/progress
 *  - GET  /api/projects/:id/progress-history
 *  - GET  /api/projects/:id/velocity
 *
 * Security & Integrity:
 *  - Enforces atomic database locks on Project to prevent concurrent calculation collisions.
 *  - Multi-tenant IDOR protection (strict owner checks).
 *  - Requirement statuses and verified evidence are strictly immutable inputs.
 *  - AI outputs are never consumed as progress metrics.
 *  - Zero absolute filesystem path leakage.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { calculateProgress } from '../services/progress/progressCalculator.js';
import { persistProgressSnapshot, getProgressHistory } from '../services/progress/progressHistoryService.js';
import { calculateVelocity } from '../services/progress/velocityCalculator.js';

/**
 * POST /api/projects/:id/calculate-progress
 * Calculates deterministic weighted progress and verification coverage from verified requirements.
 */
export const calculateProjectProgress = async (req, res, next) => {
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

    // 2. Verify Project Ownership (IDOR Guard)
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

    // 3. Require completed extraction
    if (project.extractionStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Project extraction must be completed before calculating progress. Current status: "${project.extractionStatus}"`,
      });
    }

    // 4. Require completed source code analysis (Step 7)
    let latestReport = null;
    if (project.latestReport) {
      latestReport = await AnalysisReport.findById(project.latestReport);
    }
    if (!latestReport || latestReport.status !== 'completed' || !latestReport.sourceAnalysis) {
      latestReport = await AnalysisReport.findOne({
        project: id,
        status: 'completed',
        sourceAnalysis: { $ne: null },
      }).sort({ createdAt: -1 });
    }

    if (!latestReport || !latestReport.sourceAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'No completed static source analysis found for this project. Run Step 7 source analysis first.',
      });
    }

    // 5. Fetch requirements
    const requirements = await Requirement.find({ project: id }).sort({ createdAt: 1 });
    if (!requirements || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No requirements defined for this project. Define and verify requirements before calculating progress.',
      });
    }

    // 6. Check that requirements have been verified by Step 8
    const hasOnlyPending = requirements.every((r) => r.status === 'pending');
    if (hasOnlyPending) {
      return res.status(400).json({
        success: false,
        message: 'Requirements have not been verified yet. Run Step 8 requirement verification before calculating progress.',
      });
    }

    // 7. Acquire Atomic Database Lock on Project (Concurrency Guard)
    lockToken = crypto.randomUUID();
    const lockedProject = await Project.findOneAndUpdate(
      {
        _id: id,
        owner: req.user._id,
        progressLockToken: null,
      },
      {
        progressLockToken: lockToken,
        progressStartedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!lockedProject) {
      return res.status(409).json({
        success: false,
        message: 'Progress calculation is already in progress for this project',
      });
    }

    // 8. Snapshot requirement statuses to guarantee verification integrity
    const requirementSnapshots = requirements.map((r) => ({
      id: r._id.toString(),
      status: r.status,
      confidence: r.confidence,
    }));

    // Optional delay for concurrency and contention testing
    if (req.body?.delayMs && typeof req.body.delayMs === 'number' && req.body.delayMs > 0) {
      await new Promise((r) => setTimeout(r, req.body.delayMs));
    }

    // 9. Execute Deterministic Calculation
    let progressResult;
    try {
      progressResult = calculateProgress(requirements);
    } catch (calcErr) {
      return res.status(400).json({
        success: false,
        message: calcErr.message || 'Progress calculation error',
      });
    }

    // 10. Guarantee requirement statuses were NOT modified
    for (const snap of requirementSnapshots) {
      const current = await Requirement.findById(snap.id);
      if (current && (current.status !== snap.status || current.confidence !== snap.confidence)) {
        current.status = snap.status;
        current.confidence = snap.confidence;
        await current.save();
      }
    }

    // 11. Persist immutable snapshot onto the completed AnalysisReport & Project
    const persistedReport = await persistProgressSnapshot(latestReport._id, progressResult);

    // 12. Release lock before sending response
    await Project.updateOne(
      { _id: id, progressLockToken: lockToken },
      { progressLockToken: null, progressStartedAt: null }
    );
    lockToken = null;

    return res.status(200).json({
      success: true,
      message: 'Project progress calculated and persisted successfully',
      data: {
        projectId: id.toString(),
        reportId: latestReport._id.toString(),
        ...progressResult,
      },
    });
  } catch (error) {
    // Release lock on error
    if (lockToken) {
      try {
        await Project.updateOne(
          { _id: id, progressLockToken: lockToken },
          { progressLockToken: null, progressStartedAt: null }
        );
      } catch (cleanupErr) {
        console.error('Failed to release progress lock:', cleanupErr.message);
      }
    }
    next(error);
  }
};

/**
 * GET /api/projects/:id/progress
 * Retrieves current progress breakdown, verification coverage, and status for a project.
 */
export const getProjectProgress = async (req, res, next) => {
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

    // Look for the latest completed report with progress metrics
    let latestReport = null;
    if (project.latestReport) {
      latestReport = await AnalysisReport.findById(project.latestReport);
    }
    if (!latestReport || latestReport.status !== 'completed') {
      latestReport = await AnalysisReport.findOne({
        project: id,
        status: 'completed',
      }).sort({ createdAt: -1 });
    }

    const requirements = await Requirement.find({ project: id }).sort({ createdAt: 1 });

    // If report has stored progressMetrics, use it; otherwise compute from current requirements
    let progressData;
    if (latestReport && latestReport.progressMetrics) {
      progressData = {
        ...latestReport.progressMetrics,
        reportId: latestReport._id.toString(),
      };
    } else {
      progressData = calculateProgress(requirements);
      if (latestReport) {
        progressData.reportId = latestReport._id.toString();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Project progress retrieved successfully',
      data: {
        projectId: id.toString(),
        overallProgress: project.overallProgress ?? progressData.progressPercentage,
        progressStatus: project.progressStatus ?? progressData.calculationStatus,
        verificationCoverage: project.verificationCoverage ?? progressData.verificationCoverage,
        ...progressData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id/progress-history
 * Retrieves the historical progress timeline across all completed inspection runs.
 */
export const getProjectProgressHistory = async (req, res, next) => {
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

    const history = await getProgressHistory(id);

    return res.status(200).json({
      success: true,
      message: 'Project progress history retrieved successfully',
      data: {
        projectId: id.toString(),
        totalSnapshots: history.length,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id/velocity
 * Retrieves progress velocity (percentage points per day) and completion forecasting.
 */
export const getProjectVelocity = async (req, res, next) => {
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

    const history = await getProgressHistory(id);
    const velocityMetrics = calculateVelocity(history);

    return res.status(200).json({
      success: true,
      message: 'Project velocity retrieved successfully',
      data: {
        projectId: id.toString(),
        ...velocityMetrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  calculateProjectProgress,
  getProjectProgress,
  getProjectProgressHistory,
  getProjectVelocity,
};
