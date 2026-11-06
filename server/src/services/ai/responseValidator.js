/**
 * responseValidator.js
 * Validates and sanitizes AI-generated output against a strict schema.
 *
 * Ensures:
 *  - Malformed or incomplete JSON responses are rejected safely.
 *  - Priorities are restricted strictly to: 'low' | 'medium' | 'high' | 'critical'.
 *  - All expected top-level and nested fields exist with valid types.
 */

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_STATUSES = new Set(['verified', 'partial', 'not_found', 'needs_review', 'pending']);

/**
 * Extracts and parses JSON from raw AI text output, handling markdown blocks if present.
 * @param {string} rawText
 * @returns {Object} Parsed JSON object
 */
export function extractAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI response is empty or invalid.');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Attempt locating the first { and last } if preamble or trailing commentary was included
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Malformed AI response: Failed to parse JSON: ${err.message}`);
  }
}

/**
 * Validates the structured AI analysis object.
 *
 * @param {Object} data - Parsed JSON from AI
 * @returns {Object} Sanitized and validated object
 */
export function validateAIResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Malformed AI response: Expected a root JSON object.');
  }

  // 1. projectSummary
  if (!data.projectSummary || typeof data.projectSummary !== 'string' || data.projectSummary.trim().length < 10) {
    throw new Error('Malformed AI response: "projectSummary" must be a non-empty string.');
  }

  // 2. overallStrengths
  if (!Array.isArray(data.overallStrengths)) {
    throw new Error('Malformed AI response: "overallStrengths" must be an array of strings.');
  }

  // 3. majorIssues
  if (!Array.isArray(data.majorIssues)) {
    throw new Error('Malformed AI response: "majorIssues" must be an array of strings.');
  }

  // 4. requirementExplanations
  if (!Array.isArray(data.requirementExplanations)) {
    throw new Error('Malformed AI response: "requirementExplanations" must be an array.');
  }
  for (let i = 0; i < data.requirementExplanations.length; i++) {
    const item = data.requirementExplanations[i];
    if (!item || typeof item !== 'object') {
      throw new Error(`Malformed AI response: requirementExplanations[${i}] must be an object.`);
    }
    if (!item.title || typeof item.title !== 'string') {
      throw new Error(`Malformed AI response: requirementExplanations[${i}].title is required.`);
    }
    if (!item.explanation || typeof item.explanation !== 'string') {
      throw new Error(`Malformed AI response: requirementExplanations[${i}].explanation is required.`);
    }
  }

  // 5. missingFeatures
  if (!Array.isArray(data.missingFeatures)) {
    throw new Error('Malformed AI response: "missingFeatures" must be an array of strings.');
  }

  // 6. recommendedActions
  if (!Array.isArray(data.recommendedActions)) {
    throw new Error('Malformed AI response: "recommendedActions" must be an array.');
  }
  for (let i = 0; i < data.recommendedActions.length; i++) {
    const action = data.recommendedActions[i];
    if (!action || typeof action !== 'object') {
      throw new Error(`Malformed AI response: recommendedActions[${i}] must be an object.`);
    }
    if (!action.title || typeof action.title !== 'string') {
      throw new Error(`Malformed AI response: recommendedActions[${i}].title is required.`);
    }
    if (!action.description || typeof action.description !== 'string') {
      throw new Error(`Malformed AI response: recommendedActions[${i}].description is required.`);
    }
    if (!action.reason || typeof action.reason !== 'string') {
      throw new Error(`Malformed AI response: recommendedActions[${i}].reason is required.`);
    }
    const priority = (action.priority || '').toLowerCase();
    if (!VALID_PRIORITIES.has(priority)) {
      throw new Error(
        `Invalid priority in recommendedAction "${action.title}": "${action.priority}". Must be one of: low, medium, high, critical.`
      );
    }
    action.priority = priority; // normalize

    if (!Array.isArray(action.suggestedImplementationSteps)) {
      action.suggestedImplementationSteps = [];
    }
    if (typeof action.expectedOutcome !== 'string') {
      action.expectedOutcome = '';
    }
  }

  // 7. suggestedPriority
  if (typeof data.suggestedPriority !== 'string') {
    data.suggestedPriority = '';
  }

  // 8. technicalDebt
  if (!Array.isArray(data.technicalDebt)) {
    data.technicalDebt = [];
  }

  // 9. improvementOpportunities
  if (!Array.isArray(data.improvementOpportunities)) {
    data.improvementOpportunities = [];
  }

  return {
    projectSummary: data.projectSummary.trim(),
    overallStrengths: data.overallStrengths.map(String).filter(Boolean),
    majorIssues: data.majorIssues.map(String).filter(Boolean),
    requirementExplanations: data.requirementExplanations.map((re) => ({
      requirementCode: String(re.requirementCode || ''),
      title: String(re.title || ''),
      status: String(re.status || '').toLowerCase(),
      explanation: String(re.explanation || ''),
      gapAnalysis: String(re.gapAnalysis || ''),
    })),
    missingFeatures: data.missingFeatures.map(String).filter(Boolean),
    recommendedActions: data.recommendedActions.map((ra) => ({
      title: String(ra.title).trim(),
      description: String(ra.description).trim(),
      reason: String(ra.reason).trim(),
      priority: ra.priority,
      relatedRequirementCode: ra.relatedRequirementCode ? String(ra.relatedRequirementCode) : null,
      suggestedImplementationSteps: ra.suggestedImplementationSteps.map(String).filter(Boolean),
      expectedOutcome: String(ra.expectedOutcome).trim(),
    })),
    suggestedPriority: data.suggestedPriority.trim(),
    technicalDebt: data.technicalDebt.map(String).filter(Boolean),
    improvementOpportunities: data.improvementOpportunities.map(String).filter(Boolean),
  };
}

export default { extractAndParseJSON, validateAIResponse };
