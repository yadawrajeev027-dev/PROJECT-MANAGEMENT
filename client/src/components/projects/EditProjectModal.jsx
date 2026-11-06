import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  FolderKanban, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  'Web Application',
  'Mobile Application',
  'Machine Learning',
  'Backend Application',
  'Full-Stack Application',
  'Developer Tooling',
  'Desktop Application',
  'Other',
];

const STATUSES = [
  'In Progress',
  'Completed',
  'Needs Attention',
  'Not Analyzed',
];

export default function EditProjectModal({
  isOpen,
  project,
  onClose,
  onSaveProject,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Application');
  const [status, setStatus] = useState('In Progress');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setCategory(project.category || 'Web Application');
      setStatus(project.status || 'In Progress');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveProject({
      ...project,
      name: name.trim(),
      description: description.trim(),
      category,
      status,
      lastUpdated: 'Just now',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] shadow-sm">
              <Edit3 size={18} className="text-[#F5C400]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717] tracking-tight">
                Edit Project Metadata
              </h3>
              <p className="text-xs text-[#777777]">
                Update classification &amp; scope details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Project Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2.5 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400]"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-[#171717]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] cursor-pointer"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-white text-[#171717]">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5">
              Project Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl p-3 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[11px] text-[#777777] flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-[#F5C400]" />
            <span>Updates are synchronized in local component state. In Task 2, updates will issue a <code>PUT /api/projects/:id</code> request to MongoDB.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAEAEA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#F7F7F5] bg-white border border-[#EAEAEA] shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save size={13} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
