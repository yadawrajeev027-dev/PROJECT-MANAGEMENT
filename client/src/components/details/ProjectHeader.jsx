import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ArrowLeft, 
  Edit3, 
  RefreshCw, 
  MoreVertical, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  GitBranch,
  Clock
} from 'lucide-react';

export default function ProjectHeader({
  project,
  onBack,
  onEdit,
  onReanalyse,
  onDelete,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(project.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setDropdownOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-[#F5C400]/15 text-[#171717] border-[#F5C400]/40';
      case 'Pending Analysis':
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Extracting':
      case 'Analyzing':
        return 'bg-[#F7F7F5] text-[#171717] border-[#EAEAEA]';
      case 'Needs Attention':
        return 'bg-rose-50 text-rose-700 border-rose-200';
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
      case 'Extracting':
      case 'Analyzing':
        return 'bg-[#F5C400] animate-pulse';
      case 'Needs Attention':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-[#777777]">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-[#F5C400] transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>My Projects</span>
        </button>
        <ChevronRight size={13} className="text-[#777777]" />
        <span className="text-[#171717] font-semibold truncate max-w-[200px] sm:max-w-none">
          {project.name}
        </span>
        <ChevronRight size={13} className="text-[#777777]" />
        <span className="text-[#777777]">Project Details Dossier</span>
      </nav>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          {/* Left: Identity, Badges & Scope */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(project.status)}`}>
                <span className={`w-2 h-2 rounded-full ${getStatusDot(project.status)}`} />
                {project.status}
              </span>

              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
                {project.category}
              </span>

              {project.isSample && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
                  Illustrative Sample Data
                </span>
              )}

              {project.repoBranch && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#171717] bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#EAEAEA]">
                  <GitBranch size={12} className="text-[#F5C400]" />
                  <span>{project.repoBranch}</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                {project.name}
              </h1>
              {project.tagline && (
                <p className="text-xs sm:text-sm font-medium text-[#777777] mt-0.5">
                  {project.tagline}
                </p>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#777777] leading-relaxed max-w-4xl">
              {project.description}
            </p>

            {/* Tech Stack Chips & Updated Timestamp */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#EAEAEA]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] uppercase font-bold text-[#777777] mr-1">
                  Stack:
                </span>
                {(project.detectedTechnologies && project.detectedTechnologies.length > 0) ? (
                  <>
                    {project.detectedTechnologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                        title="Detected in source codebase package manifest"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {tech}
                      </span>
                    ))}
                    {(project.declaredTechnologies || []).filter(t => !project.detectedTechnologies.includes(t)).map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#F7F7F5] text-[#777777] border border-dashed border-[#EAEAEA] flex items-center gap-1"
                        title="Manually declared tag (Not detected in code)"
                      >
                        {tech} <span className="text-[9px] text-[#777777]">(Declared)</span>
                      </span>
                    ))}
                  </>
                ) : (
                  (project.technologies || []).map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]"
                    >
                      {tech}
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[#777777] text-[11px]">
                <Clock size={12} className="text-[#777777]" />
                <span>Updated {project.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions Group */}
          <div className="flex flex-wrap items-center gap-2.5 self-start shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#F7F7F5] bg-white border border-[#EAEAEA] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Edit3 size={14} className="text-[#171717]" />
              <span>Edit Project</span>
            </button>

            <button
              type="button"
              onClick={onReanalyse}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Re-analyse</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-2 rounded-xl text-[#777777] hover:text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-colors shadow-sm"
                title="More Actions"
              >
                <MoreVertical size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EAEAEA] rounded-xl shadow-xl p-1.5 z-30 text-xs animate-in fade-in slide-in-from-top-2">
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#171717] hover:bg-[#F7F7F5] transition-colors text-left"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-[#F5C400]" />}
                    <span>{copied ? 'Copied ID!' : 'Copy Project ID'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert(`Exporting analysis report dossier for ${project.name} (PDF / Markdown)`);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#171717] hover:bg-[#F7F7F5] transition-colors text-left"
                  >
                    <Download size={13} className="text-[#171717]" />
                    <span>Export Dossier (PDF)</span>
                  </button>

                  <div className="my-1 border-t border-[#EAEAEA]" />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onDelete(project);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-left"
                  >
                    <Trash2 size={13} />
                    <span>Delete Project</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
