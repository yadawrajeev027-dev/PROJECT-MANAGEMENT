import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  FileArchive, 
  ListChecks, 
  Save, 
  RotateCcw, 
  ArrowRight, 
  HardDrive, 
  Tag, 
  Sparkles,
  Info
} from 'lucide-react';

export default function ProjectSummary({
  formData,
  selectedFile,
  requirements,
  draftSavedTime,
  onSaveDraft,
  onReset,
  onReview,
}) {
  const totalWeight = requirements.reduce(
    (acc, curr) => acc + (Number(curr.weight) || 0),
    0
  );

  // Readiness Checklist checks
  const isNameValid = Boolean(formData.name && formData.name.trim().length > 0);
  const isDescValid = Boolean(formData.description && formData.description.trim().length >= 10);
  const isFileValid = Boolean(selectedFile);
  const isReqsValid = requirements.length > 0 && requirements.every(r => r.title.trim().length > 0 && r.weight > 0);

  const completedChecks = [isNameValid, isDescValid, isFileValid, isReqsValid].filter(Boolean).length;
  const readinessPercent = Math.round((completedChecks / 4) * 100);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight">
            Specification Summary
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Readiness audit before review
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono font-bold text-[#171717]">
            {readinessPercent}%
          </span>
          <span className="block text-[10px] text-[#777777] uppercase font-semibold">
            Ready
          </span>
        </div>
      </div>

      {/* Readiness Progress Bar */}
      <div>
        <div className="w-full bg-[#EAEAEA] rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full rounded-full bg-[#F5C400] transition-all duration-500"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Matrix */}
      <div className="space-y-3 text-xs">
        {/* Project Name */}
        <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
          <span className="text-[10px] text-[#777777] uppercase font-semibold block">
            Project Identity
          </span>
          <div className="font-bold text-[#171717] text-sm mt-0.5 truncate">
            {formData.name || <span className="text-[#777777] italic">Untitled Project</span>}
          </div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-[#171717] border border-[#EAEAEA]">
            {formData.category}
          </span>
        </div>

        {/* Selected Archive */}
        <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileArchive size={16} className={selectedFile ? 'text-[#F5C400]' : 'text-[#777777]'} />
            <div className="min-w-0">
              <span className="text-[10px] text-[#777777] uppercase font-semibold block">
                Source ZIP
              </span>
              <span className="font-medium text-[#171717] text-xs truncate block">
                {selectedFile ? selectedFile.name : <span className="text-[#777777] italic">No archive attached</span>}
              </span>
            </div>
          </div>
          {selectedFile && (
            <span className="text-[11px] font-mono text-[#171717] shrink-0 font-medium">
              {formatFileSize(selectedFile.size)}
            </span>
          )}
        </div>

        {/* Requirements Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
            <span className="text-[10px] text-[#777777] uppercase font-semibold block">
              Requirements
            </span>
            <span className="font-mono font-bold text-[#171717] text-base">
              {requirements.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
            <span className="text-[10px] text-[#777777] uppercase font-semibold block">
              Total Weight
            </span>
            <span className="font-mono font-bold text-[#171717] text-base">
              {totalWeight} <span className="text-xs font-normal text-[#777777]">pts</span>
            </span>
          </div>
        </div>

        {/* Technology Badges */}
        {formData.technologies.length > 0 && (
          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
            <span className="text-[10px] text-[#777777] uppercase font-semibold block mb-1.5">
              Target Tech Stack ({formData.technologies.length})
            </span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {formData.technologies.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-[#171717] border border-[#EAEAEA]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Validation Checklist */}
      <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-2 text-xs">
        <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">
          Submission Checklist
        </span>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            {isNameValid ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <Circle size={13} className="text-[#777777]" />
            )}
            <span className={isNameValid ? 'text-[#171717] font-medium' : 'text-[#777777]'}>
              Project name defined
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDescValid ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <Circle size={13} className="text-[#777777]" />
            )}
            <span className={isDescValid ? 'text-[#171717] font-medium' : 'text-[#777777]'}>
              Description provided (&ge; 10 chars)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isFileValid ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <Circle size={13} className="text-[#777777]" />
            )}
            <span className={isFileValid ? 'text-[#171717] font-medium' : 'text-[#777777]'}>
              Valid .ZIP file selected (&le; 100 MB)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isReqsValid ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <Circle size={13} className="text-[#777777]" />
            )}
            <span className={isReqsValid ? 'text-[#171717] font-medium' : 'text-[#777777]'}>
              At least one validated requirement
            </span>
          </div>
        </div>
      </div>

      {/* Draft Save Timestamp Indicator */}
      {draftSavedTime && (
        <div className="text-[11px] text-[#777777] text-center flex items-center justify-center gap-1 font-mono">
          <Save size={12} className="text-[#F5C400]" />
          <span>Draft auto-saved: {draftSavedTime}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {/* Continue to Review */}
        <button
          type="button"
          onClick={onReview}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <span>Continue to Review</span>
          <ArrowRight size={14} />
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Save as Draft */}
          <button
            type="button"
            onClick={onSaveDraft}
            className="py-2 px-3 rounded-xl text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            title="Save in local storage"
          >
            <Save size={13} className="text-[#777777]" />
            <span>Save Draft</span>
          </button>

          {/* Reset Form */}
          <button
            type="button"
            onClick={onReset}
            className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 bg-white border border-[#EAEAEA] hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            title="Reset all fields"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
