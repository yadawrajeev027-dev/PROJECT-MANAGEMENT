/**
 * velocityCalculator.js
 * Step 10: Development Velocity & Milestone Completion Forecasting Engine.
 *
 * Velocity Formula:
 *  Velocity = (Current Progress - Previous Progress) / Elapsed Days
 *  Unit: Percentage points per day
 *
 * Forecasting Rules:
 *  - Requires >= 3 valid completed snapshots.
 *  - Requires positive velocity (> 0).
 *  - Labeled strictly as an estimate, not a guaranteed completion date.
 */

import { roundPrecision } from './progressCalculator.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculates development velocity and milestone forecasting from historical progress snapshots.
 *
 * @param {Array<Object>} history - Chronological array of valid completed report snapshots
 * @returns {Object} Velocity metrics and forecasting estimates
 */
export function calculateVelocity(history = []) {
  // 1. Guard: Check for insufficient history (< 2 reports)
  if (!Array.isArray(history) || history.length < 2) {
    return {
      hasSufficientHistory: false,
      snapshotCount: Array.isArray(history) ? history.length : 0,
      velocity: null,
      velocityPointsPerDay: null,
      trend: 'INSUFFICIENT_HISTORY',
      message: 'At least two completed inspection cycles are required to calculate velocity.',
      currentProgress: history?.[0]?.progressPercentage ?? 0,
      previousProgress: null,
      progressChange: 0,
      elapsedDays: 0,
      forecast: {
        isAvailable: false,
        reason: 'Insufficient history for forecasting (requires at least 3 completed inspection cycles with positive velocity).',
        estimatedDays: null,
        estimatedCompletionDate: null,
      },
    };
  }

  // 2. Identify the two most recent consecutive completed snapshots
  const latestSnapshot = history[history.length - 1];
  const previousSnapshot = history[history.length - 2];

  const currentProgress = typeof latestSnapshot.progressPercentage === 'number'
    ? latestSnapshot.progressPercentage
    : 0;
  const previousProgress = typeof previousSnapshot.progressPercentage === 'number'
    ? previousSnapshot.progressPercentage
    : 0;

  const progressChange = roundPrecision(currentProgress - previousProgress, 2);

  const latestTime = new Date(latestSnapshot.calculatedAt || Date.now()).getTime();
  const prevTime = new Date(previousSnapshot.calculatedAt || latestTime).getTime();

  // Elapsed time calculation
  const elapsedMs = Math.max(0, latestTime - prevTime);
  const elapsedDays = roundPrecision(elapsedMs / MS_PER_DAY, 4);

  let velocity = 0;
  let trend = 'STAGNANT';
  let isZeroElapsed = false;

  // 3. Handle zero elapsed time safely (never divide by zero)
  if (elapsedDays <= 0 || elapsedMs < 1000) {
    isZeroElapsed = true;
    velocity = 0;
    trend = progressChange > 0 ? 'SAME_DAY_ADVANCE' : progressChange < 0 ? 'SAME_DAY_REGRESSION' : 'STAGNANT';
  } else {
    velocity = roundPrecision(progressChange / elapsedDays, 2);
    if (velocity > 0) {
      trend = 'ADVANCING';
    } else if (velocity < 0) {
      trend = 'REGRESSION'; // Explicit negative velocity indicates project regression
    } else {
      trend = 'STAGNANT';
    }
  }

  // 4. Milestone Completion Forecasting
  // Requires at least 3 completed snapshots AND positive velocity (> 0)
  let forecast = {
    isAvailable: false,
    reason: 'Forecasting unavailable.',
    estimatedDays: null,
    estimatedCompletionDate: null,
  };

  const hasThreeSnapshots = history.length >= 3;
  const hasPositiveTrend = velocity > 0;

  if (currentProgress >= 100) {
    forecast = {
      isAvailable: false,
      reason: 'Project has already attained 100% verified completion.',
      estimatedDays: 0,
      estimatedCompletionDate: new Date(latestTime).toISOString(),
    };
  } else if (!hasThreeSnapshots) {
    forecast = {
      isAvailable: false,
      reason: `Requires at least 3 valid completed snapshots for linear forecasting (current count: ${history.length}).`,
      estimatedDays: null,
      estimatedCompletionDate: null,
    };
  } else if (!hasPositiveTrend) {
    forecast = {
      isAvailable: false,
      reason: velocity < 0
        ? 'Project velocity is currently negative (regression detected). Completion cannot be projected.'
        : 'Project velocity is stagnant (0 points/day). Active progress is required to forecast completion.',
      estimatedDays: null,
      estimatedCompletionDate: null,
    };
  } else {
    // Meaningful positive trend with >= 3 historical snapshots
    const remainingPoints = roundPrecision(100 - currentProgress, 2);
    const estimatedDays = Math.ceil(remainingPoints / velocity);
    const estimatedCompletionDate = new Date(latestTime + estimatedDays * MS_PER_DAY).toISOString();

    forecast = {
      isAvailable: true,
      isEstimate: true,
      estimatedDays,
      estimatedCompletionDate,
      remainingPoints,
      disclaimer: 'Forecast is a linear estimate based on historical velocity, not a guaranteed milestone date.',
    };
  }

  return {
    hasSufficientHistory: true,
    snapshotCount: history.length,
    velocity,
    velocityPointsPerDay: velocity,
    trend,
    currentProgress,
    previousProgress,
    progressChange,
    elapsedDays,
    isZeroElapsed,
    message: isZeroElapsed
      ? 'Consecutive reports completed in the same window (elapsed time near zero).'
      : `Current velocity is ${velocity > 0 ? '+' : ''}${velocity} percentage points per day.`,
    forecast,
  };
}

export default {
  calculateVelocity,
};
