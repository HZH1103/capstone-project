import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadState from '../components/LoadState.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { apiRequest } from '../services/api.js';
import { GITHUB_PROFILE_URL } from '../config.js';

const SKILLS = [
  'JavaScript',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'Mongoose',
  'REST APIs',
  'HTML & CSS',
  'Git & GitHub'
];

export default function HomePage() {
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
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> Full-stack developer / student portfolio</p>
          <h1>Ideas made <em>useful.</em></h1>
          <p className="hero-description">
            I’m 何宗翰, a full-stack web development student. I build complete products — React
            interfaces, Express APIs, and MongoDB data models — with a focus on clarity,
            accessibility, and the small details people actually feel.
          </p>
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
        <div className="home-about-aside">
          <div className="section-label"><span className="section-index">01</span><span>About me</span></div>
          <figure className="portrait-card">
            <img
              className="portrait-image"
              src="/assets/profile-portrait.jpg"
              alt="Portrait of 何宗翰"
              width="900"
              height="900"
              loading="lazy"
            />
            <figcaption className="portrait-caption">
              <span className="portrait-name">何宗翰</span>
              <span className="portrait-meta">Full-stack student</span>
            </figcaption>
          </figure>
        </div>
        <div className="home-about-copy">
          <h2 id="intro-title">A full-stack student building at the intersection of <em>design and data.</em></h2>
          <p>
            I study web data management and application development, and I like taking an idea the
            whole way: modelling the data in MongoDB, writing the Node.js and Express API that serves
            it, and designing the React interface that makes it feel simple.
          </p>
          <p>
            This site is the coursework made real — a React single-page application talking to a
            separate Express API. Every project and journal entry you see here was created through
            the protected admin dashboard, not hardcoded into the client.
          </p>
          <div className="skill-block">
            <p className="eyebrow">Working toolkit</p>
            <ul className="skill-list">
              {SKILLS.map((skill) => <li key={skill} className="skill-chip">{skill}</li>)}
            </ul>
          </div>
          <div className="about-actions">
            <a className="text-link" href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer">
              github.com/HZH1103 <span aria-hidden="true">↗</span>
            </a>
            <Link className="text-link" to="/blog">Read the journal <span aria-hidden="true">↗</span></Link>
          </div>
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
        <LoadState
          loading={loading}
          error={error}
          onRetry={loadProjects}
          isEmpty={projects.length === 0}
          empty="Projects will appear here once the portfolio database has been seeded from the Admin Dashboard."
        >
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
