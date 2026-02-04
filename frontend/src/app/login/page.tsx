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
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr,0.95fr]">
            <div className="relative overflow-hidden px-10 py-12">
              <img
                src="/images/purchase-details.jpg"
                alt="Academic Guide Course"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/55" />
              <div className="relative z-10 text-white">
                <p className="text-xl text-white/90">Welcome back</p>
                <h1 className="mt-3 text-3xl font-semibold">Pick up where you left off.</h1>
                <div className="absolute bottom-20 right-8 flex items-center justify-end">
                  <Link href="/" className="inline-flex items-center text-sm font-normal text-white/70">
                    <span className="mr-2">←</span> Back to home
                  </Link>
                </div>
              </div>
            </div>

            <div className="px-10 py-12">
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
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-ocean-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Remember me
                </label>
                <button type="button" className="text-ocean-600 hover:underline">
                  Forgot password?
                </button>
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
