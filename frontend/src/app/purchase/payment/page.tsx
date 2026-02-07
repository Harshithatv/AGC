'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPricing, purchasePackage } from '@/lib/api';

const paymentOptions = [
  { value: 'card', label: 'Credit / Debit Card', helper: 'We will contact you to process payment.' },
  { value: 'upi', label: 'UPI / Instant transfer', helper: 'Use your UPI ID once invoice is shared.' },
  { value: 'bank', label: 'Bank Transfer', helper: 'Standard invoice and bank details provided.' }
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
      }, 1200);
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
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Step 2</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Select payment method</h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose your preferred payment option to finalize the package request.
            </p>
          </div>
          <Link href="/purchase/details" className="text-xs font-semibold text-ocean-600">
            Edit details
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Payment method</h2>
              <div className="mt-4 grid gap-3">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-sm transition ${
                      paymentMethod === option.value
                        ? 'border-ocean-400 bg-ocean-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-slate-800">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.helper}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">Select</span>
                  </label>
                ))}
              </div>

              {paymentMethod === 'card' ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Card details</h3>
                  <div className="mt-4 grid gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Name on card
                      </label>
                      <input
                        value={cardForm.nameOnCard}
                        onChange={(event) => setCardForm({ ...cardForm, nameOnCard: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                        placeholder="Priya Sharma"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Card number
                      </label>
                      <input
                        value={cardForm.cardNumber}
                        onChange={(event) => setCardForm({ ...cardForm, cardNumber: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Expiry
                        </label>
                        <input
                          value={cardForm.expiry}
                          onChange={(event) => setCardForm({ ...cardForm, expiry: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          CVC
                        </label>
                        <input
                          value={cardForm.cvc}
                          onChange={(event) => setCardForm({ ...cardForm, cvc: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  
                  </div>
                </div>
              ) : null}
              {paymentMethod === 'upi' ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-800">UPI transfer details</h3>
                  <div className="mt-4 grid gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        UPI ID
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                        placeholder="name@upi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Payer name
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              {paymentMethod === 'bank' ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Bank transfer details</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Account name
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                        placeholder="Account holder name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Reference ID
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                        placeholder="Payment reference"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">Purchase complete! You can now log in.</p> : null}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-ocean-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="rounded-2xl bg-gradient-to-r from-ocean-600 to-ocean-400 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/80">Order summary</p>
                <p className="text-lg font-semibold">{packageLabel} Package</p>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Plan</span>
                  <span className="font-semibold text-slate-900">{packageLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Plan price</span>
                  <span className="font-semibold text-slate-900">{formattedPrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Billing cycle</span>
                  <span className="font-semibold text-slate-700">One-time</span>
                </div>
                <div className="border-t border-slate-200 pt-4 text-xl font-semibold text-slate-900">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span>{formattedPrice}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                {/* <div className="rounded-2xl border border-ocean-100 bg-ocean-50 p-4 text-sm text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Package details</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Users</span>
                      <span className="font-semibold text-slate-900">{packageUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Certification</span>
                      <span className="font-semibold text-slate-900">Included</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Support</span>
                      <span className="font-semibold text-slate-900">Priority email</span>
                    </div>
                  </div>
                </div> */}
                <div className="rounded-2xl border border-emerald-100 bg-ocean-50 p-4 text-sm text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">What you get</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-ocean-500" />
                      Mandatory modules with video + presentation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-ocean-500" />
                      Sequential unlocks and completion tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-ocean-500" />
                      Certificate issued on completion
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">💬</span>
                    <div>
                      <p className="font-semibold text-slate-800">Need help?</p>
                      <p className="text-xs text-slate-500">Contact support@agc-portal.com</p>
                    </div>
                  </div>
                
                  {/* <p className="mt-3 text-xs text-slate-500">
                    Our team responds within 1 business day.
                  </p> */}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
