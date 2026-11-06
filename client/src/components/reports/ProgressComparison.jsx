import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ListChecks, 
  Calendar,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function ProgressComparison({
  reports = [],
  selectedForCompare = [],
  onClearCompare,
}) {
  // Find projects that have at least 2 reports to compare
  const projectsWithMultipleReports = useMemo(() => {
    const counts = {};
    reports.forEach((r) => {
      counts[r.projectId] = (counts[r.projectId] || 0) + 1;
    });
    const eligibleProjectIds = Object.keys(counts).filter((pId) => counts[pId] >= 2);
    return eligibleProjectIds.map((pId) => {
      const rep = reports.find((r) => r.projectId === pId);
      return { id: pId, name: rep?.projectName || pId };
    });
  }, [reports]);

  // Default project selection: if user selected 2 items via checkbox from same project, use that; otherwise pick first eligible project
  const initialProjectId = useMemo(() => {
    if (
      selectedForCompare.length === 2 &&
      selectedForCompare[0].projectId === selectedForCompare[1].projectId
    ) {
      return selectedForCompare[0].projectId;
    }
    return projectsWithMultipleReports[0]?.id || 'proj-food-quality';
  }, [selectedForCompare, projectsWithMultipleReports]);

  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);

  // Available reports for the active project, sorted chronologically
  const projectReports = useMemo(() => {
    return reports
      .filter((r) => r.projectId === activeProjectId)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [reports, activeProjectId]);

  // Choose Report A (earlier) and Report B (later)
  const [reportAId, setReportAId] = useState(() => {
    return projectReports[0]?.id || '';
  });
  const [reportBId, setReportBId] = useState(() => {
    return projectReports[projectReports.length - 1]?.id || '';
  });

  // Keep report IDs in sync if project changes
  React.useEffect(() => {
    if (projectReports.length >= 2) {
      setReportAId(projectReports[0].id);
      setReportBId(projectReports[projectReports.length - 1].id);
    } else if (projectReports.length === 1) {
      setReportAId(projectReports[0].id);
      setReportBId(projectReports[0].id);
    }
  }, [projectReports]);

  const reportA = projectReports.find((r) => r.id === reportAId) || projectReports[0];
  const reportB = projectReports.find((r) => r.id === reportBId) || projectReports[projectReports.length - 1];

  // Mathematical percentage-point difference
  const progressA = reportA?.currentProgress || 0;
  const progressB = reportB?.currentProgress || 0;
  const percentagePointDifference = progressB - progressA;

  // Recharts bar comparison dataset
  const chartData = [
    {
      metric: 'Milestone Completion',
      [reportA?.id || 'Report A']: progressA,
      [reportB?.id || 'Report B']: progressB,
    },
    {
      metric: 'Verified Specs',
      [reportA?.id || 'Report A']: reportA?.requirementsBreakdown?.verified || 0,
      [reportB?.id || 'Report B']: reportB?.requirementsBreakdown?.verified || 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <GitCompare size={18} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Progress &amp; Requirement Gap Comparison
            </h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Compare actual metrics between two verified inspection cycles of the same project
            </p>
          </div>
        </div>

        {/* Project Selector for Comparison */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#777777]">Target Project:</span>
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-1.5 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] cursor-pointer"
          >
            {projectsWithMultipleReports.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-[#171717]">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selectors for Report A and Report B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Baseline Report A */}
        <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
            Baseline Run (Scan A)
          </span>
          <select
            value={reportAId}
            onChange={(e) => setReportAId(e.target.value)}
            className="w-full bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400]"
          >
            {projectReports.map((r) => (
              <option key={r.id} value={r.id} className="bg-white text-[#171717]">
                {r.id} &bull; {r.analysisDate} ({r.currentProgress}%)
              </option>
            ))}
          </select>
          {reportA && (
            <div className="text-[11px] text-[#777777] flex justify-between pt-1 font-mono">
              <span>Verified: {reportA.requirementsBreakdown?.verified || 0} reqs</span>
              <span>Gaps: {reportA.missingFeaturesCount}</span>
            </div>
          )}
        </div>

        {/* Comparison Report B */}
        <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#171717] block">
            Successive Run (Scan B)
          </span>
          <select
            value={reportBId}
            onChange={(e) => setReportBId(e.target.value)}
            className="w-full bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400]"
          >
            {projectReports.map((r) => (
              <option key={r.id} value={r.id} className="bg-white text-[#171717]">
                {r.id} &bull; {r.analysisDate} ({r.currentProgress}%)
              </option>
            ))}
          </select>
          {reportB && (
            <div className="text-[11px] text-[#777777] flex justify-between pt-1 font-mono">
              <span>Verified: {reportB.requirementsBreakdown?.verified || 0} reqs</span>
              <span>Gaps: {reportB.missingFeaturesCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Numerical Delta Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F5] border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
            Net Progress Trajectory Delta
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-3xl font-extrabold text-[#777777]">
              {progressA}%
            </span>
            <ArrowRight size={18} className="text-[#171717]" />
            <span className="font-mono text-3xl font-extrabold text-[#171717]">
              {progressB}%
            </span>
            <span
              className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded-full ${
                percentagePointDifference >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {percentagePointDifference >= 0 ? `+${percentagePointDifference}` : percentagePointDifference} percentage points
            </span>
          </div>
        </div>

        <div className="text-xs text-[#777777] border-t sm:border-t-0 sm:border-l border-[#EAEAEA] pt-2 sm:pt-0 sm:pl-5 space-y-1">
          <div>Audited Project: <strong className="text-[#171717]">{reportB?.projectName}</strong></div>
          <div>Specification Count: <strong className="text-[#171717] font-mono">{reportB?.requirementsChecked} features</strong></div>
        </div>
      </div>

      {/* Visual Progress Comparison Tracks */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#777777] font-mono">
              {reportA?.id} ({reportA?.analysisDate})
            </span>
            <span className="font-mono font-bold text-[#777777]">{progressA}%</span>
          </div>
          <div className="w-full bg-[#EAEAEA] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#777777] transition-all duration-700"
              style={{ width: `${progressA}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#171717] font-mono font-semibold">
              {reportB?.id} ({reportB?.analysisDate})
            </span>
            <span className="font-mono font-bold text-[#171717]">{progressB}%</span>
          </div>
          <div className="w-full bg-[#EAEAEA] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F5C400] transition-all duration-700"
              style={{ width: `${progressB}%` }}
            />
          </div>
        </div>
      </div>

      {/* Newly Completed Requirements vs Remaining Missing Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Newly Completed Requirements */}
        <div className="p-4 rounded-xl bg-[#F7F7F5] border border-emerald-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 size={15} />
            <span>Newly Completed Specifications ({reportB?.newlyCompletedRequirements?.length || 0})</span>
          </div>

          {reportB?.newlyCompletedRequirements && reportB.newlyCompletedRequirements.length > 0 ? (
            <ul className="space-y-2">
              {reportB.newlyCompletedRequirements.map((req, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-white border border-[#EAEAEA] text-[#171717] text-[11px] flex items-start gap-2 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-[#777777] italic">
              No new requirements verified between these two selected cycles.
            </p>
          )}
        </div>

        {/* Remaining Missing Requirements */}
        <div className="p-4 rounded-xl bg-[#F7F7F5] border border-red-200 space-y-3">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wide">
            <AlertCircle size={15} />
            <span>Remaining Missing Requirements ({reportB?.remainingMissingRequirements?.length || 0})</span>
          </div>

          {reportB?.remainingMissingRequirements && reportB.remainingMissingRequirements.length > 0 ? (
            <ul className="space-y-2">
              {reportB.remainingMissingRequirements.map((req, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-white border border-[#EAEAEA] text-[#171717] text-[11px] flex items-start gap-2 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-emerald-600 font-medium">
              Zero missing requirements detected in this scan!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
