import React from 'react';
import { 
  FolderKanban, 
  ExternalLink, 
  Clock, 
  ListChecks, 
  Calendar, 
  Sparkles 
} from 'lucide-react';
import ProjectActionMenu from './ProjectActionMenu';

export default function ProjectList({
  projects,
  onViewDetails,
  onEdit,
  onReanalyse,
  onDelete,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-[#F5C400]/15 text-[#171717] border-[#F5C400]/40';
      case 'Needs Attention':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Not Analyzed':
      default:
        return 'bg-[#F7F7F5] text-[#777777] border-[#EAEAEA]';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-[#F5C400]';
      case 'Needs Attention':
        return 'bg-rose-500';
      case 'Not Analyzed':
      default:
        return 'bg-slate-400';
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-emerald-500';
    return 'bg-[#F5C400]';
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm overflow-hidden animate-in fade-in duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EAEAEA] text-[11px] font-semibold text-[#777777] uppercase tracking-wider bg-[#F7F7F5]">
              <th className="py-3 px-4">Project &amp; Category</th>
              <th className="py-3 px-3">Technologies</th>
              <th className="py-3 px-3 min-w-[150px]">Completion</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 hidden lg:table-cell">Requirements</th>
              <th className="py-3 px-3 hidden md:table-cell">Updated</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEAEA]">
            {projects.map((project) => (
              <tr 
                key={project.id}
                className="hover:bg-[#F7F7F5] transition-colors group"
              >
                {/* Project & Category */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#171717] text-xs truncate">
                      {project.name}
                    </span>
                    {project.isSample && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
                        Sample
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#777777]">
                      {project.category}
                    </span>
                  </div>
                </td>

                {/* Technologies */}
                <td className="py-3.5 px-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(project.technologies || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]"
                      >
                        {t}
                      </span>
                    ))}
                    {project.technologies && project.technologies.length > 3 && (
                      <span className="px-1 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#777777]">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                </td>

                {/* Completion Progress Bar */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 bg-[#EAEAEA] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressBarColor(project.completionPercentage)}`}
                        style={{ width: `${project.completionPercentage}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-[#171717] text-[11px] w-9 text-right">
                      {project.completionPercentage}%
                    </span>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(project.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(project.status)}`} />
                    {project.status}
                  </span>
                </td>

                {/* Requirements */}
                <td className="py-3.5 px-3 hidden lg:table-cell text-[#171717] font-mono text-[11px]">
                  {project.requirementsCount || 0} reqs
                </td>

                {/* Updated */}
                <td className="py-3.5 px-3 hidden md:table-cell text-[#777777] text-[11px]">
                  {project.lastUpdated}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(project)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                    >
                      <span>Details</span>
                      <ExternalLink size={11} />
                    </button>

                    <ProjectActionMenu
                      project={project}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onReanalyse={onReanalyse}
                      onDelete={onDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
