'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { bulkCreateUsers, createUser, listUsers, listAdminOrganizations, getOrganization } from '@/lib/api';
import Link from 'next/link';
import * as XLSX from 'xlsx';

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
  const [showAddForm, setShowAddForm] = useState(true);
  const [showBulkForm, setShowBulkForm] = useState(false);

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

  const handleAddUser = async () => {
    if (!token) return;
    setSingleError('');
    const payload = {
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password.trim()
    };
    if (!payload.name || !payload.email || !payload.password) {
      setSingleError('Name, email, and password are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
      setSingleError('Please enter a valid email address.');
      return;
    }
    if (payload.password.length < 6) {
      setSingleError('Password must be at least 6 characters.');
      return;
    }
    if (org && typeof org.userCount === 'number' && typeof org.maxUsers === 'number') {
      if (org.userCount >= org.maxUsers) {
        setSingleError('User limit reached for this package.');
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
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : 'Unable to add user');
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
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Unable to upload users');
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
      } catch (err) {
        setBulkError(err instanceof Error ? err.message : 'Unable to upload users');
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!user) return null;

  if (user.role === 'SYSTEM_ADMIN') {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold sm:text-xl">User directory</h2>
          <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">
            Review package holders and manage access in a single place.
          </p>
        </div>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {orgs.map((org) => {
            const displayName = cleanGroupSuffix(org.name);
            
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
                  <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 sm:px-3 sm:py-1">
                    Active
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold sm:text-xl">User management</h2>
        <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">
          Add learners, upload in bulk, and keep track of active accounts.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">Add learners</h3>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Choose single add or bulk upload to onboard learners.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm bg-ocean-600"
            >
              {showAddForm ? 'Hide add user' : 'Add user'}
            </button>
            <button
              onClick={() => setShowBulkForm((prev) => !prev)}
              className="rounded-lg border border-ocean-200 px-3 py-1.5 text-xs font-semibold text-ocean-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
            >
              {showBulkForm ? 'Hide bulk upload' : 'Bulk upload'}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
          {showAddForm ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:rounded-2xl sm:p-5">
              <h4 className="text-sm font-semibold sm:text-base">Add a single user</h4>
              <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-sm">Create a learner profile with login details.</p>
              <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                <input
                  placeholder="Full name"
                  value={newUser.name}
                  onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:rounded-xl sm:px-4"
                />
                <input
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:rounded-xl sm:px-4"
                />
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Temporary password"
                    value={newUser.password}
                    onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm sm:rounded-xl sm:px-4"
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
                <button
                  onClick={handleAddUser}
                  disabled={singleLoading}
                  className="rounded-lg bg-ocean-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
                >
                  {singleLoading ? 'Adding...' : 'Add user'}
                </button>
                {singleError ? <p className="text-xs text-red-500 sm:text-sm">{singleError}</p> : null}
              </div>
            </div>
          ) : null}
          {showBulkForm ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h4 className="text-base font-semibold">Bulk upload users</h4>
              <p className="mt-2 text-sm text-slate-600">
                Upload an Excel file with columns: name, email, password.
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-ocean-200 bg-ocean-50 px-4 py-4 text-sm text-ocean-700">
                <span>{bulkFileName ? bulkFileName : 'Choose .xlsx or .csv file'}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ocean-700">Browse</span>
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
              {/* <div className="mt-4">
                <p className="text-xs text-slate-500">Optional: paste CSV rows below if needed.</p>
                <textarea
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  rows={5}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Jane Doe,jane@example.com,Temp1234"
                />
              </div> */}
              {bulkError ? <p className="mt-3 text-sm text-red-500">{bulkError}</p> : null}
              {/* <button
                onClick={handleBulkUpload}
                disabled={bulkLoading}
                className="mt-3 rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700 disabled:opacity-60"
              >
                {bulkLoading ? 'Uploading...' : 'Upload users'}
              </button> */}
            </div>
          ) : null}
        </div>
      </div>

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
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {users.map((member) => (
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
      </div>
    </div>
  );
}
