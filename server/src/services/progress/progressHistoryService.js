/**
 * progressHistoryService.js
 * Step 10: Progress History & Immutable Report Snapshot Management.
 *
 * Guarantees:
 *  - Historical reports are strictly immutable and never overwritten by subsequent calculations.
 *  - Failed and incomplete reports (status !== 'completed') are omitted from progress trends.
 *  - Computes sequential delta (progress change) between consecutive inspection snapshots.
 */

import AnalysisReport from '../../models/AnalysisReport.js';
import Project from '../../models/Project.js';
import { roundPrecision } from './progressCalculator.js';

/**
 * Persists a calculated progress snapshot onto a completed AnalysisReport and updates the Project document.
 *
 * @param {string|import('mongoose').Types.ObjectId} reportId
 * @param {Object} progressData - Output from progressCalculator.calculateProgress
 * @returns {Promise<Object>} Updated report summary
 */
export async function persistProgressSnapshot(reportId, progressData) {
  const report = await AnalysisReport.findById(reportId);
  if (!report) {
    const err = new Error('AnalysisReport not found for progress persistence.');
    err.statusCode = 404;
    throw err;
  }

  // Persist progress metrics onto the report document
  report.progressMetrics = {
    totalRequirements: progressData.totalRequirements,
    verifiedCount: progressData.verifiedCount,
    partialCount: progressData.partialCount,
    notFoundCount: progressData.notFoundCount,
    needsReviewCount: progressData.needsReviewCount,
    pendingCount: progressData.pendingCount,
    totalWeight: progressData.totalWeight,
    verifiedWeight: progressData.verifiedWeight,
    partialWeight: progressData.partialWeight,
    notFoundWeight: progressData.notFoundWeight,
    needsReviewWeight: progressData.needsReviewWeight,
    pendingWeight: progressData.pendingWeight,
    earnedWeight: progressData.earnedWeight,
    assessedWeight: progressData.assessedWeight,
    progressPercentage: progressData.progressPercentage,
    verificationCoverage: progressData.verificationCoverage,
    calculationStatus: progressData.calculationStatus,
    calculatedAt: progressData.calculatedAt || new Date(),
    warnings: progressData.warnings || [],
  };

  report.progressPercentage = progressData.progressPercentage;
  report.totalRequirements = progressData.totalRequirements;
  report.verifiedCount = progressData.verifiedCount;
  report.partialCount = progressData.partialCount;
  report.notFoundCount = progressData.notFoundCount;
  report.needsReviewCount = progressData.needsReviewCount;
  report.pendingCount = progressData.pendingCount;

  await report.save();

  // Safely update the parent Project document
  await Project.updateOne(
    { _id: report.project },
    {
      overallProgress: progressData.progressPercentage,
      progressStatus: progressData.calculationStatus,
      verificationCoverage: progressData.verificationCoverage,
      latestReport: report._id,
    }
  );

  return {
    reportId: report._id.toString(),
    projectId: report.project.toString(),
    ...report.progressMetrics,
  };
}

/**
 * Retrieves the chronological completed progress history for a project.
 *
 * @param {string|import('mongoose').Types.ObjectId} projectId
 * @returns {Promise<Array<Object>>}
 */
export async function getProgressHistory(projectId) {
  // Query only completed reports sorted chronologically (oldest to newest)
  const completedReports = await AnalysisReport.find({
    project: projectId,
    status: 'completed',
  }).sort({ createdAt: 1 });

  const history = [];
  let previousProgress = null;

  for (let i = 0; i < completedReports.length; i++) {
    const rep = completedReports[i];

    const metrics = rep.progressMetrics || {};
    const progressPercentage = typeof metrics.progressPercentage === 'number'
      ? metrics.progressPercentage
      : typeof rep.progressPercentage === 'number'
      ? rep.progressPercentage
      : 0;

    const verificationCoverage = typeof metrics.verificationCoverage === 'number'
      ? metrics.verificationCoverage
      : (rep.totalRequirements > 0
          ? roundPrecision(((rep.verifiedCount + rep.partialCount + rep.notFoundCount) / rep.totalRequirements) * 100, 2)
          : 0);

    const calculationStatus = metrics.calculationStatus || (
      rep.pendingCount === 0 && rep.needsReviewCount === 0 && rep.totalRequirements > 0
        ? 'FINAL'
        : 'PROVISIONAL'
    );

    const calculatedAt = metrics.calculatedAt || rep.completedAt || rep.createdAt;

    // Delta calculation
    const progressChange = previousProgress !== null
      ? roundPrecision(progressPercentage - previousProgress, 2)
      : 0;

    history.push({
      index: i + 1,
      reportId: rep._id.toString(),
      analysisVersion: rep.analysisVersion || '1.0.0',
      calculatedAt,
      progressPercentage,
      verificationCoverage,
      calculationStatus,
      progressChange,
      breakdown: {
        totalRequirements: metrics.totalRequirements ?? rep.totalRequirements,
        verifiedCount: metrics.verifiedCount ?? rep.verifiedCount,
        partialCount: metrics.partialCount ?? rep.partialCount,
        notFoundCount: metrics.notFoundCount ?? rep.notFoundCount,
        needsReviewCount: metrics.needsReviewCount ?? rep.needsReviewCount,
        pendingCount: metrics.pendingCount ?? rep.pendingCount,
        totalWeight: metrics.totalWeight ?? rep.totalRequirements,
        verifiedWeight: metrics.verifiedWeight ?? rep.verifiedCount,
        partialWeight: metrics.partialWeight ?? (rep.partialCount * 0.5),
        notFoundWeight: metrics.notFoundWeight ?? 0,
      },
    });

    previousProgress = progressPercentage;
  }

  return history;
}

export default {
  persistProgressSnapshot,
  getProgressHistory,
};
