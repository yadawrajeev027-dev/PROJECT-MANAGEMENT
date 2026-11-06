import React from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Activity
} from 'lucide-react';

const ICON_MAP = {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity
};

export default function StatCard({ stat }) {
  const IconComponent = ICON_MAP[stat.iconName] || Activity;

  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-sm hover:shadow-md hover:border-[#F5C400]/60 transition-all duration-200 relative overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
            {stat.title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#171717] tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs font-medium text-[#777777]">
              projects
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717]">
          <IconComponent size={22} className="text-[#171717]" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-xs relative z-10">
        <span className="text-[#777777] truncate max-w-[180px]">
          {stat.description}
        </span>
        <span 
          className={`font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${
            stat.changeType === 'positive' 
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
              : stat.changeType === 'negative' 
              ? 'text-amber-700 bg-amber-50 border-amber-200' 
              : 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]'
          }`}
        >
          {stat.changeType === 'positive' && <TrendingUp size={11} />}
          {stat.change}
        </span>
      </div>
    </div>
  );
}
