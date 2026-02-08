'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { deletePricing, listAdminPricing, updatePricing, getOrganization, getPricing } from '@/lib/api';
import { showToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

type FieldErrors = Record<string, string>;

export default function DashboardPackagesPage() {
  const { user, token } = useAuth();
  const [adminPricing, setAdminPricing] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [publicPricing, setPublicPricing] = useState<any[]>([]);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; packageType: string; isNew?: boolean }>({ open: false, packageType: '', isNew: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const defaultMeta: Record<string, { label: string; summary: string; features: string[]; highlight?: boolean }> = {
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
  };

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    if (!token || !user) return;

    if (user.role === 'SYSTEM_ADMIN') {
      listAdminPricing(token).then((data) => setAdminPricing(data as any[]));
    }

    if (user.role === 'ORG_ADMIN') {
      Promise.all([getOrganization(token), getPricing()]).then(([orgData, pricing]) => {
        setOrg(orgData);
        setPublicPricing(pricing as any[]);
      });
    }
  }, [token, user]);

  const handlePricingChange = (
    packageType: string,
    updates: {
      amount?: number;
      maxUsers?: number;
      label?: string;
      summary?: string;
      features?: string[];
      highlight?: boolean;
      packageTypeOverride?: string;
    }
  ) => {
    const { packageTypeOverride, ...rest } = updates;
    setAdminPricing((prev) =>
      prev.map((item) =>
        (item.id || item.packageType) === editingPackage
          ? {
              ...item,
              ...rest,
              ...(typeof packageTypeOverride === 'string'
                ? { packageType: packageTypeOverride }
                : {})
            }
          : item
      )
    );
  };

  const editingItem = adminPricing.find((item) => (item.id || item.packageType) === editingPackage) || null;

  const validatePackageForm = (): boolean => {
    if (!editingItem) return false;
    const errors: FieldErrors = {};
    if (!editingItem.packageType?.trim()) errors.packageType = 'Package code is required';
    if (!editingItem.label?.trim()) errors.label = 'Label is required';
    if (typeof editingItem.amount !== 'number' || editingItem.amount < 0) errors.amount = 'Amount is required and must be 0 or greater';
    if (!editingItem.maxUsers || editingItem.maxUsers < 1) errors.maxUsers = 'Max users is required and must be at least 1';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePricing = async (
    packageType: string,
    payload: {
      amount: number;
      maxUsers?: number;
      currency?: string;
      label?: string;
      summary?: string;
      features?: string[];
      highlight?: boolean;
    }
  ) => {
    if (!token) return;
    // Validate first, before checking packageType — so errors show even for new packages
    if (!validatePackageForm()) return;
    if (!packageType) return;
    try {
      setSaveLoading(true);
      await updatePricing(token, { packageType, ...payload });
      const pricing = await listAdminPricing(token);
      setAdminPricing(pricing as any[]);
      setEditingPackage(null);
      setFieldErrors({});
      showToast('Package saved successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save package', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePackage = async (packageType: string, isNew?: boolean) => {
    if (!token) return;
    setDeleteError('');
    if (!packageType && isNew) {
      setAdminPricing((prev) => prev.filter((item) => !item.isNew));
      setEditingPackage(null);
      setDeleteConfirm({ open: false, packageType: '', isNew: false });
      return;
    }
    try {
      setDeleteLoading(true);
      await deletePricing(token, packageType);
      const pricing = await listAdminPricing(token);
      setAdminPricing(pricing as any[]);
      setEditingPackage(null);
      setDeleteConfirm({ open: false, packageType: '', isNew: false });
      showToast('Package deleted successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to delete package.';
      setDeleteError(msg);
      showToast(msg, 'error');
      setDeleteConfirm({ open: false, packageType: '', isNew: false });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddPackage = () => {
    const draftId = `new-${Date.now()}`;
    setAdminPricing((prev) => [
      ...prev,
      {
        id: draftId,
        packageType: '',
        amount: 0,
        currency: 'USD',
        maxUsers: 1,
        label: '',
        summary: '',
        features: [''],
        highlight: false,
        isNew: true
      }
    ]);
    setEditingPackage(draftId);
    setFieldErrors({});
  };

  const handleCancelEdit = () => {
    // Remove any draft (isNew) items from the list when cancelling
    setAdminPricing((prev) => prev.filter((item) => !item.isNew));
    setEditingPackage(null);
    setFieldErrors({});
  };

  const applyDefaults = (packageType: string) => {
    if (!packageType) return;
    const meta = defaultMeta[packageType];
    if (!meta) return;
    setAdminPricing((prev) =>
      prev.map((item) =>
        item.packageType === packageType
          ? {
              ...item,
              label: item.label || meta.label,
              summary: item.summary || meta.summary,
              features:
                Array.isArray(item.features) && item.features.length > 0 ? item.features : [...meta.features],
              highlight: typeof item.highlight === 'boolean' ? item.highlight : meta.highlight
            }
          : item
      )
    );
  };

  const handleFeatureChange = (packageType: string, index: number, value: string) => {
    const current = adminPricing.find((item) => item.packageType === packageType);
    const features = Array.isArray(current?.features) ? [...current.features] : [];
    features[index] = value;
    handlePricingChange(packageType, { features });
  };

  const handleAddFeature = (packageType: string) => {
    const current = adminPricing.find((item) => item.packageType === packageType);
    const features = Array.isArray(current?.features) ? [...current.features] : [];
    features.push('');
    handlePricingChange(packageType, { features });
  };

  const handleRemoveFeature = (packageType: string, index: number) => {
    const current = adminPricing.find((item) => item.packageType === packageType);
    const features = Array.isArray(current?.features) ? [...current.features] : [];
    features.splice(index, 1);
    handlePricingChange(packageType, { features });
  };

  const packagePrice = useMemo(() => {
    if (!org) return null;
    return publicPricing.find((item) => item.packageType === org.type) || null;
  }, [org, publicPricing]);

  const errBorder = (field: string) =>
    fieldErrors[field] ? 'border-red-400' : 'border-slate-200';

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Packages</h2>
        <p className="mt-2 text-sm text-slate-600">Manage package pricing and view current package details.</p>
      </div>

      {user.role === 'SYSTEM_ADMIN' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Manage pricing and package details.</p>
            <button
              onClick={handleAddPackage}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-ocean-300"
            >
              + Add package
            </button>
          </div>
          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
          <div className="space-y-4">
            {adminPricing.filter((item) => !item.isNew).map((item) => {
              const itemKey = item.id || item.packageType;
              const meta = defaultMeta[item.packageType];
              const displayLabel = item.label || meta?.label || item.packageType || 'New package';
              return (
                <div key={itemKey} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Package</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{displayLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Price</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatCurrency(item.amount, item.currency || 'USD')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          applyDefaults(item.packageType);
                          setEditingPackage(itemKey);
                          setFieldErrors({});
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-ocean-300"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, packageType: item.packageType, isNew: item.isNew })}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                        aria-label="Delete package"
                        title="Delete package"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {user.role === 'SYSTEM_ADMIN' && editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Edit package</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {editingItem.label || editingItem.packageType || 'New package'}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-ocean-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Package code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.packageType ?? ''}
                    onChange={(event) => {
                      handlePricingChange(editingItem.packageType, { packageTypeOverride: event.target.value });
                      setFieldErrors((e) => ({ ...e, packageType: '' }));
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-normal text-slate-700 ${errBorder('packageType')}`}
                    placeholder="e.g., SINGLE"
                    disabled={!editingItem.isNew}
                  />
                  {fieldErrors.packageType ? <p className="text-xs text-red-500">{fieldErrors.packageType}</p> : null}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.label ?? ''}
                    onChange={(event) => {
                      handlePricingChange(editingItem.packageType, { label: event.target.value });
                      setFieldErrors((e) => ({ ...e, label: '' }));
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-normal text-slate-700 ${errBorder('label')}`}
                    placeholder="Package label"
                  />
                  {fieldErrors.label ? <p className="text-xs text-red-500">{fieldErrors.label}</p> : null}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </label>
                <textarea
                  value={editingItem.summary ?? ''}
                  onChange={(event) => handlePricingChange(editingItem.packageType, { summary: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                  rows={3}
                  placeholder="Short description"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Features</p>
                <div className="mt-3 space-y-2">
                  {(Array.isArray(editingItem.features) ? editingItem.features : []).map(
                    (feature: string, index: number) => (
                      <div key={`${editingItem.packageType}-feature-${index}`} className="flex items-center gap-2">
                        <input
                          value={feature}
                          onChange={(event) => handleFeatureChange(editingItem.packageType, index, event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder={`Feature ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(editingItem.packageType, index)}
                          className="rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-500 hover:border-red-200 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddFeature(editingItem.packageType)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-ocean-300"
                  >
                    + Add feature
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editingItem.amount}
                    onChange={(event) => {
                      handlePricingChange(editingItem.packageType, { amount: Number(event.target.value) });
                      setFieldErrors((e) => ({ ...e, amount: '' }));
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-normal text-slate-700 ${errBorder('amount')}`}
                    placeholder="Amount"
                  />
                  {fieldErrors.amount ? <p className="text-xs text-red-500">{fieldErrors.amount}</p> : null}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Max users <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editingItem.maxUsers ?? ''}
                    onChange={(event) => {
                      handlePricingChange(editingItem.packageType, { maxUsers: Number(event.target.value) });
                      setFieldErrors((e) => ({ ...e, maxUsers: '' }));
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-normal text-slate-700 ${errBorder('maxUsers')}`}
                    placeholder="Max users"
                    min={1}
                  />
                  {fieldErrors.maxUsers ? <p className="text-xs text-red-500">{fieldErrors.maxUsers}</p> : null}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <input
                  type="checkbox"
                  checked={Boolean(editingItem.highlight)}
                  onChange={(event) => handlePricingChange(editingItem.packageType, { highlight: event.target.checked })}
                />
                Highlight package
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() =>
                    handleSavePricing(editingItem.packageType, {
                      amount: editingItem.amount,
                      maxUsers: typeof editingItem.maxUsers === 'number' ? editingItem.maxUsers : undefined,
                      currency: editingItem.currency,
                      label: editingItem.label,
                      summary: editingItem.summary,
                      features: Array.isArray(editingItem.features) ? editingItem.features : undefined,
                      highlight: typeof editingItem.highlight === 'boolean' ? editingItem.highlight : undefined
                    })
                  }
                  disabled={saveLoading}
                  className="rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {saveLoading ? 'Saving...' : 'Save changes'}
                </button>
             
                <button
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-ocean-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => handleDeletePackage(deleteConfirm.packageType, deleteConfirm.isNew)}
        onCancel={() => setDeleteConfirm({ open: false, packageType: '', isNew: false })}
      />

      {user.role === 'ORG_ADMIN' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Current package</h3>
          {org ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Organization</p>
                <p className="mt-1 font-semibold text-slate-900">{org.name}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Package</p>
                <p className="mt-1 font-semibold text-slate-900">{org.type}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Users</p>
                <p className="mt-1 font-semibold text-slate-900">{org.userCount}/{org.maxUsers}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Price</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {packagePrice ? formatCurrency(packagePrice.amount, packagePrice.currency || 'USD') : 'N/A'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
