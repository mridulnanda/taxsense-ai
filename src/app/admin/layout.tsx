"use client";

/**
 * Admin Dashboard Layout
 * Base layout with navigation and real-time updates
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/admin/store";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/computations", label: "Computations", icon: "⚙️" },
  { href: "/admin/revenue", label: "Revenue", icon: "💰" },
  { href: "/admin/compliance", label: "Compliance", icon: "✓" },
  { href: "/admin/support", label: "Support", icon: "🆘" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  { href: "/admin/reports", label: "Reports", icon: "📄" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, alerts } = useAdminStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const unreadAlerts = alerts.filter((a) => a.status === "active").length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">TaxSense Admin</span>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              {sidebarOpen ? "−" : "+"}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/app"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <span>←</span>
            {sidebarOpen && <span>Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {NAV_ITEMS.find((item) => item.href === pathname)?.label ||
              "Dashboard"}
          </h1>

          {/* Alerts Badge */}
          <div className="flex items-center gap-4">
            {unreadAlerts > 0 && (
              <Link
                href="/admin/alerts"
                className="relative p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              </Link>
            )}
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-blue-700">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
