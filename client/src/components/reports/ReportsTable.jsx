import React from 'react';
import { 
  FileText, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  GitCompare
} from 'lucide-react';

export default function ReportsTable({
  reports = [],
  onViewReport,
  selectedForCompare = [],
  onToggleCompare,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Needs Attention':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-[#F7F7F5] text-[#777777] border-[#EAEAEA]';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-amber-500';
      case 'Needs Attention':
        return 'bg-red-500';
      default:
        return 'bg-[#777777]';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm overflow-hidden animate-in fade-in duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EAEAEA] text-[11px] font-semibold text-[#777777] uppercase tracking-wider bg-[#F7F7F5]">
              <th className="py-3.5 px-4 w-12 text-center">Compare</th>
              <th className="py-3.5 px-3">Report ID</th>
              <th className="py-3.5 px-4">Project</th>
              <th className="py-3.5 px-3">Date</th>
              <th className="py-3.5 px-3 text-center">Previous</th>
              <th className="py-3.5 px-3 text-center">Current</th>
              <th className="py-3.5 px-3 text-center">Change</th>
              <th className="py-3.5 px-3 hidden lg:table-cell text-center">Audited</th>
              <th className="py-3.5 px-3 hidden md:table-cell text-center">Gaps</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEAEA]">
            {reports.map((report) => {
              const isChecked = selectedForCompare.some((r) => r.id === report.id);
              const change = report.progressChange || 0;

              return (
                <tr
                  key={report.id}
                  className={`hover:bg-[#F7F7F5] transition-colors group ${
                    isChecked ? 'bg-amber-50/50' : ''
                  }`}
                >
                  {/* Compare Selection Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCompare && onToggleCompare(report)}
                      className="rounded border-[#EAEAEA] text-[#080808] focus:ring-[#F5C400] bg-white cursor-pointer"
                      title="Select for comparison (up to 2 belonging to same project)"
                    />
                  </td>

                  {/* Report ID */}
                  <td className="py-3.5 px-3 font-mono font-bold text-[#171717] text-[11px] whitespace-nowrap">
                    {report.id}
                  </td>

                  {/* Project Name & Category */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-[#171717] group-hover:text-[#F28C28] transition-colors text-xs truncate">
                      {report.projectName}
                    </div>
                    <div className="text-[10px] text-[#777777] mt-0.5">
                      {report.category}
                    </div>
                  </td>

                  {/* Analysis Date */}
                  <td className="py-3.5 px-3 text-[#777777] whitespace-nowrap text-[11px]">
                    {report.analysisDate}
                  </td>

                  {/* Previous Progress */}
                  <td className="py-3.5 px-3 text-center font-mono text-[#777777] text-[11px]">
                    {report.previousProgress}%
                  </td>

                  {/* Current Progress */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-[#171717] text-[11px]">
                    {report.currentProgress}%
                  </td>

                  {/* Progress Change */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono font-bold text-[11px] ${
                        change > 0
                          ? 'text-emerald-600'
                          : change < 0
                          ? 'text-red-500'
                          : 'text-[#777777]'
                      }`}
                    >
                      {change > 0 && <TrendingUp size={11} />}
                      {change < 0 && <TrendingDown size={11} />}
                      {change === 0 && <Minus size={11} />}
                      <span>{change > 0 ? `+${change}%` : `${change}%`}</span>
                    </span>
                  </td>

                  {/* Requirements Checked */}
                  <td className="py-3.5 px-3 hidden lg:table-cell text-center font-mono text-[#777777] text-[11px]">
                    {report.requirementsChecked} reqs
                  </td>

                  {/* Missing Features Count */}
                  <td className="py-3.5 px-3 hidden md:table-cell text-center font-mono text-[11px]">
                    <span className={report.missingFeaturesCount > 0 ? 'text-amber-600' : 'text-emerald-600 font-semibold'}>
                      {report.missingFeaturesCount}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${getStatusBadge(report.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(report.status)}`} />
                      {report.status}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewReport(report)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#171717] bg-[#F7F7F5] hover:bg-[#080808] hover:text-white border border-[#EAEAEA] transition-all inline-flex items-center gap-1 active:scale-95 shadow-sm"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
