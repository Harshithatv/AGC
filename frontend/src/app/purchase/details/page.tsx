'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPricing } from '@/lib/api';

const packageOptions = [
  {
    label: 'Single User',
    value: 'SINGLE',
    users: '1 user',
    summary: 'Best for individual Academic Guides.'
  },
  {
    label: 'Group',
    value: 'GROUP',
    users: 'Up to 5 users',
    summary: 'For teams needing shared oversight.'
  },
  {
    label: 'Institution',
    value: 'INSTITUTION',
    users: 'Up to 10 users',
    summary: 'For institutions scaling training.'
  }
];

const roleOptions = [
  'Principal',
  'Head Teacher',
  'Academic Coordinator',
  'School Administrator',
  'Instructional Lead'
];

type PackageType = 'SINGLE' | 'GROUP' | 'INSTITUTION';

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
  const [pricing, setPricing] = useState<Array<{ packageType: string; amount: number; currency: string }>>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedFromUrl = (params.get('package') || '').toUpperCase();
    if (selectedFromUrl === 'SINGLE' || selectedFromUrl === 'GROUP' || selectedFromUrl === 'INSTITUTION') {
      setForm((prev) => ({ ...prev, packageType: selectedFromUrl as PackageType }));
    }
  }, []);

  useEffect(() => {
    getPricing()
      .then((data) => setPricing(data as Array<{ packageType: string; amount: number; currency: string }>))
      .catch(() => setPricing([]));
  }, []);

  const selectedPackage = useMemo(
    () => packageOptions.find((option) => option.value === form.packageType),
    [form.packageType]
  );

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
                    <p className="font-semibold text-slate-900">{option.label}</p>
                    <p className="text-xs text-ocean-600">{option.users}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatPrice(option.value)}</p>
                    <p className="mt-2 text-xs text-slate-500">{option.summary}</p>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                <span>
                  Selected: <span className="font-semibold text-slate-700">{selectedPackage?.label}</span>
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
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                    placeholder="Create a secure password"
                  />
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
