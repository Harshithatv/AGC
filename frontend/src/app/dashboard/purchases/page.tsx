'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listAdminPurchases } from '@/lib/api';
import Pagination from '@/components/Pagination';

const packageLabels: Record<string, string> = {
  SINGLE: 'Single User',
  GROUP: 'Group',
  INSTITUTION: 'Institution'
};

const packageColors: Record<string, { bg: string; text: string; dot: string }> = {
  SINGLE: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  GROUP: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  INSTITUTION: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' }
};

export default function DashboardPurchasesPage() {
  const { user, token } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const cleanGroupSuffix = (value?: string) => (value ? value.replace(/\s+Group$/i, '') : '');

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === 'SYSTEM_ADMIN') {
      listAdminPurchases(token).then((data) => setPurchases(data as any[]));
    }
  }, [token, user]);

  // Dynamically get all unique package types from the data
  const allPackageTypes = useMemo(() => {
    const types = new Set<string>();
    purchases.forEach((p) => {
      if (p.packageType) types.add(p.packageType);
      if (p.organization?.type) types.add(p.organization.type);
    });
    // Sort: SINGLE, GROUP, INSTITUTION first, then custom
    const order = ['SINGLE', 'GROUP', 'INSTITUTION'];
    return Array.from(types).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const orgName = cleanGroupSuffix(p.organization?.name) || '';
      const buyerName = p.purchasedBy?.name || '';
      const buyerEmail = p.purchasedBy?.email || '';
      const matchesSearch =
        !search ||
        orgName.toLowerCase().includes(search.toLowerCase()) ||
        buyerName.toLowerCase().includes(search.toLowerCase()) ||
        buyerEmail.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'ALL' || p.packageType === filterType || p.organization?.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [purchases, search, filterType]);

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = useMemo(() => {
    return filteredPurchases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredPurchases, currentPage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTypeLabel = (type: string) => packageLabels[type] || type;
  const getTypeColors = (type: string) => packageColors[type] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500' };

  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Purchases are available for System Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Package Purchases</h2>
        <p className="mt-1 text-sm text-slate-500">Track all package purchases, buyer details, and organization information.</p>
      </div>

      {/* Search + Dropdown filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, email, or organization..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Package:</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
            >
              <option value="ALL">All Packages</option>
              {allPackageTypes.map((type) => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchase list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Desktop table header */}
        <div className="hidden border-b border-slate-100 px-5 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
          <div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</div>
          <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Package</div>
          <div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Purchased By</div>
          <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Users</div>
          <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Date</div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="p-10 text-center">
            <span className="text-3xl">📭</span>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {search || filterType !== 'ALL' ? 'No purchases match your filters' : 'No purchases yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {search || filterType !== 'ALL' ? 'Try adjusting your search or filter criteria.' : 'Purchases will appear here once users buy packages.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedPurchases.map((purchase) => {
              const orgName = cleanGroupSuffix(purchase.organization?.name) || 'Unknown';
              const orgType = purchase.organization?.type || purchase.packageType;
              const maxUsers = purchase.organization?.maxUsers;
              const colors = getTypeColors(orgType);
              const buyer = purchase.purchasedBy;

              return (
                <div
                  key={purchase.id}
                  className="px-5 py-4 transition hover:bg-slate-50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* Organization */}
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-800">{orgName}</p>
                    <p className="mt-0.5 text-xs text-slate-400 sm:hidden">
                      {formatDate(purchase.purchasedAt)}
                    </p>
                  </div>

                  {/* Package type */}
                  <div className="col-span-2 mt-2 sm:mt-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      {getTypeLabel(orgType)}
                    </span>
                  </div>

                  {/* Purchased by */}
                  <div className="col-span-3 mt-2 sm:mt-0">
                    {buyer ? (
                      <div>
                        <p className="text-sm text-slate-700">{buyer.name}</p>
                        <p className="text-xs text-slate-400">{buyer.email}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">—</p>
                    )}
                  </div>

                  {/* Max users */}
                  <div className="col-span-2 mt-2 sm:mt-0">
                    <p className="text-sm text-slate-700">
                      {maxUsers ? (maxUsers === 1 ? '1 user' : `${maxUsers} users`) : '—'}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 mt-2 hidden sm:mt-0 sm:block">
                    <p className="text-sm text-slate-700">{formatDate(purchase.purchasedAt)}</p>
                    <p className="text-xs text-slate-400">{formatTime(purchase.purchasedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredPurchases.length > 0 ? (
          <div className="px-5 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPurchases.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
