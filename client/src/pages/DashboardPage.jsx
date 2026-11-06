import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { FolderKanban, Plus, Sparkles, Activity, CheckCircle2, Clock, UploadCloud, Layers } from 'lucide-react';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import ProgressChart from '../components/ProgressChart';
import AnalysisBreakdown from '../components/AnalysisBreakdown';
import AIInsights from '../components/AIInsights';
import RecentProjects from '../components/RecentProjects';

import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';
import { 
  WEEKLY_PROGRESS_DATA, 
  ANALYSIS_BREAKDOWN, 
  AI_INSIGHTS 
} from '../data/sampleData';

export default function DashboardPage({ 
  searchQuery: propSearchQuery, 
  onViewProjectDetails, 
  onReanalyseProject 
}) {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { projects, dashboardStats: fallbackStats } = useProjects();
  const { isAuthenticated, user } = useAuth();

  const [backendStats, setBackendStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const searchQuery = propSearchQuery !== undefined 
    ? propSearchQuery 
    : (outletContext.searchQuery || '');

  // Fetch real aggregated dashboard statistics from backend
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      setLoadingStats(true);
      try {
        const stats = await projectService.getDashboardStats();
        if (isMounted && stats) {
          setBackendStats(stats);
        }
      } catch (err) {
        console.warn('Could not fetch backend dashboard stats, using contextual calculations:', err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, projects.length]);

  const featuredProject = projects[0] || null;

  const handleViewProject = (project) => {
    if (project?.id || project?._id) {
      navigate(`/projects/${project.id || project._id}`);
    } else if (onViewProjectDetails) {
      onViewProjectDetails(project);
    }
  };

  const handleReanalyse = (project) => {
    if (outletContext.handleOpenReanalyse) {
      outletContext.handleOpenReanalyse(project);
    } else if (onReanalyseProject) {
      onReanalyseProject(project);
    }
  };

  // Build live or fallback StatCards
  const statsCards = backendStats ? [
    {
      id: 'stat-total-projects',
      title: 'Total Projects',
      value: backendStats.totalProjects,
      description: 'Active source codebases',
      change: `${backendStats.totalProjects} Active`,
      changeType: 'positive',
      iconName: 'FolderKanban',
    },
    {
      id: 'stat-completed-projects',
      title: 'Completed',
      value: backendStats.completedProjects,
      description: 'Fully verified milestones',
      change: `${backendStats.totalProjects > 0 ? Math.round((backendStats.completedProjects / backendStats.totalProjects) * 100) : 0}%`,
      changeType: 'positive',
      iconName: 'CheckCircle2',
    },
    {
      id: 'stat-in-progress',
      title: 'In Progress',
      value: Math.max(0, backendStats.totalProjects - backendStats.completedProjects),
      description: 'Under active AST analysis',
      change: 'Active Pipeline',
      changeType: 'neutral',
      iconName: 'Clock',
    },
    {
      id: 'stat-overall-progress',
      title: 'Average Progress',
      value: `${backendStats.averageProgress}%`,
      description: 'Deterministic weighted average',
      change: `${backendStats.verificationBreakdown?.verified || 0} Verified`,
      changeType: 'positive',
      iconName: 'Activity',
    },
  ] : fallbackStats;

  // Build live or fallback ProgressChart data
  const chartData = (backendStats && Array.isArray(backendStats.progressTrend) && backendStats.progressTrend.length > 0)
    ? backendStats.progressTrend.map((pt, idx) => ({
        day: pt.date || `Milestone ${idx + 1}`,
        completion: pt.progress,
        target: 100,
      }))
    : WEEKLY_PROGRESS_DATA;

  // Build live or fallback AnalysisBreakdown items
  const breakdownItems = backendStats?.verificationBreakdown ? [
    {
      id: 'frontend',
      category: 'Verified Requirements',
      statusText: `${backendStats.verificationBreakdown.verified} fully verified with AST evidence`,
      percentage: backendStats.verificationBreakdown.totalRequirements > 0
        ? Math.round((backendStats.verificationBreakdown.verified / backendStats.verificationBreakdown.totalRequirements) * 100)
        : 0,
      grade: backendStats.verificationBreakdown.verified > 0 ? 'A' : 'P',
    },
    {
      id: 'backend',
      category: 'Partial Implementations',
      statusText: `${backendStats.verificationBreakdown.partial} partial matches requiring additional routes`,
      percentage: backendStats.verificationBreakdown.totalRequirements > 0
        ? Math.round((backendStats.verificationBreakdown.partial / backendStats.verificationBreakdown.totalRequirements) * 100)
        : 0,
      grade: 'B',
    },
    {
      id: 'database',
      category: 'Pending Requirements',
      statusText: `${backendStats.verificationBreakdown.pending} pending static code analysis`,
      percentage: backendStats.verificationBreakdown.totalRequirements > 0
        ? Math.round((backendStats.verificationBreakdown.pending / backendStats.verificationBreakdown.totalRequirements) * 100)
        : 0,
      grade: 'C',
    },
    {
      id: 'authentication',
      category: 'Needs Review',
      statusText: `${backendStats.verificationBreakdown.needsReview} ambiguous evidence requiring manual review`,
      percentage: backendStats.verificationBreakdown.totalRequirements > 0
        ? Math.round((backendStats.verificationBreakdown.needsReview / backendStats.verificationBreakdown.totalRequirements) * 100)
        : 0,
      grade: 'D',
    },
    {
      id: 'testing-deployment',
      category: 'Missing Implementation Gaps',
      statusText: `${backendStats.verificationBreakdown.notFound} not found in extracted source code`,
      percentage: backendStats.verificationBreakdown.totalRequirements > 0
        ? Math.round((backendStats.verificationBreakdown.notFound / backendStats.verificationBreakdown.totalRequirements) * 100)
        : 0,
      grade: 'F',
    },
  ] : ANALYSIS_BREAKDOWN;

  // Build live or fallback AI insights
  const liveInsights = (backendStats && Array.isArray(backendStats.latestInsights) && backendStats.latestInsights.length > 0)
    ? {
        missingFeatures: backendStats.latestInsights.map((ins, idx) => ({
          id: `gap-${idx}`,
          title: ins.title,
          impact: ins.priority ? (ins.priority.charAt(0).toUpperCase() + ins.priority.slice(1)) : 'High',
          description: ins.description,
          recommendation: 'Review implementation gaps against expected requirements checklist.',
        })),
        keyInsights: backendStats.latestInsights.map((ins, idx) => ({
          id: `key-${idx}`,
          title: ins.title,
          description: ins.description,
          badge: ins.priority || 'Advisory',
          type: ins.priority === 'critical' ? 'critical' : 'warning',
        })),
        recommendedAction: backendStats.latestInsights[0] ? {
          title: backendStats.latestInsights[0].title,
          description: backendStats.latestInsights[0].description,
          buttonText: 'Inspect Report',
        } : null,
      }
    : AI_INSIGHTS;

  // Clean empty state when authenticated user has no projects
  const hasZeroProjects = isAuthenticated && projects.length === 0 && (!backendStats || backendStats.totalProjects === 0);

  if (hasZeroProjects) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 py-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl p-8 border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5C400]/15 border border-[#F5C400]/40 text-[#171717] text-xs font-semibold">
              <Sparkles size={14} className="text-[#F5C400]" />
              <span>Welcome to ProjectPulse AI, {user?.name || 'Developer'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Start by uploading your first software project
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] max-w-xl">
              Upload a source code ZIP archive to perform static Babel AST analysis, verify software requirements, detect technology stacks, and calculate deterministic progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-2.5 active:scale-95 shrink-0"
          >
            <UploadCloud size={18} />
            <span>Upload New Project</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] w-fit">
              <Layers size={22} className="text-[#F5C400]" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">Static AST Source Code Analysis</h3>
            <p className="text-xs text-[#777777] leading-relaxed">
              Parse Babel and TypeScript abstract syntax trees statically without executing untrusted user code.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] w-fit">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">Evidence-Based Verification</h3>
            <p className="text-xs text-[#777777] leading-relaxed">
              Match project requirements against verified controllers, schemas, route handlers, and UI components.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-3">
            <div className="p-3 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] w-fit">
              <Activity size={22} className="text-[#F28C28]" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">Deterministic Velocity &amp; Progress</h3>
            <p className="text-xs text-[#777777] leading-relaxed">
              Mathematical progress tracking computed directly from verified weighted requirement evidence.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Statistics Cards Row - Dynamically calculated from live backend or shared state */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statsCards.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      {/* 2. Middle Row: Featured Project Overview & Recharts Progress Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          {featuredProject ? (
            <ProjectCard
              project={featuredProject}
              onViewDetails={() => handleViewProject(featuredProject)}
              onReanalyse={() => handleReanalyse(featuredProject)}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#EAEAEA] shadow-sm flex flex-col items-center justify-center h-full">
              <FolderKanban size={36} className="text-[#777777] mb-2" />
              <p className="text-xs text-[#777777]">No project selected.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <ProgressChart data={chartData} />
        </div>
      </section>

      {/* 3. Detailed Component Analysis Breakdown & AI Insights Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <AnalysisBreakdown items={breakdownItems} />
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <AIInsights 
            insights={liveInsights} 
            onRunAction={() => handleReanalyse(featuredProject)}
          />
        </div>
      </section>

      {/* 4. Recent Projects Repository Table */}
      <section>
        <RecentProjects
          projects={projects.slice(0, 5)}
          searchQuery={searchQuery}
          onViewProject={handleViewProject}
        />
      </section>
    </div>
  );
}
