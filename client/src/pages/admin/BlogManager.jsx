import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../services/api.js';

const emptyPost = { title: '', content: '' };

export default function BlogManager() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyPost);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/blog', { token });
      setPosts(result.posts || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

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
    setNotice('');
    setError('');
    try {
      await apiRequest(editingId ? `/blog/${editingId}` : '/blog', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(form)
      });
      setNotice(editingId ? 'Journal entry updated.' : 'Journal entry published.');
      resetForm();
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(post) {
    setEditingId(post._id);
    setForm({ title: post.title || '', content: post.content || '' });
    setNotice('');
  }

  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      await apiRequest(`/blog/${post._id}`, { method: 'DELETE', token });
      setNotice('Journal entry deleted.');
      if (editingId === post._id) resetForm();
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="manage-grid">
      <form className="form-panel manage-form" onSubmit={submit}>
        <p className="eyebrow">{editingId ? 'Update a journal entry' : 'Write something worth keeping'}</p>
        <h2>{editingId ? 'Edit entry' : 'New entry'}</h2>
        <label htmlFor="post-title">Title</label>
        <input id="post-title" name="title" value={form.title} onChange={update} minLength={3} maxLength={180} required />
        <label htmlFor="post-content">Content</label>
        <textarea id="post-content" name="content" value={form.content} onChange={update} rows={12} required />
        {error && <p className="form-notice form-notice-error" role="alert">{error}</p>}
        {notice && <p className="form-notice" role="status">{notice}</p>}
        <div className="form-actions">
          <button className="button" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish entry'} <span aria-hidden="true">↗</span></button>
          {editingId && <button type="button" className="button button-quiet" onClick={resetForm}>Cancel edit</button>}
        </div>
      </form>
      <section className="manage-list" aria-labelledby="posts-list-title">
        <div className="manage-list-heading"><p className="eyebrow">Published notes</p><h2 id="posts-list-title">Journal <span>{posts.length}</span></h2></div>
        {loading ? <p className="notice" role="status">Loading entries…</p> : posts.length === 0 ? <p className="notice">No entries yet. Start the journal here.</p> : (
          <ul className="manage-items">
            {posts.map((post) => (
              <li key={post._id} className="manage-item">
                <div><h3><Link to={`/blog/${post._id}`}>{post.title}</Link></h3><p>{post.author?.username || 'Portfolio author'} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Draft'}</p></div>
                <div className="manage-item-actions"><button type="button" onClick={() => edit(post)}>Edit</button><button className="danger-link" type="button" onClick={() => remove(post)}>Delete</button></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
