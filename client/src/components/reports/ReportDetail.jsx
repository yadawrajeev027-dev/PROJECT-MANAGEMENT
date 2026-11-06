import React from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  Lightbulb, 
  Code2, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import ReportExport from './ReportExport';

export default function ReportDetail({
  report,
  isOpen,
  onClose,
}) {
  if (!isOpen || !report) return null;

  const breakdown = report.requirementsBreakdown || {
    verified: 0,
    partial: 0,
    notFound: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white border border-[#EAEAEA] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#EAEAEA] bg-[#F7F7F5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
                  {report.projectName}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white text-[#171717] border border-[#EAEAEA]">
                  {report.id}
                </span>
              </div>
              <p className="text-xs text-[#777777] flex items-center gap-2 mt-0.5">
                <Calendar size={12} className="text-[#777777]" />
                <span>Audited: {report.analysisDate}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#EAEAEA] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs">
          {/* Executive Summary & Progress Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777] tracking-wider block">
                  Overall Completion Score
                </span>
                <span className="text-3xl font-extrabold text-[#171717] font-mono mt-0.5 block">
                  {report.currentProgress}%
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">
                  Previous Run Delta
                </span>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  +{report.progressChange}% improvement
                </span>
              </div>
            </div>

            <div className="w-full bg-[#EAEAEA] rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F5C400] transition-all duration-700"
                style={{ width: `${report.currentProgress}%` }}
              />
            </div>

            <p className="text-[#171717] text-xs leading-relaxed pt-1">
              {report.summary}
            </p>
          </div>

          {/* Requirements Status Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
              <Layers size={14} className="text-amber-500" />
              <span>Specification Verification Breakdown</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs font-semibold mb-1">
                  <CheckCircle2 size={13} />
                  <span>Verified</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {breakdown.verified}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-700 text-xs font-semibold mb-1">
                  <Clock size={13} />
                  <span>Partial</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-700">
                  {breakdown.partial}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-50/60 border border-red-200 text-center">
                <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-semibold mb-1">
                  <AlertCircle size={13} />
                  <span>Not Found</span>
                </div>
                <div className="text-xl font-bold font-mono text-red-600">
                  {breakdown.notFound}
                </div>
              </div>
            </div>
          </div>

          {/* Missing Features List */}
          {report.missingFeaturesList && report.missingFeaturesList.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-red-500" />
                <span>Identified Missing Features ({report.missingFeaturesList.length})</span>
              </h4>
              <ul className="space-y-1.5">
                {report.missingFeaturesList.map((feature, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] flex items-start gap-2 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Lightbulb size={14} className="text-amber-500" />
                <span>Actionable Recommendations</span>
              </h4>
              <ul className="space-y-1.5">
                {report.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] flex items-start gap-2 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] shrink-0 mt-1.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technology Detection Summary */}
          {report.techSignaturesDetected && report.techSignaturesDetected.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Code2 size={14} className="text-[#171717]" />
                <span>Discovered Codebase Signatures</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {report.techSignaturesDetected.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg font-mono text-[11px] bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Limitations Notice */}
          <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#777777] space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[#171717]">
              <Info size={13} className="text-amber-500" />
              <span>Inspection Scope &amp; Audit Limitations</span>
            </div>
            <p className="leading-relaxed">
              {report.limitations}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions & Real Export Controls */}
        <div className="p-4 sm:p-5 border-t border-[#EAEAEA] bg-[#F7F7F5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <ReportExport report={report} />

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#EAEAEA] bg-white border border-[#EAEAEA] transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
