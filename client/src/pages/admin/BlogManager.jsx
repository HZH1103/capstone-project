import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../services/api.js';

const emptyPost = { title: '', content: '' };

function authorIdOf(post) {
  return String(post.author?._id || post.author || '');
}

export default function BlogManager() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyPost);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const currentUserId = String(user?._id || '');
  const canManage = (post) => Boolean(currentUserId) && authorIdOf(post) === currentUserId;

  const loadPosts = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setListError('');
    try {
      const result = await apiRequest('/blog', { token });
      setPosts(result.posts || []);
    } catch (requestError) {
      setListError(requestError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetForm() {
    setForm(emptyPost);
    setEditingId('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setNotice('');
    try {
      await apiRequest(editingId ? `/blog/${editingId}` : '/blog', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim()
        })
      });
      setNotice(editingId ? 'Journal entry updated.' : 'Journal entry published.');
      resetForm();
      await loadPosts({ quiet: true });
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(post) {
    setEditingId(post._id);
    setForm({ title: post.title || '', content: post.content || '' });
    setActionError('');
    setNotice('');
  }

  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setBusyId(post._id);
    setActionError('');
    setNotice('');
    try {
      await apiRequest(`/blog/${post._id}`, { method: 'DELETE', token });
      setNotice('Journal entry deleted.');
      if (editingId === post._id) resetForm();
      await loadPosts({ quiet: true });
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
          <p className="eyebrow">{editingId ? 'Update a journal entry' : 'Write something worth keeping'}</p>
          <h2>{editingId ? 'Edit entry' : 'New entry'}</h2>
          <label htmlFor="post-title">Title</label>
          <input id="post-title" name="title" value={form.title} onChange={update} minLength={3} maxLength={180} required placeholder="What I learned building the portfolio API" />
          <label htmlFor="post-content">Content</label>
          <textarea id="post-content" name="content" value={form.content} onChange={update} rows={12} required placeholder="Write the entry. Line breaks are preserved on the published page." />
          <div className="form-actions">
            <button className="button" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish entry'} <span aria-hidden="true">↗</span></button>
            {editingId && <button type="button" className="button button-quiet" onClick={resetForm} disabled={saving}>Cancel edit</button>}
          </div>
        </form>
        <section className="manage-list" aria-labelledby="posts-list-title">
          <div className="manage-list-heading"><p className="eyebrow">Published notes</p><h2 id="posts-list-title">Journal <span>{posts.length}</span></h2></div>
          {loading ? <p className="notice" role="status">Loading entries...</p> : listError ? (
            <div className="notice notice-error" role="alert">
              <p><strong>Error:</strong> {listError}</p>
              <button className="button button-small button-quiet" type="button" onClick={() => loadPosts()}>Try again <span aria-hidden="true">↻</span></button>
            </div>
          ) : posts.length === 0 ? <p className="notice">No entries yet. Start the journal here.</p> : (
            <ul className="manage-items">
              {posts.map((post) => (
                <li key={post._id} className={editingId === post._id ? 'manage-item is-editing' : 'manage-item'}>
                  <div>
                    <h3><Link to={`/blog/${post._id}`}>{post.title}</Link></h3>
                    <p>{post.author?.username || 'Portfolio author'} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Draft'}</p>
                  </div>
                  <div className="manage-item-actions">
                    {canManage(post) ? (
                      <>
                        <button type="button" onClick={() => edit(post)} disabled={actionsDisabled}>Edit</button>
                        <button className="danger-link" type="button" onClick={() => remove(post)} disabled={actionsDisabled}>
                          {busyId === post._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </>
                    ) : <span className="manage-note">Only the author can edit this entry</span>}
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
