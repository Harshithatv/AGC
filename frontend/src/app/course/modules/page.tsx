'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMyModules, startModule } from '@/lib/api';

export default function CourseModulesPage() {
  const router = useRouter();
  const { user, token, logout, ready } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const completedCount = modules.filter((moduleItem) => moduleItem.status === 'COMPLETED').length;
  const totalProgress = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ORG_USER') {
      router.push('/dashboard');
      return;
    }
    getMyModules(token).then((data) => setModules(data as any[]));
  }, [token, user, router, ready]);

  const handleStart = async (id: string) => {
    if (!token) return;
    await startModule(token, id);
    router.push(`/course/modules/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.svg" alt="AGC logo" width={40} height={40} />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Academic Guide Course</p>
              <h1 className="text-lg font-semibold text-slate-900">Learner Portal</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/course#program" className="hover:text-ocean-600">Programme</Link>
            <Link href="/course/modules" className="hover:text-ocean-600">Modules</Link>
            <Link href="/course#how-it-works" className="hover:text-ocean-600">How it works</Link>
            <Link href="/course#certification" className="hover:text-ocean-600">Certification</Link>
            <Link href="/course#contact" className="hover:text-ocean-600">Contact</Link>
          </nav>
          <div className="relative">
            <details className="group">
              <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">
                  👤
                </span>
              </summary>
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                <div className="px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{user?.name || 'Learner'}</p>
                  <p className="text-xs text-slate-500">{user?.email || ''}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm" id="modules-list">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Modules</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">Module list</h2>
              <p className="mt-1 text-sm text-slate-500">Complete each module to unlock the next.</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="text-lg">📘</span>
              {modules.length} modules · Complete sequentially.
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total progress</span>
              <span>{totalProgress}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white">
              <div className="h-2 rounded-full bg-ocean-600" style={{ width: `${totalProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {completedCount} module{completedCount === 1 ? '' : 's'} completed
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {modules.map((moduleItem) => (
              <div
                key={moduleItem.id}
                className={`rounded-2xl border p-4 ${
                  moduleItem.isActive ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-4">
                    <Image
                      src="/images/hero.jpg"
                      alt="Module preview"
                      width={92}
                      height={92}
                      className="hidden h-20 w-20 rounded-2xl object-cover md:block"
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase text-ocean-600">Module {moduleItem.order}</p>
                      <h3 className="text-base font-semibold text-slate-900">{moduleItem.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{moduleItem.description}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {moduleItem.mediaType === 'PRESENTATION' ? 'Presentation' : 'Video'} ·{' '}
                        {moduleItem.durationMinutes} mins
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className="text-xs font-semibold uppercase text-slate-500 whitespace-nowrap">
                      {moduleItem.status?.replace('_', ' ') || 'Not started'}
                    </span>
                    {moduleItem.isActive ? (
                      <button
                        onClick={() => handleStart(moduleItem.id)}
                        className="rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white"
                      >
                        {moduleItem.status === 'NOT_STARTED' ? 'Start module' : 'View module'}
                      </button>
                    ) : (
                      <span className="text-lg text-slate-400">🔒</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm text-slate-500">
            <Link href="/course" className="font-semibold text-ocean-600">
              ← Back to home
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100 text-slate-700">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[2fr,1fr,1fr,1fr]">
            <div className="space-y-4">
              <p className="text-lg font-semibold text-slate-900">Academic Guide Course</p>
              <p className="text-sm text-slate-700">
                Professional development & certification for ALS educators. Built to support real-world academic
                guidance with structured learning and verified progress.
              </p>
              <div className="flex gap-3">
                <span className="rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
                  Certified learning
                </span>
                <span className="rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
                  Guided modules
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Quick links</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="hover:text-blue-700">Packages</li>
                <li className="hover:text-blue-700">Purchase</li>
                <li className="hover:text-blue-700">Login</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Support</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>help@agc-portal.com</li>
                <li>Mon–Fri · 9:00–18:00</li>
                <li>Response within 24 hours</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Stay updated</p>
              <p className="text-sm text-slate-700">
                Get updates on module releases and certification announcements.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-blue-200 pt-6 text-xs text-slate-600 md:flex-row">
            <span>© 2026 Academic Guide Course. All rights reserved.</span>
            <div className="flex gap-4">
              <span className="hover:text-blue-700">Privacy</span>
              <span className="hover:text-blue-700">Terms</span>
              <span className="hover:text-blue-700">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
