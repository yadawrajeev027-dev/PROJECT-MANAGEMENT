/**
 * aiAnalysisService.js
 * High-level orchestration for Step 9: AI Explanations and Development Recommendations.
 *
 * Enforces Verification Integrity:
 *  - Reads Step 7 AST analysis and Step 8 verified requirements.
 *  - Never mutates Requirement.status or changes evidence/confidence.
 *  - Validates AI responses against strict schema.
 *  - Persists AI findings onto AnalysisReport.aiAnalysis.
 */

import Project from '../../models/Project.js';
import Requirement from '../../models/Requirement.js';
import AnalysisReport from '../../models/AnalysisReport.js';
import { callAIProvider } from './aiProvider.js';
import { buildSystemInstruction, buildUserPrompt } from './promptBuilder.js';
import { extractAndParseJSON, validateAIResponse } from './responseValidator.js';

/**
 * Executes AI recommendation generation for a given project.
 *
 * @param {string|import('mongoose').Types.ObjectId} projectId
 * @param {Object} [providerOverride]
 * @returns {Promise<Object>} Persisted AI recommendation payload
 */
export async function generateProjectRecommendations(projectId, providerOverride = {}) {
  // 1. Fetch project
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Fetch the latest completed AnalysisReport
  let report = null;
  if (project.latestReport) {
    report = await AnalysisReport.findById(project.latestReport);
  }
  if (!report || report.status !== 'completed' || !report.sourceAnalysis) {
    report = await AnalysisReport.findOne({
      project: projectId,
      status: 'completed',
      sourceAnalysis: { $ne: null },
    }).sort({ createdAt: -1 });
  }

  if (!report || !report.sourceAnalysis) {
    const err = new Error('No completed static source analysis found for this project. Please complete Step 7 first.');
    err.statusCode = 400;
    throw err;
  }

  // 3. Fetch project requirements
  const requirements = await Requirement.find({ project: projectId }).sort({ createdAt: 1 });

  // 4. Require that requirements have been verified by Step 8
  const hasUnverifiedRequirements = requirements.length > 0 && requirements.every((r) => r.status === 'pending');
  if (hasUnverifiedRequirements) {
    const err = new Error('Project requirements have not been verified yet. Run POST /verify-requirements (Step 8) before generating AI recommendations.');
    err.statusCode = 400;
    throw err;
  }

  // Snapshot requirement statuses before AI generation to guarantee verification integrity
  const statusSnapshot = requirements.map((r) => ({ id: r._id.toString(), status: r.status, confidence: r.confidence }));

  // 5. Build sanitized prompts
  const systemInstruction = buildSystemInstruction();
  const userPrompt = buildUserPrompt(project, report.sourceAnalysis, requirements);

  // 6. Invoke AI Provider
  const { rawText, provider, model } = await callAIProvider(systemInstruction, userPrompt, providerOverride);

  // 7. Parse & Validate structured JSON
  const parsedJSON = extractAndParseJSON(rawText);
  const validatedData = validateAIResponse(parsedJSON);

  // 8. CRITICAL GUARANTEE: Verify that NO requirement statuses were tampered with
  for (const snap of statusSnapshot) {
    const currentReq = await Requirement.findById(snap.id);
    if (currentReq && (currentReq.status !== snap.status || currentReq.confidence !== snap.confidence)) {
      // Revert immediately if any drift occurred
      currentReq.status = snap.status;
      currentReq.confidence = snap.confidence;
      await currentReq.save();
    }
  }

  // 9. Persist AI Analysis onto AnalysisReport without overwriting verification metrics
  const aiPayload = {
    status: 'completed',
    provider,
    model,
    generatedAt: new Date(),
    projectSummary: validatedData.projectSummary,
    overallStrengths: validatedData.overallStrengths,
    majorIssues: validatedData.majorIssues,
    requirementExplanations: validatedData.requirementExplanations,
    missingFeatures: validatedData.missingFeatures,
    recommendedActions: validatedData.recommendedActions,
    suggestedPriority: validatedData.suggestedPriority,
    technicalDebt: validatedData.technicalDebt,
    improvementOpportunities: validatedData.improvementOpportunities,
    errorMessage: null,
  };

  report.aiAnalysis = aiPayload;
  await report.save();

  return {
    projectId: projectId.toString(),
    reportId: report._id.toString(),
    ...aiPayload,
  };
}

export default { generateProjectRecommendations };
