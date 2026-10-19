import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="eyebrow">404 / Page not found</p>
      <h1>This page went<br /><em>off the map.</em></h1>
      <Link className="button" to="/">Return home <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
