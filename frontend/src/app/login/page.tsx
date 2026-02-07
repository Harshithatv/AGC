'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      const role = loggedInUser?.role;
      if (role === 'ORG_USER') {
        router.push('/course');
      } else {
        router.push('/dashboard/overview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-100 via-white to-blue-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 sm:py-16">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
          <div className="grid lg:grid-cols-[1.05fr,0.95fr]">
            <div className="relative hidden overflow-hidden px-8 py-10 sm:px-10 sm:py-12 lg:block">
              <img
                src="/images/purchase-details.jpg"
                alt="Academic Guide Course"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/55" />
              <div className="relative z-10 text-white">
                <p className="text-lg text-white/90 sm:text-xl">Welcome back</p>
                <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Pick up where you left off.</h1>
                <div className="absolute bottom-20 right-8 flex items-center justify-end">
                  <Link href="/" className="inline-flex items-center text-sm font-normal text-white/70">
                    <span className="mr-2">←</span> Back to home
                  </Link>
                </div>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-12">
              <div className="mb-6 lg:hidden">
                <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-500">Sign in to continue your learning</p>
              </div>
              <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-ocean-400 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 focus:border-ocean-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-ocean-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-ocean-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Log in'}
              </button>
              <p className="text-center text-sm text-slate-500">
                Need to start fresh?{' '}
                <Link href="/purchase/details" className="font-semibold text-ocean-600 hover:underline">
                  Create your account
                </Link>
              </p>
              </form>
              {/* <div className="mt-10 flex items-center justify-end text-sm text-slate-500">
                <Link href="/" className="inline-flex items-center font-semibold text-ocean-600">
                  <span className="mr-2">←</span> Back to home
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
