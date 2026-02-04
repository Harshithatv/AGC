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
  const [showCertificatePopup, setShowCertificatePopup] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url: string) => (url.startsWith('http') ? url : `${apiBaseUrl}${url}`);
  const getPresentationViewerUrl = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return url;
    }
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  };

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
    const certData = (await getCertificate(token)) as {
      certificate?: { issuedTo: string; issuedEmail: string; issuedAt: string; program: string } | null;
      completedCount?: number;
      totalModules?: number;
    };
    setCertificate(certData as any);
    if (certData?.certificate && certData?.completedCount === certData?.totalModules) {
      setShowCertificatePopup(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showCertificatePopup ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Certificate achieved</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Congratulations!</h2>
                <p className="mt-2 text-sm text-slate-600">
                  You have completed all modules. Your Academic Guide certificate is now available.
                </p>
              </div>
              <button
                onClick={() => setShowCertificatePopup(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-ocean-100 bg-ocean-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg">🏅</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Certificate ready</p>
                  <p className="text-xs text-slate-600">View and download from the certification section.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/course#certification"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                View certificate
              </Link>
              <button
                onClick={() => setShowCertificatePopup(false)}
                className="inline-flex items-center justify-center rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
                    src={getPresentationViewerUrl(resolveMediaUrl(moduleItem.mediaUrl))}
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
