'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getAdminOrganization, listAdminOrganizationUsers } from '@/lib/api';

type Organization = {
  id: string;
  name: string;
  type: 'SINGLE' | 'GROUP' | 'INSTITUTION';
  maxUsers: number;
  startDate: string;
  purchases?: Array<{ purchasedAt: string }>;
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Account profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {cleanGroupSuffix(organization?.name) || 'Account'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Users: {users.length}/{organization?.maxUsers ?? 0}
            </p>
            {primaryPurchase ? (
              <p className="mt-1 text-xs text-slate-500">
                Latest purchase: {new Date(primaryPurchase).toLocaleDateString()}
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

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {users.map((member) => {
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
      </div>
    </div>
  );
}
