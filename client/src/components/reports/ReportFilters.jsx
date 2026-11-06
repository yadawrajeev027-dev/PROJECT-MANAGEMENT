import React from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  FolderKanban, 
  X 
} from 'lucide-react';

export default function ReportFilters({
  searchQuery,
  setSearchQuery,
  projectFilter,
  setProjectFilter,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  availableProjects = [],
  totalResults = 0,
}) {
  const statusOptions = ['ALL', 'Completed', 'In Progress', 'Needs Attention'];
  const dateOptions = [
    { id: 'ALL', label: 'All Time' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: '90days', label: 'Last 90 Days' },
  ];

  const hasActiveFilters =
    searchQuery ||
    projectFilter !== 'ALL' ||
    dateFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleReset = () => {
    setSearchQuery('');
    setProjectFilter('ALL');
    setDateFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm space-y-4">
      {/* Search and Dropdowns Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report ID (e.g. REP-2026-104) or project name..."
            className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl pl-9 pr-8 py-2 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#777777] hover:text-[#171717]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Project Filter */}
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] pr-7 appearance-none cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-[#171717]">
                  {p.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#777777]">
              <FolderKanban size={13} />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] pr-7 appearance-none cursor-pointer"
            >
              {dateOptions.map((d) => (
                <option key={d.id} value={d.id} className="bg-white text-[#171717]">
                  {d.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#777777]">
              <Calendar size={13} />
            </div>
          </div>

          {/* Sorting Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] pr-7 appearance-none cursor-pointer"
            >
              <option value="newest" className="bg-white text-[#171717]">Newest First</option>
              <option value="oldest" className="bg-white text-[#171717]">Oldest First</option>
              <option value="highest" className="bg-white text-[#171717]">Highest Progress</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#777777]">
              <ArrowUpDown size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Badges & Reset Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EAEAEA] text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] mr-1 shrink-0">
            Status:
          </span>
          {statusOptions.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'bg-[#F7F7F5] text-[#777777] hover:text-[#171717] border border-[#EAEAEA]'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-[#777777]">
          <span className="font-mono text-[11px]">
            <strong className="text-[#171717] font-bold">{totalResults}</strong> {totalResults === 1 ? 'report' : 'reports'} found
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-[#F28C28] hover:text-[#d9771e] font-semibold underline underline-offset-2 ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
