import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Lightbulb, 
  AlertCircle 
} from 'lucide-react';

export default function NextActions({ recommendations: initialRecommendations = [] }) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);

  const handleToggleDone = (id) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, userCompleted: !rec.userCompleted } : rec
      )
    );
  };

  const completedCount = recommendations.filter((r) => r.userCompleted).length;

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <Lightbulb size={18} className="text-[#F5C400]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Prioritized Next Action Recommendations
            </h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Targeted sprint tasks engineered to maximize requirement compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[#171717] bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#EAEAEA]">
            {completedCount} of {recommendations.length} User Marked
          </span>
        </div>
      </div>

      {/* Distinction Banner: User Confirmed vs AI Verified */}
      <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-[#F5C400] shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] text-[#777777]">
          <strong className="text-[#171717]">Audit Distinction Rule:</strong> Tasks marked as done here reflect <span className="text-[#171717] font-semibold">User-Confirmed Sprint Progress</span>. Full verification is confirmed only after the code is re-scanned by the AST engine in the next analysis cycle.
        </p>
      </div>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                rec.userCompleted
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-[#F7F7F5] border-[#EAEAEA] hover:border-[#F5C400]/60'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleDone(rec.id)}
                  className={`mt-1 p-1 rounded-lg transition-colors shrink-0 ${
                    rec.userCompleted
                      ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-[#777777] hover:text-[#171717] bg-white border border-[#EAEAEA]'
                  }`}
                  title={rec.userCompleted ? 'Click to mark as pending' : 'Click to mark as done'}
                >
                  {rec.userCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm font-bold ${
                      rec.userCompleted ? 'line-through text-[#777777]' : 'text-[#171717]'
                    }`}>
                      {rec.title}
                    </h4>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(rec.priority)}`}>
                      {rec.priority} Priority
                    </span>

                    {rec.userCompleted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        <span>User Confirmed &bull; Pending Next Scan</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#777777] leading-relaxed">
                    {rec.explanation}
                  </p>
                </div>
              </div>

              {/* Impact Badge & Quick Action Button */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EAEAEA]">
                <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                  {rec.impact}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleDone(rec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    rec.userCompleted
                      ? 'bg-white text-[#171717] hover:bg-[#F7F7F5] border border-[#EAEAEA]'
                      : 'bg-[#F5C400] hover:bg-[#E0B300] text-black shadow-sm'
                  }`}
                >
                  {rec.userCompleted ? 'Undo Mark' : 'Mark as Done'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-[#777777] bg-[#F7F7F5] rounded-xl border border-dashed border-[#EAEAEA] p-6 space-y-2">
          <Lightbulb size={24} className="text-[#777777] mx-auto" />
          <p className="font-semibold text-[#171717]">Recommendations Awaiting Code Analysis</p>
          <p className="text-[11px] text-[#777777] max-w-md mx-auto">
            Prioritized engineering action items and sprint suggestions will be generated once code AST route evaluation completes.
          </p>
        </div>
      )}
    </div>
  );
}
