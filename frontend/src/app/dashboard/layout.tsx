"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navByRole: Record<string, Array<{ label: string; href: string; icon: string }>> = {
  SYSTEM_ADMIN: [
    { label: "Dashboard", href: "/dashboard/overview", icon: "grid" },
    { label: "Packages", href: "/dashboard/packages", icon: "box" },
    { label: "Users", href: "/dashboard/users", icon: "users" },
    { label: "Modules", href: "/dashboard/modules", icon: "book" },
    { label: "Purchases", href: "/dashboard/purchases", icon: "receipt" }
  ],
  ORG_ADMIN: [
    { label: "Dashboard", href: "/dashboard/overview", icon: "grid" },
    { label: "Package", href: "/dashboard/packages", icon: "box" },
    { label: "Users", href: "/dashboard/users", icon: "users" },
    { label: "Modules", href: "/dashboard/modules", icon: "book" }
  ],
  ORG_USER: [
    { label: "Course", href: "/dashboard/course", icon: "book" },
    { label: "Certification", href: "/dashboard/course#certificate", icon: "badge" },
    { label: "Support", href: "/dashboard/course#support", icon: "help" }
  ]
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const roleLabel = useMemo(() => {
    if (!user) return "Dashboard";
    if (user.role === "SYSTEM_ADMIN") return "System Admin Dashboard";
    if (user.role === "ORG_ADMIN") return "Organization Admin Dashboard";
    return "Academic Guide Dashboard";
  }, [user]);

  const navItems = navByRole[user?.role || "ORG_USER"] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.svg" alt="AGC logo" width={36} height={36} />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">AGC</p>
              <h1 className="text-lg font-semibold text-slate-900">{roleLabel}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden w-80 items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:flex">
              <span className="mr-2">🔍</span>
              Search users, modules
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm">
              🔔
            </button>
            <div className="relative">
              <details className="group">
                <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-slate-50 p-2">
                  <img
                    src="/images/avatar.jpg"
                    alt="User profile"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                </summary>
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  <div className="px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
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

      <div className="flex w-full">
        <aside className="hidden h-[calc(100vh-64px)] w-64 flex-shrink-0 border-r border-slate-200 bg-white px-4 py-6 md:block">
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
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="w-full px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
