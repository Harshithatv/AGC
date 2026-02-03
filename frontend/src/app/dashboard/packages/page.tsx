'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listAdminPricing, updatePricing, getOrganization, getPricing } from '@/lib/api';

export default function DashboardPackagesPage() {
  const { user, token } = useAuth();
  const [adminPricing, setAdminPricing] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [publicPricing, setPublicPricing] = useState<any[]>([]);

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    if (!token || !user) return;

    if (user.role === 'SYSTEM_ADMIN') {
      listAdminPricing(token).then((data) => setAdminPricing(data as any[]));
    }

    if (user.role === 'ORG_ADMIN') {
      Promise.all([getOrganization(token), getPricing()]).then(([orgData, pricing]) => {
        setOrg(orgData);
        setPublicPricing(pricing as any[]);
      });
    }
  }, [token, user]);

  const handlePricingChange = (packageType: string, amount: number) => {
    setAdminPricing((prev) =>
      prev.map((item) => (item.packageType === packageType ? { ...item, amount } : item))
    );
  };

  const handleSavePricing = async (packageType: 'SINGLE' | 'GROUP' | 'INSTITUTION', amount: number, currency?: string) => {
    if (!token) return;
    await updatePricing(token, { packageType, amount, currency });
    const pricing = await listAdminPricing(token);
    setAdminPricing(pricing as any[]);
  };

  const packagePrice = useMemo(() => {
    if (!org) return null;
    return publicPricing.find((item) => item.packageType === org.type) || null;
  }, [org, publicPricing]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Packages</h2>
        <p className="mt-2 text-sm text-slate-600">Manage package pricing and view current package details.</p>
      </div>

      {user.role === 'SYSTEM_ADMIN' ? (
        <div className="grid gap-6 md:grid-cols-3">
          {adminPricing.map((item) => (
            <div key={item.packageType} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">{item.packageType}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(item.amount, item.currency || 'USD')}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number"
                  value={item.amount}
                  onChange={(event) => handlePricingChange(item.packageType, Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  onClick={() =>
                    handleSavePricing(item.packageType as 'SINGLE' | 'GROUP' | 'INSTITUTION', item.amount, item.currency)
                  }
                  className="rounded-xl bg-ocean-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {user.role === 'ORG_ADMIN' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Current package</h3>
          {org ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Organization</p>
                <p className="mt-1 font-semibold text-slate-900">{org.name}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Package</p>
                <p className="mt-1 font-semibold text-slate-900">{org.type}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Users</p>
                <p className="mt-1 font-semibold text-slate-900">{org.userCount}/{org.maxUsers}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Price</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {packagePrice ? formatCurrency(packagePrice.amount, packagePrice.currency || 'USD') : 'N/A'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
