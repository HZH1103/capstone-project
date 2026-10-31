import { useCallback, useEffect, useState } from 'react';
import PageHeading from '../components/PageHeading.jsx';
import LoadState from '../components/LoadState.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { apiRequest } from '../services/api.js';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/projects');
      setProjects(result.projects || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  return (
    <section className="content-page">
      <PageHeading
        index="01"
        eyebrow="Selected work"
        title="Projects"
        description="A growing collection of full-stack builds: React interfaces, Express APIs, and the data models that hold them together. Each one starts with a question worth exploring."
      />
      <LoadState
        loading={loading}
        error={error}
        onRetry={loadProjects}
        isEmpty={projects.length === 0}
        empty="No projects have been published yet. The portfolio owner can add projects from the Admin Dashboard."
      >
        <div className="project-grid project-grid-wide">
          {projects.map((project, index) => <ProjectCard key={project._id} project={project} number={String(index + 1).padStart(2, '0')} />)}
        </div>
      </LoadState>
    </section>
  );
}
