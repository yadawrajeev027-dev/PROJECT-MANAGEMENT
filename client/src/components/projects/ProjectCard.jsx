import React from 'react';
import { 
  FolderKanban, 
  Calendar, 
  ListChecks, 
  ExternalLink, 
  Clock, 
  Sparkles,
  GitBranch
} from 'lucide-react';
import ProjectActionMenu from './ProjectActionMenu';

export default function ProjectCard({
  project,
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
      case 'Pending Analysis':
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
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
      case 'Pending Analysis':
      case 'Pending':
        return 'bg-amber-500 animate-pulse';
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
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAEAEA] hover:border-[#F5C400]/60 flex flex-col justify-between transition-all duration-200 group shadow-sm">
      <div>
        {/* Top Header: Category, Status & Action Menu */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(project.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(project.status)}`} />
              {project.status}
            </span>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
              {project.category}
            </span>

            {project.isSample && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
                Sample
              </span>
            )}
          </div>

          <ProjectActionMenu
            project={project}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onReanalyse={onReanalyse}
            onDelete={onDelete}
          />
        </div>

        {/* Project Name & Description */}
        <h3 className="text-base font-bold text-[#171717] tracking-tight">
          {project.name}
        </h3>
        <p className="text-xs text-[#777777] mt-1.5 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Technology Stack Badges */}
        <div className="mt-3.5 flex flex-wrap gap-1">
          {(project.technologies || []).slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] transition-colors"
            >
              {tech}
            </span>
          ))}
          {project.technologies && project.technologies.length > 4 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>

        {/* Progress Section */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777777] font-medium flex items-center gap-1">
              <span>Feature Completion</span>
            </span>
            <span className={`font-mono font-bold text-xs ${
              project.analysisStatus === 'Pending' || project.status === 'Pending Analysis'
                ? 'text-amber-700'
                : 'text-[#171717]'
            }`}>
              {project.analysisStatus === 'Pending' || project.status === 'Pending Analysis'
                ? 'Pending AST'
                : `${project.completionPercentage}%`}
            </span>
          </div>

          <div className="w-full bg-[#EAEAEA] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                project.analysisStatus === 'Pending' || project.status === 'Pending Analysis'
                  ? 'bg-amber-400 animate-pulse'
                  : getProgressBarColor(project.completionPercentage)
              } transition-all duration-700`}
              style={{
                width: project.analysisStatus === 'Pending' || project.status === 'Pending Analysis'
                  ? '100%'
                  : `${project.completionPercentage}%`
              }}
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="mt-4 pt-3 border-t border-[#EAEAEA] grid grid-cols-2 gap-2 text-[11px] text-[#777777]">
          <div className="flex items-center gap-1.5 truncate">
            <ListChecks size={13} className="text-[#F5C400] shrink-0" />
            <span>
              <strong className="text-[#171717] font-mono">{project.requirementsCount || 0}</strong> requirements
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Clock size={13} className="text-[#171717] shrink-0" />
            <span>Last audit: <strong className="text-[#171717]">{project.lastAnalysisDate || 'Never'}</strong></span>
          </div>
        </div>
      </div>

      {/* Card Footer: Last Updated & View Details CTA */}
      <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#777777]">
          Updated {project.lastUpdated}
        </span>

        <button
          type="button"
          onClick={() => onViewDetails(project)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1 active:scale-95"
        >
          <span>View Details</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
