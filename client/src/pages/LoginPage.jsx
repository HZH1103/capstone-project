import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registrationComplete = location.state?.registered === true;
  const redirectTo = location.state?.from?.pathname || '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-intro"><p className="eyebrow">Welcome back</p><h1>Pick up<br /><em>where you left off.</em></h1><p>Sign in to manage the portfolio and join the conversation in the journal.</p></div>
      <form className="form-panel auth-form" onSubmit={handleSubmit} aria-busy={submitting}>
        <p className="eyebrow">Your account</p>
        <h2>Log in</h2>
        {registrationComplete && <p className="form-notice" role="status">Your account is ready. Sign in to continue.</p>}
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required placeholder="Your password" />
        {error && <p className="form-notice form-notice-error" role="alert">{error}</p>}
        <button className="button" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span></button>
        <p className="form-footnote">New to the journal? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}
