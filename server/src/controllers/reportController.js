/**
 * reportController.js
 * Step 11: Persisted Analysis Reports Controller.
 *
 * Endpoints:
 *  - GET /api/reports
 *  - GET /api/reports/:id
 *  - GET /api/projects/:id/reports
 *
 * Enforces:
 *  - Multi-tenant IDOR protection (user can only access reports for projects they own).
 *  - Zero absolute filesystem path leakage.
 */

import mongoose from 'mongoose';
import Project from '../models/Project.js';
import AnalysisReport from '../models/AnalysisReport.js';

/**
 * GET /api/reports
 * Retrieve all analysis reports across all projects owned by the authenticated user.
 */
export const getAllReports = async (req, res, next) => {
  try {
    // 1. Get all projects owned by this user
    const userProjects = await Project.find({ owner: req.user._id }).select('_id name category status');
    const projectMap = new Map();
    userProjects.forEach((p) => projectMap.set(p._id.toString(), p));

    const projectIds = userProjects.map((p) => p._id);

    // 2. Fetch reports
    const reports = await AnalysisReport.find({
      project: { $in: projectIds },
    }).sort({ createdAt: -1 });

    const safeReports = reports.map((rep) => {
      const proj = projectMap.get(rep.project.toString()) || {};
      const metrics = rep.progressMetrics || {};

      return {
        id: rep._id.toString(),
        reportId: rep._id.toString(),
        projectId: rep.project.toString(),
        projectName: proj.name || 'Unnamed Project',
        projectCategory: proj.category || 'Web Application',
        analysisVersion: rep.analysisVersion || '1.0.0',
        status: rep.status,
        progressPercentage: typeof metrics.progressPercentage === 'number'
          ? metrics.progressPercentage
          : rep.progressPercentage || 0,
        verificationCoverage: metrics.verificationCoverage || 0,
        calculationStatus: metrics.calculationStatus || 'PROVISIONAL',
        totalRequirements: metrics.totalRequirements ?? rep.totalRequirements ?? 0,
        verifiedCount: metrics.verifiedCount ?? rep.verifiedCount ?? 0,
        partialCount: metrics.partialCount ?? rep.partialCount ?? 0,
        notFoundCount: metrics.notFoundCount ?? rep.notFoundCount ?? 0,
        needsReviewCount: metrics.needsReviewCount ?? rep.needsReviewCount ?? 0,
        pendingCount: metrics.pendingCount ?? rep.pendingCount ?? 0,
        totalFiles: rep.sourceAnalysis?.totalFiles || 0,
        totalLines: rep.sourceAnalysis?.totalLines || 0,
        hasAIAnalysis: Boolean(rep.aiAnalysis && rep.aiAnalysis.status === 'completed'),
        aiSummary: rep.aiAnalysis?.projectSummary || null,
        createdAt: rep.createdAt,
        completedAt: rep.completedAt || rep.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: safeReports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id
 * Retrieve full details for a single analysis report.
 */
export const getSingleReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    const report = await AnalysisReport.findById(id).populate('project', 'name description category status owner');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Analysis report not found',
      });
    }

    // Verify ownership (IDOR Guard)
    if (!report.project || report.project.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Analysis report not found',
      });
    }

    const metrics = report.progressMetrics || {};

    return res.status(200).json({
      success: true,
      data: {
        id: report._id.toString(),
        reportId: report._id.toString(),
        projectId: report.project._id.toString(),
        projectName: report.project.name,
        projectDescription: report.project.description,
        projectCategory: report.project.category,
        analysisVersion: report.analysisVersion,
        status: report.status,
        progressPercentage: typeof metrics.progressPercentage === 'number'
          ? metrics.progressPercentage
          : report.progressPercentage || 0,
        verificationCoverage: metrics.verificationCoverage || 0,
        calculationStatus: metrics.calculationStatus || 'PROVISIONAL',
        progressMetrics: metrics,
        breakdown: {
          totalRequirements: metrics.totalRequirements ?? report.totalRequirements ?? 0,
          verifiedCount: metrics.verifiedCount ?? report.verifiedCount ?? 0,
          partialCount: metrics.partialCount ?? report.partialCount ?? 0,
          notFoundCount: metrics.notFoundCount ?? report.notFoundCount ?? 0,
          needsReviewCount: metrics.needsReviewCount ?? report.needsReviewCount ?? 0,
          pendingCount: metrics.pendingCount ?? report.pendingCount ?? 0,
          totalWeight: metrics.totalWeight ?? 0,
          verifiedWeight: metrics.verifiedWeight ?? 0,
          partialWeight: metrics.partialWeight ?? 0,
          notFoundWeight: metrics.notFoundWeight ?? 0,
        },
        sourceAnalysis: report.sourceAnalysis,
        aiAnalysis: report.aiAnalysis,
        findings: report.findings || [],
        startedAt: report.startedAt,
        completedAt: report.completedAt || report.createdAt,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id/reports
 * Retrieve all reports for a specific project.
 */
export const getProjectReports = async (req, res, next) => {
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

    const reports = await AnalysisReport.find({ project: id }).sort({ createdAt: -1 });

    const safeReports = reports.map((rep) => ({
      id: rep._id.toString(),
      reportId: rep._id.toString(),
      projectId: id,
      analysisVersion: rep.analysisVersion || '1.0.0',
      status: rep.status,
      progressPercentage: rep.progressMetrics?.progressPercentage ?? rep.progressPercentage ?? 0,
      verificationCoverage: rep.progressMetrics?.verificationCoverage ?? 0,
      calculationStatus: rep.progressMetrics?.calculationStatus || 'PROVISIONAL',
      totalRequirements: rep.progressMetrics?.totalRequirements ?? rep.totalRequirements ?? 0,
      verifiedCount: rep.progressMetrics?.verifiedCount ?? rep.verifiedCount ?? 0,
      partialCount: rep.progressMetrics?.partialCount ?? rep.partialCount ?? 0,
      notFoundCount: rep.progressMetrics?.notFoundCount ?? rep.notFoundCount ?? 0,
      hasAIAnalysis: Boolean(rep.aiAnalysis && rep.aiAnalysis.status === 'completed'),
      createdAt: rep.createdAt,
      completedAt: rep.completedAt || rep.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: safeReports,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllReports,
  getSingleReport,
  getProjectReports,
};
