/**
 * verificationService.js
 * Orchestrates the Step 8 Requirement Verification pipeline:
 *  1. Retrieves the project and its latest completed AnalysisReport (sourceAnalysis).
 *  2. Reads all Requirement documents associated with the project.
 *  3. Executes normalization, evidence collection, and verification rule evaluation.
 *  4. Persists the verification verdicts and line-referenced evidence back into MongoDB.
 *  5. Aggregates metrics (verifiedCount, partialCount, progressPercentage) and updates AnalysisReport.
 *
 * Preserves historical reports and requirements without deletion.
 */

import fs from 'fs';
import Project from '../../models/Project.js';
import Requirement from '../../models/Requirement.js';
import AnalysisReport from '../../models/AnalysisReport.js';
import { normalizeRequirement } from './requirementNormalizer.js';
import { collectEvidence } from './evidenceCollector.js';
import { matchRequirement } from './requirementMatcher.js';

/**
 * Execute requirement verification for a given project.
 *
 * @param {string|import('mongoose').Types.ObjectId} projectId
 * @returns {Promise<Object>} Verification results summary
 */
export async function verifyProjectRequirements(projectId) {
  // 1. Fetch project with extractedStoragePath
  const project = await Project.findById(projectId).select('+extractedStoragePath');
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Fetch the latest completed AnalysisReport containing sourceAnalysis
  let report = null;
  if (project.latestReport) {
    report = await AnalysisReport.findById(project.latestReport);
  }
  if (!report || report.status !== 'completed' || !report.sourceAnalysis) {
    // Fallback: look for most recent completed report with sourceAnalysis
    report = await AnalysisReport.findOne({
      project: projectId,
      status: 'completed',
      sourceAnalysis: { $ne: null },
    }).sort({ createdAt: -1 });
  }

  if (!report || !report.sourceAnalysis) {
    const err = new Error('No completed static source analysis found for this project. Run POST /analyze-source first.');
    err.statusCode = 400;
    throw err;
  }

  const sourceAnalysis = report.sourceAnalysis;
  const extractedRoot = project.extractedStoragePath && fs.existsSync(project.extractedStoragePath)
    ? project.extractedStoragePath
    : null;

  // Context for incomplete scan detection
  const matchContext = {
    unsupportedFiles: sourceAnalysis.unsupportedFiles || [],
    analysisWarnings: sourceAnalysis.analysisWarnings || [],
    totalFiles: sourceAnalysis.totalFiles || 0,
  };

  // 3. Fetch all requirements for this project
  const requirements = await Requirement.find({ project: projectId }).sort({ createdAt: 1 });

  const verificationResults = [];
  let verifiedCount = 0;
  let partialCount = 0;
  let notFoundCount = 0;
  let needsReviewCount = 0;
  let pendingCount = 0;
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const reqDoc of requirements) {
    const weight = typeof reqDoc.weight === 'number' && reqDoc.weight >= 0 ? reqDoc.weight : 1;
    totalWeight += weight;

    // Normalization
    const normalized = normalizeRequirement(reqDoc);

    // Evidence Collection
    const evidenceList = collectEvidence(normalized, sourceAnalysis, extractedRoot);

    // Matching & Decision Rules
    const verdict = matchRequirement(normalized, evidenceList, matchContext);

    // Track counts
    switch (verdict.status) {
      case 'verified':
        verifiedCount++;
        earnedWeight += weight * 1.0;
        break;
      case 'partial':
        partialCount++;
        earnedWeight += weight * 0.5; // Partial earns 50% weighted progress
        break;
      case 'not_found':
        notFoundCount++;
        break;
      case 'needs_review':
        needsReviewCount++;
        break;
      case 'pending':
      default:
        pendingCount++;
        break;
    }

    // Persist to Requirement document in MongoDB
    const safeEvidence = evidenceList.map((e) => ({
      filePath: e.filePath,
      lineStart: e.lineStart,
      lineEnd: e.lineEnd,
      evidenceType: e.evidenceType,
      confidence: e.confidence,
      strength: e.strength,
      explanation: e.explanation,
      snippet: e.snippet || '',
    }));

    reqDoc.status = verdict.status;
    reqDoc.confidence = verdict.confidence;
    reqDoc.explanation = verdict.explanation;
    reqDoc.evidence = safeEvidence;
    reqDoc.verificationMethod = 'static_ast_evidence';
    reqDoc.analysisReport = report._id;
    reqDoc.verifiedAt = new Date();
    await reqDoc.save();

    verificationResults.push({
      id: reqDoc._id.toString(),
      requirementCode: reqDoc.requirementCode,
      title: reqDoc.title,
      priority: reqDoc.priority,
      weight: reqDoc.weight,
      status: verdict.status,
      confidence: verdict.confidence,
      explanation: verdict.explanation,
      evidenceCount: safeEvidence.length,
      evidence: safeEvidence,
    });
  }

  // Calculate overall weighted progress percentage
  const progressPercentage = totalWeight > 0
    ? Math.round((earnedWeight / totalWeight) * 100)
    : 0;

  // 4. Update the AnalysisReport document with verification metrics
  report.totalRequirements = requirements.length;
  report.verifiedCount = verifiedCount;
  report.partialCount = partialCount;
  report.notFoundCount = notFoundCount;
  report.needsReviewCount = needsReviewCount;
  report.pendingCount = pendingCount;
  report.progressPercentage = progressPercentage;
  await report.save();

  return {
    projectId: projectId.toString(),
    reportId: report._id.toString(),
    totalRequirements: requirements.length,
    verifiedCount,
    partialCount,
    notFoundCount,
    needsReviewCount,
    pendingCount,
    progressPercentage,
    verifiedAt: new Date(),
    requirements: verificationResults,
  };
}

export default { verifyProjectRequirements };
