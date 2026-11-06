import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Gauge, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  PauseCircle, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  ShieldCheck, 
  Info, 
  Zap, 
  Scale 
} from 'lucide-react';
import CircularProgress from '../CircularProgress';

export default function ProgressVelocityCard({
  projectId,
  progressData,
  velocityData,
  isCalculating,
  onRecalculate,
  error,
  isSample = false,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'breakdown' | 'velocity'

  // Default fallback data if live backend has not yet computed metrics
  const progressPercentage = progressData?.progressPercentage ?? 0;
  const coveragePercentage = progressData?.verificationCoverage ?? 0;
  const calculationStatus = progressData?.calculationStatus || 'PROVISIONAL';
  const calculatedAt = progressData?.calculatedAt;

  const totalReqs = progressData?.totalRequirements ?? 0;
  const verifiedCount = progressData?.verifiedCount ?? 0;
  const partialCount = progressData?.partialCount ?? 0;
  const notFoundCount = progressData?.notFoundCount ?? 0;
  const needsReviewCount = progressData?.needsReviewCount ?? 0;
  const pendingCount = progressData?.pendingCount ?? 0;

  const totalWeight = progressData?.totalWeight ?? 0;
  const verifiedWeight = progressData?.verifiedWeight ?? 0;
  const partialWeight = progressData?.partialWeight ?? 0;
  const notFoundWeight = progressData?.notFoundWeight ?? 0;
  const needsReviewWeight = progressData?.needsReviewWeight ?? 0;
  const pendingWeight = progressData?.pendingWeight ?? 0;

  // Velocity data
  const hasVelocity = velocityData && velocityData.hasSufficientHistory;
  const velocity = velocityData?.velocity;
  const velocityTrend = velocityData?.trend || 'INSUFFICIENT_HISTORY';
  const forecast = velocityData?.forecast;

  const isFinal = calculationStatus === 'FINAL';

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* 1. Header with Title, Status Badge, and Recalculate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <Gauge size={20} className="text-[#F5C400]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
                Deterministic Progress &amp; Milestone Velocity
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isFinal
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {calculationStatus} PROGRESS
              </span>
            </div>
            <p className="text-xs text-[#777777] mt-0.5">
              Weighted requirement score and inspection cycle velocity
            </p>
          </div>
        </div>

        {/* Action Button & Timestamp */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {calculatedAt && (
            <span className="text-[11px] text-[#777777] flex items-center gap-1 font-mono">
              <Calendar size={12} className="text-[#777777]" />
              <span>{new Date(calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          )}

          {onRecalculate && (
            <button
              type="button"
              onClick={onRecalculate}
              disabled={isCalculating}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isCalculating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  <span>Recalculate Progress</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Ephemeral Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Main KPI Grid: Circular Score + Coverage Bar + Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* A. Overall Weighted Completion Meter */}
        <div className="md:col-span-4 p-5 bg-[#F7F7F5] rounded-2xl border border-[#EAEAEA] flex flex-col items-center justify-center text-center space-y-3">
          <CircularProgress
            percentage={progressPercentage}
            size={135}
            strokeWidth={11}
            subtitle={isFinal ? 'Verified Completion' : 'Provisional Score'}
          />
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs font-bold text-[#171717]">
                {progressPercentage >= 90
                  ? 'Production Ready'
                  : progressPercentage >= 70
                  ? 'Substantial Implementation'
                  : progressPercentage >= 40
                  ? 'Core Features Active'
                  : 'Early Scaffolding'}
              </span>
            </div>
            <span className="text-[11px] text-[#777777] block mt-0.5 font-mono">
              {progressData?.earnedWeight ?? 0} / {totalWeight} total weight points
            </span>
          </div>
        </div>

        {/* B. Verification Coverage & Formula Breakdown */}
        <div className="md:col-span-4 p-5 bg-[#F7F7F5] rounded-2xl border border-[#EAEAEA] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#171717] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#F5C400]" />
                Verification Coverage
              </span>
              <span className="font-mono font-bold text-[#171717]">
                {coveragePercentage}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#EAEAEA] overflow-hidden">
              <div
                className="h-full bg-[#F5C400] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, coveragePercentage))}%` }}
              />
            </div>
            <span className="text-[11px] text-[#777777] mt-1 block">
              {coveragePercentage >= 100
                ? 'All requirements assessed (100% coverage)'
                : `${Math.round((100 - coveragePercentage) * 10) / 10}% unassessed weight (Pending / Needs Review)`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-[#EAEAEA] text-[11px] text-[#777777] space-y-1">
            <span className="font-semibold text-[#171717] block text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Scale size={11} className="text-[#F5C400]" />
              Deterministic Rule
            </span>
            <p className="text-[#777777] text-[10.5px] leading-relaxed">
              Progress = &Sigma;(weight &times; score) / &Sigma;(weight). Verified earns 1.0, Partial earns 0.5. Needs Review &amp; Pending contribute 0.0.
            </p>
          </div>
        </div>

        {/* C. Velocity & Forecasting Card */}
        <div className="md:col-span-4 p-5 bg-[#F7F7F5] rounded-2xl border border-[#EAEAEA] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#171717] flex items-center gap-1.5">
                <Zap size={14} className="text-[#F5C400]" />
                Development Velocity
              </span>
              {hasVelocity && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    velocity > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : velocity < 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-white text-[#777777] border border-[#EAEAEA]'
                  }`}
                >
                  {velocityTrend}
                </span>
              )}
            </div>

            {hasVelocity ? (
              <div className="mt-2 space-y-1">
                <div className="text-2xl font-bold font-mono text-[#171717] flex items-center gap-1.5">
                  {velocity > 0 ? (
                    <TrendingUp size={22} className="text-emerald-600 shrink-0" />
                  ) : velocity < 0 ? (
                    <TrendingDown size={22} className="text-rose-600 shrink-0" />
                  ) : (
                    <Minus size={22} className="text-[#777777] shrink-0" />
                  )}
                  <span className={velocity > 0 ? 'text-emerald-700' : velocity < 0 ? 'text-rose-700' : 'text-[#171717]'}>
                    {velocity > 0 ? `+${velocity}` : velocity}
                  </span>
                  <span className="text-xs text-[#777777] font-sans font-normal">pts / day</span>
                </div>
                <p className="text-[11px] text-[#777777]">
                  {velocityData.message}
                </p>
              </div>
            ) : (
              <div className="py-2 text-[#777777] text-xs space-y-1">
                <span className="font-semibold text-[#171717] block text-xs">Insufficient History</span>
                <p className="text-[11px] leading-relaxed">
                  Velocity tracking requires at least two completed inspection cycles. Run another analysis to observe velocity trends.
                </p>
              </div>
            )}
          </div>

          {/* Forecasting Block */}
          {forecast?.isAvailable ? (
            <div className="p-2.5 rounded-xl bg-white border border-[#EAEAEA] text-[11px] space-y-0.5">
              <div className="flex items-center justify-between text-[#171717] font-semibold">
                <span>Milestone Forecast</span>
                <span className="text-[10px] bg-[#F7F7F5] border border-[#EAEAEA] px-1.5 py-0.5 rounded text-[#171717]">
                  ~{forecast.estimatedDays} days
                </span>
              </div>
              <p className="text-[10px] text-[#777777] font-mono">
                Est. Completion: {new Date(forecast.estimatedCompletionDate).toLocaleDateString()}
              </p>
              <span className="text-[9.5px] text-[#777777] block pt-0.5 italic">
                {forecast.disclaimer}
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white border border-[#EAEAEA] text-[10.5px] text-[#777777]">
              <span className="font-semibold text-[#171717] block text-[10px]">Forecasting Unavailable</span>
              <p className="text-[10px] text-[#777777] leading-snug">
                {forecast?.reason || 'Requires 3+ cycles with positive velocity.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Requirement Status Breakdown Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        {/* Verified */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Verified</span>
            <CheckCircle2 size={14} />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {verifiedCount}
          </div>
          <span className="text-[10.5px] text-emerald-700 block font-mono">
            Weight: {verifiedWeight} (100%)
          </span>
        </div>

        {/* Partial */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Partial</span>
            <Clock size={14} />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">
            {partialCount}
          </div>
          <span className="text-[10.5px] text-amber-700 block font-mono">
            Weight: {partialWeight} (50%)
          </span>
        </div>

        {/* Not Found */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-700">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Not Found</span>
            <AlertCircle size={14} />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700">
            {notFoundCount}
          </div>
          <span className="text-[10.5px] text-rose-700 block font-mono">
            Weight: {notFoundWeight} (0%)
          </span>
        </div>

        {/* Needs Review */}
        <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#171717]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Needs Review</span>
            <HelpCircle size={14} />
          </div>
          <div className="text-xl font-bold font-mono text-[#171717]">
            {needsReviewCount}
          </div>
          <span className="text-[10.5px] text-[#777777] block font-mono">
            Weight: {needsReviewWeight} (0%)
          </span>
        </div>

        {/* Pending */}
        <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#777777]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending</span>
            <PauseCircle size={14} />
          </div>
          <div className="text-xl font-bold font-mono text-[#171717]">
            {pendingCount}
          </div>
          <span className="text-[10.5px] text-[#777777] block font-mono">
            Weight: {pendingWeight} (0%)
          </span>
        </div>
      </div>

      {/* 3. Honest Notice: Provisional vs Final */}
      {!isFinal ? (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Provisional Calculation Notice:</strong> {pendingCount + needsReviewCount} requirement(s) are currently marked as Pending or Needs Review. Complete source analysis and AST verification across all specifications are required to transition this score to <strong>FINAL</strong>.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Finalized Progress Score:</strong> All {totalReqs} requirements have undergone static AST verification with 100% verification coverage.
          </p>
        </div>
      )}
    </div>
  );
}
