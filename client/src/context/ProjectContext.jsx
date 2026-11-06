import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  INITIAL_PROJECTS, 
  SAMPLE_REPORTS,
  calculateProjectStats, 
  calculateDashboardStats 
} from '../data/centralData';
import { calculateRequirementMetrics } from '../utils/requirementMetrics.js';
import { useAuth } from './AuthContext';
import projectService from '../services/projectService';

const ProjectContext = createContext();

const CUSTOM_PROJECTS_KEY = 'projectpulse_custom_projects';

// Helper to normalize any project object dynamically
function normalizeProjectObject(proj) {
  if (!proj) return null;
  const analysisStatus = proj.analysisStatus || (proj.isSample ? 'Completed' : 'Pending');
  const metrics = calculateRequirementMetrics(proj.requirements || [], analysisStatus);

  return {
    ...proj,
    analysisStatus,
    requirementsCount: metrics.total,
    totalRequirements: metrics.total,
    completedRequirements: metrics.verified,
    partialRequirements: metrics.partial,
    missingRequirements: metrics.missing,
    pendingRequirements: metrics.pending,
    completionPercentage: proj.isSample ? (proj.completionPercentage ?? metrics.progressPercentage) : metrics.progressPercentage,
  };
}

// Convert backend MongoDB project record into normalized frontend representation
export function mapBackendProject(p) {
  if (!p) return null;
  const projId = (p._id || p.id)?.toString();
  if (!projId) return null;

  const reqs = (p.requirements || []).map((r, idx) => ({
    id: r.requirementCode || r.code || r._id || `REQ-${String(idx + 1).padStart(3, '0')}`,
    code: r.requirementCode || r.code || `REQ-${String(idx + 1).padStart(3, '0')}`,
    requirementCode: r.requirementCode || r.code || `REQ-${String(idx + 1).padStart(3, '0')}`,
    _id: r._id,
    title: r.title || `Requirement #${idx + 1}`,
    description: r.description || '',
    priority: r.priority ? (r.priority.charAt(0).toUpperCase() + r.priority.slice(1).toLowerCase()) : 'Medium',
    weight: typeof r.weight === 'number' ? r.weight : 10,
    status: r.status
      ? (r.status.toLowerCase() === 'verified'
          ? 'Verified'
          : r.status.toLowerCase() === 'partial'
          ? 'Partial'
          : r.status.toLowerCase() === 'not_found'
          ? 'Not Found'
          : r.status.toLowerCase() === 'needs_review'
          ? 'Needs Review'
          : 'Pending')
      : 'Pending',
    evidence: (Array.isArray(r.evidence) && r.evidence.length > 0)
      ? (r.evidence[0].explanation || r.evidence[0].snippet || `${r.evidence.length} evidence point(s) detected`)
      : ((typeof r.evidence === 'object' && r.evidence?.summary)
          ? r.evidence.summary
          : (typeof r.evidence === 'string' && r.evidence 
              ? r.evidence 
              : (r.status?.toLowerCase() === 'not_found' 
                  ? 'Zero implementation detected in AST.' 
                  : (r.status?.toLowerCase() === 'needs_review' 
                      ? 'Ambiguous or incomplete evidence detected.' 
                      : 'Waiting for AST parser extraction.')))),
  }));

  const activeReport = (p.latestReport && typeof p.latestReport === 'object') ? p.latestReport : null;
  const sourceAnalysis = p.sourceAnalysis || activeReport?.sourceAnalysis || null;
  const progressMetrics = activeReport?.progressMetrics || p.progressMetrics || null;

  const analysisStatus = (sourceAnalysis || p.status === 'completed' || activeReport?.status === 'completed')
    ? 'Completed' 
    : (p.extractionStatus === 'extracting' ? 'Extracting' : (p.status === 'analyzing' || activeReport?.status === 'analyzing' ? 'Analyzing' : 'Pending'));

  const completionPercentage = typeof p.overallProgress === 'number'
    ? p.overallProgress
    : (typeof progressMetrics?.progressPercentage === 'number'
        ? progressMetrics.progressPercentage
        : (p.progress?.overallProgress || 0));

  const progressStatus = p.progressStatus || progressMetrics?.calculationStatus || null;
  const verificationCoverage = typeof p.verificationCoverage === 'number'
    ? p.verificationCoverage
    : (typeof progressMetrics?.verificationCoverage === 'number' ? progressMetrics.verificationCoverage : 0);

  const detectedTechnologies = sourceAnalysis?.technologies 
    ? (Array.isArray(sourceAnalysis.technologies) 
        ? sourceAnalysis.technologies.map((t) => (typeof t === 'string' ? t : (t.name || t.rawName))) 
        : Object.values(sourceAnalysis.technologies).flat().map((t) => (typeof t === 'string' ? t : (t.name || t.rawName)))) 
    : (activeReport?.detectedTechnologies || []);

  const lastAnalysisDate = (sourceAnalysis || activeReport)
    ? (activeReport?.completedAt ? new Date(activeReport.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Completed')
    : 'Pending Analysis';

  return {
    id: projId,
    _id: projId,
    name: p.name,
    tagline: p.category || 'Custom Software Project',
    description: p.description || 'Uploaded software project specification.',
    category: p.category || 'Web Application',
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    declaredTechnologies: Array.isArray(p.technologies) ? p.technologies : [],
    detectedTechnologies,
    completionPercentage,
    overallProgress: completionPercentage,
    progressStatus,
    verificationCoverage,
    progressMetrics: progressMetrics ? {
      ...progressMetrics,
      progressPercentage: progressMetrics.progressPercentage ?? completionPercentage,
      verificationCoverage: progressMetrics.verificationCoverage ?? verificationCoverage,
      calculationStatus: progressMetrics.calculationStatus || progressStatus || 'PROVISIONAL',
    } : null,
    analysisStatus,
    status: completionPercentage >= 90 ? 'Completed' : (completionPercentage > 0 ? 'In Progress' : (analysisStatus === 'Completed' ? 'Needs Attention' : 'Pending Analysis')),
    statusColor: completionPercentage >= 90 ? 'emerald' : (completionPercentage > 0 ? 'purple' : (analysisStatus === 'Completed' ? 'rose' : 'amber')),
    lastUpdated: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now',
    updatedTimestamp: p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now(),
    lastAnalysisDate,
    repoBranch: 'main',
    zipFileName: p.originalZipName || p.zipFileName || null,
    originalZipName: p.originalZipName || null,
    zipFileSize: p.zipFileSize || null,
    extractedFileCount: p.extractedFileCount || null,
    extractedTotalSize: p.extractedTotalSize || null,
    extractionStatus: p.extractionStatus || 'pending',
    requirements: reqs,
    requirementsCount: reqs.length,
    totalRequirements: reqs.length,
    completedRequirements: reqs.filter((r) => r.status === 'Verified').length,
    partialRequirements: reqs.filter((r) => r.status === 'Partial').length,
    missingRequirements: reqs.filter((r) => r.status === 'Not Found').length,
    pendingRequirements: reqs.filter((r) => r.status === 'Pending' || r.status === 'Needs Review').length,
    developmentBreakdown: [],
    missingFeatures: [],
    recommendations: [],
    progressTrend: [
      { run: 'Uploaded', progress: 0, features: 0, target: reqs.length }
    ],
    analysisHistory: [],
    isSample: false,
    rawBackend: p,
  };
}

function loadLocalProjects() {
  try {
    const savedCustom = localStorage.getItem(CUSTOM_PROJECTS_KEY);
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p) => p.id));
        const filteredInitial = INITIAL_PROJECTS.filter((p) => !customIds.has(p.id));
        return [...parsed, ...filteredInitial];
      }
    }
  } catch (e) {
    console.warn('Failed reading custom projects from localStorage:', e);
  }
  return INITIAL_PROJECTS;
}

export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState(() => loadLocalProjects());
  const [loading, setLoading] = useState(false);

  // Synchronize projects with backend when authenticated
  const refreshProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await projectService.getProjects();
      const rawList = res?.data?.projects || res?.projects || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      if (Array.isArray(rawList)) {
        const mapped = rawList.map(mapBackendProject).filter(Boolean);
        const backendIds = new Set(mapped.map((p) => p.id));
        const nonCollidingSample = INITIAL_PROJECTS.filter((p) => !backendIds.has(p.id));
        setProjects([...mapped, ...nonCollidingSample]);
      }
    } catch (err) {
      console.warn('Failed fetching backend projects, keeping local state:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProjects();
    } else {
      setProjects(loadLocalProjects());
    }
  }, [isAuthenticated, refreshProjects]);

  // Persist only non-sample (custom) projects to localStorage for offline / unauthenticated mode
  const persistCustomProjects = (allProjects) => {
    try {
      const customOnly = allProjects.filter((p) => !p.isSample && !p._id);
      localStorage.setItem(CUSTOM_PROJECTS_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed persisting custom projects:', e);
    }
  };

  const getProjectById = (id) => {
    if (!id) return null;
    const normalized = id.toLowerCase().trim();
    const raw = projects.find(
      (p) => (p.id && p.id.toLowerCase() === normalized) ||
             (p._id && p._id.toString().toLowerCase() === normalized) ||
             (p.name && p.name.toLowerCase() === normalized)
    );
    return raw ? normalizeProjectObject(raw) : null;
  };

  const addProject = async (projectData) => {
    // If authenticated, persist to MongoDB backend
    if (isAuthenticated) {
      try {
        const created = await projectService.createProject({
          name: projectData.name,
          description: projectData.description,
          category: projectData.category,
          technologies: projectData.technologies || [],
        });

        const createdProject = created?.project || created?.data?.project || created?.data || created;
        const createdId = createdProject?._id || createdProject?.id;

        // If requirements exist, persist them
        if (Array.isArray(projectData.requirements) && projectData.requirements.length > 0 && createdId) {
          for (const req of projectData.requirements) {
            try {
              await projectService.addRequirement(createdId, {
                code: req.id || req.code || req.requirementCode,
                title: req.title,
                description: req.description,
                priority: (req.priority || 'medium').toLowerCase(),
                weight: Number(req.weight) || 10,
              });
            } catch (rErr) {
              console.warn('Failed saving requirement to project:', rErr);
            }
          }
        }

        await refreshProjects();
        return mapBackendProject(createdProject);
      } catch (err) {
        console.error('Error creating backend project, falling back to local:', err);
      }
    }

    // Fallback: local custom project
    const newId = `proj-custom-${Date.now()}`;
    const rawRequirements = projectData.requirements || [];

    const newRequirements = rawRequirements.map((req, idx) => ({
      ...req,
      id: req.id || `REQ-${String(idx + 1).padStart(3, '0')}`,
      title: req.title || `Requirement #${idx + 1}`,
      description: req.description || '',
      priority: req.priority || 'Medium',
      weight: Number(req.weight) || 10,
      status: req.status || 'Pending',
      evidence: req.evidence || 'Waiting for AST parser extraction.',
    }));

    const analysisStatus = projectData.analysisStatus || 'Pending';
    const metrics = calculateRequirementMetrics(newRequirements, analysisStatus);

    const declaredTech = projectData.declaredTechnologies || projectData.technologies || [];
    const detectedTech = projectData.detectedTechnologies || [];
    const activeTechList = detectedTech.length > 0 ? detectedTech : declaredTech;

    const newProject = {
      id: newId,
      name: projectData.name,
      tagline: projectData.category || 'Custom Software Project',
      description: projectData.description || 'Uploaded software project specification.',
      category: projectData.category || 'Web Application',
      technologies: activeTechList,
      declaredTechnologies: declaredTech,
      detectedTechnologies: detectedTech,
      zipFileName: projectData.zipFileName || null,
      zipFileSize: projectData.zipFileSize || null,
      totalFiles: projectData.totalFiles || null,
      requirementsSourceFile: projectData.requirementsSourceFile || null,
      completionPercentage: metrics.progressPercentage,
      analysisStatus,
      status: 'Pending Analysis',
      statusColor: 'amber',
      lastUpdated: 'Just now',
      updatedTimestamp: Date.now(),
      lastAnalysisDate: 'Pending Analysis',
      repoBranch: 'main',
      requirementsCount: metrics.total,
      requirements: newRequirements,
      totalRequirements: metrics.total,
      completedRequirements: metrics.verified,
      partialRequirements: metrics.partial,
      missingRequirements: metrics.missing,
      pendingRequirements: metrics.pending,
      developmentBreakdown: [],
      missingFeatures: [],
      recommendations: [],
      progressTrend: [
        { run: 'Uploaded', progress: 0, features: 0, target: metrics.total }
      ],
      analysisHistory: [],
      isSample: false,
    };

    setProjects((prev) => {
      const next = [newProject, ...prev];
      persistCustomProjects(next);
      return next;
    });

    return newProject;
  };

  const updateProject = async (id, updates) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isAuthenticated && isObjectId) {
      try {
        await projectService.updateProject(id, updates);
      } catch (err) {
        console.warn('Failed updating project on backend:', err);
      }
    }

    setProjects((prev) => {
      const next = prev.map((proj) => {
        if (proj.id !== id && proj._id !== id) return proj;

        const updated = { 
          ...proj, 
          ...updates, 
          lastUpdated: 'Just now', 
          updatedTimestamp: Date.now() 
        };

        if (updates.requirements) {
          const metrics = calculateRequirementMetrics(updates.requirements, updated.analysisStatus);
          updated.requirementsCount = metrics.total;
          updated.totalRequirements = metrics.total;
          updated.completedRequirements = metrics.verified;
          updated.partialRequirements = metrics.partial;
          updated.missingRequirements = metrics.missing;
          updated.pendingRequirements = metrics.pending;
          updated.completionPercentage = metrics.progressPercentage;

          if (updated.analysisStatus === 'Completed') {
            if (metrics.progressPercentage >= 90) {
              updated.status = 'Completed';
              updated.statusColor = 'emerald';
            } else if (metrics.progressPercentage === 0) {
              updated.status = 'Not Analyzed';
              updated.statusColor = 'slate';
            } else {
              updated.status = 'In Progress';
              updated.statusColor = 'purple';
            }
          }
        }

        return updated;
      });

      persistCustomProjects(next);
      return next;
    });
  };

  const deleteProject = async (id) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isAuthenticated && isObjectId) {
      try {
        await projectService.deleteProject(id);
      } catch (err) {
        console.warn('Failed deleting project on backend:', err);
      }
    }

    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id && p._id !== id);
      persistCustomProjects(next);
      return next;
    });
  };

  const toggleRequirementStatus = (projectId, requirementId) => {
    setProjects((prev) => {
      const next = prev.map((proj) => {
        if (proj.id !== projectId && proj._id !== projectId) return proj;

        const updatedRequirements = (proj.requirements || []).map((req) => {
          if (req.id !== requirementId && req._id !== requirementId) return req;
          
          let nextStatus;
          let nextEvidence;
          const current = (req.status || 'Pending').toLowerCase();

          if (current === 'pending' || current === 'not analyzed') {
            nextStatus = 'Verified';
            nextEvidence = 'Manually verified in requirements matrix.';
          } else if (current === 'verified') {
            nextStatus = 'Partial';
            nextEvidence = 'Partial implementation verified with remaining items.';
          } else if (current === 'partial') {
            nextStatus = 'Not Found';
            nextEvidence = 'AST check or manual audit confirms missing implementation.';
          } else {
            nextStatus = 'Pending';
            nextEvidence = 'Waiting for AST parser extraction.';
          }

          return {
            ...req,
            status: nextStatus,
            evidence: nextEvidence,
          };
        });

        const analysisStatus = 'Completed';
        const metrics = calculateRequirementMetrics(updatedRequirements, analysisStatus);

        return {
          ...proj,
          analysisStatus,
          requirements: updatedRequirements,
          requirementsCount: metrics.total,
          totalRequirements: metrics.total,
          completedRequirements: metrics.verified,
          partialRequirements: metrics.partial,
          missingRequirements: metrics.missing,
          pendingRequirements: metrics.pending,
          completionPercentage: metrics.progressPercentage,
          lastAnalysisDate: 'Evaluated Just Now',
          status: metrics.progressPercentage >= 90 ? 'Completed' : 'In Progress',
          statusColor: metrics.progressPercentage >= 90 ? 'emerald' : 'purple',
          lastUpdated: 'Just now',
          updatedTimestamp: Date.now(),
        };
      });

      persistCustomProjects(next);
      return next;
    });
  };

  const resetProjects = () => {
    setProjects(INITIAL_PROJECTS);
    try {
      localStorage.removeItem(CUSTOM_PROJECTS_KEY);
    } catch (e) {
      console.error('Failed clearing custom projects:', e);
    }
  };

  const projectStats = useMemo(() => calculateProjectStats(projects), [projects]);
  const dashboardStats = useMemo(() => calculateDashboardStats(projects, SAMPLE_REPORTS), [projects]);

  return (
    <ProjectContext.Provider value={{
      projects,
      loading,
      refreshProjects,
      getProjectById,
      addProject,
      updateProject,
      deleteProject,
      toggleRequirementStatus,
      resetProjects,
      projectStats,
      dashboardStats,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
