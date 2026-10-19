import { useEffect, useState } from 'react';
import PageHeading from '../components/PageHeading.jsx';
import LoadState from '../components/LoadState.jsx';
import BlogPostCard from '../components/BlogPostCard.jsx';
import { apiRequest } from '../services/api.js';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/blog')
      .then((result) => { if (active) setPosts(result.posts || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="content-page journal-page">
      <PageHeading index="02" eyebrow="Notes from the process" title="The journal" description="Short notes on making things for the web: what I tried, what I learned, and what I want to explore next." />
      <LoadState loading={loading} error={error} empty="No journal entries yet. Check back soon for notes from the build process.">
        <div className="post-list">
          {posts.map((post, index) => <BlogPostCard key={post._id} post={post} number={String(index + 1).padStart(2, '0')} />)}
        </div>
      </LoadState>
    </section>
  );
}
