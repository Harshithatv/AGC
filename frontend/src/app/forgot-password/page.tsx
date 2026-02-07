'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendResetEmail = async () => {
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendResetEmail();
  };

  const handleResend = async () => {
    await sendResetEmail();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-100 via-white to-blue-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">Check your email</h1>
              <p className="mt-3 text-sm text-slate-600">
                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                The link will expire in 1 hour.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Resend email'}
                </button>
                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-ocean-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-ocean-700"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ocean-100">
                  <svg className="h-8 w-8 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">Forgot your password?</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-ocean-400 focus:outline-none"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-ocean-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Remember your password?{' '}
                  <Link href="/login" className="font-semibold text-ocean-600 hover:underline">
                    Back to login
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
