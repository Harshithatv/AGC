'use client';

import { useState } from 'react';
import { submitContactMessage } from '@/lib/api';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please enter your message.');
      return;
    }

    setLoading(true);
    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setSuccess('Your message has been sent successfully! We will get back to you soon.');
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="rounded-2xl border border-white/70 bg-white/80 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="space-y-4">
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">
            Full name
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">
            Email address
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            placeholder="you@example.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">
            Message
          </label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            rows={4}
            placeholder="Tell us how we can help"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
