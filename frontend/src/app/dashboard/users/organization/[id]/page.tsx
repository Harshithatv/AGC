'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getAdminOrganization, listAdminOrganizationUsers } from '@/lib/api';
import Pagination from '@/components/Pagination';

type Organization = {
  id: string;
  name: string;
  type: 'SINGLE' | 'GROUP' | 'INSTITUTION';
  maxUsers: number;
  startDate: string;
  purchases?: Array<{ purchasedAt: string }>;
  adminName?: string;
};

type UserProgress = {
  completedCount: number;
  totalModules: number;
  allCompleted: boolean;
};

type OrganizationUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  progress: UserProgress;
  certificate: { issuedAt: string } | null;
};

export default function AdminOrganizationUsersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [userPage, setUserPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const cleanGroupSuffix = (value?: string) => (value ? value.replace(/\s+Group$/i, '') : '');

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== 'SYSTEM_ADMIN') {
      router.push('/dashboard');
      return;
    }

    getAdminOrganization(token, id).then((data) => setOrganization(data as Organization));
    listAdminOrganizationUsers(token, id).then((data) => setUsers(data as OrganizationUser[]));
  }, [token, user, id, router]);

  const primaryPurchase = useMemo(
    () => organization?.purchases?.[0]?.purchasedAt ?? null,
    [organization]
  );

  const orgType = (organization?.type || '').toUpperCase();
  const orgName = cleanGroupSuffix(organization?.name);
  const adminName = organization?.adminName || '';

  const displayName =
    orgType === 'INSTITUTION' && adminName
      ? `${adminName} - ${orgName}`
      : orgName || 'Account';

  const typeLabel =
    orgType === 'SINGLE'
      ? 'Single User'
      : orgType === 'GROUP'
        ? 'Group'
        : orgType === 'INSTITUTION'
          ? 'Institution'
          : orgType || 'Unknown';

  const typeBadgeColor =
    orgType === 'SINGLE'
      ? 'bg-blue-50 text-blue-700'
      : orgType === 'GROUP'
        ? 'bg-purple-50 text-purple-700'
        : orgType === 'INSTITUTION'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-600';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Account profile</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeBadgeColor}`}>
                {typeLabel}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {displayName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Users: {users.length}/{organization?.maxUsers ?? 0}
            </p>
            {primaryPurchase ? (
              <p className="mt-1 text-xs text-slate-500">
                Latest purchase: {new Date(primaryPurchase).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            ) : null}
          </div>
          <Link href="/dashboard/users" className="text-sm font-semibold text-ocean-600">
            ← Back to user directory
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Learners</h3>
        </div>

        {(() => {
          const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
          const paginatedUsers = users.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);
          return (
            <>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {paginatedUsers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-4 text-sm font-semibold text-slate-500">No users yet</p>
              {/* <p className="mt-1 text-xs text-slate-400">No learners have been added to this account.</p> */}
            </div>
          )}
          {paginatedUsers.map((member) => {
            const total = member.progress?.totalModules ?? 0;
            const completed = member.progress?.completedCount ?? 0;
            const percent = total ? Math.round((completed / total) * 100) : 0;

            return (
              <Link
                key={member.id}
                href={`/dashboard/users/user/${member.id}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      member.progress?.allCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {member.progress?.allCompleted ? 'Certified' : 'In progress'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {completed} of {total} modules
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white">
                    <div className="h-2 rounded-full bg-ocean-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={userPage}
            totalPages={totalPages}
            totalItems={users.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setUserPage}
          />
        </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
