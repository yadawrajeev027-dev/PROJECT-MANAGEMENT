import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

export default function DeleteProjectModal({
  isOpen,
  project,
  onClose,
  onConfirmDelete,
}) {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
            <AlertTriangle size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#171717] tracking-tight">
              Delete Project Specification?
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Are you sure you want to delete <strong className="text-[#171717] font-semibold">"{project.name}"</strong>? This will remove the project from your local workspace repository view.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Project Snapshot Card */}
        <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs space-y-1">
          <div className="flex justify-between items-center text-[#777777]">
            <span>Category:</span>
            <span className="font-semibold text-[#171717]">{project.category}</span>
          </div>
          <div className="flex justify-between items-center text-[#777777]">
            <span>Progress:</span>
            <span className="font-mono font-semibold text-[#171717]">{project.completionPercentage}%</span>
          </div>
          <div className="flex justify-between items-center text-[#777777]">
            <span>Requirements:</span>
            <span className="font-mono text-[#171717]">{project.requirementsCount || 0} items</span>
          </div>
        </div>

        {/* Informative Notice */}
        <div className="text-[11px] text-[#777777] bg-[#F7F7F5] p-2.5 rounded-xl border border-[#EAEAEA] flex items-start gap-2">
          <Info size={13} className="text-[#F5C400] shrink-0 mt-0.5" />
          <span>
            <strong>Frontend Simulation:</strong> This action removes the item from the browser application state. Backend MongoDB document deletion will be activated in Task 2.
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAEAEA]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#F7F7F5] bg-white border border-[#EAEAEA] transition-colors shadow-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirmDelete(project.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Trash2 size={13} />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
