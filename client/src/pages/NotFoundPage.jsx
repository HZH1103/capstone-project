import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="eyebrow">404 / Page not found</p>
      <h1>This page went<br /><em>off the map.</em></h1>
      <p className="page-description">The link may be outdated, or the page may have moved. Try one of these instead.</p>
      <div className="not-found-links">
        <Link className="button" to="/">Return home <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" to="/projects">See projects <span aria-hidden="true">→</span></Link>
        <Link className="text-link" to="/blog">Read the journal <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
