import { Link } from 'react-router-dom';

function excerpt(content, maxLength = 180) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

function readingMinutes(content) {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function BlogPostCard({ post, number = '01' }) {
  const date = post.createdAt ? new Date(post.createdAt) : null;
  const minutes = readingMinutes(post.content);
  return (
    <article className="post-card">
      <p className="post-index">{number} <span aria-hidden="true">/</span> {date?.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) || 'New entry'}</p>
      <h2><Link to={`/blog/${post._id}`}>{post.title}</Link></h2>
      <p className="post-excerpt">{excerpt(post.content)}</p>
      <div className="post-meta">
        <span>By {post.author?.username || 'Portfolio author'} · {minutes} min read</span>
        <Link to={`/blog/${post._id}`} aria-label={`Read ${post.title}`}>Read entry <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}
