import { useState } from 'react';

export default function ProjectCard({ project, number = '01' }) {
  const [imageBroken, setImageBroken] = useState(false);
  const hasImage = Boolean(project.imageUrl) && !imageBroken;

  return (
    <article className="project-card">
      <div className="project-visual">
        {hasImage ? (
          <img
            src={project.imageUrl}
            alt={`${project.title} project preview`}
            loading="lazy"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <span className="project-monogram" aria-hidden="true">{String(project.title || 'P').slice(0, 1).toUpperCase()}</span>
        )}
        <span className="project-number">{number}</span>
      </div>
      <div className="project-card-body">
        <p className="card-kicker">Selected work / {number}</p>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
        <div className="card-links">
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Visit site <span aria-hidden="true">↗</span></a>}
          {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">Source code <span aria-hidden="true">↗</span></a>}
        </div>
      </div>
    </article>
  );
}
