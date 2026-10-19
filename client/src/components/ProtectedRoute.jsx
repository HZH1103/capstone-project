import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'admin') {
    return (
      <section className="access-panel">
        <p className="eyebrow">Private area</p>
        <h1>Administrator access required.</h1>
        <p>Your account is signed in, but it has not been promoted to an administrator yet. Follow the setup steps in the project README.</p>
      </section>
    );
  }
  return <Outlet />;
}
