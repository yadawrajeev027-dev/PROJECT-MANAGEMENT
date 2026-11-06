import React from 'react';
import { 
  Code2, 
  Server, 
  Database, 
  ShieldCheck, 
  TestTube2, 
  Rocket, 
  Layers 
} from 'lucide-react';

const ICON_MAP = {
  frontend: Code2,
  backend: Server,
  database: Database,
  auth: ShieldCheck,
  testing: TestTube2,
  deployment: Rocket,
};

export default function DevelopmentBreakdown({ breakdown = [] }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
            Subsystem Development Breakdown
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Static code analysis verification across 6 core architectural domains
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
          6 Architectural Layers
        </span>
      </div>

      {breakdown.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {breakdown.map((item) => {
            const Icon = ICON_MAP[item.id] || Layers;
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] hover:border-[#F5C400]/60 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white text-[#171717] border border-[#EAEAEA] shadow-sm">
                        <Icon size={16} className="text-[#F5C400]" />
                      </div>
                      <span className="text-xs font-bold text-[#171717]">
                        {item.name}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-[#171717] border border-[#EAEAEA]">
                      Grade {item.grade}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-[11px] text-[#777777]">Implementation</span>
                    <span className="font-mono font-bold text-[#171717]">{item.percentage}%</span>
                  </div>

                  <div className="w-full bg-[#EAEAEA] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F5C400] transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EAEAEA] text-[11px] text-[#777777] leading-snug">
                  {item.note}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-[#F7F7F5] rounded-xl border border-dashed border-[#EAEAEA] space-y-2">
          <Layers size={24} className="text-[#777777] mx-auto" />
          <h4 className="text-xs font-semibold text-[#171717]">Subsystem Breakdown Pending</h4>
          <p className="text-[11px] text-[#777777] max-w-md mx-auto">
            Layer-by-layer architectural grading (Frontend, Backend, Database, Auth, Testing, DevOps) will be evaluated when the AST code ingestion pipeline runs.
          </p>
        </div>
      )}
    </div>
  );
}
