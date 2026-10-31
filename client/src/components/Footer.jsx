import { Link } from 'react-router-dom';
import { GITHUB_PROFILE_URL } from '../config.js';

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="eyebrow">Thanks for stopping by</p>
          <p className="footer-note">Good work starts with a thoughtful conversation.</p>
          <div className="footer-links">
            <a className="footer-link" href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
            <Link className="footer-link" to="/projects">Projects</Link>
            <Link className="footer-link" to="/blog">Journal</Link>
            <Link className="footer-link" to="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-actions">
          <Link className="footer-contact" to="/contact">Send a note <span aria-hidden="true">↗</span></Link>
          <span className="footer-stack">React · Node.js · Express · MongoDB</span>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} 何宗翰</span>
          <span>Full-stack portfolio capstone · Web Data Management and Application</span>
          <button className="footer-top" type="button" onClick={scrollToTop}>Back to top ↑</button>
        </div>
      </div>
    </footer>
  );
}
