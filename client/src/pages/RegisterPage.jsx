import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-intro"><p className="eyebrow">Join the conversation</p><h1>Make a little<br /><em>room for ideas.</em></h1><p>Create an account to leave comments on journal entries. Admin access is granted after the owner promotes the account.</p></div>
      <form className="form-panel auth-form" onSubmit={handleSubmit} aria-busy={submitting}>
        <p className="eyebrow">A few details</p>
        <h2>Create account</h2>
        <label htmlFor="register-username">Username</label>
        <input id="register-username" name="username" value={form.username} onChange={update} minLength={3} maxLength={30} autoComplete="username" required placeholder="Your display name" />
        <label htmlFor="register-email">Email address</label>
        <input id="register-email" name="email" type="email" value={form.email} onChange={update} autoComplete="email" required placeholder="you@example.com" />
        <label htmlFor="register-password">Password <span className="label-hint">at least 6 characters</span></label>
        <input id="register-password" name="password" type="password" value={form.password} onChange={update} minLength={6} autoComplete="new-password" required placeholder="Choose a password" />
        {error && <p className="form-notice form-notice-error" role="alert">{error}</p>}
        <button className="button" disabled={submitting}>{submitting ? 'Creating…' : 'Create account'} <span aria-hidden="true">↗</span></button>
        <p className="form-footnote">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
