'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getPricing } from '@/lib/api';

const defaultOrder = ['SINGLE', 'GROUP', 'INSTITUTION'];

const defaultMeta = {
  SINGLE: {
    label: 'Single User',
    summary: 'Ideal for individual Academic Guides who want certification and personal tracking.',
    features: ['Personal dashboard', 'All 5 modules', 'Certification included', 'No annual subscription'],
    highlight: false
  },
  GROUP: {
    label: 'Group',
    summary: 'Best for small teams that need a shared learning plan and consistent standards.',
    features: ['Group admin access', 'Bulk user upload', 'Team progress view', 'Certification included'],
    highlight: true
  },
  INSTITUTION: {
    label: 'Institution',
    summary: 'Built for institutions that need scalable onboarding and quality assurance.',
    features: ['Institution admin access', 'Bulk user upload', 'QA reporting', 'Certification included'],
    highlight: false
  }
} as const;

export default function PackagesPage() {
  const [pricing, setPricing] = useState<
    Array<{
      packageType: string;
      amount: number;
      currency: string;
      maxUsers?: number;
      label?: string;
      summary?: string;
      features?: string[];
      highlight?: boolean;
    }>
  >([]);

  useEffect(() => {
    getPricing()
      .then((data) => setPricing(data as Array<{ packageType: string; amount: number; currency: string; maxUsers?: number }>))
      .catch(() => setPricing([]));
  }, []);

  const pricingMap = useMemo(() => {
    const map = new Map<
      string,
      {
        amount: number;
        currency: string;
        maxUsers?: number;
        label?: string;
        summary?: string;
        features?: string[];
        highlight?: boolean;
      }
    >();
    pricing.forEach((item) =>
      map.set(item.packageType, {
        amount: item.amount,
        currency: item.currency,
        maxUsers: item.maxUsers,
        label: item.label,
        summary: item.summary,
        features: item.features,
        highlight: item.highlight
      })
    );
    return map;
  }, [pricing]);

  const packageList = useMemo(() => {
    if (pricing.length === 0) {
      return defaultOrder.map((value) => ({ value }));
    }

    const listed = new Set<string>();
    const ordered = defaultOrder
      .filter((value) => pricingMap.has(value))
      .map((value) => {
        listed.add(value);
        return { value };
      });

    const extras = pricing
      .map((item) => item.packageType)
      .filter((value) => !listed.has(value))
      .map((value) => ({ value }));

    return [...ordered, ...extras];
  }, [pricing, pricingMap]);

  const formatPrice = (type: string) => {
    const fallback =
      ({
        SINGLE: { amount: 50, currency: 'USD', maxUsers: 1 },
        GROUP: { amount: 100, currency: 'USD', maxUsers: 5 },
        INSTITUTION: { amount: 200, currency: 'USD', maxUsers: 10 }
      } as const)[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    const item = pricingMap.get(type) || fallback;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item.currency || 'USD',
      maximumFractionDigits: 0
    }).format(item.amount);
  };

  const formatUsers = (type: string) => {
    const fallback =
      ({
        SINGLE: { maxUsers: 1 },
        GROUP: { maxUsers: 5 },
        INSTITUTION: { maxUsers: 10 }
      } as const)[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    const item = pricingMap.get(type) || fallback;
    if (!item?.maxUsers) return 'Users';
    if (item.maxUsers === 1) return '1 user';
    return `Up to ${item.maxUsers} users`;
  };

  const getMeta = (type: string) => {
    const item = pricingMap.get(type);
    const fallback = defaultMeta[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    const label = item?.label || fallback?.label || type;
    const summary = item?.summary || fallback?.summary || 'Package description';
    const highlight = typeof item?.highlight === 'boolean' ? item.highlight : fallback?.highlight || false;
    const features =
      Array.isArray(item?.features) && item.features.length > 0
        ? item.features
        : fallback?.features || [];
    return { label, summary, highlight, features };
  };
  return (
    <div className="bg-white">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">Academic Guide Course Packages</h1>
          <p className="mt-3 text-sm text-slate-600 sm:mt-4 sm:text-base">
            All packages are one-time purchases with mandatory modules and certification.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {packageList.map((item) => {
            const meta = getMeta(item.value);
            return (
            <div
              key={item.value}
              className={`flex h-full flex-col rounded-2xl border ${
                meta.highlight ? 'border-ocean-200 bg-ocean-50' : 'border-slate-200 bg-white'
              } p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">{meta.label}</h3>
                {meta.highlight ? (
                  <span className="rounded-full bg-ocean-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium text-ocean-600">{formatUsers(item.value)}</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{formatPrice(item.value)}</p>
              <p className="mt-4 text-sm text-slate-600">{meta.summary}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {meta.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-ocean-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/purchase/details?package=${item.value}`}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  meta.highlight
                    ? 'bg-ocean-600 text-white hover:bg-ocean-700'
                    : 'border border-slate-200 text-slate-700 hover:border-ocean-300'
                }`}
              >
                Purchase package
              </Link>
            </div>
          );
        })}
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">What’s included in every package</h2>
            <p className="text-slate-600">
              Five mandatory modules, progress tracking, and certification delivered through a standard portal.
            </p>
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">Video lessons and presentations</div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">Sequential module unlocks</div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">Completion-based certification</div>
            </div>
          </div>
          <div>
            <Image
              src="/images/certification.jpg"
              alt="Certification"
              width={720}
              height={540}
              className="rounded-3xl shadow-lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
