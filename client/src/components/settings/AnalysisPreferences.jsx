import React from 'react';
import { Sliders, Code2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

export default function AnalysisPreferences({ preferences, onChange }) {
  const categories = [
    'Web Application',
    'Machine Learning',
    'Backend Application',
    'Mobile Application',
    'Desktop Application',
    'Other'
  ];

  const detailLevels = [
    {
      id: 'comprehensive',
      name: 'Comprehensive',
      desc: 'Full AST code snippets, detailed route heuristics, dependency audits, and prioritized recommendations.'
    },
    {
      id: 'standard',
      name: 'Standard',
      desc: 'Requirement status matrix, verified files summary, and primary gap analysis.'
    },
    {
      id: 'summary',
      name: 'Executive Summary',
      desc: 'High-level percentage progress, categorical grades, and milestone delivery estimates.'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
            <Sliders size={18} className="text-[#171717]" />
            <span>Analysis Engine Preferences</span>
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Configure how ProjectPulse parses uploaded codebases and structures analysis reports
          </p>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* 1. Default Project Category */}
        <div>
          <label 
            htmlFor="pref-default-category"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5"
          >
            Default Project Category
          </label>
          <div className="relative max-w-md">
            <select
              id="pref-default-category"
              value={preferences.defaultCategory}
              onChange={(e) => onChange('defaultCategory', e.target.value)}
              className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-white text-[#171717]">
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[#777777] mt-1">
            Pre-selected when uploading new software project repositories.
          </p>
        </div>

        {/* 2. Report Detail Level */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-2">
            Report Detail Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {detailLevels.map((lvl) => {
              const isSelected = preferences.detailLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onChange('detailLevel', lvl.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#F7F7F5] border-[#080808] ring-1 ring-[#080808]'
                      : 'bg-white hover:bg-[#F7F7F5] border-[#EAEAEA] hover:border-[#777777]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#171717]">{lvl.name}</span>
                    {isSelected && (
                      <CheckCircle2 size={13} className="text-[#171717]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#777777] leading-relaxed">
                    {lvl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 & 4. Toggles for Code Evidence & Recommendations */}
        <div className="divide-y divide-[#EAEAEA] pt-2">
          {/* Show Code Evidence Snippets */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] shrink-0">
                <Code2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717] mb-0.5">
                  Include AST Code Evidence Snippets
                </h4>
                <p className="text-xs text-[#777777] leading-relaxed">
                  Extract and display relevant lines of source code confirming requirement implementation.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.showEvidence}
              onClick={() => onChange('showEvidence', !preferences.showEvidence)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F5C400] ${
                preferences.showEvidence ? 'bg-[#080808]' : 'bg-[#EAEAEA]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.showEvidence ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Recommendations */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717] mb-0.5">
                  Generate Actionable Next Steps
                </h4>
                <p className="text-xs text-[#777777] leading-relaxed">
                  Provide concrete architectural recommendations and implementation steps for missing features.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.showRecommendations}
              onClick={() => onChange('showRecommendations', !preferences.showRecommendations)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F5C400] ${
                preferences.showRecommendations ? 'bg-[#080808]' : 'bg-[#EAEAEA]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.showRecommendations ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
