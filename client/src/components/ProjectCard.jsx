export default function ProjectCard({ project, number = '01' }) {
  return (
    <article className="project-card">
      <div className="project-visual">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt="" loading="lazy" />
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
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer">Visit site ↗</a>}
          {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer">Source code ↗</a>}
        </div>
      </div>
    </article>
  );
}
