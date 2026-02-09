'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listContactMessages, markContactAsRead, deleteContactMessage } from '@/lib/api';
import { showToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';

type ContactMsg = {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const ITEMS_PER_PAGE = 10;

export default function ContactMessagesPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Delete confirmation dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listContactMessages(token)
      .then((data: any) => setMessages(data))
      .catch(() => showToast('Failed to load messages', 'error'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    let result = messages;
    if (filterStatus === 'unread') result = result.filter((m) => !m.read);
    if (filterStatus === 'read') result = result.filter((m) => m.read);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [messages, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  const unreadCount = messages.filter((m) => !m.read).length;

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await markContactAsRead(token, id);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
      showToast('Marked as read', 'success');
    } catch {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteConfirm.id) return;
    setDeleteLoading(true);
    try {
      await deleteContactMessage(token, deleteConfirm.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      showToast('Message deleted', 'success');
      if (expandedId === deleteConfirm.id) setExpandedId(null);
    } catch {
      showToast('Failed to delete message', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ open: false, id: '' });
    }
  };

  const handleExpand = (msg: ContactMsg) => {
    if (expandedId === msg.id) {
      setExpandedId(null);
    } else {
      setExpandedId(msg.id);
      // Auto-mark as read when expanding
      if (!msg.read && token) {
        markContactAsRead(token, msg.id).then(() => {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)));
        });
      }
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
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Contact Messages</h2>
            <p className="mt-1 text-sm text-slate-500">
              Messages from the support contact form.{' '}
              {unreadCount > 0 && (
                <span className="font-semibold text-ocean-600">{unreadCount} unread</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 px-3 py-1.5 text-xs font-semibold text-ocean-700">
              ✉️ {messages.length} total
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                🔔 {unreadCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition focus:border-ocean-300 focus:outline-none focus:ring-2 focus:ring-ocean-100"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unread' | 'read')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
        >
          <option value="all">All messages</option>
          <option value="unread">Unread only</option>
          <option value="read">Read only</option>
        </select>
      </div>

      {/* Messages list */}
      <div className="rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ocean-200 border-t-ocean-600" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {search || filterStatus !== 'all' ? 'No messages match your filters' : 'No contact messages yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((msg) => (
              <div
                key={msg.id}
                className={`transition ${!msg.read ? 'bg-ocean-50/30' : ''}`}
              >
                {/* Message row */}
                <button
                  onClick={() => handleExpand(msg)}
                  className="flex w-full items-start gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  {/* Unread indicator */}
                  <div className="mt-1.5 flex-shrink-0">
                    {!msg.read ? (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-ocean-500" />
                    ) : (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-200" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!msg.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="truncate text-xs text-slate-500">{msg.email}</span>
                    </div>
                    <p className={`mt-1 truncate text-sm ${!msg.read ? 'text-slate-700' : 'text-slate-500'}`}>
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition ${expandedId === msg.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded view */}
                {expandedId === msg.id && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">From</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{msg.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Email</p>
                        <a href={`mailto:${msg.email}`} className="mt-1 block text-sm text-ocean-600 hover:underline">
                          {msg.email}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Received</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {new Date(msg.createdAt).toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
                        <p className="mt-1">
                          {msg.read ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                              ✓ Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              ● Unread
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">Message</p>
                      <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-relaxed text-slate-700 border border-slate-100">
                        {msg.message}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {!msg.read && (
                        <button
                          onClick={() => handleMarkRead(msg.id)}
                          className="rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ocean-700"
                        >
                          Mark as read
                        </button>
                      )}
                      <a
                        href={`mailto:${msg.email}?subject=Re: Your enquiry to AGC Support&body=Hi ${msg.name},%0A%0AThank you for contacting us.%0A%0A`}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        ↩ Reply via email
                      </a>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, id: msg.id })}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete message"
        message="Are you sure you want to delete this contact message? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: '' })}
      />
    </div>
  );
}
