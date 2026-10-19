import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import LoadState from '../components/LoadState.jsx';
import { apiRequest } from '../services/api.js';

export default function BlogDetailPage() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(`/blog/${encodeURIComponent(id)}`);
      setPost(result.post);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPost(); }, [loadPost]);

  async function handleComment(event) {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      await apiRequest(`/blog/${encodeURIComponent(id)}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body })
      });
      setBody('');
      setNotice('Your comment has been posted.');
      await loadPost();
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="content-page article-page">
      <LoadState loading={loading} error={error}>
        {post && (
          <article>
            <Link className="back-link" to="/blog">← Back to journal</Link>
            <header className="article-heading">
              <p className="eyebrow">Journal / {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : 'New entry'}</p>
              <h1>{post.title}</h1>
              <p className="article-byline">Written by {post.author?.username || 'Portfolio author'}</p>
            </header>
            <div className="article-content">{post.content}</div>
            <section className="comments-section" aria-labelledby="comments-title">
              <div className="section-heading-row">
                <div><p className="eyebrow">A conversation</p><h2 id="comments-title">Comments <span className="comment-count">{post.comments?.length || 0}</span></h2></div>
              </div>
              {post.comments?.length ? (
                <ol className="comment-list">
                  {post.comments.map((comment) => (
                    <li key={comment._id} className="comment-card">
                      <p className="comment-author">{comment.author?.username || 'Reader'} <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span></p>
                      <p>{comment.body}</p>
                    </li>
                  ))}
                </ol>
              ) : <p className="muted-copy">No comments yet. Start the conversation.</p>}
              {isAuthenticated ? (
                <form className="form-panel comment-form" onSubmit={handleComment}>
                  <label htmlFor="comment-body">Add a comment</label>
                  <textarea id="comment-body" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} rows={4} />
                  {notice && <p className="form-notice" role="status">{notice}</p>}
                  <button className="button" disabled={submitting}>{submitting ? 'Posting…' : 'Post comment'} <span aria-hidden="true">↗</span></button>
                </form>
              ) : <p className="muted-copy"><Link to="/login">Log in</Link> to leave a comment.</p>}
            </section>
          </article>
        )}
      </LoadState>
    </section>
  );
}
