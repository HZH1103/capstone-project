import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="eyebrow">Thanks for stopping by</p>
          <p className="footer-note">Good work starts with a thoughtful conversation.</p>
        </div>
        <Link className="footer-contact" to="/contact">Send a note <span aria-hidden="true">↗</span></Link>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} 何宗翰</span>
          <span>Designed & built with React, Node and MongoDB</span>
          <Link to="/">Back to top ↑</Link>
        </div>
      </div>
    </footer>
  );
}
