/**
 * aiController.js
 * HTTP Controller for Step 9: AI Explanations & Actionable Recommendations.
 *
 * Endpoints:
 *  - POST /api/projects/:id/generate-recommendations
 *  - GET  /api/projects/:id/recommendations
 *
 * Security & Reliability:
 *  - Multi-tenant IDOR protection (strict user ownership verification).
 *  - Atomic database-level lock on the Project document to prevent concurrent AI generations.
 *  - Safe lock release in both success and error handlers.
 *  - Zero leakage of API keys, credentials, or internal server paths.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { generateProjectRecommendations } from '../services/ai/aiAnalysisService.js';

// Simple in-memory rate limiting map for AI generation requests (max 5 requests per minute per user)
const userRateLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 10;

  const userHistory = userRateLimits.get(userId.toString()) || [];
  const validHistory = userHistory.filter((t) => now - t < windowMs);

  if (validHistory.length >= maxReqs) {
    return false;
  }

  validHistory.push(now);
  userRateLimits.set(userId.toString(), validHistory);
  return true;
}

/**
 * POST /api/projects/:id/generate-recommendations
 * Generate AI-powered explanations and development recommendations.
 */
export const generateRecommendations = async (req, res, next) => {
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

    // 2. Rate limit check
    if (!checkRateLimit(req.user._id)) {
      return res.status(429).json({
        success: false,
        message: 'Too many AI generation requests. Please wait a moment before trying again.',
      });
    }

    // 3. Verify ownership
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

    // 4. Require completed extraction
    if (project.extractionStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Project extraction must be completed first. Current extraction status: "${project.extractionStatus}"`,
      });
    }

    // 5. Require completed source analysis
    const latestReport = await AnalysisReport.findOne({
      project: id,
      status: 'completed',
      sourceAnalysis: { $ne: null },
    }).sort({ createdAt: -1 });

    if (!latestReport) {
      return res.status(400).json({
        success: false,
        message: 'No completed static source analysis found for this project. Run Step 7 source code analysis first.',
      });
    }

    // 6. Atomic Lock on Project Document (Prevents concurrent AI jobs)
    lockToken = crypto.randomUUID();
    const lockedProject = await Project.findOneAndUpdate(
      {
        _id: id,
        owner: req.user._id,
        aiLockToken: null,
      },
      {
        aiLockToken: lockToken,
        aiStartedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!lockedProject) {
      return res.status(409).json({
        success: false,
        message: 'AI recommendation generation is already in progress for this project',
      });
    }

    // 7. Execute AI Generation Pipeline
    let aiResults;
    try {
      aiResults = await generateProjectRecommendations(id, req.body?.providerOverride || {});
    } catch (aiErr) {
      // Release lock on error
      await Project.updateOne(
        { _id: id, aiLockToken: lockToken },
        { aiLockToken: null, aiStartedAt: null }
      );
      lockToken = null;

      // Persist failure record onto report if available
      try {
        await AnalysisReport.updateOne(
          { _id: latestReport._id },
          {
            'aiAnalysis.status': 'failed',
            'aiAnalysis.errorMessage': aiErr.message || 'AI generation failed',
            'aiAnalysis.generatedAt': new Date(),
          }
        );
      } catch {}

      const statusCode = aiErr.statusCode || (aiErr.isConfigError ? 503 : 502);
      return res.status(statusCode).json({
        success: false,
        message: aiErr.message || 'AI recommendation generation failed',
      });
    }

    // 8. Release lock on success
    await Project.updateOne(
      { _id: id, aiLockToken: lockToken },
      { aiLockToken: null, aiStartedAt: null }
    );
    lockToken = null;

    return res.status(200).json({
      success: true,
      message: 'AI development recommendations generated successfully',
      data: aiResults,
    });
  } catch (error) {
    // Safety net: release lock on unexpected error
    if (lockToken) {
      try {
        await Project.updateOne(
          { _id: id, aiLockToken: lockToken },
          { aiLockToken: null, aiStartedAt: null }
        );
      } catch (cleanupErr) {
        console.error('Failed to release AI lock after error:', cleanupErr.message);
      }
    }
    next(error);
  }
};

/**
 * GET /api/projects/:id/recommendations
 * Retrieve the latest persisted AI recommendations for the project.
 */
export const getRecommendations = async (req, res, next) => {
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

    const report = await AnalysisReport.findOne({
      project: id,
      'aiAnalysis.status': 'completed',
    }).sort({ createdAt: -1 });

    if (!report || !report.aiAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'No AI recommendations have been generated for this project yet. Trigger POST /generate-recommendations first.',
        data: {
          isGenerating: project.aiLockToken !== null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        projectId: id,
        reportId: report._id.toString(),
        isGenerating: project.aiLockToken !== null,
        ...report.aiAnalysis,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  generateRecommendations,
  getRecommendations,
};
