'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { completeModule, getCertificate, getMyModules, startModule } from '@/lib/api';

export default function DashboardCoursePage() {
  const { user, token } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url: string) => (url.startsWith('http') ? url : `${apiBaseUrl}${url}`);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    getMyModules(token).then((data) => setModules(data as any[]));
    getCertificate(token).then((data) => setCertificate(data));
  }, [token, user]);

  useEffect(() => {
    if (!modules.length) return;
    if (selectedId && modules.some((moduleItem) => moduleItem.id === selectedId)) return;
    const firstActive = modules.find((moduleItem) => moduleItem.isActive) || modules[0];
    setSelectedId(firstActive?.id ?? null);
  }, [modules, selectedId]);

  if (!user) return null;

  const selectedModule = useMemo(
    () => modules.find((moduleItem) => moduleItem.id === selectedId) || null,
    [modules, selectedId]
  );

  const handleStart = async (id: string) => {
    if (!token) return;
    await startModule(token, id);
    const moduleData = await getMyModules(token);
    setModules(moduleData as any[]);
  };

  const handleComplete = async (id: string) => {
    if (!token) return;
    await completeModule(token, id);
    const moduleData = await getMyModules(token);
    setModules(moduleData as any[]);
    const certData = await getCertificate(token);
    setCertificate(certData);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Academic Guide Course</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Your personalised learning workspace
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Follow each module in sequence, track your progress, and complete the programme to unlock your
              certification.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-400">Modules</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{modules.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-400">Completed</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{certificate?.completedCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-400">Certificate</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {certificate?.certificate ? 'Issued' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-ocean-100/70" />
            <Image
              src="/images/learning.jpg"
              alt="Course learning"
              width={720}
              height={520}
              className="relative w-full rounded-3xl object-cover shadow-md"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6" id="modules">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Course modules</h3>
                <p className="mt-1 text-sm text-slate-500">Watch modules in order to unlock the next lesson.</p>
              </div>
              <Image src="/images/modules.svg" alt="Modules icon" width={40} height={40} />
            </div>
            <div className="mt-4 space-y-4">
              {modules.map((moduleItem) => {
                const isSelected = moduleItem.id === selectedId;
                return (
                  <button
                    key={moduleItem.id}
                    onClick={() => setSelectedId(moduleItem.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-ocean-200 bg-ocean-50/40'
                        : 'border-slate-100 bg-white hover:border-ocean-100'
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
                          <h4 className="text-base font-semibold text-slate-900">{moduleItem.title}</h4>
                          <p className="mt-1 text-sm text-slate-600">{moduleItem.description}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {moduleItem.mediaType === 'PRESENTATION' ? 'Presentation' : 'Video'} ·{' '}
                            {moduleItem.durationMinutes} mins
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className="text-xs font-semibold uppercase text-slate-500">
                          {moduleItem.status?.replace('_', ' ') || 'Not started'}
                        </span>
                        {moduleItem.isActive ? (
                          <>
                            {moduleItem.status === 'NOT_STARTED' ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStart(moduleItem.id);
                                }}
                                className="rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white"
                              >
                                Start module
                              </button>
                            ) : null}
                            {moduleItem.status !== 'COMPLETED' ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleComplete(moduleItem.id);
                                }}
                                className="rounded-xl border border-ocean-200 px-4 py-2 text-xs font-semibold text-ocean-700"
                              >
                                Mark completed
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Locked</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" id="support">
            <p className="font-semibold text-slate-800">Need support?</p>
            <p className="mt-2">Contact support@agc-portal.com for assistance.</p>
            <Link href="/" className="mt-3 inline-flex text-sm font-semibold text-ocean-600">
              Back to programme
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Now viewing</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{selectedModule?.title || 'Select a module'}</h3>
            <p className="mt-2 text-sm text-slate-600">{selectedModule?.description}</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {selectedModule?.mediaUrl ? (
                selectedModule.mediaType === 'PRESENTATION' ? (
                  <iframe
                    src={resolveMediaUrl(selectedModule.mediaUrl)}
                    title="Presentation"
                    className="h-72 w-full"
                  />
                ) : (
                  <video controls className="h-72 w-full object-cover">
                    <source src={resolveMediaUrl(selectedModule.mediaUrl)} />
                  </video>
                )
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                  No media uploaded for this module.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm" id="certificate">
            <h3 className="text-lg font-semibold">Certification</h3>
            <p className="mt-2 text-sm text-slate-600">
              Completed {certificate?.completedCount ?? 0} of {certificate?.totalModules ?? 0} modules.
            </p>
            {certificate?.certificate ? (
              <div className="mt-4 rounded-xl border border-ocean-100 bg-ocean-50 p-4 text-sm text-ocean-700">
                <p className="font-semibold">Certificate issued</p>
                <p>Issued to: {certificate.certificate.issuedTo}</p>
                <p>Programme: {certificate.certificate.program}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                Complete all modules to unlock certification.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
