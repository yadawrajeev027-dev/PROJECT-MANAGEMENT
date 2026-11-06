import React from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export default function ProjectStats({ projects = [], activeFilter, onSelectFilter }) {
  // Dynamically calculate metrics from current project dataset (not hardcoded)
  const total = projects.length;
  const completed = projects.filter((p) => p.status === 'Completed').length;
  const inProgress = projects.filter((p) => p.status === 'In Progress').length;
  const needsAttention = projects.filter((p) => p.status === 'Needs Attention').length;

  const stats = [
    {
      id: 'ALL',
      title: 'Total Projects',
      value: total,
      subtext: 'Across local workspaces',
      icon: FolderKanban,
      iconColor: 'text-[#171717]',
    },
    {
      id: 'Completed',
      title: 'Completed',
      value: completed,
      subtext: `${total > 0 ? Math.round((completed / total) * 100) : 0}% completion rate`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    {
      id: 'In Progress',
      title: 'In Progress',
      value: inProgress,
      subtext: 'Active milestone tracking',
      icon: Clock,
      iconColor: 'text-[#F5C400]',
    },
    {
      id: 'Needs Attention',
      title: 'Needs Attention',
      value: needsAttention,
      subtext: 'Feature gaps require review',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {stats.map((st) => {
        const Icon = st.icon;
        const isSelected = activeFilter === st.id;

        return (
          <div
            key={st.id}
            onClick={() => onSelectFilter && onSelectFilter(st.id)}
            className={`bg-white rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-200 cursor-pointer shadow-sm ${
              isSelected
                ? 'border-[#F5C400] ring-1 ring-[#F5C400]'
                : 'border border-[#EAEAEA] hover:border-[#F5C400]/60'
            }`}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  {st.title}
                </span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight font-mono">
                    {st.value}
                  </span>
                  <span className="text-[11px] text-[#777777]">projects</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] shadow-sm shrink-0">
                <Icon size={18} className={st.iconColor} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#777777] relative z-10">
              <span className="truncate">{st.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
