import React from 'react';
import ProjectCard from './ProjectCard';

export default function ProjectGrid({
  projects,
  onViewDetails,
  onEdit,
  onReanalyse,
  onDelete,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onReanalyse={onReanalyse}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
