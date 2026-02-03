'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listAdminPurchases } from '@/lib/api';

export default function DashboardPurchasesPage() {
  const { user, token } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);

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
          {purchases.map((purchase) => (
            <div key={purchase.id} className="rounded-xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-800">{purchase.organization?.name}</p>
              <p className="text-sm text-slate-500">Package: {purchase.packageType}</p>
              <p className="text-xs text-slate-400">Purchased by {purchase.purchasedBy?.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
