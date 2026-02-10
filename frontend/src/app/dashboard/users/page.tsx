'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { bulkCreateUsers, createUser, listUsers, listAdminOrganizations, getOrganization } from '@/lib/api';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { showToast } from '@/components/Toast';
import Pagination from '@/components/Pagination';

type FieldErrors = Record<string, string>;

export default function DashboardUsersPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [org, setOrg] = useState<any | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [singleError, setSingleError] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<'single' | 'bulk'>('single');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [orgSearch, setOrgSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [orgPage, setOrgPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const cleanGroupSuffix = (value?: string) => (value ? value.replace(/\s+Group$/i, '') : '');

  useEffect(() => {
    if (!token || !user) return;

    if (user.role === 'ORG_ADMIN') {
      listUsers(token).then((data) => setUsers(data as any[]));
      getOrganization(token).then((data) => setOrg(data as any));
    }

    if (user.role === 'SYSTEM_ADMIN') {
      listAdminOrganizations(token).then((data) => setOrgs(data as any[]));
    }
  }, [token, user]);

  const validateUserForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!newUser.name.trim()) errors.name = 'Full name is required';
    if (!newUser.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(newUser.email.trim())) errors.email = 'Please enter a valid email address';
    if (!newUser.password.trim()) errors.password = 'Password is required';
    else if (newUser.password.trim().length < 6) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!token) return;
    setSingleError('');
    if (!validateUserForm()) return;

    const payload = {
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password.trim()
    };

    if (org && typeof org.userCount === 'number' && typeof org.maxUsers === 'number') {
      if (org.userCount >= org.maxUsers) {
        setSingleError('User limit reached for this package.');
        showToast('User limit reached for this package', 'error');
        return;
      }
    }
    try {
      setSingleLoading(true);
      await createUser(token, payload);
      const userList = await listUsers(token);
      setUsers(userList as any[]);
      if (user?.role === 'ORG_ADMIN') {
        const orgData = await getOrganization(token);
        setOrg(orgData as any);
      }
      setNewUser({ name: '', email: '', password: '' });
      setFieldErrors({});
      setShowAddModal(false);
      showToast('User added successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to add user';
      setSingleError(msg);
      showToast(msg, 'error');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!token) return;
    setBulkError('');
    const rows = bulkText
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    const usersPayload = rows.map((row) => {
      const [name, email, password] = row.split(',').map((cell) => cell.trim());
      return { name, email, password };
    });
    const invalid = usersPayload.some(
      (item) =>
        !item.name ||
        !item.email ||
        !item.password ||
        item.password.length < 6 ||
        !/^\S+@\S+\.\S+$/.test(item.email)
    );
    if (invalid) {
      setBulkError('Each row must include valid name, email, and password (min 6 characters).');
      return;
    }
    if (org && typeof org.userCount === 'number' && typeof org.maxUsers === 'number') {
      if (org.userCount + usersPayload.length > org.maxUsers) {
        setBulkError('User limit exceeded for this package.');
        showToast('User limit exceeded for this package', 'error');
        return;
      }
    }

    try {
      setBulkLoading(true);
      await bulkCreateUsers(token, { users: usersPayload });
      const userList = await listUsers(token);
      setUsers(userList as any[]);
      if (user?.role === 'ORG_ADMIN') {
        const orgData = await getOrganization(token);
        setOrg(orgData as any);
      }
      setBulkText('');
      setBulkFileName('');
      setShowAddModal(false);
      showToast('Users uploaded successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to upload users';
      setBulkError(msg);
      showToast(msg, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkFile = (file: File) => {
    setBulkError('');
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          throw new Error('Unable to read file');
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<{ name?: string; email?: string; password?: string }>(worksheet, {
          defval: ''
        });
        if (!rows.length) {
          throw new Error('No rows found in the file');
        }
        const usersPayload = rows.map((row) => ({
          name: String(row.name || '').trim(),
          email: String(row.email || '').trim(),
          password: String(row.password || '').trim()
        }));
        const invalid = usersPayload.some(
          (item) =>
            !item.name ||
            !item.email ||
            !item.password ||
            item.password.length < 6 ||
            !/^\S+@\S+\.\S+$/.test(item.email)
        );
        if (invalid) {
          throw new Error('Each row must include valid name, email, and password (min 6 characters).');
        }
        if (org && typeof org.userCount === 'number' && typeof org.maxUsers === 'number') {
          if (org.userCount + usersPayload.length > org.maxUsers) {
            throw new Error('User limit exceeded for this package.');
          }
        }
        if (!token) return;
        setBulkLoading(true);
        await bulkCreateUsers(token, { users: usersPayload });
        const userList = await listUsers(token);
        setUsers(userList as any[]);
        if (user?.role === 'ORG_ADMIN') {
          const orgData = await getOrganization(token);
          setOrg(orgData as any);
        }
        setShowAddModal(false);
        showToast('Users uploaded successfully', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to upload users';
        setBulkError(msg);
        showToast(msg, 'error');
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const errBorder = (field: string) =>
    fieldErrors[field] ? 'border-red-400' : 'border-slate-200';

  if (!user) return null;

  if (user.role === 'SYSTEM_ADMIN') {
    // Dynamically get all unique org types from the data
    const allOrgTypes = (() => {
      const types = new Set<string>();
      orgs.forEach((o) => { if (o.type) types.add(o.type.toUpperCase()); });
      const order = ['SINGLE', 'GROUP', 'INSTITUTION'];
      return Array.from(types).sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
    })();

    const typeLabels: Record<string, string> = { SINGLE: 'Single User', GROUP: 'Group', INSTITUTION: 'Institution' };

    const filteredOrgs = orgs.filter((o) => {
      const orgName = cleanGroupSuffix(o.name);
      const adminN = o.adminName || '';
      const matchSearch = !orgSearch || orgName.toLowerCase().includes(orgSearch.toLowerCase()) || adminN.toLowerCase().includes(orgSearch.toLowerCase());
      const matchType = orgFilter === 'ALL' || (o.type || '').toUpperCase() === orgFilter;
      return matchSearch && matchType;
    });

    const orgTotalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
    const paginatedOrgs = filteredOrgs.slice((orgPage - 1) * ITEMS_PER_PAGE, orgPage * ITEMS_PER_PAGE);

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold sm:text-xl">User directory</h2>
          <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">
            Review package holders and manage access in a single place.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={orgSearch}
                onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1); }}
                placeholder="Search by organization or admin name..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Type:</label>
              <select
                value={orgFilter}
                onChange={(e) => { setOrgFilter(e.target.value); setOrgPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
              >
                <option value="ALL">All Types</option>
                {allOrgTypes.map((type) => (
                  <option key={type} value={type}>{typeLabels[type] || type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {filteredOrgs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-4 text-sm font-semibold text-slate-500">No users yet</p>
              {/* <p className="mt-1 text-xs text-slate-400">Users will appear here once packages are purchased.</p> */}
            </div>
          )}
          {paginatedOrgs.map((org) => {
            const orgName = cleanGroupSuffix(org.name);
            const adminName = org.adminName || '';
            const orgType = (org.type || '').toUpperCase();

            // For institution: "Admin Name - School Name", otherwise just org name
            const displayName =
              orgType === 'INSTITUTION' && adminName
                ? `${adminName} - ${orgName}`
                : orgName;

            const typeLabel =
              orgType === 'SINGLE'
                ? 'Single User'
                : orgType === 'GROUP'
                  ? 'Group'
                  : orgType === 'INSTITUTION'
                    ? 'Institution'
                    : orgType || 'Unknown';

            const typeBadgeColor =
              orgType === 'SINGLE'
                ? 'bg-blue-50 text-blue-700'
                : orgType === 'GROUP'
                  ? 'bg-purple-50 text-purple-700'
                  : orgType === 'INSTITUTION'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600';

            return (
              <Link
                key={org.id}
                href={`/dashboard/users/organization/${org.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl sm:p-5"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">{displayName}</p>
                    <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                      Users: {org.userCount}/{org.maxUsers}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 ${typeBadgeColor}`}>
                    {typeLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={orgPage}
            totalPages={orgTotalPages}
            totalItems={filteredOrgs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setOrgPage}
          />
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((m) => !userSearch || m.name?.toLowerCase().includes(userSearch.toLowerCase()) || m.email?.toLowerCase().includes(userSearch.toLowerCase()));
  const userTotalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">User management</h2>
            <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">
              Add learners, upload in bulk, and keep track of active accounts.
            </p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setAddTab('single'); setSingleError(''); setBulkError(''); setFieldErrors({}); }}
            className="inline-flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add learners
          </button>
        </div>
      </div>

      {/* Add learners modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add learners</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">Onboard new learners</h3>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Choose single add or bulk upload to add learners to your account.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({ name: '', email: '', password: '' });
                  setFieldErrors({});
                  setSingleError('');
                  setBulkError('');
                  setBulkText('');
                  setBulkFileName('');
                }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setAddTab('single')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  addTab === 'single'
                    ? 'bg-white text-ocean-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Single add
                </span>
              </button>
              <button
                onClick={() => setAddTab('bulk')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  addTab === 'bulk'
                    ? 'bg-white text-ocean-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk upload
                </span>
              </button>
            </div>

            {/* Single add tab */}
            {addTab === 'single' ? (
              <div className="mt-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(event) => { setNewUser({ ...newUser, name: event.target.value }); setFieldErrors((e) => ({ ...e, name: '' })); }}
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm ${errBorder('name')}`}
                  />
                  {fieldErrors.name ? <p className="text-xs text-red-500">{fieldErrors.name}</p> : null}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(event) => { setNewUser({ ...newUser, email: event.target.value }); setFieldErrors((e) => ({ ...e, email: '' })); }}
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm ${errBorder('email')}`}
                  />
                  {fieldErrors.email ? <p className="text-xs text-red-500">{fieldErrors.email}</p> : null}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">
                    Temporary password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter temporary password"
                      value={newUser.password}
                      onChange={(event) => { setNewUser({ ...newUser, password: event.target.value }); setFieldErrors((e) => ({ ...e, password: '' })); }}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm ${errBorder('password')}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password ? <p className="text-xs text-red-500">{fieldErrors.password}</p> : null}
                </div>
                {singleError ? <p className="text-xs text-red-500">{singleError}</p> : null}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleAddUser}
                    disabled={singleLoading}
                    className="rounded-xl bg-ocean-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-ocean-700 transition-colors"
                  >
                    {singleLoading ? 'Adding...' : 'Add user'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewUser({ name: '', email: '', password: '' });
                      setFieldErrors({});
                      setSingleError('');
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Bulk upload tab */}
            {addTab === 'bulk' ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-700 sm:text-sm">File format requirements</p>
                  <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                    Upload an Excel (.xlsx) or CSV file with columns: <span className="font-semibold">name</span>, <span className="font-semibold">email</span>, <span className="font-semibold">password</span>
                  </p>
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-ocean-200 bg-ocean-50/50 px-5 py-5 text-sm text-ocean-700 transition hover:border-ocean-400 hover:bg-ocean-50">
                  <div className="flex items-center gap-3">
                    <svg className="h-8 w-8 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{bulkFileName ? bulkFileName : 'Choose file to upload'}</p>
                      <p className="text-xs text-slate-500">.xlsx or .csv</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ocean-700 shadow-sm">Browse</span>
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleBulkFile(file);
                    }}
                  />
                </label>
                {bulkError ? <p className="text-sm text-red-500">{bulkError}</p> : null}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setBulkError('');
                      setBulkText('');
                      setBulkFileName('');
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Learners</h3>
            <p className="text-sm text-slate-600">Active accounts available for modules.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Total: {users.length}
          </span>
        </div>
        <div className="mt-3 relative sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredUsers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-4 text-sm font-semibold text-slate-500">No users yet</p>
              <p className="mt-1 text-xs text-slate-400">Add learners using the button above to get started.</p>
            </div>
          )}
          {paginatedUsers.map((member) => (
            <Link
              key={member.id}
              href={`/dashboard/users/user/${member.id}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-ocean-700">
                {(member.name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{member.name}</p>
                <p className="text-sm text-slate-500">{member.email}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={userPage}
            totalPages={userTotalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setUserPage}
          />
        </div>
      </div>
    </div>
  );
}
