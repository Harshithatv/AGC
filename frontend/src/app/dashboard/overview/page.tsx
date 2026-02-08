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
        <div className="space-y-5 sm:space-y-6">
          {/* User breakdown cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ocean-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-ocean-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Total Learners</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {certStats?.totalLearners ?? adminOrgs.reduce((total, item) => total + (item.userCount ?? 0), 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Total Single User</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {adminOrgs.filter((o) => (o.type || '').toUpperCase() === 'SINGLE').length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Total Groups</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {adminOrgs.filter((o) => (o.type || '').toUpperCase() === 'GROUP').length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-violet-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Total Institutions</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {adminOrgs.filter((o) => (o.type || '').toUpperCase() === 'INSTITUTION').length}
                </p>
              </div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Certified</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">{certStats?.certifiedCount ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-rose-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Purchases</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">{adminPurchases.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-cyan-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Modules</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">{adminModules.length}</p>
              </div>
            </div>
          </div>

          {/* Graph + Latest purchases */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Learner activity</h3>
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
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Latest purchases</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {adminPurchases.length} total
                </span>
              </div>
              {adminPurchases.length === 0 ? (
                <p className="mt-4 text-center text-sm text-slate-400">No purchases yet</p>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {adminPurchases.slice(0, 4).map((purchase) => {
                    const orgType = (purchase.organization?.type || '').toUpperCase();
                    const badgeColor =
                      orgType === 'SINGLE' ? 'bg-blue-50 text-blue-600'
                      : orgType === 'GROUP' ? 'bg-emerald-50 text-emerald-600'
                      : orgType === 'INSTITUTION' ? 'bg-violet-50 text-violet-600'
                      : 'bg-slate-50 text-slate-600';
                    const typeLabel =
                      orgType === 'SINGLE' ? 'Single'
                      : orgType === 'GROUP' ? 'Group'
                      : orgType === 'INSTITUTION' ? 'Institution'
                      : orgType || '—';
                    return (
                      <div key={purchase.id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{purchase.organization?.name}</p>
                          <p className="text-xs text-slate-400">
                            {purchase.purchasedBy?.name ? `by ${purchase.purchasedBy.name}` : ''}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>
                          {typeLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
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
