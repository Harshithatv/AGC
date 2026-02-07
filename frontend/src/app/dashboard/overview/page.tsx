'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getCertificate,
  getCertificationStats,
  getMyModules,
  getOrganization,
  listAdminOrganizations,
  listAdminPurchases,
  listAllModules
} from '@/lib/api';

export default function DashboardOverviewPage() {
  const { user, token } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [adminOrgs, setAdminOrgs] = useState<any[]>([]);
  const [adminPurchases, setAdminPurchases] = useState<any[]>([]);
  const [adminModules, setAdminModules] = useState<any[]>([]);
  const [certStats, setCertStats] = useState<{ totalLearners: number; certifiedCount: number } | null>(null);
  const [certificate, setCertificate] = useState<any>(null);

  const roleLabel = useMemo(() => {
    if (!user) return 'Dashboard';
    if (user.role === 'SYSTEM_ADMIN') return 'System Admin Overview';
    if (user.role === 'ORG_ADMIN') return 'Admin Overview';
    return 'Learning Overview';
  }, [user]);

  useEffect(() => {
    if (!token || !user) return;

    const load = async () => {
      if (user.role === 'SYSTEM_ADMIN') {
        const [orgs, purchases, moduleList, certificationStats] = await Promise.all([
          listAdminOrganizations(token),
          listAdminPurchases(token),
          listAllModules(token),
          getCertificationStats(token)
        ]);
        setAdminOrgs(orgs as any[]);
        setAdminPurchases(purchases as any[]);
        setAdminModules(moduleList as any[]);
        setCertStats(certificationStats as { totalLearners: number; certifiedCount: number });
      }

      if (user.role === 'ORG_ADMIN') {
        const [orgData, moduleData] = await Promise.all([
          getOrganization(token),
          getMyModules(token)
        ]);
        setOrg(orgData);
        setModules(moduleData as any[]);
        return;
      }

      if (user.role === 'ORG_USER') {
        const [moduleData, certData] = await Promise.all([
          getMyModules(token),
          getCertificate(token)
        ]);
        setModules(moduleData as any[]);
        setCertificate(certData);
      }
    };

    load();
  }, [token, user]);

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <p className="text-xs text-slate-500 sm:text-sm">Dashboard</p>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{roleLabel}</h2>
        <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">Welcome back, {user.name}.</p>
      </div>

      {user.role === 'SYSTEM_ADMIN' ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-6 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xs text-slate-500 sm:text-sm">Learners</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">
                {certStats?.totalLearners ?? adminOrgs.reduce((total, item) => total + (item.userCount ?? 0), 0)}
              </p>
              <p className="mt-1 text-xs text-slate-400 sm:mt-2">Across all accounts</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xs text-slate-500 sm:text-sm">Certified</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">
                {certStats?.certifiedCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-400 sm:mt-2">Completed all modules</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xs text-slate-500 sm:text-sm">Purchases</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">{adminPurchases.length}</p>
              <p className="mt-1 text-xs text-slate-400 sm:mt-2">New package requests</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xs text-slate-500 sm:text-sm">Modules</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">{adminModules.length}</p>
              <p className="mt-1 text-xs text-slate-400 sm:mt-2">Published content</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold sm:text-lg">Learner activity</h3>
                <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs font-semibold text-ocean-600 sm:px-3 sm:py-1">30 days</span>
              </div>
              <div className="mt-4 h-36 rounded-2xl bg-gradient-to-br from-ocean-50 to-white p-3 sm:mt-6 sm:h-48 sm:p-4">
                <svg viewBox="0 0 400 120" className="h-full w-full">
                  <polyline
                    fill="none"
                    stroke="#3a6ff0"
                    strokeWidth="4"
                    points="0,90 60,70 120,76 180,52 240,60 300,40 360,22 400,30"
                  />
                  <circle cx="360" cy="22" r="6" fill="#3a6ff0" />
                </svg>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <h3 className="text-base font-semibold sm:text-lg">Latest purchases</h3>
              <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                {adminPurchases.slice(0, 3).map((purchase) => (
                  <div key={purchase.id} className="rounded-lg border border-slate-100 p-2 text-sm sm:rounded-xl sm:p-3">
                    <p className="truncate font-semibold text-slate-800">{purchase.organization?.name}</p>
                    <p className="text-xs text-slate-500">
                      {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {user.role === 'ORG_ADMIN' ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Users</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{org?.userCount ?? 0}</p>
              <p className="mt-2 text-xs text-slate-400">Active learners</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Certified</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{org?.certifiedCount ?? 0}</p>
              <p className="mt-2 text-xs text-slate-400">Completed all modules</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Modules</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{modules.length}</p>
              <p className="mt-2 text-xs text-slate-400">Published content</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Account summary</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Account name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{org?.name ?? '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">User limit</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {org?.userCount ?? 0}/{org?.maxUsers ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Start date</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {org?.startDate ? new Date(org.startDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Modules assigned</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{modules.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Progress snapshot</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total modules</span>
                  <span className="font-semibold text-slate-900">{modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active learners</span>
                  <span className="font-semibold text-slate-900">{org?.userCount ?? 0}</span>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                  Track learner progress under Users.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {user.role === 'ORG_USER' ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Your modules</h3>
            <p className="mt-2 text-sm text-slate-600">Total modules: {modules.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Certification</h3>
            <p className="mt-2 text-sm text-slate-600">
              Completed {certificate?.completedCount ?? 0} of {certificate?.totalModules ?? 0}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
