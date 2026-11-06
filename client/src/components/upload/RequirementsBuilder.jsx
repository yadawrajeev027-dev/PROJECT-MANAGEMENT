import React, { useRef } from 'react';
import { 
  ListChecks, 
  Plus, 
  Sparkles, 
  Trash2, 
  AlertCircle, 
  HelpCircle,
  Layers,
  Upload,
  FileText,
  CheckCircle2
} from 'lucide-react';
import RequirementCard from './RequirementCard';
import { parseRequirementsMarkdown } from '../../utils/markdownParser.js';

const SAMPLE_STARTER_TEMPLATE = [
  {
    id: 'tpl-1',
    title: 'User Authentication & JWT Tokens',
    description: 'User registration, login endpoint, password hashing with bcrypt, and Bearer JWT middleware guard.',
    priority: 'High',
    weight: 20,
  },
  {
    id: 'tpl-2',
    title: 'Database CRUD & Data Validation',
    description: 'Data models with field validations, timestamps, and REST controller handlers for creation and retrieval.',
    priority: 'High',
    weight: 25,
  },
  {
    id: 'tpl-3',
    title: 'Input Validation & Error Handling',
    description: 'Centralized error-handling middleware returning standard JSON error envelopes for invalid payloads.',
    priority: 'Medium',
    weight: 15,
  },
  {
    id: 'tpl-4',
    title: 'Responsive Frontend Dashboard UI',
    description: 'React dashboard with modular components, interactive charts, and responsive mobile navigation.',
    priority: 'Medium',
    weight: 20,
  },
  {
    id: 'tpl-5',
    title: 'Automated Unit & Integration Tests',
    description: 'Test suite exercising core controller routes and edge cases with at least 50% code coverage.',
    priority: 'Low',
    weight: 20,
  },
];

export default function RequirementsBuilder({
  requirements = [],
  setRequirements,
  errors = {},
  requirementsSourceFile = null,
  onImportRequirements = null,
}) {
  const fileInputRef = useRef(null);
  const totalWeight = requirements.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);

  const handleAddRequirement = () => {
    const newReq = {
      id: `REQ-${String(requirements.length + 1).padStart(3, '0')}`,
      title: '',
      description: '',
      priority: 'Medium',
      weight: 10,
    };
    setRequirements([...requirements, newReq]);
  };

  const handleUpdateRequirement = (id, field, value) => {
    setRequirements(
      requirements.map((req) =>
        req.id === id ? { ...req, [field]: value } : req
      )
    );
  };

  const handleRemoveRequirement = (id) => {
    setRequirements(requirements.filter((req) => req.id !== id));
  };

  const handleLoadTemplate = () => {
    const freshTemplate = SAMPLE_STARTER_TEMPLATE.map((item, idx) => ({
      ...item,
      id: `REQ-TPL-${idx + 1}`,
      status: 'Pending',
      evidence: 'Awaiting AST parser extraction.',
    }));
    setRequirements(freshTemplate);
  };

  const handleClearAll = () => {
    if (requirements.length > 0) {
      if (window.confirm('Clear all defined requirements?')) {
        setRequirements([]);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const parsed = parseRequirementsMarkdown(content);
        if (parsed.length > 0) {
          if (onImportRequirements) {
            onImportRequirements(parsed, file.name);
          } else {
            setRequirements(parsed);
          }
        } else {
          alert('Could not detect structured requirements in the uploaded Markdown file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <ListChecks size={18} className="text-[#F5C400]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171717] tracking-tight">
              3. Project Requirements Specification
            </h3>
            <p className="text-xs text-[#777777]">
              Define the functional requirements and milestones AI will verify
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-[#171717] bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#EAEAEA]">
            {requirements.length} {requirements.length === 1 ? 'Requirement' : 'Requirements'}
          </span>
          <span className="text-[11px] font-mono text-[#171717] bg-[#F5C400]/20 px-2.5 py-1 rounded-full border border-[#F5C400]/40 font-semibold">
            Total Weight: <strong>{totalWeight} pts</strong>
          </span>
        </div>
      </div>

      {/* Source Specification File Banner */}
      {requirementsSourceFile && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              Active requirements loaded from <strong className="text-[#171717] font-mono">{requirementsSourceFile}</strong>
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
            Source Validated
          </span>
        </div>
      )}

      {/* Hidden File Input for .md Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddRequirement}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus size={14} />
            <span>Add Requirement</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-colors flex items-center gap-1.5 shadow-sm"
            title="Import requirements from a standalone Markdown file (e.g. PROJECT_REQUIREMENTS.md)"
          >
            <Upload size={13} className="text-[#171717]" />
            <span>Import Markdown (.md)</span>
          </button>

          <button
            type="button"
            onClick={handleLoadTemplate}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-colors flex items-center gap-1.5 shadow-sm"
            title="Load standard requirements as an editable starting point"
          >
            <Sparkles size={13} className="text-[#F5C400]" />
            <span>Load Starter Template</span>
          </button>
        </div>

        {requirements.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#777777] hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Global Requirements Error */}
      {errors.requirements && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{errors.requirements}</span>
        </div>
      )}

      {/* Requirement Cards List */}
      {requirements.length > 0 ? (
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              index={index}
              onChange={handleUpdateRequirement}
              onRemove={handleRemoveRequirement}
              error={errors[req.id] || {}}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-10 px-4 rounded-xl border border-dashed border-[#EAEAEA] text-center bg-[#F7F7F5] space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white text-[#171717] border border-[#EAEAEA] flex items-center justify-center mx-auto shadow-sm">
            <ListChecks size={24} className="text-[#F5C400]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#171717]">No Requirements Defined Yet</h4>
            <p className="text-xs text-[#777777] max-w-sm mx-auto mt-1">
              Add at least one requirement or load the starter template so the AST scanner knows which features to verify.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleAddRequirement}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Add First Requirement</span>
            </button>
            <button
              type="button"
              onClick={handleLoadTemplate}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles size={14} className="text-[#F5C400]" />
              <span>Use Starter Template</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
