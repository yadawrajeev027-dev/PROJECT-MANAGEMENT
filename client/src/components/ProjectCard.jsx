import React from 'react';
import { 
  Sparkles, 
  Calendar, 
  Files, 
  GitFork, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import CircularProgress from './CircularProgress';

export default function ProjectCard({ project, onViewDetails, onReanalyse }) {
  if (!project) return null;

  const techList = project.technologies || project.techStack || [];
  const filesCount = project.filesInspected || (project.requirementsCount ? project.requirementsCount * 2 + 4 : 38);
  const endpointsCount = project.endpointsFound || (project.requirementsCount ? Math.round(project.requirementsCount * 0.7) : 14);
  const lastAnalyzedDate = (project.lastAnalysisDate || project.lastAnalyzed || 'Nov 4, 2026').split('•')[0].trim();
  const remainingHours = project.estimatedRemainingHours || (project.completionPercentage >= 90 ? '0 hours (Target Met)' : `${Math.round((100 - (project.completionPercentage || 0)) * 0.6)} hours`);

  return (
    <div className="bg-white rounded-2xl p-6 relative overflow-hidden border border-[#EAEAEA] shadow-sm hover:border-[#F5C400]/50 transition-all duration-200">
      {/* Decorative top yellow accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#F5C400]" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F5C400]/15 text-[#171717] border border-[#F5C400]/40">
              Featured Analysis
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
              project.analysisStatus === 'Pending' || project.status === 'Pending Analysis'
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                project.analysisStatus === 'Pending' || project.status === 'Pending Analysis'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500 animate-pulse'
              }`} />
              {project.status || 'In Progress'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#171717] mt-2 tracking-tight">
            {project.name}
          </h2>
          {project.tagline && (
            <p className="text-xs text-[#777777] font-medium mt-0.5">
              {project.tagline}
            </p>
          )}
        </div>

        {/* Circular Progress Meter */}
        <div className="self-center sm:self-auto shrink-0 bg-[#F7F7F5] p-3 rounded-2xl border border-[#EAEAEA]">
          <CircularProgress 
            percentage={project.completionPercentage || 0} 
            size={105} 
            strokeWidth={9}
            subtitle={project.analysisStatus === 'Pending' || project.status === 'Pending Analysis' ? 'Awaiting AST' : 'Overall Score'}
          />
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-xs sm:text-sm text-[#777777] leading-relaxed">
        {project.description}
      </p>

      {/* Tech Stack Badges */}
      {techList.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {techList.map((tech) => (
            <span 
              key={tech} 
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] hover:border-[#F5C400] transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Project Metadata Stats */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs">
        <div className="flex items-center gap-2 text-[#171717]">
          <Files size={15} className="text-[#F5C400] shrink-0" />
          <div>
            <div className="text-[10px] text-[#777777] uppercase font-semibold">Inspected Files</div>
            <div className="font-bold text-[#171717]">{filesCount} source files</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#171717]">
          <GitFork size={15} className="text-[#F28C28] shrink-0" />
          <div>
            <div className="text-[10px] text-[#777777] uppercase font-semibold">API Endpoints</div>
            <div className="font-bold text-[#171717]">{endpointsCount} detected</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-center gap-2 text-[#171717]">
          <Calendar size={15} className="text-[#171717] shrink-0" />
          <div>
            <div className="text-[10px] text-[#777777] uppercase font-semibold">Last Analyzed</div>
            <div className="font-bold text-[#171717] truncate">{lastAnalyzedDate}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#EAEAEA]">
        <div className="flex items-center gap-1.5 text-xs text-[#777777]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#F5C400]" />
          <span>Estimated gap: <strong className="text-[#171717]">{remainingHours}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={onReanalyse}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RefreshCw size={13} className="text-[#777777]" />
            <span>Re-analyse</span>
          </button>

          <button 
            type="button"
            onClick={onViewDetails}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>View Details</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
