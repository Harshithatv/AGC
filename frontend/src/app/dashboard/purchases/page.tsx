'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listAdminPurchases } from '@/lib/api';

export default function DashboardPurchasesPage() {
  const { user, token } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const cleanGroupSuffix = (value?: string) => (value ? value.replace(/\s+Group$/i, '') : '');

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === 'SYSTEM_ADMIN') {
      listAdminPurchases(token).then((data) => setPurchases(data as any[]));
    }
  }, [token, user]);

  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Purchases are available for System Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Package purchases</h2>
        <p className="mt-2 text-sm text-slate-600">View recent package purchases.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-3">
          {purchases.map((purchase) => {
            const displayName = cleanGroupSuffix(purchase.organization?.name) || 'Unknown';
            
            return (
              <div key={purchase.id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-400">
                  {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
