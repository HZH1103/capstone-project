import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'admin') {
    return (
      <section className="access-panel">
        <p className="eyebrow">Private area</p>
        <h1>Administrator access required.</h1>
        <p>
          You are signed in as <strong>{user.username}</strong>, but this account has not been promoted to
          an administrator yet. Promote it from the server folder with <code>npm run admin:promote</code>,
          then reload this page.
        </p>
        <div className="access-actions">
          <Link className="button" to="/">Back to portfolio</Link>
          <button className="button button-quiet" type="button" onClick={logout}>Log out</button>
        </div>
      </section>
    );
  }
  return <Outlet />;
}
