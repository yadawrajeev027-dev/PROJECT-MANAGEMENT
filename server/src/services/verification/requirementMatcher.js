/**
 * requirementMatcher.js
 * Evaluates collected evidence against a normalized requirement to produce
 * a definitive, transparent verification verdict.
 *
 * Verdicts:
 * - VERIFIED: Convincing, multi-part or strong implementation evidence found.
 * - PARTIAL: Incomplete implementation (e.g. login UI without auth backend, API route stub, model without queries).
 * - NOT_FOUND: Complete scan found no implementation evidence.
 * - NEEDS_REVIEW: Ambiguous, conflicting, or unsupported language scan.
 * - PENDING: Untouched / default state.
 */

/**
 * @typedef {Object} VerificationVerdict
 * @property {'verified'|'partial'|'not_found'|'needs_review'|'pending'} status
 * @property {number} confidence - 0 to 100
 * @property {string} explanation - Transparent human-readable explanation
 * @property {number} completeness - Estimated requirement completeness 0 to 100
 */

/**
 * Matches collected evidence to determine the verification status of a requirement.
 *
 * @param {Object} normalizedReq  - Output of normalizeRequirement
 * @param {Array<Object>} evidenceList - Output of collectEvidence
 * @param {Object} [context]      - Additional context (scan warnings, unsupported files, etc.)
 * @returns {VerificationVerdict}
 */
export function matchRequirement(normalizedReq, evidenceList = [], context = {}) {
  const { flags, title } = normalizedReq;
  const unsupportedFiles = context.unsupportedFiles || [];
  const analysisWarnings = context.analysisWarnings || [];

  // ── Rule 1: Incomplete or Unsupported Scan → NEEDS_REVIEW ───────────────────
  // If the project predominantly consists of unsupported AST languages (e.g. Python, Java)
  // or heavy scan budget aborts, we cannot conclusively say NOT_FOUND.
  const hasUnsupportedLanguages = unsupportedFiles.some(
    (f) => f.reason === 'no-ast-parser' && !['.json', '.md', '.txt', '.yaml', '.yml'].includes(f.extension?.toLowerCase())
  );
  const hasHeavyScanWarnings = analysisWarnings.some((w) => w.includes('budget exceeded') || w.includes('limit reached'));

  if (evidenceList.length === 0 && (hasUnsupportedLanguages || hasHeavyScanWarnings)) {
    return {
      status: 'needs_review',
      confidence: 40,
      completeness: 0,
      explanation: 'Analysis scan is incomplete or the codebase contains languages without full AST parser support (e.g. Python, Java). Manual review required.',
    };
  }

  // ── Rule 2: Ambiguous Requirements → NEEDS_REVIEW ──────────────────────────
  // If the requirement title or description is empty, generic, or conflicting
  if (!title || title.trim().length < 4 || /ambiguous|tbd|to be determined|needs discussion/i.test(title)) {
    return {
      status: 'needs_review',
      confidence: 30,
      completeness: 0,
      explanation: 'Requirement definition is ambiguous or unspecified. Implementation cannot be verified accurately.',
    };
  }

  // ── Rule 3: Zero Evidence → NOT_FOUND ──────────────────────────────────────
  if (evidenceList.length === 0) {
    return {
      status: 'not_found',
      confidence: 90,
      completeness: 0,
      explanation: 'A complete static AST scan of the project codebase found no matching functions, routes, components, or database operations for this requirement.',
    };
  }

  // ── Analyze Evidence Composition ───────────────────────────────────────────
  const strongItems = evidenceList.filter((e) => e.strength === 'strong');
  const moderateItems = evidenceList.filter((e) => e.strength === 'moderate');
  const weakItems = evidenceList.filter((e) => e.strength === 'weak');

  const hasRoute = evidenceList.some((e) => e.evidenceType === 'api_route');
  const hasComponent = evidenceList.some((e) => e.evidenceType === 'react_component');
  const hasFunction = evidenceList.some((e) => e.evidenceType === 'function');
  const hasModel = evidenceList.some((e) => e.evidenceType === 'database_model');
  const onlyWeakOrImports = evidenceList.every((e) => e.strength === 'weak' || e.evidenceType === 'import');

  // ── Rule 4: Only Imports or Weak Stubs → PARTIAL ───────────────────────────
  if (onlyWeakOrImports) {
    const isOnlyImports = evidenceList.every((e) => e.evidenceType === 'import');
    if (isOnlyImports) {
      return {
        status: 'partial',
        confidence: 45,
        completeness: 20,
        explanation: 'Associated libraries are imported, but no concrete functions, routes, or components implementing the required capability were found.',
      };
    }

    return {
      status: 'partial',
      confidence: 50,
      completeness: 25,
      explanation: 'Only empty handler stubs, placeholders, or superficial declarations were found without actionable business logic.',
    };
  }

  // ── Rule 5: Authentication Special Verification Rules ─────────────────────
  // A login UI alone does NOT prove authentication works!
  if (flags.requiresAuth) {
    const hasAuthLogicEvidence = strongItems.some((e) =>
      e.explanation.toLowerCase().includes('cryptographic') ||
      e.explanation.toLowerCase().includes('token') ||
      e.explanation.toLowerCase().includes('verified') ||
      e.explanation.toLowerCase().includes('auth')
    );
    const hasUIOnly = hasComponent && !hasAuthLogicEvidence && !hasRoute;

    if (hasUIOnly) {
      return {
        status: 'partial',
        confidence: 70,
        completeness: 40,
        explanation: 'Frontend login or authentication UI component exists, but no backend authentication middleware, password hashing, or token verification logic was found.',
      };
    }

    if (hasRoute && !hasAuthLogicEvidence) {
      return {
        status: 'partial',
        confidence: 65,
        completeness: 50,
        explanation: 'Authentication endpoint is declared, but cryptographic password hashing or secure session/token verification logic is incomplete or unverified.',
      };
    }

    if (hasAuthLogicEvidence || (hasRoute && hasFunction && strongItems.length > 0)) {
      return {
        status: 'verified',
        confidence: 90,
        completeness: 100,
        explanation: 'Complete authentication capability verified with active cryptographic or token verification logic.',
      };
    }
  }

  // ── Rule 6: Database Persistence Special Verification Rules ───────────────
  // A Mongoose model alone does NOT prove persistent storage works!
  if (flags.requiresPersistence) {
    const hasPersistenceLogicEvidence = strongItems.some((e) =>
      e.explanation.includes('persistence') || e.explanation.includes('query')
    );

    if (hasModel && !hasPersistenceLogicEvidence) {
      return {
        status: 'partial',
        confidence: 70,
        completeness: 40,
        explanation: 'Database schema or model definition exists, but no database persistence operations (.save, .create, .find) were found operating on it.',
      };
    }

    if (hasPersistenceLogicEvidence) {
      return {
        status: 'verified',
        confidence: 90,
        completeness: 100,
        explanation: 'Database model definition and active database query/persistence operations verified.',
      };
    }
  }

  // ── Rule 7: API Route Stubs vs Real Logic ─────────────────────────────────
  const routeEvidence = evidenceList.filter((e) => e.evidenceType === 'api_route');
  if (routeEvidence.length > 0 && flags.requiresBackend) {
    const allRoutesAreWeak = routeEvidence.every((r) => r.strength === 'weak');
    if (allRoutesAreWeak && strongItems.length === 0) {
      return {
        status: 'partial',
        confidence: 60,
        completeness: 35,
        explanation: 'API route is declared, but the handler implementation appears to be an empty placeholder or stub without business logic.',
      };
    }
  }

  // ── Rule 8: General Verified Verification ─────────────────────────────────
  if (strongItems.length >= 1 || moderateItems.length >= 2 || (hasRoute && hasFunction)) {
    const avgConfidence = Math.round(
      evidenceList.reduce((acc, e) => acc + (e.confidence || 75), 0) / evidenceList.length
    );
    const confidenceScore = Math.min(95, Math.max(80, avgConfidence));

    return {
      status: 'verified',
      confidence: confidenceScore,
      completeness: 100,
      explanation: `Implementation verified through concrete AST evidence (${evidenceList.length} supporting artifact(s) identified across project source files).`,
    };
  }

  // ── Rule 9: Partial / Incomplete Fallback ──────────────────────────────────
  return {
    status: 'partial',
    confidence: 65,
    completeness: 50,
    explanation: 'Some implementation elements were detected, but full end-to-end functionality could not be completely verified from the available AST evidence.',
  };
}

export default { matchRequirement };
