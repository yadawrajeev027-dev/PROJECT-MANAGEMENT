import React from 'react';
import { 
  FileText, 
  Layers, 
  Activity, 
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function ReportStats({ reports = [] }) {
  // Dynamically calculate metrics from current reports dataset
  const totalReports = reports.length;

  // Count unique projects analyzed
  const uniqueProjectIds = Array.from(new Set(reports.map((r) => r.projectId)));
  const projectsAnalyzed = uniqueProjectIds.length;

  // Average completion percentage across all inspection reports
  const averageCompletion =
    totalReports > 0
      ? Math.round(
          reports.reduce((acc, curr) => acc + (curr.currentProgress || 0), 0) /
            totalReports
        )
      : 0;

  // Count projects that demonstrated progress improvement between earlier and later scans
  let projectsImproved = 0;
  uniqueProjectIds.forEach((pId) => {
    const projectReports = reports
      .filter((r) => r.projectId === pId)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (projectReports.length >= 2) {
      const earliest = projectReports[0].currentProgress || 0;
      const latest = projectReports[projectReports.length - 1].currentProgress || 0;
      if (latest > earliest) {
        projectsImproved += 1;
      }
    } else if (projectReports.length === 1 && (projectReports[0].progressChange || 0) > 0) {
      projectsImproved += 1;
    }
  });

  const cards = [
    {
      id: 'total-reports',
      title: 'Total Reports',
      value: totalReports,
      subtext: 'Historical analysis runs',
      icon: FileText,
      color: 'text-[#171717]',
      bg: 'bg-[#F7F7F5] border-[#EAEAEA]',
    },
    {
      id: 'projects-analyzed',
      title: 'Projects Analyzed',
      value: projectsAnalyzed,
      subtext: 'Unique codebases audited',
      icon: Layers,
      color: 'text-[#171717]',
      bg: 'bg-[#F7F7F5] border-[#EAEAEA]',
    },
    {
      id: 'average-completion',
      title: 'Average Completion',
      value: `${averageCompletion}%`,
      subtext: 'Across all verified runs',
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      id: 'projects-improved',
      title: 'Projects Improved',
      value: projectsImproved,
      subtext: `${projectsAnalyzed > 0 ? Math.round((projectsImproved / projectsAnalyzed) * 100) : 0}% positive momentum`,
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 border border-[#EAEAEA] shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  {card.title}
                </span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight font-mono">
                    {card.value}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${card.bg} ${card.color} shadow-sm shrink-0`}>
                <Icon size={18} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#777777] relative z-10">
              <span className="truncate">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
