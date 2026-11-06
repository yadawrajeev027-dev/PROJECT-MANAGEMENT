import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FolderX, 
  Plus, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Loader2 
} from 'lucide-react';

import ProjectHeader from '../components/details/ProjectHeader';
import ProjectOverview from '../components/details/ProjectOverview';
import ProgressVelocityCard from '../components/details/ProgressVelocityCard';
import RequirementTable from '../components/details/RequirementTable';
import DevelopmentBreakdown from '../components/details/DevelopmentBreakdown';
import MissingFeatures from '../components/details/MissingFeatures';
import NextActions from '../components/details/NextActions';
import AIAdvisorySection from '../components/details/AIAdvisorySection';
import AnalysisTimeline from '../components/details/AnalysisTimeline';
import ProjectProgressTrend from '../components/details/ProjectProgressTrend';

import EditProjectModal from '../components/projects/EditProjectModal';
import DeleteProjectModal from '../components/projects/DeleteProjectModal';
import ReanalyseModal from '../components/ReanalyseModal';

import { useProjects, mapBackendProject } from '../context/ProjectContext';
import { calculateRequirementMetrics } from '../utils/requirementMetrics';
import projectService from '../services/projectService';
import analysisService from '../services/analysisService';
import progressService from '../services/progressService';

export default function ProjectDetails({
  projectId: propProjectId,
}) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { getProjectById, updateProject, deleteProject, toggleRequirementStatus } = useProjects();

  const resolvedProjectId = propProjectId || routeId || 'proj-food-quality';
  const contextProject = getProjectById(resolvedProjectId);
  const [backendProject, setBackendProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(!contextProject && /^[0-9a-fA-F]{24}$/.test(resolvedProjectId));

  const project = backendProject || contextProject;

  // Real backend requirements state (Step 8 Integration)
  const [liveRequirements, setLiveRequirements] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Real backend AI Advisory state (Step 9 Integration)
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Real backend Progress & Velocity state (Step 10 Integration)
  const [liveProgress, setLiveProgress] = useState(null);
  const [liveProgressHistory, setLiveProgressHistory] = useState([]);
  const [liveVelocity, setLiveVelocity] = useState(null);
  const [isCalculatingProgress, setIsCalculatingProgress] = useState(false);
  const [progressError, setProgressError] = useState(null);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReanalyseOpen, setIsReanalyseOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Attempt fetching live verified requirements, AI advisory, and progress metrics from backend
  useEffect(() => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(resolvedProjectId);
    if (!isObjectId) return;

    if (!contextProject && !backendProject) {
      setLoadingProject(true);
    }

    // Always fetch latest project specification from backend for an ObjectId
    projectService.getProject(resolvedProjectId)
      .then((res) => {
        const p = res?.project || res?.data?.project || res?.data || res;
        if (p && (p._id || p.id)) {
          const normalized = mapBackendProject(p);
          setBackendProject(normalized);
          setFetchError(null);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch project record:', err);
        setFetchError(err.message || 'Could not fetch project record from server.');
      })
      .finally(() => setLoadingProject(false));

    const fetchLiveProjectData = async () => {
      // 1. Fetch live requirements independently
      try {
        const reqs = await projectService.getRequirements(resolvedProjectId);
        if (Array.isArray(reqs) && reqs.length > 0) {
          setLiveRequirements(reqs);
        }
      } catch (err) {
        console.warn('Backend requirements fetch warning:', err);
      }

      // 2. Fetch AI recommendations (optional; 404 is normal if not generated yet)
      try {
        const ai = await analysisService.getRecommendations(resolvedProjectId);
        if (ai) {
          setAiAnalysis(ai);
        }
      } catch (err) {
        // AI recommendations may not exist yet; safe to ignore
      }

      // 3. Fetch Step 10 Deterministic Progress Metrics
      try {
        const prog = await progressService.getProgress(resolvedProjectId);
        if (prog) {
          setLiveProgress(prog);
        }
      } catch (err) {
        console.warn('Backend progress fetch warning:', err);
      }

      // 4. Fetch Progress History
      try {
        const hist = await progressService.getProgressHistory(resolvedProjectId);
        if (Array.isArray(hist)) {
          setLiveProgressHistory(hist);
        }
      } catch (err) {
        console.warn('Backend progress history fetch warning:', err);
      }

      // 5. Fetch Velocity & Forecast
      try {
        const vel = await progressService.getVelocity(resolvedProjectId);
        if (vel) {
          setLiveVelocity(vel);
        }
      } catch (err) {
        console.warn('Backend velocity fetch warning:', err);
      }
    };

    fetchLiveProjectData();
  }, [resolvedProjectId]);

  // Derive authoritative progress metrics synchronized between both dashboard sections
  const authoritativeProgress = useMemo(() => {
    if (liveProgress && typeof liveProgress.progressPercentage === 'number') {
      return liveProgress;
    }
    if (project?.progressMetrics && typeof project.progressMetrics.progressPercentage === 'number') {
      return project.progressMetrics;
    }
    const reqs = liveRequirements || project?.requirements || [];
    if (reqs.length > 0) {
      const metrics = calculateRequirementMetrics(reqs, project?.analysisStatus);
      return {
        progressPercentage: metrics.progressPercentage,
        verificationCoverage: metrics.verificationCoverage,
        calculationStatus: metrics.calculationStatus,
        totalRequirements: metrics.total,
        verifiedCount: metrics.verified,
        partialCount: metrics.partial,
        notFoundCount: metrics.missing,
        needsReviewCount: metrics.needsReview,
        pendingCount: metrics.pending,
        totalWeight: metrics.totalWeight,
        verifiedWeight: metrics.verifiedWeight,
        partialWeight: metrics.partialWeight,
        notFoundWeight: metrics.notFoundWeight,
        needsReviewWeight: metrics.needsReviewWeight,
        pendingWeight: metrics.pendingWeight,
        earnedWeight: metrics.earnedWeight,
        assessedWeight: metrics.assessedWeight,
      };
    }
    return null;
  }, [liveProgress, project, liveRequirements]);

  // Handler to recalculate deterministic progress
  const handleRecalculateProgress = async () => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(resolvedProjectId);
    if (!isObjectId) {
      showToast('info', 'Progress recalculation is available for backend projects.');
      return;
    }

    setIsCalculatingProgress(true);
    setProgressError(null);
    try {
      const data = await progressService.calculateProgress(resolvedProjectId);
      if (data) {
        setLiveProgress(data);
        showToast('success', `Progress updated: ${data.progressPercentage}% (${data.calculationStatus})`);

        // Refresh project record, requirements, history & velocity in parallel to keep everything in sync
        const [projRes, reqsRes, hist, vel] = await Promise.all([
          projectService.getProject(resolvedProjectId).catch(() => null),
          projectService.getRequirements(resolvedProjectId).catch(() => null),
          progressService.getProgressHistory(resolvedProjectId).catch(() => null),
          progressService.getVelocity(resolvedProjectId).catch(() => null),
        ]);
        const p = projRes?.project || projRes?.data?.project || projRes?.data || projRes;
        if (p && (p._id || p.id)) {
          setBackendProject(mapBackendProject(p));
        }
        if (Array.isArray(reqsRes) && reqsRes.length > 0) {
          setLiveRequirements(reqsRes);
        }
        if (Array.isArray(hist)) setLiveProgressHistory(hist);
        if (vel) setLiveVelocity(vel);
      }
    } catch (err) {
      const msg = err.message || 'Failed to recalculate progress.';
      setProgressError(msg);
      showToast('info', msg);
    } finally {
      setIsCalculatingProgress(false);
    }
  };

  // Handler to trigger real backend AI generation (POST /api/projects/:id/generate-recommendations)
  const handleGenerateAI = async () => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(resolvedProjectId);
    if (!isObjectId) {
      showToast('info', 'AI Advisory is available for backend projects with completed AST analysis.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const data = await analysisService.generateRecommendations(resolvedProjectId);
      if (data?.aiAnalysis) {
        setAiAnalysis(data.aiAnalysis);
        showToast('success', 'AI development advisory generated successfully!');
      } else {
        showToast('info', 'AI recommendations generated.');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate AI recommendations.';
      setAiError(errorMsg);
      showToast('info', errorMsg);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handler to trigger real backend requirement verification
  const handleTriggerVerification = async () => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(resolvedProjectId);
    if (!isObjectId) {
      showToast('info', 'Live AST verification is only available for uploaded backend projects.');
      return;
    }

    setIsVerifying(true);
    try {
      const data = await analysisService.verifyRequirements(resolvedProjectId);
      if (data) {
        showToast('success', `Verification complete! ${data.verifiedCount} verified, ${data.partialCount} partial.`);
        if (Array.isArray(data.requirements)) {
          setLiveRequirements(data.requirements);
        }
        // Also refresh progress and project specification
        const [prog, projRes] = await Promise.all([
          progressService.getProgress(resolvedProjectId).catch(() => null),
          projectService.getProject(resolvedProjectId).catch(() => null),
        ]);
        if (prog) setLiveProgress(prog);
        const p = projRes?.project || projRes?.data?.project || projRes?.data || projRes;
        if (p && (p._id || p.id)) setBackendProject(mapBackendProject(p));
      }
    } catch (err) {
      showToast('info', err.message || 'Verification could not be completed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveEdit = (updatedFields) => {
    if (project) {
      updateProject(project.id, updatedFields);
      showToast('success', `Metadata successfully updated for "${updatedFields.name}".`);
    }
    setIsEditOpen(false);
  };

  const handleDeleteConfirm = (projectId) => {
    const targetId = projectId || project?.id;
    if (targetId) {
      deleteProject(targetId);
      setIsDeleteOpen(false);
      showToast('info', `Project "${project?.name}" removed from workspace.`);
      setTimeout(() => {
        navigate('/projects');
      }, 1000);
    }
  };

  const handleToggleRequirement = (reqId) => {
    if (project) {
      toggleRequirementStatus(project.id, reqId);
      showToast('success', `Requirement status updated.`);
    }
  };

  // If loading backend project, show spinner
  if (loadingProject) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center max-w-md mx-auto my-16 border border-[#EAEAEA] space-y-4 shadow-sm">
        <Loader2 size={32} className="animate-spin text-[#F5C400] mx-auto" />
        <h3 className="text-sm font-bold text-[#171717]">Loading Project Specification</h3>
        <p className="text-xs text-[#777777]">Fetching verified AST analysis and requirement checklist from MongoDB...</p>
      </div>
    );
  }

  // If project is not found, render a helpful empty state
  if (!project) {
    return (
      <div className="bg-white rounded-2xl p-12 sm:p-16 text-center max-w-xl mx-auto my-12 border border-[#EAEAEA] space-y-4 shadow-sm animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[#F7F7F5] text-rose-600 border border-[#EAEAEA] flex items-center justify-center mx-auto">
          <FolderX size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#171717] tracking-tight">
          {fetchError ? 'Unable to Load Project Specification' : 'Project Specification Not Found'}
        </h2>
        <p className="text-xs text-[#777777] leading-relaxed">
          {fetchError ? (
            <span>{fetchError}</span>
          ) : (
            <>The requested project ID <code className="text-[#171717] font-mono">"{resolvedProjectId}"</code> does not exist or has been removed from your local workspace.</>
          )}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/projects"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Return to My Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Ephemeral Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-[#F7F7F5] border-[#EAEAEA] text-[#171717]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <Info size={16} className="text-[#F5C400] shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Page Header & Breadcrumbs */}
      <ProjectHeader
        project={project}
        onBack={() => navigate('/projects')}
        onEdit={() => setIsEditOpen(true)}
        onReanalyse={() => setIsReanalyseOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      {/* 2. Project Overview KPI & Circular Meter */}
      <ProjectOverview 
        project={project} 
        progressData={authoritativeProgress}
        requirements={liveRequirements || project.requirements || []}
      />

      {/* 2b. Deterministic Progress & Velocity Engine (Step 10) */}
      <ProgressVelocityCard
        projectId={resolvedProjectId}
        progressData={authoritativeProgress}
        velocityData={liveVelocity}
        isCalculating={isCalculatingProgress}
        onRecalculate={handleRecalculateProgress}
        error={progressError}
        isSample={project.isSample}
      />

      {/* 3. Requirements Tracking Implementation Matrix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {liveRequirements ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={12} />
                Live MongoDB AST Evidence Connected
              </span>
            ) : project.isSample ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
                <Info size={12} />
                Illustrative Sample Requirements (Not Live Data)
              </span>
            ) : null}
          </div>
          {/^[0-9a-fA-F]{24}$/.test(resolvedProjectId) && (
            <button
              type="button"
              onClick={handleTriggerVerification}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Verifying Evidence...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  <span>Run AST Verification</span>
                </>
              )}
            </button>
          )}
        </div>
        <RequirementTable 
          requirements={liveRequirements || project.requirements || []} 
          onToggleStatus={handleToggleRequirement}
        />
      </div>

      {/* 4. AI Development Advisory & Action Plan (Step 9 Engine) */}
      <AIAdvisorySection
        projectId={resolvedProjectId}
        aiAnalysis={aiAnalysis}
        isGenerating={isGeneratingAI}
        onGenerate={handleGenerateAI}
        error={aiError}
        isSample={project.isSample}
      />

      {/* 5. Development Breakdown Across 6 Layers */}
      <DevelopmentBreakdown breakdown={project.developmentBreakdown || []} />

      {/* 5. Identified Feature Gaps & Missing Features */}
      <MissingFeatures missingFeatures={project.missingFeatures || []} />

      {/* 6. Prioritized Next Action Recommendations with User Done Toggle */}
      <NextActions recommendations={project.recommendations || []} />

      {/* 7. Historical Velocity Line Chart (Recharts) */}
      <ProjectProgressTrend
        data={
          liveProgressHistory && liveProgressHistory.length > 0
            ? liveProgressHistory.map((h) => ({
                run: new Date(h.calculatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                progress: h.progressPercentage,
                target: 100,
              }))
            : (project.progressTrend || [])
        }
      />

      {/* 8. Analysis Timeline with Previous Report Snapshots */}
      <AnalysisTimeline
        history={
          liveProgressHistory && liveProgressHistory.length > 0
            ? liveProgressHistory.map((h) => ({
                id: h.reportId ? h.reportId.slice(-8) : 'SNAPSHOT',
                date: new Date(h.calculatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
                summary: `Progress snapshot: ${h.progressPercentage}% (${h.calculationStatus}). Verification coverage: ${h.verificationCoverage}%.`,
                requirementsChecked: h.breakdown?.totalRequirements || 0,
                missingFeatures: h.breakdown?.notFoundCount || 0,
                completion: h.progressPercentage,
              }))
            : (project.analysisHistory || [])
        }
      />

      {/* Interactive Modals */}
      <EditProjectModal
        isOpen={isEditOpen}
        project={project}
        onClose={() => setIsEditOpen(false)}
        onSaveProject={handleSaveEdit}
      />

      <DeleteProjectModal
        isOpen={isDeleteOpen}
        project={project}
        onClose={() => setIsDeleteOpen(false)}
        onConfirmDelete={handleDeleteConfirm}
      />

      <ReanalyseModal
        isOpen={isReanalyseOpen}
        project={project}
        onClose={() => setIsReanalyseOpen(false)}
      />
    </div>
  );
}
