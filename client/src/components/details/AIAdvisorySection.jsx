import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Lightbulb, 
  RefreshCw, 
  Loader2, 
  Cpu, 
  Wrench, 
  CheckSquare2, 
  Info 
} from 'lucide-react';

export default function AIAdvisorySection({
  projectId,
  aiAnalysis,
  isGenerating,
  onGenerate,
  error,
  isSample = false,
}) {
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'overview' | 'debt'

  const hasAIResults = aiAnalysis && (aiAnalysis.projectSummary || (aiAnalysis.recommendedActions && aiAnalysis.recommendedActions.length > 0));

  const getPriorityBadge = (priority = 'medium') => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'high':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'medium':
        return 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]';
      case 'low':
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <Sparkles size={20} className="text-[#F5C400]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
                AI Development Advisory &amp; Action Plan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
                Step 9 Advisory
              </span>
            </div>
            <p className="text-xs text-[#777777] mt-0.5">
              LLM architectural explanations and prioritized next development steps
            </p>
          </div>
        </div>

        {/* Action Button & Disclaimer */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Synthesizing Insights...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>{hasAIResults ? 'Re-generate AI Advice' : 'Generate AI Advice'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Advisory Banner (Integrity Notice) */}
      <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[11px] text-[#777777] flex items-start gap-2">
        <Info size={14} className="text-[#F5C400] shrink-0 mt-0.5" />
        <span className="leading-snug">
          <strong>Advisory Notice:</strong> AI recommendations provide strategic development guidance and architectural explanations. Authoritative requirement verification is deterministically enforced by the Step 8 AST engine.
        </span>
      </div>

      {/* Provider Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={15} />
            <span>AI Advisor Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed pl-5">
            {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && !hasAIResults && (
        <div className="py-12 text-center space-y-3">
          <Loader2 size={32} className="text-[#F5C400] animate-spin mx-auto" />
          <h4 className="font-semibold text-[#171717] text-sm">Synthesizing Codebase Intelligence</h4>
          <p className="text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
            Correlating Step 7 static source analysis artifacts and Step 8 requirement verification evidence to generate tailored architectural recommendations...
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {hasAIResults && (
        <div className="space-y-5 animate-in fade-in">
          {/* Executive Summary */}
          {aiAnalysis.projectSummary && (
            <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] leading-relaxed space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#171717] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Cpu size={13} className="text-[#F5C400]" />
                  Executive AI Summary
                </span>
                {aiAnalysis.generatedAt && (
                  <span className="text-[10px] text-[#777777] font-mono flex items-center gap-1">
                    <Clock size={11} />
                    Generated {new Date(aiAnalysis.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                {aiAnalysis.projectSummary}
              </p>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#EAEAEA] pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              Actionable Plan ({aiAnalysis.recommendedActions?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              Strengths &amp; Gaps
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('debt')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                activeTab === 'debt'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              Technical Debt ({aiAnalysis.technicalDebt?.length || 0})
            </button>
          </div>

          {/* Tab 1: Recommended Actions */}
          {activeTab === 'recommendations' && (
            <div className="space-y-3">
              {aiAnalysis.suggestedPriority && (
                <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs flex items-start gap-2">
                  <Lightbulb size={15} className="text-[#F5C400] shrink-0 mt-0.5" />
                  <span className="text-[#171717] leading-snug">
                    <strong>Lead Priority:</strong> {aiAnalysis.suggestedPriority}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(aiAnalysis.recommendedActions || []).map((action, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] hover:border-[#F5C400]/60 transition-colors space-y-3 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-[#171717] text-xs sm:text-sm leading-snug">
                          {action.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getPriorityBadge(action.priority)}`}>
                          {action.priority}
                        </span>
                      </div>

                      {action.relatedRequirementCode && (
                        <span className="inline-block text-[10px] font-mono font-semibold text-[#171717] bg-white px-2 py-0.5 rounded border border-[#EAEAEA]">
                          Targets {action.relatedRequirementCode}
                        </span>
                      )}

                      <p className="text-[11px] text-[#777777] leading-relaxed">
                        {action.description}
                      </p>

                      <div className="p-2.5 rounded-lg bg-white border border-[#EAEAEA] text-[11px] text-[#777777]">
                        <span className="font-semibold text-[#171717]">Rationale: </span>
                        {action.reason}
                      </div>

                      {action.suggestedImplementationSteps && action.suggestedImplementationSteps.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase text-[#171717] tracking-wider">
                            Implementation Steps:
                          </span>
                          <ul className="space-y-1 pl-1">
                            {action.suggestedImplementationSteps.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-1.5 text-[11px] text-[#777777]">
                                <span className="text-[#F5C400] font-bold shrink-0">{sIdx + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {action.expectedOutcome && (
                      <div className="pt-2 border-t border-[#EAEAEA] text-[10px] text-emerald-700 flex items-center gap-1.5">
                        <CheckSquare2 size={12} className="text-emerald-600 shrink-0" />
                        <span>Outcome: {action.expectedOutcome}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Strengths & Missing Features */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <CheckCircle2 size={15} />
                  <span>Observed Codebase Strengths</span>
                </div>
                <ul className="space-y-2 text-xs text-[#777777]">
                  {(aiAnalysis.overallStrengths || []).map((strength, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="leading-snug text-[#171717]">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Major Gaps */}
              <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <AlertCircle size={15} />
                  <span>Identified Functional Gaps</span>
                </div>
                <ul className="space-y-2 text-xs text-[#777777]">
                  {(aiAnalysis.majorIssues || []).map((issue, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span className="leading-snug text-[#171717]">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Technical Debt & Improvement Opportunities */}
          {activeTab === 'debt' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
                  <Wrench size={15} />
                  <span>Technical Debt &amp; Stubs</span>
                </div>
                <ul className="space-y-2 text-xs text-[#777777]">
                  {(aiAnalysis.technicalDebt || []).map((debt, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span className="leading-snug text-[#171717]">{debt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717] uppercase tracking-wider">
                  <Lightbulb size={15} className="text-[#F5C400]" />
                  <span>Optimization Opportunities</span>
                </div>
                <ul className="space-y-2 text-xs text-[#777777]">
                  {(aiAnalysis.improvementOpportunities || []).map((opp, oIdx) => (
                    <li key={oIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] mt-1.5 shrink-0" />
                      <span className="leading-snug text-[#171717]">{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State before generation */}
      {!hasAIResults && !isGenerating && !error && (
        <div className="py-8 text-center space-y-2 text-xs">
          <Sparkles size={24} className="text-[#F5C400] mx-auto mb-1" />
          <h4 className="font-semibold text-[#171717]">No AI Advisory Generated Yet</h4>
          <p className="text-[#777777] text-[11px] max-w-sm mx-auto">
            Click "Generate AI Advice" above to synthesize Step 7 AST source analysis and Step 8 verification evidence into targeted action items.
          </p>
        </div>
      )}
    </div>
  );
}
