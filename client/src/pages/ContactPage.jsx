import { useState } from 'react';
import PageHeading from '../components/PageHeading.jsx';
import { apiRequest } from '../services/api.js';

const emptyForm = { name: '', email: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const result = await apiRequest('/contact', { method: 'POST', body: JSON.stringify(form) });
      setForm(emptyForm);
      setNotice({ type: 'success', text: result.message });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="content-page contact-page">
      <PageHeading index="03" eyebrow="Say hello" title="Let’s talk." description="Have a question, an idea, or a project that needs a thoughtful web experience? Send me a note." />
      <div className="contact-layout">
        <div className="contact-aside">
          <p className="eyebrow">A good place to begin</p>
          <p>Tell me what you’re working on, what you’re curious about, or what you’d like to make next.</p>
          <span className="contact-aside-mark" aria-hidden="true">↘</span>
        </div>
        <form className="form-panel" onSubmit={handleSubmit}>
          <label htmlFor="contact-name">Your name</label>
          <input id="contact-name" name="name" value={form.name} onChange={update} required maxLength={100} autoComplete="name" />
          <label htmlFor="contact-email">Email address</label>
          <input id="contact-email" name="email" type="email" value={form.email} onChange={update} required maxLength={254} autoComplete="email" />
          <label htmlFor="contact-message">Your message</label>
          <textarea id="contact-message" name="message" value={form.message} onChange={update} required minLength={10} maxLength={5000} rows={6} />
          {notice && <p className={`form-notice ${notice.type === 'error' ? 'form-notice-error' : ''}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
          <button className="button" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </section>
  );
}
