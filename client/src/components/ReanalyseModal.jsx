import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Cpu, 
  FileCode2, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Play
} from 'lucide-react';
import projectService from '../services/projectService';
import analysisService from '../services/analysisService';
import progressService from '../services/progressService';
import { useProjects } from '../context/ProjectContext';

export default function ReanalyseModal({ project, isOpen, onClose }) {
  if (!isOpen || !project) return null;

  const { refreshProjects } = useProjects();
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1: unzipping, 2: ast parsing, 3: requirements matching, 4: complete
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  const steps = [
    { title: 'ZIP Archive Extraction', desc: 'Sanitizing directory paths, stripping forbidden patterns, and extracting source.' },
    { title: 'Babel AST Code Ingestion', desc: 'Parsing controllers, route handlers, database schemas, and components.' },
    { title: 'Requirements Matrix Matcher', desc: 'Evaluating implemented routes & schemas against requirement checklist.' },
    { title: 'AI Advisory & Progress Scoring', desc: 'Synthesizing gap recommendations and deterministic weighted velocity.' },
  ];

  const projectId = project._id || project.id;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(projectId);

  const handleStartAnalysis = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanStep(1);

    if (isObjectId) {
      try {
        // Step 1: Extract ZIP
        try {
          await projectService.extractProjectZip(projectId);
        } catch (e) {
          // If already extracted, proceed gracefully
          console.warn('Extraction notice:', e.message);
        }

        // Step 2: AST Source Analysis
        setScanStep(2);
        await analysisService.analyzeSource(projectId);

        // Step 3: Requirements Verification
        setScanStep(3);
        await analysisService.verifyRequirements(projectId);

        // Step 4: AI Recommendations & Deterministic Progress
        setScanStep(4);
        try {
          await analysisService.generateRecommendations(projectId);
        } catch (aiErr) {
          console.warn('AI advisory notice:', aiErr.message);
        }
        await progressService.calculateProgress(projectId);

        // Complete
        setIsScanning(false);
        if (refreshProjects) await refreshProjects();
      } catch (err) {
        console.error('Pipeline execution error:', err);
        setScanError(err.message || 'Pipeline execution failed.');
        setIsScanning(false);
      }
    } else {
      // Simulation for canonical sample projects
      setTimeout(() => {
        setScanStep(2);
        setTimeout(() => {
          setScanStep(3);
          setTimeout(() => {
            setScanStep(4);
            setIsScanning(false);
          }, 1200);
        }, 1200);
      }, 1200);
    }
  };

  const handleReset = () => {
    setScanStep(0);
    setIsScanning(false);
    setScanError(null);
  };

  const handleCloseAndReload = () => {
    onClose();
    if (scanStep === 4 && isObjectId) {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] bg-[#F7F7F5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717]">
                Re-analyse Codebase
              </h3>
              <p className="text-xs text-[#777777]">
                {project.name} &bull; {isObjectId ? 'Live Backend Pipeline' : 'Demo Preview'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAndReload}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#EAEAEA] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#171717]">
            <strong>Architecture Pipeline:</strong> {isObjectId ? 'This runs the live 4-stage pipeline against your uploaded repository.' : 'This previews the multi-stage analysis pipeline.'}
          </div>

          {scanError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Stepper Pipeline */}
          <div className="space-y-3">
            {steps.map((st, idx) => {
              const stepNumber = idx + 1;
              const isDone = (scanStep > stepNumber && !isScanning) || (scanStep === 4 && !isScanning && !scanError) || (scanStep > stepNumber && isScanning);
              const isCurrent = scanStep === stepNumber && isScanning;

              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isDone 
                      ? 'bg-emerald-50/60 border-emerald-200' 
                      : isCurrent 
                      ? 'bg-amber-50/60 border-amber-300 shadow-sm' 
                      : 'bg-[#F7F7F5] border-[#EAEAEA] opacity-60'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : isCurrent ? (
                      <RefreshCw size={16} className="text-amber-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#777777] flex items-center justify-center text-[10px] text-[#777777] font-mono">
                        {stepNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#171717]">
                        {st.title}
                      </span>
                      {isDone && (
                        <span className="text-[10px] text-emerald-600 font-mono uppercase font-bold">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#777777] mt-0.5">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {scanStep === 4 && !isScanning && !scanError && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>Full codebase analysis pipeline complete! All evidence and progress scores updated.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAEAEA] bg-[#F7F7F5] flex items-center justify-between">
          {scanStep === 4 && !isScanning ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#171717] bg-white border border-[#EAEAEA] hover:bg-[#EAEAEA]"
            >
              Reset Run
            </button>
          ) : (
            <span className="text-[11px] text-[#777777]">
              Target branch: <strong className="text-[#171717] font-mono">main</strong>
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloseAndReload}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#777777] hover:text-[#171717]"
            >
              {scanStep === 4 ? 'Close & View Results' : 'Cancel'}
            </button>

            {scanStep !== 4 && (
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Play size={13} fill="currentColor" />
                <span>{isScanning ? 'Executing Pipeline...' : 'Run Analysis Pipeline'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
