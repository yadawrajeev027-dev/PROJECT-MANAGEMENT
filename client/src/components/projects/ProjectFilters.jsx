import React from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  X, 
  Code2 
} from 'lucide-react';

export default function ProjectFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedTech,
  setSelectedTech,
  availableTechnologies = [],
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  totalResults = 0,
}) {
  const statusOptions = [
    { id: 'ALL', label: 'All Projects' },
    { id: 'Completed', label: 'Completed' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Needs Attention', label: 'Needs Attention' },
    { id: 'Not Analyzed', label: 'Not Analyzed' },
  ];

  const sortOptions = [
    { id: 'recently-updated', label: 'Recently Updated' },
    { id: 'oldest-updated', label: 'Oldest Updated' },
    { id: 'highest-progress', label: 'Highest Progress' },
    { id: 'lowest-progress', label: 'Lowest Progress' },
    { id: 'name-az', label: 'Project Name A-Z' },
  ];

  const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || selectedTech !== 'ALL';

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSelectedTech('ALL');
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm space-y-4">
      {/* Top Filter Controls: Search, Tech Selector, Sort, & Grid/List View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, description or tech stack..."
            className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl pl-9 pr-8 py-2 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:bg-white focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] transition-all"
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

        {/* Dropdowns & View Toggle Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tech Stack Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] pr-7 appearance-none cursor-pointer"
            >
              <option value="ALL">All Technologies</option>
              {availableTechnologies.map((tech) => (
                <option key={tech} value={tech} className="bg-white text-[#171717]">
                  {tech}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#777777]">
              <Code2 size={13} />
            </div>
          </div>

          {/* Sorting Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] pr-7 appearance-none cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-white text-[#171717]">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#777777]">
              <ArrowUpDown size={13} />
            </div>
          </div>

          {/* Grid / List Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Filter Controls: Status Badges & Active Filters Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EAEAEA] text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusOptions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'bg-[#F7F7F5] text-[#777777] hover:text-[#171717] border border-[#EAEAEA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Clear Filters & Results Count */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-[#777777]">
          <span className="font-mono text-[11px]">
            <strong className="text-[#171717] font-bold">{totalResults}</strong> {totalResults === 1 ? 'project' : 'projects'} found
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] text-[#171717] hover:text-[#F5C400] font-semibold underline underline-offset-2 ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
