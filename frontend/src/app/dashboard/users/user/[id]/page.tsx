'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getAdminUserProgress } from '@/lib/api';

type UserProgressDetails = {
  user: { id: string; name: string; email: string; role: string };
  organization: { id: string; name: string; type: string } | null;
  progress: { completedCount: number; totalModules: number; allCompleted: boolean };
  lastCompletedModule: { id: string; title: string; order: number } | null;
  certificate: { issuedAt: string; program: string } | null;
  modules: Array<{
    id: string;
    title: string;
    order: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  }>;
};

export default function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [details, setDetails] = useState<UserProgressDetails | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== 'SYSTEM_ADMIN') {
      router.push('/dashboard');
      return;
    }

    getAdminUserProgress(token, id).then((data) => setDetails(data as UserProgressDetails));
  }, [token, user, id, router]);

  const summary = details?.progress;
  const percent = useMemo(() => {
    if (!summary?.totalModules) return 0;
    return Math.round((summary.completedCount / summary.totalModules) * 100);
  }, [summary]);

  if (!details) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Learner profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{details.user.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{details.user.email}</p>
            {/* <p className="mt-1 text-xs text-slate-500">
              {details.organization?.name || 'Account'} · {details.organization?.type || 'Unknown'} package
            </p> */}
          </div>
          <Link href="/dashboard/users" className="text-sm font-semibold text-ocean-600">
            ← Back to user directory
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Module progress</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {percent}% complete
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total progress</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white">
              <div className="h-2 rounded-full bg-ocean-600" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {summary?.completedCount ?? 0} of {summary?.totalModules ?? 0} modules completed
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {details.modules.map((moduleItem) => (
              <div key={moduleItem.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-ocean-600">Module {moduleItem.order}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{moduleItem.title}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      moduleItem.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : moduleItem.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {moduleItem.status?.replace('_', ' ') || 'Not started'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {moduleItem.completedAt
                    ? `Completed on ${new Date(moduleItem.completedAt).toLocaleDateString()}`
                    : moduleItem.startedAt
                      ? `Started on ${new Date(moduleItem.startedAt).toLocaleDateString()}`
                      : 'Not started yet'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Latest completion</h3>
            <p className="mt-2 text-sm text-slate-600">
              {details.lastCompletedModule
                ? `Module ${details.lastCompletedModule.order}: ${details.lastCompletedModule.title}`
                : 'No modules completed yet.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Certificate status</h3>
            {details.certificate ? (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                Certificate achieved on {new Date(details.certificate.issuedAt).toLocaleDateString()}.
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Certificate not yet achieved.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
