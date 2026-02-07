'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPricing } from '@/lib/api';

const defaultOrder = ['SINGLE', 'GROUP', 'INSTITUTION'];

const defaultMeta = {
  SINGLE: {
    label: 'Single User',
    summary: 'Best for individual Academic Guides.'
  },
  GROUP: {
    label: 'Group',
    summary: 'For teams needing shared oversight.'
  },
  INSTITUTION: {
    label: 'Institution',
    summary: 'For institutions scaling training.'
  }
} as const;

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
    const map = new Map<string, { amount: number; currency: string; maxUsers?: number; label?: string; summary?: string }>();
    pricing.forEach((item) =>
      map.set(item.packageType, {
        amount: item.amount,
        currency: item.currency,
        maxUsers: item.maxUsers,
        label: item.label,
        summary: item.summary
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

  const selectedPackage = useMemo(
    () => packageOptions.find((option) => option.value === form.packageType),
    [form.packageType, packageOptions]
  );

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

  const formatLabel = (type: string) => {
    const item = pricingMap.get(type);
    const fallback = defaultMeta[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    return item?.label || fallback?.label || type;
  };

  const formatSummary = (type: string) => {
    const item = pricingMap.get(type);
    const fallback = defaultMeta[type as 'SINGLE' | 'GROUP' | 'INSTITUTION'];
    return item?.summary || fallback?.summary || 'Package description';
  };

  const handleChange = (field: keyof DetailsForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    router.push('/purchase/payment');
  };

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr]">
          <div className="h-full">
            <div className="relative h-full min-h-[520px] overflow-hidden rounded-3xl">
              <Image
                src="/images/purchase-details.jpg"
                alt="Academic Guide Course"
                width={720}
                height={720}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/35 to-transparent" />
              <div className="absolute inset-x-0 top-0 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Step 1</p>
                <h1 className="mt-2 text-3xl font-semibold">Enter your details</h1>
                <p className="mt-2 text-sm text-white/90">
                  Create your Academic Guide Course account and confirm your package.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Package selection</h2>
                <Link href="/packages" className="text-xs font-semibold text-ocean-600">
                  View packages
                </Link>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {packageOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${
                      form.packageType === option.value
                        ? 'border-ocean-500 bg-ocean-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="packageType"
                      value={option.value}
                      checked={form.packageType === option.value}
                      onChange={() => handleChange('packageType', option.value)}
                      className="sr-only"
                    />
                    <p className="font-semibold text-slate-900">{formatLabel(option.value)}</p>
                    <p className="text-xs text-ocean-600">{formatUsers(option.value)}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatPrice(option.value)}</p>
                    {/* <p className="mt-2 text-xs text-slate-500">{formatSummary(option.value)}</p> */}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                <span>
                  Selected: <span className="font-semibold text-slate-700">{formatLabel(form.packageType)}</span>
                </span>
                <span className="font-semibold text-slate-700">{formatPrice(form.packageType)}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">User details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {form.packageType === 'INSTITUTION' ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Institute name</label>
                    <input
                      required
                      value={form.instituteName}
                      onChange={(event) => handleChange('instituteName', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2"
                      placeholder="ALS Institution"
                    />
                  </div>
                ) : null}
                {form.packageType === 'INSTITUTION' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Your role at school</label>
                    <select
                      required
                      value={form.roleAtSchool}
                      onChange={(event) => handleChange('roleAtSchool', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2"
                    >
                      <option value="">Select role</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full name</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) => handleChange('fullName', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                    placeholder="Priya Sharma"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                    placeholder="name@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => handleChange('password', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 pr-12"
                      placeholder="Create a secure password"
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
                </div>
              </div>
              <label className="mt-6 flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={form.agree}
                  onChange={(event) => handleChange('agree', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  I agree to the terms and conditions and confirm the details provided are accurate.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-ocean-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700"
            >
              Continue to payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
