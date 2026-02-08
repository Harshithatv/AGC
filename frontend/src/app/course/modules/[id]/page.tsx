'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { completeModule, completeModuleFile, getCertificate, getMyModules, startModule, startModuleFile } from '@/lib/api';

export default function ModuleViewerPage() {
  const params = useParams<{ id: string }>();
  const moduleId = params?.id;
  const router = useRouter();
  const { user, token, logout, ready } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [showCertificatePopup, setShowCertificatePopup] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url: string) => (url.startsWith('http') ? url : `${apiBaseUrl}${url}`);
  const getPdfViewerUrl = (url: string) => {
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

  const isCertified = !!certificate?.certificate;
  const isLastModule = useMemo(() => {
    if (!modules.length || !moduleItem) return false;
    const maxOrder = Math.max(...modules.map((m) => m.order ?? 0));
    return moduleItem.order === maxOrder;
  }, [modules, moduleItem]);
  const moduleFiles = useMemo(() => moduleItem?.files ?? [], [moduleItem]);

  const selectedFile = useMemo(() => {
    if (!moduleFiles.length) return null;
    if (selectedFileId) {
      return moduleFiles.find((file: any) => file.id === selectedFileId) || moduleFiles[0];
    }
    return moduleFiles.find((file: any) => file.isActive) || moduleFiles[0];
  }, [moduleFiles, selectedFileId]);

  useEffect(() => {
    if (moduleFiles.length && !selectedFileId) {
      const next = moduleFiles.find((file: any) => file.isActive) || moduleFiles[0];
      setSelectedFileId(next?.id ?? null);
    }
  }, [moduleFiles, selectedFileId]);

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

  const handleStartFile = async (fileId: string) => {
    if (!token || !moduleId) return;
    await startModuleFile(token, moduleId, fileId);
    const moduleData = await getMyModules(token);
    setModules(moduleData as any[]);
  };

  const handleCompleteFile = async (fileId: string) => {
    if (!token || !moduleId) return;
    await completeModuleFile(token, moduleId, fileId);
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
    const currentIndex = moduleFiles.findIndex((file: any) => file.id === fileId);
    if (currentIndex >= 0 && currentIndex < moduleFiles.length - 1) {
      const nextFile = moduleFiles[currentIndex + 1];
      setSelectedFileId(nextFile?.id ?? null);
    }
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
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm sm:h-8 sm:w-8">👤</span>
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
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                Module {moduleItem?.order ?? '-'}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                {moduleItem?.title || 'Module'}
              </h2>
              <p className="mt-2 text-xs text-slate-600 sm:text-sm">{moduleItem?.description}</p>
            </div>
            <Link href="/course/modules" className="text-sm font-semibold text-ocean-600">
              ← Back to modules
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {selectedFile?.mediaUrl || moduleItem?.mediaUrl ? (
                  (selectedFile?.mediaType || moduleItem?.mediaType) === 'VIDEO' ? (
                    <video controls className="h-80 w-full object-cover">
                      <source src={resolveMediaUrl(selectedFile?.mediaUrl || moduleItem?.mediaUrl)} />
                    </video>
                  ) : (
                    <iframe
                      src={getPdfViewerUrl(resolveMediaUrl(selectedFile?.mediaUrl || moduleItem?.mediaUrl))}
                      title="Module file"
                      className="h-80 w-full"
                    />
                  )
                ) : (
                  <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                    No media uploaded for this module.
                  </div>
                )}
              </div>
              {moduleFiles.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Module files</p>
                  <div className="mt-3 space-y-2">
                    {moduleFiles.map((file: any) => {
                      const isSelected = selectedFile?.id === file.id;
                      const isInProgress = file.status === 'IN_PROGRESS';
                      const isCompleted = file.status === 'COMPLETED';
                      return (
                        <button
                          key={file.id}
                          onClick={() => (isCertified || file.isActive) && setSelectedFileId(file.id)}
                          disabled={!isCertified && !file.isActive}
                          className={`relative flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                            isCertified
                              ? 'border-emerald-100 bg-emerald-50/50'
                              : isInProgress && isSelected
                                ? 'border-ocean-500 bg-ocean-50 ring-2 ring-ocean-200'
                                : isInProgress
                                  ? 'border-ocean-300 bg-ocean-50/60 hover:border-ocean-400'
                                  : isCompleted
                                    ? 'border-emerald-200 bg-emerald-50/40'
                                    : file.isActive
                                      ? 'border-slate-200 bg-white hover:border-ocean-300'
                                      : 'border-slate-100 bg-slate-50 text-slate-400'
                          } ${!isCertified && isSelected && !isInProgress ? 'border-ocean-400 bg-ocean-50' : ''}`}
                        >
                          <span className="flex items-center gap-2">
                            {isCertified ? (
                              <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : isCompleted ? (
                              <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : isInProgress ? (
                              <span className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center">
                                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-ocean-400 opacity-50" />
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-ocean-500" />
                              </span>
                            ) : (
                              <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-[9px] font-bold text-slate-400">
                                {file.order}
                              </span>
                            )}
                            <span className={`font-medium ${
                              isCertified ? 'text-slate-600'
                                : isInProgress ? 'text-ocean-800'
                                : isCompleted ? 'text-slate-700'
                                : 'text-slate-900'
                            }`}>
                              {file.title || `${file.mediaType || 'File'}`}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            {!isCertified && isInProgress ? (
                              <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ocean-700">
                                In progress
                              </span>
                            ) : (
                              <span className={`text-xs ${
                                isCertified ? 'font-semibold text-emerald-600'
                                  : isCompleted ? 'font-semibold text-emerald-600'
                                  : 'text-slate-500'
                              }`}>
                                {isCertified ? 'Completed' : isCompleted ? 'Completed' : (file.status?.replace('_', ' ') || 'Not started')}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Module status</p>
              <p className={`mt-2 text-sm whitespace-nowrap ${isCertified ? 'font-semibold text-emerald-600' : 'text-slate-600'}`}>
                {isCertified ? 'Completed' : (moduleItem?.status?.replace('_', ' ') || 'Not started')}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {isCertified ? (
                  moduleFiles.length ? (
                    <button
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 opacity-70"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      File completed
                    </button>
                  ) : (
                    <button
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 opacity-70"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Module completed
                    </button>
                  )
                ) : moduleItem?.isActive ? (
                  moduleFiles.length ? (
                    selectedFile?.status === 'NOT_STARTED' ? (
                      <button
                        onClick={() => handleStartFile(selectedFile.id)}
                        className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Start file
                      </button>
                    ) : selectedFile?.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => handleCompleteFile(selectedFile.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-ocean-200 bg-white px-3 py-2 text-xs font-semibold text-ocean-700"
                      >
                        <span>✅</span>
                        Mark file completed
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700">
                        File completed
                      </div>
                    )
                  ) : moduleItem.status === 'NOT_STARTED' ? (
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
              {isCertified ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <span>🏅</span> Certificate issued
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-600">
                      All modules completed. Your certificate has been issued.
                    </p>
                  </div>
                  {isLastModule ? (
                    <div className="rounded-xl border border-ocean-200 bg-gradient-to-br from-ocean-50 to-blue-50 p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎓</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Certification Achieved!</p>
                          <p className="text-[11px] text-slate-600">Download your certificate below</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadCertificate}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Certificate
                      </button>
                      <Link
                        href="/course#certification"
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        View certificate page
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
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
