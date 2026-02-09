"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ToastContainer } from "@/components/Toast";
import { listNotifications, markAllNotificationsAsRead } from "@/lib/api";

const navByRole: Record<string, Array<{ label: string; href: string; icon: string }>> = {
  SYSTEM_ADMIN: [
    { label: "Dashboard", href: "/dashboard/overview", icon: "grid" },
    { label: "Packages", href: "/dashboard/packages", icon: "box" },
    { label: "Users", href: "/dashboard/users", icon: "users" },
    { label: "Modules", href: "/dashboard/modules", icon: "book" },
    { label: "Purchases", href: "/dashboard/purchases", icon: "receipt" },
    { label: "Certified", href: "/dashboard/certified", icon: "badge" },
    { label: "Contacts", href: "/dashboard/contacts", icon: "mail" }
  ],
  ORG_ADMIN: [
    { label: "Dashboard", href: "/dashboard/overview", icon: "grid" },
    { label: "Users", href: "/dashboard/users", icon: "users" },
    { label: "Modules", href: "/dashboard/modules", icon: "book" },
    { label: "Certified", href: "/dashboard/certified", icon: "badge" }
  ],
  ORG_USER: [
    { label: "Course", href: "/dashboard/course", icon: "book" },
    { label: "Certification", href: "/dashboard/course#certificate", icon: "badge" },
    { label: "Support", href: "/dashboard/course#support", icon: "help" }
  ]
};

type NotifItem = { id: string; type: string; title: string; message: string; read: boolean; link?: string; createdAt: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const canSeeNotifs = user?.role === "SYSTEM_ADMIN" || user?.role === "ORG_ADMIN";

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!notifOpen || !token || !canSeeNotifs) return;
    setNotifLoading(true);
    listNotifications(token)
      .then((data: any) => {
        setNotifItems((data as NotifItem[]).slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen, token, canSeeNotifs]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  const notifIcon = (type: string) => {
    if (type === "USER_CREATED") return "👤";
    if (type === "CERTIFICATION") return "🏅";
    if (type === "CONTACT_MESSAGE") return "✉️";
    return "🔔";
  };

  const notifBg = (type: string) => {
    if (type === "USER_CREATED") return "bg-blue-100";
    if (type === "CERTIFICATION") return "bg-emerald-100";
    if (type === "CONTACT_MESSAGE") return "bg-amber-100";
    return "bg-slate-100";
  };

  const roleLabel = useMemo(() => {
    if (!user) return "Dashboard";
    if (user.role === "SYSTEM_ADMIN") return "System Admin";
    if (user.role === "ORG_ADMIN") return "Admin Dashboard";
    return "Academic Guide";
  }, [user]);

  const navItems = navByRole[user?.role || "ORG_USER"] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 md:hidden"
            >
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Image src="/images/logo.svg" alt="AGC logo" width={32} height={32} className="h-8 w-8 sm:h-9 sm:w-9" />
            <div>
              <p className="hidden text-xs uppercase tracking-wide text-slate-400 sm:block">AGC</p>
              <h1 className="text-sm font-semibold text-slate-900 sm:text-lg">{roleLabel}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden w-80 items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 lg:flex">
              <span className="mr-2">🔍</span>
              Search users, modules
            </div>
            {/* Notification bell */}
            {canSeeNotifs && (
            <div className="relative hidden sm:block" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm transition hover:bg-slate-50"
              >
                🔔
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    {notifItems.some((n) => !n.read) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-medium text-ocean-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ocean-200 border-t-ocean-600" />
                      </div>
                    ) : notifItems.length === 0 ? (
                      <div className="py-8 text-center">
                        <span className="text-2xl">✅</span>
                        <p className="mt-2 text-xs text-slate-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifItems.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.link) router.push(n.link);
                          }}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.read ? "bg-ocean-50/30" : ""}`}
                        >
                          <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${notifBg(n.type)}`}>
                            {notifIcon(n.type)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                                {n.title}
                              </p>
                              <span className="flex-shrink-0 text-[10px] text-slate-400">{formatTimeAgo(n.createdAt)}</span>
                            </div>
                            <p className={`mt-0.5 truncate text-xs ${!n.read ? "text-slate-600" : "text-slate-500"}`}>
                              {n.message}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-ocean-500" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t border-slate-100 p-2">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        router.push("/dashboard/notifications");
                      }}
                      className="w-full rounded-xl py-2 text-center text-xs font-semibold text-ocean-600 transition hover:bg-ocean-50"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}
            <div className="relative">
              <details className="group">
                <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-slate-50 p-1.5 sm:p-2">
                  <img
                    src="/images/avatar.jpg"
                    alt="User profile"
                    className="h-6 w-6 rounded-full object-cover sm:h-7 sm:w-7"
                  />
                </summary>
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  <div className="px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{user?.name || "User"}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt="AGC logo" width={32} height={32} />
            <span className="font-semibold text-slate-900">AGC</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-ocean-50 hover:text-ocean-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs">
                {item.icon === "grid" && "▦"}
                {item.icon === "box" && "▢"}
                {item.icon === "users" && "👥"}
                {item.icon === "book" && "📘"}
                {item.icon === "receipt" && "🧾"}
                {item.icon === "badge" && "🏅"}
                {item.icon === "help" && "❓"}
                {item.icon === "mail" && "✉️"}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex w-full">
        {/* Desktop Sidebar – fixed */}
        <aside className="hidden w-64 flex-shrink-0 md:block">
          <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto border-r border-slate-200 bg-white px-4 py-6">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-ocean-50 hover:text-ocean-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs">
                    {item.icon === "grid" && "▦"}
                    {item.icon === "box" && "▢"}
                    {item.icon === "users" && "👥"}
                    {item.icon === "book" && "📘"}
                    {item.icon === "receipt" && "🧾"}
                    {item.icon === "badge" && "🏅"}
                    {item.icon === "help" && "❓"}
                    {item.icon === "mail" && "✉️"}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div className="min-h-[calc(100vh-57px)] w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
      <ToastContainer />
    </div>
  );
}
