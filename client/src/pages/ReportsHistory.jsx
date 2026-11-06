import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Calendar, 
  Layers, 
  ArrowUpDown, 
  GitCompare, 
  Download,
  FolderOpen
} from 'lucide-react';

import ReportStats from '../components/reports/ReportStats';
import ReportFilters from '../components/reports/ReportFilters';
import ReportsTable from '../components/reports/ReportsTable';
import ProgressComparison from '../components/reports/ProgressComparison';
import ReportDetail from '../components/reports/ReportDetail';

import { SAMPLE_REPORTS } from '../data/reportsData';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import analysisService from '../services/analysisService';

function normalizeReport(rep) {
  if (!rep) return null;
  return {
    ...rep,
    id: rep.id || rep._id || rep.reportId,
    _id: rep._id || rep.id,
    projectId: rep.projectId || (rep.project?._id ? rep.project._id.toString() : (rep.project?.toString() || '')),
    projectName: rep.projectName || rep.project?.name || 'Project Analysis',
    analysisDate: rep.reportDate || (rep.createdAt ? new Date(rep.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'),
    currentProgress: typeof rep.progressPercentage === 'number'
      ? rep.progressPercentage
      : (rep.currentProgress || 0),
    progressChange: typeof rep.progressDelta === 'number'
      ? rep.progressDelta
      : (rep.progressChange || 0),
    summary: rep.aiExecutiveSummary || rep.summary || 'Static code analysis and requirement verification report.',
    requirementsBreakdown: rep.requirementsBreakdown || {
      verified: rep.verifiedCount ?? 0,
      partial: rep.partialCount ?? 0,
      notFound: rep.notFoundCount ?? 0,
    },
    status: rep.status || 'Completed',
    totalFiles: rep.totalFiles || rep.sourceAnalysis?.totalFiles || 0,
    linesOfCode: rep.linesOfCode || rep.sourceAnalysis?.linesOfCode || 0,
  };
}

export default function ReportsHistory({
  onViewProjectDetails,
}) {
  const { id: routeReportId } = useParams();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { isAuthenticated } = useAuth();

  const [reports, setReports] = useState(() => SAMPLE_REPORTS.map(normalizeReport));
  const [loadingReports, setLoadingReports] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Selected for Comparison State (Array of up to 2 reports from same project)
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareWarning, setCompareWarning] = useState(null);

  // Active Report Details Modal
  const [activeReportForDetail, setActiveReportForDetail] = useState(null);

  // Fetch real reports from backend if authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      if (!isAuthenticated) return;
      setLoadingReports(true);
      try {
        const res = await analysisService.getReports();
        if (isMounted) {
          if (Array.isArray(res) && res.length > 0) {
            setReports(res.map(normalizeReport));
          } else if (Array.isArray(res)) {
            // User has 0 reports
            setReports([]);
          }
        }
      } catch (err) {
        console.warn('Could not fetch backend reports, keeping local reports:', err);
      } finally {
        if (isMounted) setLoadingReports(false);
      }
    };

    fetchReports();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Automatically open report detail if route param /reports/:id is present
  useEffect(() => {
    if (routeReportId) {
      const target = reports.find(
        (r) => (r.id && r.id.toLowerCase() === routeReportId.toLowerCase()) ||
               (r._id && r._id.toLowerCase() === routeReportId.toLowerCase())
      );
      if (target) {
        setActiveReportForDetail(target);
      }
    }
  }, [routeReportId, reports]);

  // Unique Projects list for dropdown filter
  const availableProjects = useMemo(() => {
    const map = new Map();
    // First include projects from reports
    reports.forEach((r) => {
      if (r.projectId && !map.has(r.projectId)) {
        map.set(r.projectId, { id: r.projectId, name: r.projectName });
      }
    });
    // Also include any workspace projects
    projects.forEach((p) => {
      const pId = p.id || p._id;
      if (pId && !map.has(pId)) {
        map.set(pId, { id: pId, name: p.name });
      }
    });
    return Array.from(map.values());
  }, [reports, projects]);

  // Filtering and Sorting Pipeline
  const filteredReports = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    return reports
      .filter((report) => {
        // 1. Search filter: by project name or report ID
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (report.id && report.id.toLowerCase().includes(q)) ||
          (report.projectName && report.projectName.toLowerCase().includes(q)) ||
          (report.summary && report.summary.toLowerCase().includes(q));

        // 2. Project filter
        const matchesProject =
          projectFilter === 'ALL' || report.projectId === projectFilter;

        // 3. Status filter
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'COMPLETED' && report.status === 'Completed') ||
          (statusFilter === 'IN_PROGRESS' && report.status === 'In Progress') ||
          (statusFilter === 'FLAGGED' && (report.status === 'Needs Review' || report.status === 'Failed'));

        // 4. Date filter
        let matchesDate = true;
        const reportTime = report.createdAt ? new Date(report.createdAt).getTime() : now;
        if (dateFilter === '7D') {
          matchesDate = now - reportTime <= sevenDaysMs;
        } else if (dateFilter === '30D') {
          matchesDate = now - reportTime <= thirtyDaysMs;
        } else if (dateFilter === '90D') {
          matchesDate = now - reportTime <= ninetyDaysMs;
        }

        return matchesSearch && matchesProject && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp || 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp || 0);
        switch (sortBy) {
          case 'newest':
            return timeB - timeA;
          case 'oldest':
            return timeA - timeB;
          case 'highest-progress':
            return (b.currentProgress || 0) - (a.currentProgress || 0);
          case 'lowest-progress':
            return (a.currentProgress || 0) - (b.currentProgress || 0);
          default:
            return 0;
        }
      });
  }, [reports, searchQuery, projectFilter, dateFilter, statusFilter, sortBy]);

  // Comparison Handlers (enforces same project comparison limit to 2)
  const handleToggleCompare = (report) => {
    setCompareWarning(null);

    const isAlreadySelected = selectedForCompare.some((r) => r.id === report.id);

    if (isAlreadySelected) {
      setSelectedForCompare(selectedForCompare.filter((r) => r.id !== report.id));
      return;
    }

    if (selectedForCompare.length === 0) {
      setSelectedForCompare([report]);
      return;
    }

    if (selectedForCompare.length === 1) {
      const first = selectedForCompare[0];
      if (first.projectId !== report.projectId) {
        setCompareWarning(
          `Comparison is restricted to reports from the same project (${first.projectName}).`
        );
        setTimeout(() => setCompareWarning(null), 4000);
        return;
      }
      setSelectedForCompare([first, report]);
      return;
    }

    if (selectedForCompare.length >= 2) {
      setCompareWarning('You can only compare 2 reports at once. Deselect one first.');
      setTimeout(() => setCompareWarning(null), 4000);
    }
  };

  const handleClearCompare = () => {
    setSelectedForCompare([]);
    setCompareWarning(null);
  };

  const handleViewProject = (projectId) => {
    if (onViewProjectDetails) {
      const proj = projects.find((p) => (p.id === projectId || p._id === projectId));
      if (proj) onViewProjectDetails(proj);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Reports History
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              AST &amp; LLM Audits
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            View historical codebase analysis reports, requirement delta trends, and export audit manifests.
          </p>
        </div>

        {selectedForCompare.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-300 font-semibold bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
              {selectedForCompare.length} Selected for Delta View
            </span>
            <button
              type="button"
              onClick={handleClearCompare}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Comparison Warning Toast */}
      {compareWarning && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 text-amber-400" />
          <span>{compareWarning}</span>
        </div>
      )}

      {/* 2. Summary KPI Metrics */}
      <section>
        <ReportStats reports={reports} />
      </section>

      {/* 3. Side-by-Side Comparison Modal / Box */}
      {selectedForCompare.length === 2 && (
        <section>
          <ProgressComparison
            reportA={selectedForCompare[0]}
            reportB={selectedForCompare[1]}
            onClose={handleClearCompare}
          />
        </section>
      )}

      {/* 4. Filtering, Search & Sorting Controls */}
      <section>
        <ReportFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          availableProjects={availableProjects}
          totalResults={filteredReports.length}
        />
      </section>

      {/* 5. Responsive Reports Table or Empty State */}
      <section>
        {filteredReports.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-navy-750 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-navy-800 text-purple-400 border border-navy-750 flex items-center justify-center mx-auto">
              <FolderOpen size={24} />
            </div>
            <h3 className="text-base font-bold text-white">No Analysis Reports Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {reports.length === 0
                ? 'Run static source code analysis or requirement verification on a project to generate your first audit report.'
                : 'No reports match your current search and filter criteria.'}
            </p>
          </div>
        ) : (
          <ReportsTable
            reports={filteredReports}
            selectedForCompare={selectedForCompare}
            onToggleCompare={handleToggleCompare}
            onViewReport={(rep) => setActiveReportForDetail(rep)}
            onViewProject={handleViewProject}
          />
        )}
      </section>

      {/* 6. Active Report Detailed Inspection Drawer / Modal */}
      <ReportDetail
        report={activeReportForDetail}
        isOpen={Boolean(activeReportForDetail)}
        onClose={() => {
          setActiveReportForDetail(null);
          if (routeReportId) {
            navigate('/reports');
          }
        }}
        onViewProject={handleViewProject}
      />
    </div>
  );
}
