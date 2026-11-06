/**
 * ProjectPulse AI - Canonical Requirements & Progress Metrics Calculator
 * 
 * Provides a single mathematical and logical source of truth for:
 * 1. Total requirements count
 * 2. Completion status breakdown (Verified, Partial, Missing, Pending)
 * 3. Weighted progress score calculation
 * 4. State discrimination (Pending Analysis vs Analyzed)
 */

export function calculateRequirementMetrics(requirements = [], analysisStatus = 'Completed') {
  const reqList = Array.isArray(requirements) ? requirements : [];
  const total = reqList.length;

  const isPending = 
    !analysisStatus ||
    analysisStatus === 'Pending' || 
    analysisStatus === 'Extracting' || 
    analysisStatus === 'Analyzing' || 
    analysisStatus === 'Not Analyzed';

  let verified = 0;
  let partial = 0;
  let missing = 0;
  let pending = 0;
  let needsReview = 0;

  reqList.forEach((req) => {
    const st = (req.status || '').toLowerCase().trim();
    if (isPending || !st || st === 'pending' || st === 'not analyzed' || st === 'extracting' || st === 'analyzing') {
      pending++;
    } else if (st === 'verified' || st === 'complete' || st === 'completed') {
      verified++;
    } else if (st === 'partial') {
      partial++;
    } else if (st === 'not found' || st === 'not_found' || st === 'missing' || st === 'unimplemented') {
      missing++;
    } else if (st === 'needs review' || st === 'needs_review') {
      needsReview++;
    } else {
      pending++;
    }
  });

  // Calculate weighted progress & coverage metrics aligned with backend progressCalculator
  let totalWeight = 0;
  let earnedWeight = 0;
  let assessedWeight = 0;
  let verifiedWeight = 0;
  let partialWeight = 0;
  let notFoundWeight = 0;
  let needsReviewWeight = 0;
  let pendingWeight = 0;

  reqList.forEach((r) => {
    const st = (r.status || '').toLowerCase().trim();
    const w = typeof r.weight === 'number' && !isNaN(r.weight) ? r.weight : 10;
    totalWeight += w;

    if (st === 'verified' || st === 'complete' || st === 'completed') {
      verifiedWeight += w;
      earnedWeight += w * 1.0;
      assessedWeight += w;
    } else if (st === 'partial') {
      partialWeight += w;
      earnedWeight += w * 0.5;
      assessedWeight += w;
    } else if (st === 'not found' || st === 'not_found' || st === 'missing' || st === 'unimplemented') {
      notFoundWeight += w;
      assessedWeight += w;
    } else if (st === 'needs review' || st === 'needs_review') {
      needsReviewWeight += w;
    } else {
      pendingWeight += w;
    }
  });

  // If analysis is pending or no requirements defined, progress is 0%
  const progressPercentage = (isPending || totalWeight === 0) 
    ? 0 
    : Math.min(100, Math.round((earnedWeight / totalWeight) * 100));

  const verificationCoverage = (isPending || totalWeight === 0)
    ? 0
    : Math.min(100, Math.round((assessedWeight / totalWeight) * 100));

  const isFinal = !isPending && pending === 0 && needsReview === 0 && verificationCoverage >= 100;
  const calculationStatus = isFinal ? 'FINAL' : 'PROVISIONAL';

  return {
    total,
    verified,
    partial,
    missing,
    pending,
    needsReview,
    totalWeight,
    verifiedWeight,
    partialWeight,
    notFoundWeight,
    needsReviewWeight,
    pendingWeight,
    earnedWeight,
    assessedWeight,
    progressPercentage,
    verificationCoverage,
    calculationStatus,
    isPending,
  };
}
