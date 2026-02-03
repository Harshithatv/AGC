'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getPricing } from '@/lib/api';

const packages = [
  {
    name: 'Single User',
    type: 'SINGLE',
    users: '1 user',
    summary: 'For individual Academic Guides who want certification and personal tracking.',
    features: [
      'Personal dashboard',
      'All 5 mandatory modules',
      'Video + presentation resources',
      'Certification included',
      'No annual subscription'
    ],
    tag: 'Best for individuals',
    highlight: false
  },
  {
    name: 'Group',
    type: 'GROUP',
    users: 'Up to 5 users',
    summary: 'Ideal for small teams that need shared oversight and consistent outcomes.',
    features: [
      'Group admin access',
      'Bulk user upload',
      'Team progress tracking',
      'Module deadline tracking',
      'Certification included'
    ],
    tag: 'Most popular',
    highlight: true
  },
  {
    name: 'Institution',
    type: 'INSTITUTION',
    users: 'Up to 10 users',
    summary: 'Designed for institutions scaling quality-assured training.',
    features: [
      'Institution admin access',
      'Bulk user upload',
      'Quality assurance reporting',
      'Organization-level oversight',
      'Certification included'
    ],
    tag: 'For institutions',
    highlight: false
  }
];

export default function PackagesPage() {
  const [pricing, setPricing] = useState<Array<{ packageType: string; amount: number; currency: string }>>([]);

  useEffect(() => {
    getPricing()
      .then((data) => setPricing(data as Array<{ packageType: string; amount: number; currency: string }>))
      .catch(() => setPricing([]));
  }, []);

  const pricingMap = useMemo(() => {
    const map = new Map<string, { amount: number; currency: string }>();
    pricing.forEach((item) => map.set(item.packageType, { amount: item.amount, currency: item.currency }));
    return map;
  }, [pricing]);

  const formatPrice = (type: string) => {
    const item =
      pricingMap.get(type) ||
      ({
        SINGLE: { amount: 50, currency: 'USD' },
        GROUP: { amount: 100, currency: 'USD' },
        INSTITUTION: { amount: 200, currency: 'USD' }
      } as const)[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    if (!item) return '$0';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item.currency || 'USD',
      maximumFractionDigits: 0
    });
    return formatter.format(item.amount);
  };

  return (
    <div className="bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Academic Guide Course Packages</h1>
          <p className="mt-4 text-slate-600">
            Choose a package that fits your team size. One-time purchase, no annual subscription.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {packages.map((item) => (
            <div
              key={item.name}
              className={`relative flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                item.highlight ? 'border-ocean-300 bg-ocean-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ocean-600">{item.tag}</p>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">{item.users}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{formatPrice(item.type)}</p>
              <p className="text-xs text-slate-500">One-time purchase</p>
              <p className="mt-4 text-sm text-slate-600">{item.summary}</p>
              <div className="mt-6 space-y-3 text-sm text-slate-700">
                {item.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-ocean-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-400">Pricing</p>
                  <p className="font-semibold text-slate-900">One-time</p>
                </div>
                <span className="text-xs text-slate-500">No recurring fees</span>
              </div>
              <Link
                href={`/purchase/details?package=${item.type}`}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  item.highlight
                    ? 'bg-ocean-600 text-white hover:bg-ocean-700'
                    : 'border border-slate-200 text-slate-700 hover:border-ocean-300'
                }`}
              >
                Purchase package
              </Link>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
}
