import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Info,
  Lightbulb,
  Cpu
} from 'lucide-react';

export default function AIInsights({ insights = {}, onRunAction }) {
  const [activeTab, setActiveTab] = useState('missing'); // 'missing' | 'key'

  const missingFeatures = insights?.missingFeatures || [];
  const keyInsights = insights?.keyInsights || [];
  const recommendedAction = insights?.recommendedAction || null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm flex flex-col justify-between">
      {/* Header with AI Pill */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
              <Sparkles size={18} className="text-[#F5C400]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight flex items-center gap-2">
                <span>AI Insights &amp; Gap Detection</span>
              </h3>
              <p className="text-xs text-[#777777]">
                LLM &amp; AST Static Analysis Report
              </p>
            </div>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'missing'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              Missing Features ({missingFeatures.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('key')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'key'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              Key Strengths ({keyInsights.length})
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        {insights.summary && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] leading-relaxed">
            <span className="font-semibold text-[#171717]">Executive Summary: </span>
            {insights.summary}
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-4 space-y-2.5">
          {activeTab === 'missing' && (
            missingFeatures.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] flex items-start gap-3 hover:border-[#F5C400]/60 transition-colors"
              >
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  item.severity === 'High' 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                    : item.severity === 'Medium'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  <ShieldAlert size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#171717]">
                      {item.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      item.severity === 'High' 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : item.severity === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {item.severity || item.impact || 'Advisory'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777777] mt-1 leading-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}

          {activeTab === 'key' && (
            keyInsights.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] flex items-start gap-3 hover:border-emerald-300 transition-colors"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#171717] block">
                    {item.title}
                  </span>
                  <p className="text-[11px] text-[#777777] mt-1 leading-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recommended Action Box */}
        {recommendedAction && (
          <div className="mt-4 p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
            <div className="flex items-center justify-between text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Lightbulb size={14} className="text-[#F5C400]" />
                {recommendedAction.title}
              </span>
              {recommendedAction.estimatedImpact && (
                <span className="text-emerald-700 font-mono text-[11px]">
                  {recommendedAction.estimatedImpact}
                </span>
              )}
            </div>

            {recommendedAction.actionText && (
              <h4 className="text-xs sm:text-sm font-bold text-[#171717]">
                {recommendedAction.actionText}
              </h4>
            )}

            {recommendedAction.description && (
              <p className="text-xs text-[#777777] mt-1 leading-relaxed">
                {recommendedAction.description}
              </p>
            )}

            {recommendedAction.reason && (
              <p className="text-xs text-[#777777] mt-1 leading-relaxed">
                {recommendedAction.reason}
              </p>
            )}

            <button
              type="button"
              onClick={onRunAction}
              className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F5C400] hover:bg-[#E0B300] text-black flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
            >
              <span>{recommendedAction.buttonText || 'Plan Next Sprint Task'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Prominent Sample Data Disclaimer Alert if present */}
      {insights.disclaimer && (
        <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-start gap-2 text-[11px] text-[#777777] bg-[#F7F7F5] p-2.5 rounded-xl border border-[#EAEAEA]">
          <Info size={14} className="text-[#F5C400] shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Illustrative Sample Insights:</strong> {insights.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
