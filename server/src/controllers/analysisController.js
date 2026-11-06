/**
 * analysisController.js
 * HTTP controller for Step 7: Static Source Code Analysis.
 *
 * Endpoints:
 *   POST /api/projects/:id/analyze-source
 *   GET  /api/projects/:id/source-analysis-status
 *
 * Security:
 * - Validates project ownership.
 * - Requires extractionStatus === 'completed'.
 * - Uses an atomic MongoDB lock on the Project document to prevent concurrent analysis
 *   of the same project across multiple requests/processes.
 * - Never exposes absolute server paths in responses.
 * - Never executes uploaded code.
 */

import crypto from 'crypto';
import fs from 'fs';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { analyzeSourceCode } from '../services/analysis/sourceAnalysisService.js';

const ANALYSIS_VERSION = '7.0.0';

// ─── POST /api/projects/:id/analyze-source ───────────────────────────────────

/**
 * Start static source code analysis for the authenticated user's project.
 *
 * Flow:
 *  1. Validate project ID, ownership, extraction status.
 *  2. Acquire atomic DB lock on the Project document. Return 409 if already analyzing.
 *  3. Create a new AnalysisReport (status: analyzing).
 *  4. Run analysis pipeline (analyzeSourceCode).
 *  5. Persist results; mark report 'completed'.
 *  6. Release lock on Project and update project.latestReport reference.
 */
export const startSourceAnalysis = async (req, res, next) => {
  let reportId = null;
  let lockToken = null;
  const { id } = req.params;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    // 2. Verify ownership; fetch protected extractedStoragePath
    const project = await Project.findOne({ _id: id, owner: req.user._id })
      .select('+extractedStoragePath');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 3. Require completed extraction
    if (project.extractionStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Project extraction must be completed before analysis. Current extraction status: "${project.extractionStatus}"`,
      });
    }

    // 4. Verify extracted directory exists on disk
    if (!project.extractedStoragePath || !fs.existsSync(project.extractedStoragePath)) {
      return res.status(400).json({
        success: false,
        message: 'Extracted project directory not found on server storage',
      });
    }

    // 5. Atomic Lock on Project Document
    // Prevents race conditions: only one concurrent request can acquire the lock
    lockToken = crypto.randomUUID();
    const lockedProject = await Project.findOneAndUpdate(
      {
        _id: id,
        owner: req.user._id,
        analysisLockToken: null,
        status: { $ne: 'analyzing' },
      },
      {
        status: 'analyzing',
        analysisLockToken: lockToken,
        analysisStartedAt: new Date(),
      },
      { returnDocument: 'after' }
    ).select('+extractedStoragePath');

    if (!lockedProject) {
      return res.status(409).json({
        success: false,
        message: 'Source code analysis is already in progress for this project',
      });
    }

    // 6. Create report document (status: analyzing)
    const report = await AnalysisReport.create({
      project: id,
      analysisVersion: ANALYSIS_VERSION,
      status: 'analyzing',
      startedAt: new Date(),
    });
    reportId = report._id;

    // 7. Run static analysis pipeline
    let result;
    try {
      result = await analyzeSourceCode(lockedProject.extractedStoragePath);
    } catch (analysisErr) {
      // Mark report as failed
      await AnalysisReport.updateOne(
        { _id: reportId },
        {
          status: 'failed',
          errorMessage: analysisErr.message ?? 'Source analysis failed',
          completedAt: new Date(),
        }
      );

      // Release project lock
      await Project.updateOne(
        { _id: id, analysisLockToken: lockToken },
        {
          status: 'failed',
          analysisLockToken: null,
          analysisStartedAt: null,
        }
      );
      lockToken = null;

      const statusCode = analysisErr.statusCode ?? 500;
      return res.status(statusCode).json({
        success: false,
        message: analysisErr.message ?? 'Source code analysis failed',
      });
    }

    // 8. Persist results (strip absolutePath from fileInventory before saving)
    const safeInventory = (result.fileInventory ?? []).map(({ absolutePath: _abs, ...rest }) => rest);
    const techNames = [...new Set(result.technologies.map((t) => t.name))];

    await AnalysisReport.updateOne(
      { _id: reportId },
      {
        status: 'completed',
        completedAt: new Date(),
        detectedTechnologies: techNames,
        sourceAnalysis: {
          totalFiles: result.totalFiles,
          scannedFiles: result.scannedFiles,
          skippedFiles: result.skippedFiles,
          totalSourceSize: result.totalSourceSize,
          languages: result.languages,
          technologies: result.technologies,
          functionCount: result.functions.length,
          classCount: result.classes.length,
          reactComponentCount: result.reactComponents.length,
          expressRouteCount: result.expressRoutes.length,
          importCount: result.imports.length,
          exportCount: result.exports.length,
          syntaxErrorCount: result.syntaxErrors.length,
          functions: result.functions,
          classes: result.classes,
          reactComponents: result.reactComponents,
          expressRoutes: result.expressRoutes,
          imports: result.imports,
          exports: result.exports,
          syntaxErrors: result.syntaxErrors,
          unsupportedFiles: result.unsupportedFiles,
          fileInventory: safeInventory,
          analysisWarnings: result.analysisWarnings,
        },
      }
    );

    // 9. Update project.latestReport and release project lock safely
    await Project.updateOne(
      { _id: id, analysisLockToken: lockToken },
      {
        status: 'completed',
        analysisLockToken: null,
        analysisStartedAt: null,
        latestReport: reportId,
      }
    );
    lockToken = null;

    // 10. Return summary response (safe metrics, no sensitive server paths)
    return res.status(200).json({
      success: true,
      message: 'Source code analysis completed successfully',
      data: {
        reportId: reportId.toString(),
        analysisVersion: ANALYSIS_VERSION,
        totalFiles: result.totalFiles,
        scannedFiles: result.scannedFiles,
        skippedFiles: result.skippedFiles,
        totalSourceSize: result.totalSourceSize,
        languages: result.languages,
        detectedTechnologies: techNames,
        functionCount: result.functions.length,
        classCount: result.classes.length,
        reactComponentCount: result.reactComponents.length,
        expressRouteCount: result.expressRoutes.length,
        syntaxErrorCount: result.syntaxErrors.length,
        analysisWarnings: result.analysisWarnings,
      },
    });
  } catch (error) {
    // Safety net: release lock on Project and mark report failed if error thrown
    if (lockToken) {
      try {
        await Project.updateOne(
          { _id: id, analysisLockToken: lockToken },
          {
            status: 'failed',
            analysisLockToken: null,
            analysisStartedAt: null,
          }
        );
        if (reportId) {
          await AnalysisReport.updateOne(
            { _id: reportId },
            {
              status: 'failed',
              errorMessage: error.message,
              completedAt: new Date(),
            }
          );
        }
      } catch (cleanupErr) {
        console.error('Failed to release analysis lock after error:', cleanupErr.message);
      }
    }
    next(error);
  }
};

// ─── GET /api/projects/:id/source-analysis-status ────────────────────────────

/**
 * Return the latest source analysis status and result summary for a project.
 */
export const getSourceAnalysisStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    // Verify ownership
    const project = await Project.findOne({ _id: id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Fetch the most recent report for this project
    const report = await AnalysisReport.findOne({ project: id })
      .sort({ createdAt: -1 })
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No analysis report found for this project. Run POST /analyze-source first.',
      });
    }

    // Build safe response — never expose absolute paths
    const sa = report.sourceAnalysis ?? null;

    return res.status(200).json({
      success: true,
      data: {
        reportId: report._id.toString(),
        status: report.status,
        analysisVersion: report.analysisVersion,
        startedAt: report.startedAt,
        completedAt: report.completedAt,
        errorMessage: report.errorMessage,
        detectedTechnologies: report.detectedTechnologies ?? [],
        // Source analysis summary (populated on completion)
        sourceAnalysis: sa
          ? {
              totalFiles: sa.totalFiles,
              scannedFiles: sa.scannedFiles,
              skippedFiles: sa.skippedFiles,
              totalSourceSize: sa.totalSourceSize,
              languages: sa.languages,
              technologies: sa.technologies,
              functionCount: sa.functionCount,
              classCount: sa.classCount,
              reactComponentCount: sa.reactComponentCount,
              expressRouteCount: sa.expressRouteCount,
              importCount: sa.importCount,
              exportCount: sa.exportCount,
              syntaxErrorCount: sa.syntaxErrorCount,
              functions: sa.functions,
              classes: sa.classes,
              reactComponents: sa.reactComponents,
              expressRoutes: sa.expressRoutes,
              imports: sa.imports,
              exports: sa.exports,
              syntaxErrors: sa.syntaxErrors,
              unsupportedFiles: sa.unsupportedFiles,
              fileInventory: sa.fileInventory,
              analysisWarnings: sa.analysisWarnings,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { startSourceAnalysis, getSourceAnalysisStatus };
