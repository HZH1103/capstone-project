import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const links = [['Projects', '/projects'], ['Journal', '/blog'], ['Contact', '/contact']];

export default function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="何宗翰 home">
          <span className="brand-mark">HZ</span>
          <span>何宗翰<span className="brand-period">.</span></span>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          {links.map(([label, path]) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'nav-link is-active' : 'nav-link'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link className="nav-link admin-shortcut" to="/admin">Admin</Link>
              <button className="button button-small button-quiet" type="button" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="nav-link login-shortcut" to="/login">Log in</Link>
              <Link className="button button-small" to="/register">Join the journal <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
