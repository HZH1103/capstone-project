import { useEffect, useState } from 'react';
import PageHeading from '../components/PageHeading.jsx';
import LoadState from '../components/LoadState.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { apiRequest } from '../services/api.js';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/projects')
      .then((result) => { if (active) setProjects(result.projects || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="content-page">
      <PageHeading index="01" eyebrow="Selected work" title="Projects" description="A growing collection of experiments and builds. Each one starts with a question worth exploring." />
      <LoadState loading={loading} error={error} empty="No projects have been published yet. The portfolio owner can add projects in the Admin Dashboard.">
        <div className="project-grid project-grid-wide">
          {projects.map((project, index) => <ProjectCard key={project._id} project={project} number={String(index + 1).padStart(2, '0')} />)}
        </div>
      </LoadState>
    </section>
  );
}
