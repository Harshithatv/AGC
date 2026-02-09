'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPricing } from '@/lib/api';

const defaultOrder = ['SINGLE', 'GROUP', 'INSTITUTION'];

const defaultMeta: Record<string, { label: string; summary: string; icon: string; features: string[] }> = {
  SINGLE: {
    label: 'Single User',
    summary: 'Best for individual Academic Guides who want personal certification.',
    icon: '👤',
    features: ['Personal dashboard', 'All course modules', 'Completion certificate', 'One-time purchase']
  },
  GROUP: {
    label: 'Group',
    summary: 'For small teams needing shared oversight and consistent standards.',
    icon: '👥',
    features: ['Group admin access', 'Bulk user upload', 'Team progress tracking', 'Certification for all members']
  },
  INSTITUTION: {
    label: 'Institution',
    summary: 'For institutions scaling quality training across their staff.',
    icon: '🏫',
    features: ['Institution admin access', 'Bulk user upload', 'QA reporting dashboard', 'Scalable user management']
  }
};

const roleOptions = [
  'Principal',
  'Head Teacher',
  'Academic Coordinator',
  'School Administrator',
  'Instructional Lead'
];

type PackageType = string;

type DetailsForm = {
  packageType: PackageType;
  fullName: string;
  email: string;
  password: string;
  instituteName: string;
  roleAtSchool: string;
  agree: boolean;
};

const initialForm: DetailsForm = {
  packageType: 'SINGLE',
  fullName: '',
  email: '',
  password: '',
  instituteName: '',
  roleAtSchool: '',
  agree: false
};

const STORAGE_KEY = 'agc_purchase_details';

export default function PurchaseDetailsPage() {
  const router = useRouter();

  const [form, setForm] = useState<DetailsForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [pricing, setPricing] = useState<
    Array<{
      packageType: string;
      amount: number;
      currency: string;
      maxUsers?: number;
      label?: string;
      summary?: string;
      features?: string[];
    }>
  >([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedFromUrl = (params.get('package') || '').toUpperCase();
    if (selectedFromUrl) {
      setForm((prev) => ({ ...prev, packageType: selectedFromUrl as PackageType }));
    }
  }, []);

  useEffect(() => {
    getPricing()
      .then((data) => setPricing(data as Array<{ packageType: string; amount: number; currency: string }>))
      .catch(() => setPricing([]));
  }, []);

  const pricingMap = useMemo(() => {
    const map = new Map<string, { amount: number; currency: string; maxUsers?: number; label?: string; summary?: string; features?: string[] }>();
    pricing.forEach((item) =>
      map.set(item.packageType, {
        amount: item.amount,
        currency: item.currency,
        maxUsers: item.maxUsers,
        label: item.label,
        summary: item.summary,
        features: item.features
      })
    );
    return map;
  }, [pricing]);

  const packageOptions = useMemo(() => {
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
    const item =
      pricingMap.get(type) ||
      ({
        SINGLE: { amount: 50, currency: 'USD', maxUsers: 1 },
        GROUP: { amount: 100, currency: 'USD', maxUsers: 5 },
        INSTITUTION: { amount: 200, currency: 'USD', maxUsers: 10 }
      } as const)[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    if (!item) return '$0';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item.currency || 'USD',
      maximumFractionDigits: 0
    });
    return formatter.format(item.amount);
  };

  const formatUsers = (type: string) => {
    const item =
      pricingMap.get(type) ||
      ({
        SINGLE: { maxUsers: 1 },
        GROUP: { maxUsers: 5 },
        INSTITUTION: { maxUsers: 10 }
      } as const)[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    if (!item?.maxUsers) return 'Users';
    if (item.maxUsers === 1) return '1 user';
    return `Up to ${item.maxUsers} users`;
  };

  const getMeta = (type: string) => {
    const item = pricingMap.get(type);
    const fallback = defaultMeta[type];
    return {
      label: item?.label || fallback?.label || type,
      summary: item?.summary || fallback?.summary || '',
      icon: fallback?.icon || '📦',
      features: (Array.isArray(item?.features) && item.features.length > 0) ? item.features : (fallback?.features || [])
    };
  };

  const handleChange = (field: keyof DetailsForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    router.push('/purchase/payment');
  };

  const selectedMeta = getMeta(form.packageType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-600 text-sm font-semibold text-white">1</span>
            <span className="text-sm font-semibold text-ocean-600">Your Details</span>
          </div>
          <div className="h-px w-12 bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-500">2</span>
            <span className="text-sm text-slate-400">Payment</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Get started with Academic Guide Training & Certification</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Select your package and enter your details to create your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            {/* Left column - form */}
            <div className="space-y-6">

              {/* Package Selection */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Choose your package</h2>
                    <p className="mt-1 text-sm text-slate-500">All packages include mandatory modules, progress tracking, and certification.</p>
                  </div>
                  <Link href="/packages" className="hidden items-center gap-1 text-xs font-semibold text-ocean-600 hover:underline sm:inline-flex">
                     ← Compare all
                   
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {packageOptions.map((option) => {
                    const meta = getMeta(option.value);
                    const isSelected = form.packageType === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 text-sm transition-all ${
                          isSelected
                            ? 'border-ocean-500 bg-ocean-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="packageType"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => handleChange('packageType', option.value)}
                          className="sr-only"
                        />
                        {isSelected ? (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-ocean-600">
                            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : null}
                        <span className="text-2xl">{meta.icon}</span>
                        <p className="mt-2 font-semibold text-slate-900">{meta.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatUsers(option.value)}</p>
                        <p className="mt-2 text-lg font-bold text-ocean-600">{formatPrice(option.value)}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{meta.summary}</p>
                      </label>
                    );
                  })}
                </div>
                <Link href="/packages" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-ocean-600 hover:underline sm:hidden">
                  Compare all packages
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Features of selected package */}
              {selectedMeta.features.length > 0 ? (
                <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                    What&apos;s included in {selectedMeta.label}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedMeta.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                        <svg className="h-4 w-4 flex-shrink-0 text-ocean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* User Details Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">Your details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {form.packageType === 'SINGLE'
                    ? 'Create your personal learner account.'
                    : form.packageType === 'GROUP'
                      ? 'You\'ll be the group admin. Add learners from your dashboard after purchase.'
                      : 'You\'ll be the institution admin. Manage staff training from your dashboard.'}
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {form.packageType === 'INSTITUTION' ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        Institute name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={form.instituteName}
                        onChange={(event) => handleChange('instituteName', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="e.g., ALS International School"
                      />
                    </div>
                  ) : null}
                  {form.packageType === 'INSTITUTION' ? (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Your role at school <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={form.roleAtSchool}
                        onChange={(event) => handleChange('roleAtSchool', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                      >
                        <option value="">Select your role</option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.fullName}
                      onChange={(event) => handleChange('fullName', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                      placeholder="name@domain.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        minLength={6}
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => handleChange('password', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Must be at least 6 characters</p>
                  </div>
                </div>
                <label className="mt-6 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    required
                    checked={form.agree}
                    onChange={(event) => handleChange('agree', event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ocean-600"
                  />
                  <span>
                    I agree to the <span className="font-medium text-ocean-600">terms and conditions</span> and confirm the details provided are accurate.
                  </span>
                </label>
              </div>

              {/* Submit button (visible on mobile below sidebar) */}
              <button
                type="submit"
                className="w-full rounded-xl bg-ocean-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-700 active:scale-[0.98] lg:hidden"
              >
                Continue to payment →
              </button>
            </div>

            {/* Right column - sidebar summary */}
            <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
              {/* Order Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-500 px-5 py-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Order summary</p>
                  <p className="mt-1 text-xl font-bold">{selectedMeta.label}</p>
                  <p className="mt-0.5 text-sm text-white/80">{formatUsers(form.packageType)}</p>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Package</span>
                    <span className="font-semibold text-slate-900">{selectedMeta.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Users</span>
                    <span className="font-semibold text-slate-900">{formatUsers(form.packageType)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Billing</span>
                    <span className="font-semibold text-slate-900">One-time</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Certification</span>
                    <span className="font-semibold text-ocean-600">Included ✓</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-900">Total</span>
                      <span className="text-xl font-bold text-slate-900">{formatPrice(form.packageType)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What you get */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What you get</p>
                <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                      <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Mandatory modules with video &amp; PDF content
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                      <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Sequential unlocks &amp; progress tracking
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                      <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Certificate issued on completion
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                      <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {form.packageType === 'SINGLE' ? 'Personal learning dashboard' : 'Admin dashboard with analytics'}
                  </li>
                </ul>
              </div>

              {/* CTA - desktop */}
              <button
                type="submit"
                className="hidden w-full rounded-xl bg-ocean-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-700 active:scale-[0.98] lg:block"
              >
                Continue to payment →
              </button>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure checkout
                </span>
                <span>•</span>
                <span>One-time payment</span>
                <span>•</span>
                <span>Instant access</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
