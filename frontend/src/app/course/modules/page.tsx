'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getCertificate, getMyModules, startModule } from '@/lib/api';

export default function CourseModulesPage() {
  const router = useRouter();
  const { user, token, logout, ready } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCertified = !!certificate?.certificate;
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
    getCertificate(token).then((data) => setCertificate(data));
  }, [token, user, router, ready]);

  const maxOrder = modules.length ? Math.max(...modules.map((m) => m.order ?? 0)) : 0;

  const handleStart = async (id: string) => {
    if (!token) return;
    await startModule(token, id);
    router.push(`/course/modules/${id}`);
  };

  const handleDownloadCertificate = async () => {
    if (!certificate?.certificate) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setDrawColor(224, 200, 120);
    doc.setLineWidth(5);
    doc.rect(28, 28, pageWidth - 56, pageHeight - 56);
    doc.setDrawColor(230, 232, 240);
    doc.setLineWidth(1.5);
    doc.rect(44, 44, pageWidth - 88, pageHeight - 88);

    doc.setTextColor(176, 132, 40);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('ACADEMIC GUIDE COURSE', pageWidth / 2, 110, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    doc.text('Certificate of Completion', pageWidth / 2, 155, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('This is to certify that', pageWidth / 2, 200, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(30);
    doc.text(certificate.certificate.issuedTo, pageWidth / 2, 245, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('has successfully completed the programme', pageWidth / 2, 285, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.text(certificate.certificate.program, pageWidth / 2, 320, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const issuedDate = new Date(certificate.certificate.issuedAt).toLocaleDateString();
    doc.text(`Issued to: ${certificate.certificate.issuedEmail}`, pageWidth / 2, 360, { align: 'center' });
    doc.text(`Issued on: ${issuedDate}`, pageWidth / 2, 382, { align: 'center' });

    doc.setDrawColor(176, 132, 40);
    doc.setLineWidth(1);
    doc.circle(pageWidth / 2, pageHeight - 130, 36, 'S');
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('AGC', pageWidth / 2, pageHeight - 126, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Certified', pageWidth / 2, pageHeight - 112, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('Academic Guide Course & Certification', pageWidth / 2, pageHeight - 70, { align: 'center' });
    doc.text('AGC Learning Portal', pageWidth / 2, pageHeight - 52, { align: 'center' });

    doc.save(`AGC-Certificate-${certificate.certificate.issuedTo.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/images/logo.svg" alt="AGC logo" width={36} height={36} className="h-8 w-8 sm:h-10 sm:w-10" />
            <div>
              <p className="hidden text-xs uppercase tracking-wide text-slate-400 sm:block">Academic Guide Course</p>
              <h1 className="text-sm font-semibold text-slate-900 sm:text-lg">Learner Portal</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 lg:flex">
            <Link href="/course#program" className="hover:text-ocean-600">Programme</Link>
            <Link href="/course/modules" className="hover:text-ocean-600">Modules</Link>
            <Link href="/course#how-it-works" className="hover:text-ocean-600">How it works</Link>
            <Link href="/course#certification" className="hover:text-ocean-600">Certification</Link>
            <Link href="/course#contact" className="hover:text-ocean-600">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 lg:hidden"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <div className="relative">
              <details className="group">
                <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-white p-1.5 text-sm font-semibold text-slate-700 sm:p-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm sm:h-8 sm:w-8">
                    👤
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  <div className="px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{user?.name || 'Learner'}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
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
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              <Link href="/course#program" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Programme</Link>
              <Link href="/course/modules" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Modules</Link>
              <Link href="/course#how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">How it works</Link>
              <Link href="/course#certification" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Certification</Link>
              <Link href="/course#contact" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6" id="modules-list">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Modules</p>
              <h2 className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">Module list</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Complete each module to unlock the next.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:gap-4 sm:px-4 sm:py-3 sm:text-sm">
              <span className="text-base sm:text-lg">📘</span>
              <span className="whitespace-nowrap">{modules.length} modules</span>
            </div>
          </div>
          <div className={`mt-4 rounded-2xl border p-4 ${isCertified ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total progress</span>
              <span className={isCertified ? 'text-emerald-600' : ''}>{isCertified ? '100' : totalProgress}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white">
              <div className={`h-2 rounded-full ${isCertified ? 'bg-emerald-500' : 'bg-ocean-600'}`} style={{ width: isCertified ? '100%' : `${totalProgress}%` }} />
            </div>
            <p className={`mt-2 text-xs ${isCertified ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}>
              {isCertified ? (
                <span className="flex items-center gap-1">🏅 All modules completed · Certificate issued</span>
              ) : (
                <>{completedCount} module{completedCount === 1 ? '' : 's'} completed</>
              )}
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {modules.map((moduleItem) => {
              const isLast = moduleItem.order === maxOrder;
              return (
              <div
                key={moduleItem.id}
                className={`rounded-2xl border p-4 ${
                  isCertified && isLast
                    ? 'border-ocean-200 bg-gradient-to-br from-ocean-50/50 to-blue-50/50'
                    : moduleItem.isActive
                      ? 'border-slate-100 bg-white'
                      : 'border-slate-100 bg-slate-50'
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
                      {moduleItem.files?.length ? (
                        <p className="mt-2 text-xs text-slate-500">
                          {moduleItem.files.length} file{moduleItem.files.length === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className={`text-xs font-semibold uppercase whitespace-nowrap ${isCertified ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isCertified ? 'Completed' : (moduleItem.status?.replace('_', ' ') || 'Not started')}
                    </span>
                    {isCertified && isLast ? (
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                          <span className="text-sm">🎓</span>
                          <span className="text-xs font-semibold text-emerald-700">Certification Achieved</span>
                        </div>
                        <button
                          onClick={handleDownloadCertificate}
                          className="inline-flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ocean-700 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Certificate
                        </button>
                      </div>
                    ) : isCertified ? (
                      <button
                        disabled
                        className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 opacity-70"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </button>
                    ) : moduleItem.isActive ? (
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
              );
            })}
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
