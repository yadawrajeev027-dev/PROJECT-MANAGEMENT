import React from 'react';
import { 
  Code2, 
  Server, 
  Database, 
  ShieldCheck, 
  TestTube2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  frontend: Code2,
  backend: Server,
  database: Database,
  authentication: ShieldCheck,
  'testing-deployment': TestTube2,
};

export default function AnalysisBreakdown({ items }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
            Component Analysis Breakdown
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Module-by-module implementation verification score
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
          5 Core Modules
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {(items || []).map((item) => {
          const Icon = ICON_MAP[item.id] || Code2;
          return (
            <div 
              key={item.id} 
              className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] hover:border-[#F5C400]/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white border border-[#EAEAEA] text-[#171717]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#171717]">
                      {item.category}
                    </div>
                    <div className="text-[11px] text-[#777777]">
                      {item.statusText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-white text-[#171717] border border-[#EAEAEA]">
                    Grade {item.grade}
                  </span>
                  <span className="text-sm font-bold font-mono text-[#171717]">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-[#EAEAEA] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#F5C400] transition-all duration-700"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {item.details && (
                <div className="mt-2 text-[11px] text-[#777777] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#777777]" />
                  <span>{item.details}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
