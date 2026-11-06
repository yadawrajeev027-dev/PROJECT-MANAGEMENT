import React from 'react';
import { 
  FolderKanban, 
  FileCheck2, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { SAMPLE_REPORTS } from '../../data/centralData';
import { useProjects } from '../../context/ProjectContext';

export default function ActivitySummary({ onNavigateToProject, onNavigateToReport }) {
  const { projects, projectStats } = useProjects();
  const totalReports = SAMPLE_REPORTS.length;
  const totalProjectsCount = projects.length;
  const completedCount = projectStats.completed;

  const activities = [
    {
      id: 'act-1',
      type: 'analysis',
      title: 'Full AST Code Analysis Run',
      project: 'Food Quality Prediction',
      projectId: 'proj-food-quality',
      date: 'Nov 4, 2026 • 14:32 IST',
      badge: '+12% Progress',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'AST scan verified Scikit-Learn inference pipeline, Pydantic telemetry models, and FastAPI routes.',
      reportId: 'REP-2026-104'
    },
    {
      id: 'act-2',
      type: 'upload',
      title: 'New Project Repository Uploaded',
      project: 'Hostel Management System',
      projectId: 'proj-hostel-mgmt',
      date: 'Nov 2, 2026 • 10:15 IST',
      badge: '30 Requirements',
      badgeColor: 'text-[#171717] bg-white border-[#EAEAEA]',
      description: 'ZIP bundle (24.8 MB) unpacked. Extracted Express routes, JWT auth modules, and room booking schemas.',
    },
    {
      id: 'act-3',
      type: 'export',
      title: 'Formal Analysis Audit Exported',
      project: 'HumanizaAI',
      projectId: 'proj-humaniza-ai',
      date: 'Nov 3, 2026 • 16:10 IST',
      badge: '92% Completed',
      badgeColor: 'text-[#171717] bg-white border-[#EAEAEA]',
      description: 'Downloaded compliance report with AST code evidence snippets and requirement verification table.',
      reportId: 'REP-2026-203'
    },
    {
      id: 'act-4',
      type: 'analysis',
      title: 'Project Architecture Verified',
      project: 'ProjectPulse AI',
      projectId: 'proj-projectpulse-ai',
      date: 'Nov 5, 2026 • 11:30 IST',
      badge: '85% Complete',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Dashboard, Upload, Projects, Details, Reports, Profile, and Settings verified with React Router.',
      reportId: 'REP-2026-402'
    },
    {
      id: 'act-5',
      type: 'analysis',
      title: 'Initial Registration Logged',
      project: 'Smart Energy Grid Monitor',
      projectId: 'proj-smart-energy',
      date: 'Oct 28, 2026 • 09:20 IST',
      badge: 'Initial Baseline',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      description: 'Substation MQTT telemetry pipeline registered. Awaiting initial source ZIP archive.',
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Activity KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Total Projects</span>
            <div className="p-2 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717]">
              <FolderKanban size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#171717]">{totalProjectsCount}</div>
          <p className="text-[10px] text-[#777777] mt-1 flex items-center gap-1">
            <span className="text-[#171717] font-medium">{projects.filter(p => !p.isSample).length} custom</span> created
          </p>
        </div>

        {/* Total Reports */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Total Reports</span>
            <div className="p-2 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717]">
              <FileCheck2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#171717]">{totalReports}</div>
          <p className="text-[10px] text-[#777777] mt-1 flex items-center gap-1">
            <span className="text-[#171717] font-medium">Historical audit</span> records
          </p>
        </div>

        {/* Completed Projects */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#171717]">{completedCount}</div>
          <p className="text-[10px] text-[#777777] mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-medium">
              {totalProjectsCount > 0 ? ((completedCount / totalProjectsCount) * 100).toFixed(0) : 0}%
            </span> portfolio completion
          </p>
        </div>

        {/* Average Progress / Velocity */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Avg Completion</span>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#171717]">
            {totalProjectsCount > 0 
              ? Math.round(projects.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) / totalProjectsCount)
              : 0}%
          </div>
          <p className="text-[10px] text-[#777777] mt-1 flex items-center gap-1">
            <span className="text-[#171717] font-medium">Across active</span> repositories
          </p>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA] mb-6">
          <div>
            <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
              <Clock size={18} className="text-[#171717]" />
              <span>Recent Activity &amp; Audit Trail</span>
            </h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Chronological log of analyses, repository uploads, and evaluation reports
            </p>
          </div>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#EAEAEA]">
          {activities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#080808] transition-colors" />

              <div className="bg-[#F7F7F5] hover:bg-white border border-[#EAEAEA] rounded-xl p-4 transition-all shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#171717] group-hover:text-[#F28C28] transition-colors">
                      {act.title}
                    </span>
                    <span className="text-xs text-[#777777] font-medium">
                      • {act.project}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${act.badgeColor}`}>
                      {act.badge}
                    </span>
                    <span className="text-[11px] text-[#777777]">
                      {act.date}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#171717] leading-relaxed mb-3">
                  {act.description}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  {act.reportId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToReport && onNavigateToReport(act.reportId)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#171717] hover:text-[#F28C28] transition-colors"
                    >
                      <span>View Report {act.reportId}</span>
                      <ArrowUpRight size={12} />
                    </button>
                  )}

                  {act.projectId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToProject && onNavigateToProject(act.projectId)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#171717] hover:text-[#F28C28] transition-colors"
                    >
                      <span>Open Project Details</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
