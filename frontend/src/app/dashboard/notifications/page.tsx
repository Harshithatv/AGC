'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';
import { showToast } from '@/components/Toast';
import Pagination from '@/components/Pagination';

type NotifItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
};

const ITEMS_PER_PAGE = 15;

const typeLabels: Record<string, string> = {
  USER_CREATED: 'New User',
  CERTIFICATION: 'Certification',
  CONTACT_MESSAGE: 'Contact Message',
};

const typeIcons: Record<string, string> = {
  USER_CREATED: '👤',
  CERTIFICATION: '🏅',
  CONTACT_MESSAGE: '✉️',
};

const typeBg: Record<string, string> = {
  USER_CREATED: 'bg-blue-100',
  CERTIFICATION: 'bg-emerald-100',
  CONTACT_MESSAGE: 'bg-amber-100',
};

const typeBadge: Record<string, string> = {
  USER_CREATED: 'bg-blue-50 text-blue-700',
  CERTIFICATION: 'bg-emerald-50 text-emerald-700',
  CONTACT_MESSAGE: 'bg-amber-50 text-amber-700',
};

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listNotifications(token)
      .then((data: any) => setNotifications(data))
      .catch(() => showToast('Failed to load notifications', 'error'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    let result = notifications;
    if (filterType !== 'all') result = result.filter((n) => n.type === filterType);
    if (filterStatus === 'unread') result = result.filter((n) => !n.read);
    if (filterStatus === 'read') result = result.filter((n) => n.read);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notifications, filterType, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await markNotificationAsRead(token, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get unique notification types for the filter
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.type));
    return Array.from(types);
  }, [notifications]);

  if (!user || (user.role !== 'SYSTEM_ADMIN' && user.role !== 'ORG_ADMIN')) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">
              Stay updated on new users, certifications, and contact messages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition focus:border-ocean-300 focus:outline-none focus:ring-2 focus:ring-ocean-100"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All types</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {typeLabels[t] || t}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unread' | 'read')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {/* Notification list */}
      <div className="rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ocean-200 border-t-ocean-600" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🔔</span>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {search || filterType !== 'all' || filterStatus !== 'all'
                ? 'No notifications match your filters'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition hover:bg-slate-50 ${!n.read ? 'bg-ocean-50/30' : ''}`}
              >
                <span
                  className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base ${typeBg[n.type] || 'bg-slate-100'}`}
                >
                  {typeIcons[n.type] || '🔔'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeBadge[n.type] || 'bg-slate-50 text-slate-600'}`}>
                      {typeLabels[n.type] || n.type}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${!n.read ? 'text-slate-600' : 'text-slate-500'}`}>
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Mark read
                    </button>
                  )}
                  {!n.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-ocean-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="border-t border-slate-100 px-6 py-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
