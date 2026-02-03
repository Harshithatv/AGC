'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold">Login required</h1>
          <p className="mt-3 text-slate-600">Please sign in to access your dashboard.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Welcome to your dashboard</h2>
      <p className="mt-2 text-sm text-slate-600">Use the sidebar to navigate through sections.</p>
    </div>
  );
}
