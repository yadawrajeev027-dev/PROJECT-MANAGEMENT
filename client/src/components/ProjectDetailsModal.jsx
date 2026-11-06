import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode2, 
  Layers, 
  Cpu, 
  Clock, 
  Terminal,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import CircularProgress from './CircularProgress';

export default function ProjectDetailsModal({ project, isOpen, onClose }) {
  if (!isOpen || !project) return null;

  const mockFeatures = [
    { name: 'Model Serializer / Joblib loader', status: 'implemented', file: 'ml/predict.py' },
    { name: 'FastAPI router for /api/v1/predict', status: 'implemented', file: 'server/api/routes.py' },
    { name: 'Sensor payload schema validation (Pydantic)', status: 'implemented', file: 'server/schemas/sensor.py' },
    { name: 'React real-time freshness gauge UI', status: 'implemented', file: 'client/src/components/Gauge.jsx' },
    { name: 'Automated pytest inference boundary tests', status: 'missing', file: 'tests/test_inference.py' },
    { name: 'Token-bucket rate limiter middleware', status: 'missing', file: 'server/middleware/rate_limit.py' },
    { name: 'Batch prediction CSV upload route', status: 'missing', file: 'server/api/batch.py' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] bg-[#F7F7F5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <FileCode2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <span>{project.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white text-[#171717] border border-[#EAEAEA]">
                  {project.status}
                </span>
              </h3>
              <p className="text-xs text-[#777777]">
                Detailed Requirement &amp; AST Analysis Dossier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#EAEAEA] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
              <span className="text-[10px] text-[#777777] uppercase font-semibold">Score</span>
              <div className="text-lg font-bold text-[#171717] font-mono mt-0.5">
                {project.completionPercentage}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
              <span className="text-[10px] text-[#777777] uppercase font-semibold">Files Scanned</span>
              <div className="text-lg font-bold text-[#171717] font-mono mt-0.5">
                {project.filesInspected || 84}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
              <span className="text-[10px] text-[#777777] uppercase font-semibold">Implemented</span>
              <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
                {project.identifiedFeatures || 14}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
              <span className="text-[10px] text-[#777777] uppercase font-semibold">Missing Gap</span>
              <div className="text-lg font-bold text-red-500 font-mono mt-0.5">
                {project.missingFeatures || 4}
              </div>
            </div>
          </div>

          {/* Feature Matrix Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-2.5 flex items-center justify-between">
              <span>Feature Implementation Matrix</span>
              <span className="text-[10px] text-[#777777] font-normal">
                Extracted from Source Code AST
              </span>
            </h4>

            <div className="space-y-2">
              {mockFeatures.map((feat, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {feat.status === 'implemented' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                    )}
                    <span className="font-medium text-[#171717] truncate">
                      {feat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-[#777777] px-2 py-0.5 rounded bg-white border border-[#EAEAEA] hidden sm:inline-block">
                      {feat.file}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      feat.status === 'implemented'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {feat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
              Detected Stack Signatures
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(project.techStack || project.technologies || []).map((tech) => (
                <span 
                  key={tech}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EAEAEA] bg-[#F7F7F5] flex items-center justify-between">
          <span className="text-xs text-[#777777]">
            Export format: <strong className="text-[#171717]">PDF / Markdown</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] transition-colors shadow-sm"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
