import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import ProjectManager from './admin/ProjectManager.jsx';
import BlogManager from './admin/BlogManager.jsx';

export default function AdminPage() {
  const { user } = useAuth();
  const [section, setSection] = useState('projects');

  return (
    <section className="content-page admin-page">
      <PageHeading index="04" eyebrow={`Studio / Signed in as ${user.username}`} title="The workspace" description="Keep the portfolio current. Every change here is saved through the protected API with your JWT." />
      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Content to manage">
          <button
            id="admin-tab-projects"
            type="button"
            role="tab"
            aria-selected={section === 'projects'}
            aria-controls="admin-panel-projects"
            className={section === 'projects' ? 'admin-tab is-selected' : 'admin-tab'}
            onClick={() => setSection('projects')}
          >
            Projects
          </button>
          <button
            id="admin-tab-blog"
            type="button"
            role="tab"
            aria-selected={section === 'blog'}
            aria-controls="admin-panel-blog"
            className={section === 'blog' ? 'admin-tab is-selected' : 'admin-tab'}
            onClick={() => setSection('blog')}
          >
            Journal entries
          </button>
        </div>
        <Link className="text-link" to="/">View portfolio <span aria-hidden="true">↗</span></Link>
      </div>
      {section === 'projects' ? (
        <div id="admin-panel-projects" role="tabpanel" aria-labelledby="admin-tab-projects">
          <ProjectManager />
        </div>
      ) : (
        <div id="admin-panel-blog" role="tabpanel" aria-labelledby="admin-tab-blog">
          <BlogManager />
        </div>
      )}
    </section>
  );
}
