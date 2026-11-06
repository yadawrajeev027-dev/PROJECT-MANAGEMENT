import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  ExternalLink, 
  Edit3, 
  RefreshCw, 
  Trash2, 
  FileText,
  Sparkles
} from 'lucide-react';

export default function ProjectActionMenu({
  project,
  onViewDetails,
  onEdit,
  onReanalyse,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] transition-colors"
        title="Project Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1.5 w-48 bg-white border border-[#EAEAEA] rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
        >
          <div className="px-2.5 py-1.5 border-b border-[#EAEAEA] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block truncate">
              {project.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onViewDetails(project);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#171717] hover:bg-[#F7F7F5] transition-colors font-medium text-left"
          >
            <FileText size={13} className="text-[#F5C400]" />
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit(project);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#171717] hover:bg-[#F7F7F5] transition-colors font-medium text-left"
          >
            <Edit3 size={13} className="text-[#171717]" />
            <span>Edit Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onReanalyse(project);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#171717] hover:bg-[#F7F7F5] transition-colors font-medium text-left"
          >
            <RefreshCw size={13} className="text-[#171717]" />
            <span>Re-analyse Codebase</span>
          </button>

          <div className="my-1 border-t border-[#EAEAEA]" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
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
  );
}
