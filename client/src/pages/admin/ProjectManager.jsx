import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../services/api.js';

const emptyProject = { title: '', description: '', imageUrl: '', repoUrl: '', liveUrl: '' };

export default function ProjectManager() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProjects = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setListError('');
    try {
      const result = await apiRequest('/projects', { token });
      setProjects(result.projects || []);
    } catch (requestError) {
      setListError(requestError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetForm() {
    setForm(emptyProject);
    setEditingId('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setNotice('');
    try {
      await apiRequest(editingId ? `/projects/${editingId}` : '/projects', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          repoUrl: form.repoUrl.trim(),
          liveUrl: form.liveUrl.trim()
        })
      });
      setNotice(editingId ? 'Project updated.' : 'Project created.');
      resetForm();
      await loadProjects({ quiet: true });
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(project) {
    setEditingId(project._id);
    setForm(Object.fromEntries(Object.keys(emptyProject).map((key) => [key, project[key] || ''])));
    setActionError('');
    setNotice('');
  }

  async function remove(project) {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    setBusyId(project._id);
    setActionError('');
    setNotice('');
    try {
      await apiRequest(`/projects/${project._id}`, { method: 'DELETE', token });
      setNotice('Project deleted.');
      if (editingId === project._id) resetForm();
      await loadProjects({ quiet: true });
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setBusyId('');
    }
  }

  const actionsDisabled = saving || Boolean(busyId);

  return (
    <>
      {(notice || actionError) && (
        <div className="manage-feedback" aria-live="polite">
          {actionError && <p className="form-notice form-notice-error" role="alert">{actionError}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}
        </div>
      )}
      <div className="manage-grid">
        <form className="form-panel manage-form" onSubmit={submit} aria-busy={saving}>
          <p className="eyebrow">{editingId ? 'Update a project' : 'Add to the portfolio'}</p>
          <h2>{editingId ? 'Edit project' : 'New project'}</h2>
          <label htmlFor="project-title">Title</label>
          <input id="project-title" name="title" value={form.title} onChange={update} maxLength={120} required placeholder="Portfolio API and admin dashboard" />
          <label htmlFor="project-description">Description</label>
          <textarea id="project-description" name="description" value={form.description} onChange={update} rows={4} maxLength={2000} required placeholder="What the project does, what you built, and the stack behind it." />
          <label htmlFor="project-image">Image URL <span className="label-hint">optional</span></label>
          <input id="project-image" name="imageUrl" type="url" value={form.imageUrl} onChange={update} placeholder="https://example.com/preview.png" />
          <label htmlFor="project-repo">Repository URL <span className="label-hint">optional</span></label>
          <input id="project-repo" name="repoUrl" type="url" value={form.repoUrl} onChange={update} placeholder="https://github.com/HZH1103/project" />
          <label htmlFor="project-live">Live site URL <span className="label-hint">optional</span></label>
          <input id="project-live" name="liveUrl" type="url" value={form.liveUrl} onChange={update} placeholder="https://project.example.com" />
          <div className="form-actions">
            <button className="button" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish project'} <span aria-hidden="true">↗</span></button>
            {editingId && <button type="button" className="button button-quiet" onClick={resetForm} disabled={saving}>Cancel edit</button>}
          </div>
        </form>
        <section className="manage-list" aria-labelledby="projects-list-title">
          <div className="manage-list-heading"><p className="eyebrow">Portfolio collection</p><h2 id="projects-list-title">Projects <span>{projects.length}</span></h2></div>
          {loading ? <p className="notice" role="status">Loading projects...</p> : listError ? (
            <div className="notice notice-error" role="alert">
              <p><strong>Error:</strong> {listError}</p>
              <button className="button button-small button-quiet" type="button" onClick={() => loadProjects()}>Try again <span aria-hidden="true">↻</span></button>
            </div>
          ) : projects.length === 0 ? <p className="notice">No projects yet. Add the first one here.</p> : (
            <ul className="manage-items">
              {projects.map((project) => (
                <li key={project._id} className={editingId === project._id ? 'manage-item is-editing' : 'manage-item'}>
                  <div><h3>{project.title}</h3><p>{project.description}</p></div>
                  <div className="manage-item-actions">
                    <button type="button" onClick={() => edit(project)} disabled={actionsDisabled}>Edit</button>
                    <button className="danger-link" type="button" onClick={() => remove(project)} disabled={actionsDisabled}>
                      {busyId === project._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
