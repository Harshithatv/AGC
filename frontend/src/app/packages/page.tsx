'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getPricing } from '@/lib/api';

const defaultOrder = ['SINGLE', 'GROUP', 'INSTITUTION'];

const defaultMeta: Record<string, { label: string; summary: string; features: string[]; highlight: boolean; icon: string }> = {
  SINGLE: {
    label: 'Single User',
    summary: 'Ideal for individual Academic Guides who want certification and personal tracking.',
    features: ['Personal dashboard', 'All course modules', 'Certification included', 'One-time purchase'],
    highlight: false,
    icon: '👤'
  },
  GROUP: {
    label: 'Group',
    summary: 'Best for small teams that need a shared learning plan and consistent standards.',
    features: ['Group admin access', 'Bulk user upload', 'Team progress tracking', 'Certification included'],
    highlight: true,
    icon: '👥'
  },
  INSTITUTION: {
    label: 'Institution',
    summary: 'Built for institutions that need scalable onboarding and quality assurance.',
    features: ['Institution admin access', 'Bulk user upload', 'QA reporting dashboard', 'Certification included'],
    highlight: false,
    icon: '🏫'
  }
};

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
    const fallback = defaultMeta[type];
    const label = item?.label || fallback?.label || type;
    const summary = item?.summary || fallback?.summary || 'Package description';
    const highlight = typeof item?.highlight === 'boolean' ? item.highlight : fallback?.highlight || false;
    const features =
      Array.isArray(item?.features) && item.features.length > 0
        ? item.features
        : fallback?.features || [];
    const icon = fallback?.icon || '📦';
    return { label, summary, highlight, features, icon };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero section */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
        <div className="text-center">
          <span className="inline-block rounded-full bg-ocean-100 px-4 py-1.5 text-xs font-semibold text-ocean-700">
            Flexible Packages
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Choose the right plan for you
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
            All packages include mandatory course modules, sequential progress tracking, and professional certification upon completion.
          </p>
        </div>
      </section>

      {/* Package cards */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {packageList.map((item) => {
            const meta = getMeta(item.value);
            return (
              <div
                key={item.value}
                className={`relative flex h-full flex-col rounded-2xl border-2 ${
                  meta.highlight
                    ? 'border-ocean-300 bg-white shadow-lg shadow-ocean-100/50'
                    : 'border-slate-200 bg-white shadow-sm'
                } p-6 transition-shadow hover:shadow-md`}
              >
                {meta.highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ocean-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                ) : null}
                <div className="mb-4">
                  <span className="text-3xl">{meta.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{meta.label}</h3>
                <p className="mt-1 text-sm font-medium text-ocean-600">{formatUsers(item.value)}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{formatPrice(item.value)}</span>
                  <span className="text-sm text-slate-400">one-time</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{meta.summary}</p>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">What&apos;s included</p>
                  <ul className="space-y-2.5 text-sm text-slate-700">
                    {meta.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-ocean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto pt-6">
                  <Link
                    href={`/purchase/details?package=${item.value}`}
                    className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      meta.highlight
                        ? 'bg-ocean-600 text-white hover:bg-ocean-700 active:scale-[0.98]'
                        : 'border-2 border-slate-200 text-slate-700 hover:border-ocean-300 hover:text-ocean-600'
                    }`}
                  >
                    Get started →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* What's included section */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Everything you need to succeed</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              Every package comes with the same powerful features to help you complete the Academic Guide Course.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-100 text-2xl">🎥</div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800">Video Lessons</h3>
              <p className="mt-1 text-xs text-slate-500">Professional video content for each module</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-100 text-2xl">📄</div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800">PDF Materials</h3>
              <p className="mt-1 text-xs text-slate-500">Downloadable resources and guides</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-100 text-2xl">📊</div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800">Progress Tracking</h3>
              <p className="mt-1 text-xs text-slate-500">Sequential module unlocks with real-time tracking</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-100 text-2xl">🏆</div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800">Certification</h3>
              <p className="mt-1 text-xs text-slate-500">Professional certificate issued on completion</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="border-t border-slate-100">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-800">What happens after I purchase?</h3>
              <p className="mt-2 text-sm text-slate-600">
                You&apos;ll receive login credentials immediately. You can start accessing course modules right away through your personal dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-800">Can I add more users later?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Group and Institution packages come with a set user limit. Contact support if you need to increase your capacity.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-800">How does certification work?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Complete all mandatory modules sequentially. Once the last module is done, your certificate is automatically issued and accessible from your dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-800">Is this a one-time payment?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Yes! All packages are one-time purchases with no recurring fees. You get lifetime access to your course content and certificate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="border-t border-slate-100 bg-gradient-to-br from-ocean-50 to-blue-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h2 className="text-2xl font-bold text-slate-900">Ready to get started?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose your package and begin your Academic Guide certification journey today.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/purchase/details?package=SINGLE"
              className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-ocean-300"
            >
              Single User
            </Link>
            <Link
              href="/purchase/details?package=GROUP"
              className="rounded-xl bg-ocean-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-700"
            >
              Group — Most Popular
            </Link>
            <Link
              href="/purchase/details?package=INSTITUTION"
              className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-ocean-300"
            >
              Institution
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
