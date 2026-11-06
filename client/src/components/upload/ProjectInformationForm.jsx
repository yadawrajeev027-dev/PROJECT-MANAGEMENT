import React, { useState } from 'react';
import { 
  FolderKanban, 
  FileText, 
  Layers, 
  Code2, 
  Calendar, 
  Plus, 
  X, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  'Web Application',
  'Mobile Application',
  'Machine Learning',
  'Backend Application',
  'Desktop Application',
  'Other',
];

const SUGGESTED_TECH = [
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'FastAPI',
  'Python',
  'PostgreSQL',
  'Tailwind CSS',
  'Next.js',
  'Scikit-Learn',
  'Docker',
];

export default function ProjectInformationForm({
  formData,
  onChange,
  errors = {},
}) {
  const [techInput, setTechInput] = useState('');

  const handleAddTech = (tech) => {
    const trimmed = tech.trim();
    if (!trimmed) return;
    if (!formData.technologies.includes(trimmed)) {
      onChange('technologies', [...formData.technologies, trimmed]);
    }
    setTechInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTech(techInput);
    }
  };

  const handleRemoveTech = (techToRemove) => {
    onChange(
      'technologies',
      formData.technologies.filter((t) => t !== techToRemove)
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <FolderKanban size={18} className="text-[#F5C400]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171717] tracking-tight">
              1. Project Information
            </h3>
            <p className="text-xs text-[#777777]">
              Core metadata and software architecture classification
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#171717] bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#EAEAEA]">
          Step 1 of 3
        </span>
      </div>

      <div className="space-y-4">
        {/* Project Name & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project Name */}
          <div>
            <label 
              htmlFor="project-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Project Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="project-name"
                type="text"
                value={formData.name}
                maxLength={80}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="e.g. Food Quality Prediction"
                className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:bg-white transition-all ${
                  errors.name
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                    : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-[#777777] font-mono">
                {formData.name.length}/80
              </span>
            </div>
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Project Category */}
          <div>
            <label 
              htmlFor="project-category"
              className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Project Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="project-category"
                value={formData.category}
                onChange={(e) => onChange('category', e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2.5 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] cursor-pointer appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-[#171717]">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#777777]">
                <Layers size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div>
          <label 
            htmlFor="project-description"
            className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5 flex items-center justify-between"
          >
            <span>Project Description <span className="text-rose-500">*</span></span>
            <span className="text-[10px] text-[#777777] font-normal">
              Minimum 20 characters recommended
            </span>
          </label>
          <textarea
            id="project-description"
            rows={3}
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Describe the application scope, key problem it solves, and target architecture (e.g. An automated food freshness detection pipeline utilizing spectral sensor readings and regression models with a React dashboard)..."
            className={`w-full bg-[#F7F7F5] border rounded-xl p-3.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:bg-white transition-all leading-relaxed ${
              errors.description
                ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{errors.description}</span>
            </p>
          )}
        </div>

        {/* Technology Stack Tag Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5 flex items-center justify-between">
            <span>Technology Stack</span>
            <span className="text-[10px] text-[#777777]">
              Press Enter or Comma to add
            </span>
          </label>

          {/* Active Tags */}
          <div className="min-h-[44px] bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl p-2 flex flex-wrap items-center gap-1.5 focus-within:bg-white focus-within:border-[#F5C400] focus-within:ring-1 focus-within:ring-[#F5C400] transition-all">
            {formData.technologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white text-[#171717] border border-[#EAEAEA] shadow-sm group animate-in fade-in"
              >
                <span>{tech}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTech(tech)}
                  className="text-[#777777] hover:text-black transition-colors"
                  title={`Remove ${tech}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => handleAddTech(techInput)}
              placeholder={formData.technologies.length === 0 ? "Type tech and hit Enter (e.g. FastAPI)..." : "Add more..."}
              className="flex-1 min-w-[140px] bg-transparent text-xs text-[#171717] placeholder-[#777777] focus:outline-none px-2 py-1"
            />
          </div>

          {/* Suggestions */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#777777] mr-1 flex items-center gap-1">
              <Sparkles size={11} className="text-[#F5C400]" />
              Suggested:
            </span>
            {SUGGESTED_TECH.filter((t) => !formData.technologies.includes(t)).slice(0, 7).map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => handleAddTech(tech)}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#F7F7F5] hover:bg-[#F5C400]/20 text-[#171717] border border-[#EAEAEA] hover:border-[#F5C400] transition-colors flex items-center gap-1"
              >
                <Plus size={10} />
                <span>{tech}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expected Completion Date */}
        <div className="max-w-xs">
          <label 
            htmlFor="completion-date"
            className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5 flex items-center gap-1.5"
          >
            <Calendar size={13} className="text-[#F5C400]" />
            <span>Target Milestone Date (Optional)</span>
          </label>
          <input
            id="completion-date"
            type="date"
            value={formData.expectedCompletionDate}
            onChange={(e) => onChange('expectedCompletionDate', e.target.value)}
            className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2.5 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
          />
        </div>
      </div>
    </div>
  );
}
