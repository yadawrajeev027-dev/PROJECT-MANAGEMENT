import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ListChecks, 
  Calendar, 
  Activity, 
  Sparkles,
  Info,
  PauseCircle,
  FileCode2
} from 'lucide-react';
import CircularProgress from '../CircularProgress';
import { calculateRequirementMetrics } from '../../utils/requirementMetrics.js';

export default function ProjectOverview({ project, progressData, requirements }) {
  if (!project) return null;

  const reqs = requirements || project.requirements || [];
  const metrics = calculateRequirementMetrics(reqs, project.analysisStatus);

  // Synchronize with authoritative progressData if available; otherwise use local metrics
  const isPending = metrics.isPending && !progressData;
  const progressPercentage = isPending ? 0 : (progressData?.progressPercentage ?? metrics.progressPercentage);
  const total = progressData?.totalRequirements ?? metrics.total;
  const completed = progressData?.verifiedCount ?? metrics.verified;
  const partial = progressData?.partialCount ?? metrics.partial;
  const missing = progressData?.notFoundCount ?? metrics.missing;
  const pending = progressData?.pendingCount ?? metrics.pending;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* Header with Title and Last Analyzed Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <Activity size={18} className="text-[#F5C400]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Project Milestone &amp; Feature Overview
            </h2>
            <p className="text-xs text-[#777777]">
              High-level AST feature discovery and requirement satisfaction metrics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {project.zipFileName && (
            <div className="flex items-center gap-1.5 text-xs text-[#777777] bg-[#F7F7F5] px-3 py-1.5 rounded-xl border border-[#EAEAEA]">
              <FileCode2 size={13} className="text-[#F5C400]" />
              <span>Archive: <strong className="text-[#171717]">{project.zipFileName}</strong> {project.zipFileSize ? `(${Math.round(project.zipFileSize / 1024)} KB)` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[#777777] bg-[#F7F7F5] px-3 py-1.5 rounded-xl border border-[#EAEAEA]">
            <Calendar size={13} className="text-[#F5C400]" />
            <span>Last Analyzed: <strong className="text-[#171717]">{project.lastAnalysisDate || 'Pending Analysis'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid: Circular Progress on Left, Metrics Breakdown on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Circular Progress Display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-[#F7F7F5] rounded-2xl border border-[#EAEAEA]">
          <CircularProgress
            percentage={isPending ? 0 : progressPercentage}
            size={140}
            strokeWidth={11}
            subtitle={isPending ? 'Awaiting Run' : 'Overall Score'}
          />
          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-[#171717] block">
              {isPending
                ? 'Pending AST Analysis'
                : progressPercentage >= 90
                ? 'Production Ready'
                : progressPercentage >= 70
                ? 'Substantial Progress'
                : progressPercentage >= 40
                ? 'Core Components Active'
                : 'Initial Scaffolding Phase'}
            </span>
            <span className="text-[11px] text-[#777777] mt-0.5 block">
              {isPending 
                ? `${total} specifications registered (Pending)`
                : `Based on ${total} functional specifications`}
            </span>
          </div>
        </div>

        {/* Right: 4-Metric Grid */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-2 gap-3.5">
          {/* Total Requirements */}
          <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] transition-colors">
            <div className="flex items-center justify-between text-[#777777] text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Total Requirements
              </span>
              <ListChecks size={15} className="text-[#171717]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#171717]">
              {total}
            </div>
            <span className="text-[11px] text-[#777777] mt-0.5 block">
              Declared in specification checklist
            </span>
          </div>

          {/* Verified Requirements */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 transition-colors">
            <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Verified Complete
              </span>
              <CheckCircle2 size={15} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {completed}
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">
              {total > 0 ? Math.round((completed / total) * 100) : 0}% of specifications verified
            </span>
          </div>

          {/* Partial Requirements */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 transition-colors">
            <div className="flex items-center justify-between text-amber-700 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Partially Complete
              </span>
              <Clock size={15} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              {partial}
            </div>
            <span className="text-[11px] text-amber-700 mt-0.5 block">
              {isPending ? 'Pending AST inspection' : 'Route/schema found; tests pending'}
            </span>
          </div>

          {/* Missing or Pending Requirements */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isPending 
              ? 'bg-[#F7F7F5] border-[#EAEAEA]' 
              : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-semibold uppercase tracking-wider text-[10px] ${
                isPending ? 'text-[#777777]' : 'text-rose-700'
              }`}>
                {isPending ? 'Pending Extraction' : 'Missing Gap'}
              </span>
              {isPending ? (
                <PauseCircle size={15} className="text-[#777777]" />
              ) : (
                <AlertCircle size={15} className="text-rose-600" />
              )}
            </div>
            <div className={`text-2xl font-bold font-mono ${isPending ? 'text-[#171717]' : 'text-rose-700'}`}>
              {isPending ? pending : missing}
            </div>
            <span className={`text-[11px] mt-0.5 block ${isPending ? 'text-[#777777]' : 'text-rose-700'}`}>
              {isPending ? 'Awaiting AST code extraction' : 'Zero implementation detected in AST'}
            </span>
          </div>
        </div>
      </div>

      {/* Honest Status Notice Banner */}
      {isPending ? (
        <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] flex items-start gap-3">
          <Info size={16} className="text-[#F5C400] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-[#171717] text-xs">
              Analysis Status: Pending AST Engine Execution
            </h4>
            <p className="leading-relaxed text-[11px] text-[#777777]">
              Source code archive is registered in your workspace. The automated AST verification engine has not yet scanned the code files. All {total} requirements are currently marked as <strong className="text-[#171717]">Pending</strong> awaiting AST parser extraction.
            </p>
          </div>
        </div>
      ) : project.isSample ? (
        <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] flex items-start gap-2.5">
          <Info size={15} className="text-[#F5C400] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-[#777777]">
            <strong className="text-[#171717] font-semibold">Evaluation Mode Notice:</strong> This dossier displays illustrative sample analysis extracted for UI demonstration. In upcoming phases (Tasks 3-5), this data will be generated in real-time by AST route tokenization and LLM semantic evaluation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
