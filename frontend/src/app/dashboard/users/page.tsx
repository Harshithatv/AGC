'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { bulkCreateUsers, createUser, listUsers, listAdminOrganizations } from '@/lib/api';

export default function DashboardUsersPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (!token || !user) return;

    if (user.role === 'ORG_ADMIN') {
      listUsers(token).then((data) => setUsers(data as any[]));
    }

    if (user.role === 'SYSTEM_ADMIN') {
      listAdminOrganizations(token).then((data) => setOrgs(data as any[]));
    }
  }, [token, user]);

  const handleAddUser = async () => {
    if (!token) return;
    await createUser(token, newUser);
    const userList = await listUsers(token);
    setUsers(userList as any[]);
    setNewUser({ name: '', email: '', password: '' });
  };

  const handleBulkUpload = async () => {
    if (!token) return;
    const rows = bulkText
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    const usersPayload = rows.map((row) => {
      const [name, email, password] = row.split(',').map((cell) => cell.trim());
      return { name, email, password };
    });

    await bulkCreateUsers(token, { users: usersPayload });
    const userList = await listUsers(token);
    setUsers(userList as any[]);
    setBulkText('');
  };

  if (!user) return null;

  if (user.role === 'SYSTEM_ADMIN') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Organizations</h2>
          <p className="mt-2 text-sm text-slate-600">View group and institution accounts.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{org.type}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{org.name}</p>
              <p className="mt-2 text-sm text-slate-600">Users: {org.userCount}/{org.maxUsers}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Users</h2>
        <p className="mt-2 text-sm text-slate-600">Manage your group or institution users.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Add a single user</h3>
          <div className="mt-4 space-y-3">
            <input
              placeholder="Full name"
              value={newUser.name}
              onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
            />
            <input
              placeholder="Email"
              value={newUser.email}
              onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
            />
            <input
              placeholder="Temporary password"
              value={newUser.password}
              onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2"
            />
            <button
              onClick={handleAddUser}
              className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Add user
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Bulk upload users</h3>
          <p className="mt-2 text-sm text-slate-600">Paste CSV rows as: name,email,password</p>
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={6}
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3"
            placeholder="Jane Doe,jane@example.com,Temp1234\nJohn Smith,john@example.com,Temp1234"
          />
          <button
            onClick={handleBulkUpload}
            className="mt-3 rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-700"
          >
            Upload users
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">User list</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {users.map((member) => (
            <div key={member.id} className="rounded-xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-800">{member.name}</p>
              <p className="text-sm text-slate-500">{member.email}</p>
              <p className="text-xs text-slate-400">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
