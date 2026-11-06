/**
 * progressConfig.js
 * Centralized configuration for Step 10: Deterministic Progress Calculation.
 *
 * Completion Scores:
 *  - VERIFIED:     1.0 (100% of weighted points earned)
 *  - PARTIAL:      0.5 (50% of weighted points earned)
 *  - NOT_FOUND:    0.0 (0% of weighted points earned)
 *  - NEEDS_REVIEW: 0.0 (0% of weighted points earned)
 *  - PENDING:      0.0 (0% of weighted points earned)
 *
 * Verification Status Categories:
 *  - Assessed:   VERIFIED, PARTIAL, NOT_FOUND
 *  - Unassessed: PENDING, NEEDS_REVIEW
 */

export const COMPLETION_SCORES = Object.freeze({
  VERIFIED: 1.0,
  PARTIAL: 0.5,
  NOT_FOUND: 0.0,
  NEEDS_REVIEW: 0.0,
  PENDING: 0.0,
});

export const ASSESSED_STATUSES = Object.freeze(new Set(['VERIFIED', 'PARTIAL', 'NOT_FOUND']));

export const UNASSESSED_STATUSES = Object.freeze(new Set(['PENDING', 'NEEDS_REVIEW']));

/**
 * Returns the completion score for a given requirement status.
 * @param {string} status
 * @returns {number}
 */
export function getCompletionScore(status) {
  if (!status || typeof status !== 'string') {
    return COMPLETION_SCORES.PENDING;
  }
  const key = status.toUpperCase().trim();
  return typeof COMPLETION_SCORES[key] === 'number'
    ? COMPLETION_SCORES[key]
    : COMPLETION_SCORES.PENDING;
}

/**
 * Checks whether a given status counts as an assessed requirement.
 * @param {string} status
 * @returns {boolean}
 */
export function isAssessedStatus(status) {
  if (!status || typeof status !== 'string') return false;
  return ASSESSED_STATUSES.has(status.toUpperCase().trim());
}

export default {
  COMPLETION_SCORES,
  ASSESSED_STATUSES,
  UNASSESSED_STATUSES,
  getCompletionScore,
  isAssessedStatus,
};
