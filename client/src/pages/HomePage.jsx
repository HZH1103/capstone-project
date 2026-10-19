import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadState from '../components/LoadState.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { apiRequest } from '../services/api.js';

export default function HomePage() {
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
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> Web developer / student portfolio</p>
          <h1>Ideas made <em>useful.</em></h1>
          <p className="hero-description">I’m 何宗翰 — learning to build thoughtful digital experiences, from the first line of data to the final interaction.</p>
          <div className="hero-actions">
            <Link className="button" to="/projects">Explore the work <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" to="/contact">Start a conversation <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="hero-aside" aria-label="Portfolio details">
          <span className="hero-aside-mark">HZ<span>.</span></span>
          <span className="hero-aside-caption">Designing with<br />clarity & curiosity</span>
          <span className="hero-aside-coordinate">WEB · DATA · PEOPLE</span>
        </div>
        <div className="hero-footerline"><span>Scroll to explore</span><span aria-hidden="true">↓</span><span className="hero-rule" /></div>
      </section>

      <section className="home-about section-block" aria-labelledby="intro-title">
        <div className="section-label"><span className="section-index">01</span><span>A little introduction</span></div>
        <div className="home-about-copy">
          <h2 id="intro-title">A web programming student building at the intersection of <em>design and data.</em></h2>
          <p>This portfolio is a working project: a place to share selected builds, publish notes from the process, and connect through a small full-stack application.</p>
          <Link className="text-link" to="/blog">Read the journal <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="home-work section-block" aria-labelledby="featured-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow"><span className="section-index">02</span> Work in progress</p>
            <h2 id="featured-title">Selected projects</h2>
          </div>
          <Link className="text-link" to="/projects">All projects <span aria-hidden="true">↗</span></Link>
        </div>
        <LoadState loading={loading} error={error} empty="Projects will appear here once the portfolio database has been seeded from the Admin Dashboard.">
          <div className="project-grid">
            {projects.slice(0, 2).map((project, index) => (
              <ProjectCard key={project._id} project={project} number={String(index + 1).padStart(2, '0')} />
            ))}
          </div>
        </LoadState>
      </section>

      <section className="home-contact section-block">
        <p className="eyebrow"><span className="section-index">03</span> Open for good ideas</p>
        <h2>Have a thoughtful<br /><em>challenge in mind?</em></h2>
        <Link className="button button-light" to="/contact">Let’s talk <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}
