import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Filter,
  RefreshCw
} from 'lucide-react';

import ProjectStats from '../components/projects/ProjectStats';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectGrid from '../components/projects/ProjectGrid';
import ProjectList from '../components/projects/ProjectList';
import DeleteProjectModal from '../components/projects/DeleteProjectModal';
import EditProjectModal from '../components/projects/EditProjectModal';
import ReanalyseModal from '../components/ReanalyseModal';

import { useProjects } from '../context/ProjectContext';

export default function MyProjects({
  searchQuery: propSearchQuery,
  onViewProjectDetails,
  onReanalyseProject,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletContext = useOutletContext() || {};
  const { projects, deleteProject, updateProject } = useProjects();

  const urlQuery = searchParams.get('q') || '';
  const initialQuery = propSearchQuery !== undefined 
    ? propSearchQuery 
    : (urlQuery || outletContext.searchQuery || '');

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTech, setSelectedTech] = useState('ALL');
  const [sortBy, setSortBy] = useState('recently-updated');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modal states
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToReanalyse, setProjectToReanalyse] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync if URL search param changes
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Derive unique available technologies from current project dataset
  const availableTechnologies = useMemo(() => {
    const techSet = new Set();
    projects.forEach((p) => {
      if (Array.isArray(p.technologies)) {
        p.technologies.forEach((t) => techSet.add(t));
      }
    });
    return Array.from(techSet).sort();
  }, [projects]);

  // Derived filtered & sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // 1. Search filter: name, description, or technologies
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          project.name.toLowerCase().includes(q) ||
          project.description.toLowerCase().includes(q) ||
          (Array.isArray(project.technologies) &&
            project.technologies.some((t) => t.toLowerCase().includes(q)));

        // 2. Status filter
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'COMPLETED') {
            matchesStatus = project.status === 'Completed' || (project.completionPercentage || 0) >= 90;
          } else if (statusFilter === 'IN_PROGRESS') {
            matchesStatus = project.status === 'In Progress' && (project.completionPercentage || 0) < 90;
          } else if (statusFilter === 'NEEDS_ATTENTION') {
            matchesStatus = project.status === 'Needs Attention' || project.status === 'Not Analyzed';
          }
        }

        // 3. Technology stack filter
        const matchesTech =
          selectedTech === 'ALL' ||
          (Array.isArray(project.technologies) &&
            project.technologies.includes(selectedTech));

        return matchesSearch && matchesStatus && matchesTech;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'recently-updated':
            return (b.updatedTimestamp || 0) - (a.updatedTimestamp || 0);
          case 'oldest-updated':
            return (a.updatedTimestamp || 0) - (b.updatedTimestamp || 0);
          case 'highest-progress':
            return (b.completionPercentage || 0) - (a.completionPercentage || 0);
          case 'lowest-progress':
            return (a.completionPercentage || 0) - (b.completionPercentage || 0);
          case 'name-az':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [projects, searchQuery, statusFilter, selectedTech, sortBy]);

  // Project Action Handlers
  const handleDeleteConfirm = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    deleteProject(projectId);
    setProjectToDelete(null);
    showToast('info', `Project "${project?.name || 'Specification'}" removed from local workspace view.`);
  };

  const handleSaveEdit = (updatedProject) => {
    updateProject(updatedProject.id, updatedProject);
    setProjectToEdit(null);
    showToast('success', `Metadata updated for "${updatedProject.name}".`);
  };

  const handleOpenDetails = (proj) => {
    if (proj?.id || proj?._id) {
      navigate(`/projects/${proj.id || proj._id}`);
    } else if (onViewProjectDetails) {
      onViewProjectDetails(proj);
    }
  };

  const handleOpenReanalyse = (proj) => {
    if (outletContext.handleOpenReanalyse) {
      outletContext.handleOpenReanalyse(proj);
    } else if (onReanalyseProject) {
      onReanalyseProject(proj);
    } else {
      setProjectToReanalyse(proj);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSelectedTech('ALL');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              My Projects
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
              Workspace Repositories
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#777777]">
            Manage, monitor and analyze all your software projects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={16} />
          <span>Upload New Project</span>
        </button>
      </div>

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

      {/* 2. Dynamically Calculated Statistics Row */}
      <section>
        <ProjectStats
          projects={projects}
          activeFilter={statusFilter}
          onSelectFilter={(filterKey) => setStatusFilter(filterKey)}
        />
      </section>

      {/* 3. Search, Filter, Sort & View Controls */}
      <section>
        <ProjectFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedTech={selectedTech}
          setSelectedTech={setSelectedTech}
          availableTechnologies={availableTechnologies}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalResults={filteredAndSortedProjects.length}
        />
      </section>

      {/* 4. Project Cards Display (Grid or List) with Robust Empty States */}
      <section>
        {filteredAndSortedProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <ProjectGrid
              projects={filteredAndSortedProjects}
              onViewDetails={handleOpenDetails}
              onEdit={(proj) => setProjectToEdit(proj)}
              onReanalyse={handleOpenReanalyse}
              onDelete={(proj) => setProjectToDelete(proj)}
            />
          ) : (
            <ProjectList
              projects={filteredAndSortedProjects}
              onViewDetails={handleOpenDetails}
              onEdit={(proj) => setProjectToEdit(proj)}
              onReanalyse={handleOpenReanalyse}
              onDelete={(proj) => setProjectToDelete(proj)}
            />
          )
        ) : (
          /* Empty States Matrix */
          <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-[#EAEAEA] shadow-sm">
            {projects.length === 0 ? (
              /* Case 1: No Projects at all */
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] flex items-center justify-center mx-auto shadow-sm">
                  <FolderKanban size={32} className="text-[#F5C400]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#171717] tracking-tight">No Projects Uploaded Yet</h3>
                  <p className="text-xs text-[#777777] mt-1 leading-relaxed">
                    Start by uploading your first software codebase archive to generate deep architectural analysis and progress reports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/upload')}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all"
                >
                  Upload Your First Project
                </button>
              </div>
            ) : (
              /* Case 2: Filter resulted in 0 matches */
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F7F7F5] text-[#777777] flex items-center justify-center mx-auto border border-[#EAEAEA]">
                  <Search size={26} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171717] tracking-tight">No Matching Projects Found</h3>
                  <p className="text-xs text-[#777777] mt-1 leading-relaxed">
                    No software repositories matched your current filter combinations ({searchQuery ? `"${searchQuery}"` : ''} {statusFilter !== 'ALL' ? `• status: ${statusFilter}` : ''} {selectedTech !== 'ALL' ? `• tech: ${selectedTech}` : ''}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#F7F7F5] bg-white border border-[#EAEAEA] transition-all flex items-center gap-2 mx-auto shadow-sm"
                >
                  <RefreshCw size={13} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteProjectModal
        project={projectToDelete}
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Edit Project Metadata Modal */}
      <EditProjectModal
        project={projectToEdit}
        isOpen={Boolean(projectToEdit)}
        onClose={() => setProjectToEdit(null)}
        onSaveProject={handleSaveEdit}
      />

      {/* Re-analyse Modal Fallback */}
      <ReanalyseModal
        project={projectToReanalyse}
        isOpen={Boolean(projectToReanalyse)}
        onClose={() => setProjectToReanalyse(null)}
      />
    </div>
  );
}
