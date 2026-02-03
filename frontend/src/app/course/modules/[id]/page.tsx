'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { completeModule, getCertificate, getMyModules, startModule } from '@/lib/api';

export default function ModuleViewerPage() {
  const params = useParams<{ id: string }>();
  const moduleId = params?.id;
  const router = useRouter();
  const { user, token, logout, ready } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url: string) => (url.startsWith('http') ? url : `${apiBaseUrl}${url}`);

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
    getCertificate(token).then((data) => setCertificate(data));
  }, [token, user, router, ready]);

  const moduleItem = useMemo(
    () => modules.find((item) => item.id === moduleId) || null,
    [modules, moduleId]
  );

  const handleStart = async () => {
    if (!token || !moduleId) return;
    await startModule(token, moduleId);
    const moduleData = await getMyModules(token);
    setModules(moduleData as any[]);
  };

  const handleComplete = async () => {
    if (!token || !moduleId) return;
    await completeModule(token, moduleId);
    const moduleData = await getMyModules(token);
    setModules(moduleData as any[]);
    const certData = await getCertificate(token);
    setCertificate(certData);
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
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">👤</span>
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
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                Module {moduleItem?.order ?? '-'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {moduleItem?.title || 'Module'}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{moduleItem?.description}</p>
            </div>
            <Link href="/course/modules" className="text-sm font-semibold text-ocean-600">
              ← Back to modules
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {moduleItem?.mediaUrl ? (
                moduleItem.mediaType === 'PRESENTATION' ? (
                  <iframe
                    src={resolveMediaUrl(moduleItem.mediaUrl)}
                    title="Presentation"
                    className="h-80 w-full"
                  />
                ) : (
                  <video controls className="h-80 w-full object-cover">
                    <source src={resolveMediaUrl(moduleItem.mediaUrl)} />
                  </video>
                )
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  No media uploaded for this module.
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Module status</p>
              <p className="mt-2 text-sm text-slate-600 whitespace-nowrap">
                {moduleItem?.status?.replace('_', ' ') || 'Not started'}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {moduleItem?.isActive ? (
                  moduleItem.status === 'NOT_STARTED' ? (
                    <button
                      onClick={handleStart}
                      className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Start module
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-ocean-200 bg-white px-3 py-2 text-xs font-semibold text-ocean-700"
                    >
                      <span>✅</span>
                      Mark completed
                    </button>
                  )
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                    <span>🔒</span> Locked
                  </div>
                )}
              </div>
              <div className="mt-5 text-xs text-slate-500">
                Completed {certificate?.completedCount ?? 0} of {certificate?.totalModules ?? 0} modules.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.svg" alt="AGC logo" width={32} height={32} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Academic Guide Course</p>
              <p className="text-xs text-slate-500">Learner portal</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>support@agc-portal.com</span>
            <span>+91 90000 00000</span>
            <span>© 2026 AGC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
