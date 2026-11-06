import React from 'react';
import { 
  X, 
  CheckCircle2, 
  FileArchive, 
  Layers, 
  ListChecks, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Cpu,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function ReviewProjectModal({
  isOpen,
  onClose,
  formData,
  selectedFile,
  requirements,
  detectedTech = [],
  totalFiles = null,
  requirementsSourceFile = null,
  onConfirm,
}) {
  if (!isOpen) return null;

  const totalWeight = requirements.reduce(
    (acc, curr) => acc + (Number(curr.weight) || 0),
    0
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#EAEAEA] bg-[#F7F7F5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-[#171717] border border-[#EAEAEA] shadow-sm">
              <ShieldCheck size={22} className="text-[#F5C400]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
                Review Project Specification
              </h3>
              <p className="text-xs text-[#777777]">
                Verify repository metadata and requirement criteria prior to registration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Architecture Disclaimer Alert */}
          <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#171717]">
              <Cpu size={14} className="text-[#F5C400]" />
              <span>Phase 2 Specification Confirmation</span>
            </div>
            <p className="leading-relaxed text-[11px] text-[#777777]">
              Confirming this specification registers the project in your local developer workspace. Multipart streaming via Multer and disk unzipping are scheduled for backend connection in <strong>Task 3</strong>.
            </p>
          </div>

          {/* Project Identity & File Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Identity Card */}
            <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-2">
              <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">
                Project Overview
              </span>
              <div className="text-sm font-bold text-[#171717]">
                {formData.name}
              </div>
              <p className="text-[11px] text-[#777777] line-clamp-3 leading-relaxed">
                {formData.description}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-[#171717] border border-[#EAEAEA]">
                  {formData.category}
                </span>
                {formData.expectedCompletionDate && (
                  <span className="flex items-center gap-1 text-[11px] text-[#777777]">
                    <Calendar size={11} className="text-[#171717]" />
                    Target: {formData.expectedCompletionDate}
                  </span>
                )}
              </div>
            </div>

            {/* Archive Details Card */}
            <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-2">
              <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">
                Source ZIP Archive
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                <FileArchive size={18} className="text-[#F5C400] shrink-0" />
                <span className="truncate">{selectedFile?.name || 'No file selected'}</span>
              </div>
              <div className="text-[11px] text-[#777777] space-y-1">
                <div>Size: <strong className="font-mono text-[#171717]">{formatFileSize(selectedFile?.size)}</strong></div>
                {totalFiles !== null && (
                  <div>Source Files: <strong className="text-[#171717] font-mono">{totalFiles} extracted</strong></div>
                )}
                {requirementsSourceFile && (
                  <div>Requirements Source: <strong className="text-[#171717] font-mono">{requirementsSourceFile}</strong></div>
                )}
                <div>Status: <span className="text-amber-700 font-semibold">&bull; Initial Status: Pending AST Analysis</span></div>
              </div>
            </div>
          </div>

          {/* Tech Stack Chips: Detected vs Declared */}
          <div className="space-y-3">
            {detectedTech.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Detected Stack Components (from Codebase Manifest)</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedTech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.technologies.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-2">
                  Declared Stack Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Requirements Matrix Table */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAEAEA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-2">
                <ListChecks size={15} className="text-[#F5C400]" />
                <span>Requirements Matrix ({requirements.length} features)</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#171717]">
                Sum: {totalWeight} pts
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {requirements.map((req, idx) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-white text-[#171717] border border-[#EAEAEA] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-[#171717] truncate">
                        {req.title}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-[11px] text-[#777777] mt-1 pl-6 line-clamp-1">
                        {req.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      req.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : req.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {req.priority}
                    </span>
                    <span className="font-mono text-[#171717] text-[11px] bg-white px-2 py-0.5 rounded border border-[#EAEAEA]">
                      {req.weight} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EAEAEA] bg-[#F7F7F5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-white bg-[#F7F7F5] border border-[#EAEAEA] transition-colors shadow-sm"
          >
            Back to Editing
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Confirm Project Specification</span>
            <CheckCircle2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
