import React, { useState } from 'react';
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';

export default function AnalysisTimeline({ history = [] }) {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <History size={18} className="text-[#F5C400]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Historical Codebase Inspection Timeline
            </h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Chronological progression of previous AST and LLM verification runs
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
          {history.length} Inspection Cycles
        </span>
      </div>

      {/* Timeline Steps */}
      {history.length === 0 ? (
        <div className="p-8 text-center bg-[#F7F7F5] rounded-xl border border-dashed border-[#EAEAEA] space-y-2">
          <History size={24} className="text-[#777777] mx-auto" />
          <h4 className="text-xs font-semibold text-[#171717]">No Historical Inspection Cycles Recorded</h4>
          <p className="text-[11px] text-[#777777] max-w-md mx-auto">
            Each time an analysis pipeline run completes, an immutable snapshot report will be saved to this audit timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#EAEAEA]">
          {history.map((item, index) => {
          const isLatest = index === 0;

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isLatest
                    ? 'bg-[#F5C400] text-black shadow-sm'
                    : 'bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-black' : 'bg-[#777777]'}`} />
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] hover:border-[#F5C400]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#171717]">
                      {item.id}
                    </span>

                    {isLatest && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5C400]/15 text-[#171717] border border-[#F5C400]/40">
                        Current Scan
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[11px] text-[#777777]">
                      <Calendar size={12} className="text-[#777777]" />
                      <span>{item.date}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#777777] leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#777777] font-mono">
                    <span>
                      <strong className="text-[#171717]">{item.requirementsChecked}</strong> specifications checked
                    </span>
                    <span>&bull;</span>
                    <span className="text-rose-600">
                      <strong>{item.missingFeatures}</strong> gaps identified
                    </span>
                  </div>
                </div>

                {/* Score & View Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EAEAEA]">
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-lg text-[#171717]">
                      {item.completion}%
                    </div>
                    <span className="text-[10px] text-[#777777] uppercase font-semibold">
                      Score
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReport(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                  >
                    <span>View Report</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Previous Report Snapshot Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#F5C400]" />
                <h4 className="font-bold text-[#171717] text-sm">
                  Historical Report Dossier ({selectedReport.id})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-[#777777] hover:text-[#171717]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#777777]">Recorded Timestamp:</span>
                <span className="font-medium text-[#171717]">{selectedReport.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777]">Milestone Score:</span>
                <span className="font-mono font-bold text-[#171717]">{selectedReport.completion}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777]">Specifications Audited:</span>
                <span className="font-mono text-[#171717]">{selectedReport.requirementsChecked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777]">Missing Feature Count:</span>
                <span className="font-mono text-rose-600">{selectedReport.missingFeatures}</span>
              </div>
            </div>

            <p className="text-xs text-[#777777] leading-relaxed bg-[#F7F7F5] p-3 rounded-xl border border-[#EAEAEA]">
              {selectedReport.summary}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
