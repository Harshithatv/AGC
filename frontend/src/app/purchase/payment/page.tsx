'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPricing, purchasePackage } from '@/lib/api';

const paymentOptions = [
  {
    value: 'card',
    label: 'Credit / Debit Card',
    helper: 'We will contact you to process card payment securely.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    value: 'upi',
    label: 'UPI / Instant Transfer',
    helper: 'Use your UPI ID. Invoice will be shared for payment.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    value: 'bank',
    label: 'Bank Transfer',
    helper: 'Standard invoice and bank details will be provided.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }
];

const STORAGE_KEY = 'agc_purchase_details';

type PackageType = string;

type StoredDetails = {
  packageType: PackageType;
  fullName: string;
  email: string;
  password: string;
  instituteName: string;
  roleAtSchool: string;
  agree: boolean;
};

export default function PurchasePaymentPage() {
  const router = useRouter();
  const [details, setDetails] = useState<StoredDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardForm, setCardForm] = useState({
    nameOnCard: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [pricing, setPricing] = useState<
    Array<{
      packageType: string;
      amount: number;
      currency: string;
      maxUsers?: number;
      label?: string;
    }>
  >([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      router.replace('/purchase/details');
      return;
    }
    setDetails(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    getPricing()
      .then((data) => setPricing(data as Array<{ packageType: string; amount: number; currency: string }>))
      .catch(() => setPricing([]));
  }, []);

  const packageLabel = useMemo(() => {
    if (!details) return '';
    const fallback =
      ({
        SINGLE: 'Single User',
        GROUP: 'Group',
        INSTITUTION: 'Institution'
      } as const)[details.packageType];
    const item = pricing.find((price) => price.packageType === details.packageType);
    return item?.label || fallback || details.packageType || 'Package';
  }, [details, pricing]);

  const packageUsers = useMemo(() => {
    if (!details) return '';
    const fallback = ({
      SINGLE: 1,
      GROUP: 5,
      INSTITUTION: 10
    } as const)[details.packageType];
    const item = pricing.find((price) => price.packageType === details.packageType);
    const maxUsers = item?.maxUsers ?? fallback;
    if (!maxUsers) return 'Users';
    if (maxUsers === 1) return '1 user';
    return `Up to ${maxUsers} users`;
  }, [details, pricing]);

  const formattedPrice = useMemo(() => {
    const fallback =
      ({
        SINGLE: { amount: 50, currency: 'USD' },
        GROUP: { amount: 100, currency: 'USD' },
        INSTITUTION: { amount: 200, currency: 'USD' }
      } as const)[details?.packageType as 'SINGLE' | 'GROUP' | 'INSTITUTION'] || {
        amount: 0,
        currency: 'USD'
      };

    const item = pricing.find((price) => price.packageType === details?.packageType) || fallback;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item.currency || 'USD',
      maximumFractionDigits: 0
    }).format(item.amount);
  }, [pricing, details?.packageType]);

  const handleSubmit = async () => {
    if (!details) return;
    setError('');
    setSuccess(false);
    setLoading(true);

    const adminName = details.roleAtSchool
      ? `${details.fullName} (${details.roleAtSchool})`
      : details.fullName;

    const organizationName =
      details.packageType === 'INSTITUTION'
        ? details.instituteName
        : details.fullName;

    try {
      await purchasePackage({
        packageType: details.packageType,
        organizationName,
        adminName,
        adminEmail: details.email,
        adminPassword: details.password,
        instituteName: details.instituteName,
        roleAtSchool: details.roleAtSchool
      });
      setSuccess(true);
      sessionStorage.removeItem(STORAGE_KEY);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  if (!details) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-600 text-sm font-semibold text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-ocean-600">Details</span>
          </div>
          <div className="h-px w-12 bg-ocean-300" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-600 text-sm font-semibold text-white">2</span>
            <span className="text-sm font-semibold text-ocean-600">Payment</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Complete your purchase</h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose your preferred payment method and confirm your order.
            </p>
          </div>
          <Link href="/purchase/details" className="text-xs font-semibold text-ocean-600 hover:underline">
            ← Edit details
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr,380px]">
          {/* Left column */}
          <div className="space-y-6">

            {/* Account details recap */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Account details</h2>
                <Link href="/purchase/details" className="text-xs font-semibold text-ocean-600 hover:underline">
                  Edit
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-400">Full name</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{details.fullName || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{details.email || '—'}</p>
                </div>
                {details.instituteName ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Institute</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{details.instituteName}</p>
                  </div>
                ) : null}
                {details.roleAtSchool ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Role</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{details.roleAtSchool}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Payment method */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Payment method</h2>
              <p className="mt-1 text-sm text-slate-500">Select how you&apos;d like to pay for your package.</p>
              <div className="mt-4 grid gap-3">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 px-4 py-4 text-sm transition-all ${
                      paymentMethod === option.value
                        ? 'border-ocean-400 bg-ocean-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value)}
                      className="sr-only"
                    />
                    <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      paymentMethod === option.value ? 'bg-ocean-100 text-ocean-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {option.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{option.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{option.helper}</p>
                    </div>
                    {paymentMethod === option.value ? (
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ocean-600">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-slate-300" />
                    )}
                  </label>
                ))}
              </div>

              {paymentMethod === 'card' ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold text-slate-800">Card details</h3>
                  <p className="mt-1 text-xs text-slate-500">Enter your card information below.</p>
                  <div className="mt-4 grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Name on card</label>
                      <input
                        value={cardForm.nameOnCard}
                        onChange={(event) => setCardForm({ ...cardForm, nameOnCard: event.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="Full name as on card"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Card number</label>
                      <input
                        value={cardForm.cardNumber}
                        onChange={(event) => setCardForm({ ...cardForm, cardNumber: event.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Expiry date</label>
                        <input
                          value={cardForm.expiry}
                          onChange={(event) => setCardForm({ ...cardForm, expiry: event.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                          placeholder="MM / YY"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">CVC</label>
                        <input
                          value={cardForm.cvc}
                          onChange={(event) => setCardForm({ ...cardForm, cvc: event.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              {paymentMethod === 'upi' ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold text-slate-800">UPI transfer</h3>
                  <p className="mt-1 text-xs text-slate-500">Provide your UPI details for invoice processing.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">UPI ID</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="name@upi"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Payer name</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              {paymentMethod === 'bank' ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold text-slate-800">Bank transfer</h3>
                  <p className="mt-1 text-xs text-slate-500">Provide your bank transfer details for reference.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Account name</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="Account holder name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Reference ID</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
                        placeholder="Payment reference"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Purchase complete! Redirecting to login...
              </div>
            ) : null}

            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="w-full rounded-xl bg-ocean-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-700 active:scale-[0.98] disabled:opacity-60 lg:hidden"
            >
              {loading ? 'Processing...' : success ? 'Redirecting...' : `Pay ${formattedPrice} — Submit request`}
            </button>
          </div>

          {/* Right column - order summary */}
          <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            {/* Order summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-500 px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Order summary</p>
                <p className="mt-1 text-xl font-bold">{packageLabel} Package</p>
                <p className="mt-0.5 text-sm text-white/80">{packageUsers}</p>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Package</span>
                  <span className="font-semibold text-slate-900">{packageLabel}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Price</span>
                  <span className="font-semibold text-slate-900">{formattedPrice}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Users</span>
                  <span className="font-semibold text-slate-900">{packageUsers}</span>
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
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">{formattedPrice}</span>
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
                  Mandatory modules with video &amp; PDF
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                    <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Sequential unlocks &amp; tracking
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                    <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Certificate on completion
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                    <svg className="h-2.5 w-2.5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Instant dashboard access
                </li>
              </ul>
            </div>

            {/* Submit button - desktop */}
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="hidden w-full rounded-xl bg-ocean-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-700 active:scale-[0.98] disabled:opacity-60 lg:block"
            >
              {loading ? 'Processing...' : success ? 'Redirecting...' : `Pay ${formattedPrice} — Submit request`}
            </button>

            {/* Help */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">💬</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Need help?</p>
                  <p className="text-xs text-slate-500">Contact support@agc-portal.com</p>
                </div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure
              </span>
              <span>•</span>
              <span>One-time payment</span>
              <span>•</span>
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
