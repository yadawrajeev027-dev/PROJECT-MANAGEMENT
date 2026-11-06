/**
 * progressCalculator.js
 * Step 10: Deterministic Weighted Progress & Verification Coverage Engine.
 *
 * Enforces:
 *  - Strict deterministic calculation: Never uses AI or subjective heuristics.
 *  - Configurable completion scores from progressConfig.js.
 *  - Zero-division guards and strict weight validation.
 *  - Dual tracking: Project Progress (%) & Verification Coverage (%).
 *  - Calculation Status: FINAL vs PROVISIONAL.
 */

import {
  COMPLETION_SCORES,
  getCompletionScore,
  isAssessedStatus,
} from './progressConfig.js';

/**
 * Validates requirement weight.
 * Throws an explicit error if weight is not a valid non-negative finite number.
 *
 * @param {*} weight
 * @param {string} identifier
 * @returns {number}
 */
export function validateWeight(weight, identifier = 'requirement') {
  if (weight === null || weight === undefined) {
    throw new Error(`Invalid requirement weight for "${identifier}": Weight is required and cannot be null or undefined.`);
  }

  const num = typeof weight === 'number' ? weight : Number(weight);

  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error(`Invalid requirement weight for "${identifier}": Weight must be a finite number. Received: ${weight}`);
  }

  if (num < 0) {
    throw new Error(`Invalid requirement weight for "${identifier}": Weight cannot be negative. Received: ${weight}`);
  }

  return num;
}

/**
 * Rounds a number to a specified number of decimal places (default: 2).
 *
 * @param {number} val
 * @param {number} [decimals=2]
 * @returns {number}
 */
export function roundPrecision(val, decimals = 2) {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates weighted project progress and verification coverage from requirement records.
 *
 * Formula:
 *  Progress (%) = SUM(weight * completionScore) / SUM(weight) * 100
 *  Coverage (%) = SUM(assessedWeight) / SUM(weight) * 100
 *
 * @param {Array<Object>} requirements - Array of requirement documents / plain objects
 * @param {Object} [options]
 * @param {boolean} [options.allowDuplicateCodes=true]
 * @returns {Object} Comprehensive progress breakdown and metadata
 */
export function calculateProgress(requirements = [], options = {}) {
  const calculatedAt = new Date();
  const warnings = [];

  // 1. Handle missing or zero requirements
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return {
      totalRequirements: 0,
      verifiedCount: 0,
      partialCount: 0,
      notFoundCount: 0,
      needsReviewCount: 0,
      pendingCount: 0,
      totalWeight: 0,
      verifiedWeight: 0,
      partialWeight: 0,
      notFoundWeight: 0,
      needsReviewWeight: 0,
      pendingWeight: 0,
      earnedWeight: 0,
      assessedWeight: 0,
      progressPercentage: 0,
      verificationCoverage: 0,
      calculationStatus: 'PROVISIONAL',
      calculatedAt,
      warnings: ['No requirements registered for project.'],
      itemizedBreakdown: [],
    };
  }

  // 2. Track duplicate requirement codes
  const seenCodes = new Set();
  const duplicateCodes = new Set();

  for (const r of requirements) {
    const code = (r.requirementCode || '').trim();
    if (code) {
      if (seenCodes.has(code)) {
        duplicateCodes.add(code);
      } else {
        seenCodes.add(code);
      }
    }
  }

  if (duplicateCodes.size > 0) {
    warnings.push(`Duplicate requirement codes detected: ${Array.from(duplicateCodes).join(', ')}`);
  }

  // 3. Aggregate metrics across requirements
  let totalWeight = 0;
  let earnedWeight = 0;
  let assessedWeight = 0;

  let verifiedCount = 0;
  let partialCount = 0;
  let notFoundCount = 0;
  let needsReviewCount = 0;
  let pendingCount = 0;

  let verifiedWeight = 0;
  let partialWeight = 0;
  let notFoundWeight = 0;
  let needsReviewWeight = 0;
  let pendingWeight = 0;

  const itemizedBreakdown = [];

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const identifier = req.requirementCode || req.title || `Index ${i}`;

    // Validate weight strictly - never silently accept negative, NaN, or non-finite weights
    const weight = validateWeight(req.weight, identifier);
    totalWeight += weight;

    // Normalize status
    const rawStatus = (req.status || 'pending').toUpperCase().trim();
    const statusKey = ['VERIFIED', 'PARTIAL', 'NOT_FOUND', 'NEEDS_REVIEW', 'PENDING'].includes(rawStatus)
      ? rawStatus
      : 'PENDING';

    const completionScore = getCompletionScore(statusKey);
    const itemEarnedWeight = weight * completionScore;
    earnedWeight += itemEarnedWeight;

    const isAssessed = isAssessedStatus(statusKey);
    if (isAssessed) {
      assessedWeight += weight;
    }

    // Categorize counts and weights
    switch (statusKey) {
      case 'VERIFIED':
        verifiedCount++;
        verifiedWeight += weight;
        break;
      case 'PARTIAL':
        partialCount++;
        partialWeight += weight;
        break;
      case 'NOT_FOUND':
        notFoundCount++;
        notFoundWeight += weight;
        break;
      case 'NEEDS_REVIEW':
        needsReviewCount++;
        needsReviewWeight += weight;
        break;
      case 'PENDING':
      default:
        pendingCount++;
        pendingWeight += weight;
        break;
    }

    itemizedBreakdown.push({
      id: req._id ? req._id.toString() : req.id || String(i),
      requirementCode: req.requirementCode || '',
      title: req.title || '',
      status: statusKey.toLowerCase(),
      weight,
      completionScore,
      earnedWeight: roundPrecision(itemEarnedWeight, 4),
      isAssessed,
    });
  }

  // 4. Zero total weight guard
  if (totalWeight <= 0) {
    return {
      totalRequirements: requirements.length,
      verifiedCount,
      partialCount,
      notFoundCount,
      needsReviewCount,
      pendingCount,
      totalWeight: 0,
      verifiedWeight: 0,
      partialWeight: 0,
      notFoundWeight: 0,
      needsReviewWeight: 0,
      pendingWeight: 0,
      earnedWeight: 0,
      assessedWeight: 0,
      progressPercentage: 0,
      verificationCoverage: 0,
      calculationStatus: 'PROVISIONAL',
      calculatedAt,
      warnings: [...warnings, 'Total requirement weight is 0. Progress cannot be computed.'],
      itemizedBreakdown,
    };
  }

  // 5. Calculate percentages with precision clamping to [0, 100]
  const rawProgress = (earnedWeight / totalWeight) * 100;
  const progressPercentage = roundPrecision(Math.min(100, Math.max(0, rawProgress)), 2);

  const rawCoverage = (assessedWeight / totalWeight) * 100;
  const verificationCoverage = roundPrecision(Math.min(100, Math.max(0, rawCoverage)), 2);

  // 6. Determine Calculation Status (FINAL vs PROVISIONAL)
  // If any requirement is pending or needs review, status is PROVISIONAL
  // If all requirements are assessed (100% coverage) and totalRequirements > 0, status is FINAL
  const isFullyAssessed = pendingCount === 0 && needsReviewCount === 0 && verificationCoverage >= 100;
  const calculationStatus = isFullyAssessed ? 'FINAL' : 'PROVISIONAL';

  return {
    totalRequirements: requirements.length,
    verifiedCount,
    partialCount,
    notFoundCount,
    needsReviewCount,
    pendingCount,
    totalWeight: roundPrecision(totalWeight, 2),
    verifiedWeight: roundPrecision(verifiedWeight, 2),
    partialWeight: roundPrecision(partialWeight, 2),
    notFoundWeight: roundPrecision(notFoundWeight, 2),
    needsReviewWeight: roundPrecision(needsReviewWeight, 2),
    pendingWeight: roundPrecision(pendingWeight, 2),
    earnedWeight: roundPrecision(earnedWeight, 2),
    assessedWeight: roundPrecision(assessedWeight, 2),
    progressPercentage,
    verificationCoverage,
    calculationStatus,
    calculatedAt,
    warnings,
    itemizedBreakdown,
  };
}

export default {
  calculateProgress,
  validateWeight,
  roundPrecision,
};
