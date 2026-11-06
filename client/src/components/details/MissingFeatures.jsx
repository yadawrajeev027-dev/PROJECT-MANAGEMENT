import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Lightbulb, 
  Code2, 
  Info, 
  CheckCircle2 
} from 'lucide-react';

export default function MissingFeatures({ missingFeatures = [] }) {
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Low':
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Identified Feature Gaps &amp; Missing Implementation
            </h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Unimplemented requirements detected during code inspection
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          {missingFeatures.length} Critical Gaps
        </span>
      </div>

      {missingFeatures.length > 0 ? (
        <div className="space-y-3.5">
          {missingFeatures.map((gap) => (
            <div
              key={gap.id}
              className="p-4 sm:p-5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] hover:border-[#F5C400]/60 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <h4 className="text-sm font-bold text-[#171717]">
                    {gap.feature}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#171717] border border-[#EAEAEA]">
                    {gap.relatedRequirement}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(gap.priority)}`}>
                    {gap.priority} Priority
                  </span>
                </div>
              </div>

              {/* Why It Is Important */}
              <div className="text-xs text-[#777777] bg-white p-3 rounded-lg border border-[#EAEAEA]">
                <strong className="text-amber-700 block mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span>Why This Feature is Important</span>
                </strong>
                <p className="leading-relaxed text-[#171717] text-[11px]">
                  {gap.importance}
                </p>
              </div>

              {/* Suggested Implementation */}
              <div className="text-xs text-[#777777] bg-white p-3 rounded-lg border border-[#EAEAEA]">
                <strong className="text-[#171717] block mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <Lightbulb size={13} className="text-[#F5C400]" />
                  <span>Suggested Architectural Implementation</span>
                </strong>
                <p className="leading-relaxed font-mono text-[11px] text-[#777777]">
                  {gap.suggestedImplementation}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-[#777777] bg-[#F7F7F5] rounded-xl border border-dashed border-[#EAEAEA] p-6 space-y-2">
          <ShieldAlert size={24} className="text-[#777777] mx-auto" />
          <p className="font-semibold text-[#171717]">Feature Gap Analysis Pending</p>
          <p className="text-[11px] text-[#777777] max-w-md mx-auto">
            Unimplemented requirements, missing route endpoints, and schema discrepancies will be detected after automated AST extraction.
          </p>
        </div>
      )}
    </div>
  );
}
