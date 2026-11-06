import React, { useState } from 'react';
import { 
  FolderKanban, 
  ExternalLink, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function RecentProjects({ projects, searchQuery = '', onViewProject }) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter projects by both search query and status filter tab
  const filteredProjects = (projects || []).filter((project) => {
    const q = (searchQuery || '').toLowerCase();
    const techList = project.technologies || project.techStack || [];
    const matchesSearch = 
      !q ||
      (project.name || '').toLowerCase().includes(q) ||
      techList.some(tech => tech.toLowerCase().includes(q)) ||
      (project.category || '').toLowerCase().includes(q);

    const matchesStatus = 
      statusFilter === 'ALL' || (project.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Recent Projects Repository
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
              {filteredProjects.length} visible
            </span>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Overview of uploaded and analyzed software codebases
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs self-start sm:self-auto overflow-x-auto max-w-full">
          {['ALL', 'In Progress', 'Completed', 'Needs Attention'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-[#080808] text-white shadow-sm font-semibold'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Table / List View */}
      <div className="mt-4 overflow-x-auto">
        {filteredProjects.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[11px] font-semibold text-[#777777] uppercase tracking-wider">
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Tech Stack</th>
                <th className="py-3 px-3">Progress</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 hidden md:table-cell">Last Updated</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id || project._id}
                  className="hover:bg-[#F7F7F5] transition-colors group"
                >
                  {/* Name & Category */}
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-[#171717]">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-[#777777]">
                      {project.category}
                    </div>
                  </td>

                  {/* Tech stack badges */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(project.technologies || project.techStack || []).map((tech) => (
                        <span 
                          key={tech} 
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Progress bar */}
                  <td className="py-3.5 px-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#EAEAEA] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            project.completionPercentage >= 90
                              ? 'bg-emerald-500'
                              : 'bg-[#F5C400]'
                          }`}
                          style={{ width: `${project.completionPercentage || 0}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[#171717] text-[11px]">
                        {project.completionPercentage || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                      project.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : project.status === 'In Progress'
                        ? 'bg-[#F5C400]/15 text-[#171717] border-[#F5C400]/40'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'Completed'
                          ? 'bg-emerald-500'
                          : project.status === 'In Progress'
                          ? 'bg-[#F5C400]'
                          : 'bg-amber-500'
                      }`} />
                      {project.status || 'In Progress'}
                    </span>
                  </td>

                  {/* Last updated */}
                  <td className="py-3.5 px-3 text-[#777777] hidden md:table-cell text-[11px]">
                    {project.lastUpdated || (project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Just now')}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewProject(project)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-all inline-flex items-center gap-1 active:scale-95 shadow-sm"
                    >
                      <span>Report</span>
                      <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex p-3 rounded-full bg-[#F7F7F5] text-[#777777] mb-2 border border-[#EAEAEA]">
              <Search size={20} />
            </div>
            <h4 className="text-sm font-semibold text-[#171717]">No matching projects found</h4>
            <p className="text-xs text-[#777777] mt-1">
              Try adjusting your search terms or status filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
