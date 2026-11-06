import React from 'react';
import { 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  GripVertical, 
  Star,
  Flag
} from 'lucide-react';

export default function RequirementCard({
  requirement,
  index,
  onChange,
  onRemove,
  error = {},
}) {
  const priorities = [
    { value: 'High', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { value: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { value: 'Low', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] hover:border-[#F5C400]/60 transition-all duration-200 group">
      {/* Top Card Controls */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EAEAEA] mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-white text-[#171717] border border-[#EAEAEA] flex items-center justify-center font-mono text-[11px] font-bold shadow-sm">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-[#171717]">
            Requirement #{index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Pills */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white border border-[#EAEAEA] text-[10px]">
            {priorities.map((p) => {
              const isSelected = requirement.priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange(requirement.id, 'priority', p.value)}
                  className={`px-2 py-0.5 rounded-md font-bold uppercase transition-all ${
                    isSelected
                      ? p.color + ' border shadow-sm'
                      : 'text-[#777777] hover:text-[#171717]'
                  }`}
                >
                  {p.value}
                </button>
              );
            })}
          </div>

          {/* Remove Requirement Button */}
          <button
            type="button"
            onClick={() => onRemove(requirement.id)}
            className="p-1.5 rounded-lg text-[#777777] hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Remove Requirement"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="space-y-3">
        {/* Title and Weight Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Title */}
          <div className="sm:col-span-9">
            <label 
              htmlFor={`req-title-${requirement.id}`}
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1"
            >
              Requirement Title <span className="text-rose-500">*</span>
            </label>
            <input
              id={`req-title-${requirement.id}`}
              type="text"
              value={requirement.title}
              onChange={(e) => onChange(requirement.id, 'title', e.target.value)}
              placeholder="e.g. User Authentication via JWT & Refresh Tokens"
              className={`w-full bg-white border rounded-lg px-3 py-2 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                error.title
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
              }`}
            />
            {error.title && (
              <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{error.title}</span>
              </p>
            )}
          </div>

          {/* Weight */}
          <div className="sm:col-span-3">
            <label 
              htmlFor={`req-weight-${requirement.id}`}
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1 flex items-center justify-between"
            >
              <span>Weight <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-[#777777] font-mono">pts</span>
            </label>
            <input
              id={`req-weight-${requirement.id}`}
              type="number"
              min="1"
              max="100"
              value={requirement.weight}
              onChange={(e) => onChange(requirement.id, 'weight', parseInt(e.target.value) || 0)}
              className={`w-full bg-white border rounded-lg px-3 py-2 text-xs text-[#171717] font-mono focus:outline-none transition-all ${
                error.weight
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
              }`}
            />
            {error.weight && (
              <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{error.weight}</span>
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label 
            htmlFor={`req-desc-${requirement.id}`}
            className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1"
          >
            Expected Feature Description &amp; Verification Criteria
          </label>
          <textarea
            id={`req-desc-${requirement.id}`}
            rows={2}
            value={requirement.description}
            onChange={(e) => onChange(requirement.id, 'description', e.target.value)}
            placeholder="Specify controllers, route patterns, schemas or UI components expected for this feature (e.g. POST /api/auth/login route returning signed JWT; User model with hashed passwords)..."
            className="w-full bg-white border border-[#EAEAEA] rounded-lg p-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] transition-all leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
