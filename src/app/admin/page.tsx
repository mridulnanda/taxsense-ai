"use client";

/**
 * Admin Dashboard - Overview Page
 * Comprehensive metrics, trends, real-time updates, and system health
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAdminStore } from "@/lib/admin/store";
import { getAnalyticsEngine, initializeAnalytics } from "@/lib/admin/realtime";

// Dynamic imports for charts to avoid SSR issues
const DashboardOverview = dynamic(
  () => import("./dashboard"),
  { ssr: false }
);

export default function AdminPage() {
  const [error, setError] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
  const { setConnected, connectionError, setConnectionError } = useAdminStore();

  useEffect(() => {
    // Initialize analytics engine
    const engine = initializeAnalytics(
      process.env.NEXT_PUBLIC_WS_URL || `ws://${typeof window !== "undefined" ? window.location.host : "localhost"}/api/admin/ws`
    );

    // Subscribe to connection events
    let unsubscribe: (() => void) | null = null;

    const checkConnection = setInterval(() => {
      if (engine && engine.isConnected()) {
        setConnected(true);
        setConnectionStatus("Connected");
        setConnectionError(null);
      } else {
        setConnected(false);
        setConnectionStatus("Connecting...");
      }
    }, 5000);

    // Check initial connection
    setTimeout(() => {
      if (engine?.isConnected()) {
        setConnected(true);
        setConnectionStatus("Connected");
      } else {
        setConnectionStatus("Using polling fallback");
        setConnected(true);
      }
    }, 2000);

    return () => {
      clearInterval(checkConnection);
      if (unsubscribe) unsubscribe();
    };
  }, [setConnected, setConnectionError]);

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Admin Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time metrics and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">{connectionStatus}</p>
            <p className="text-xs text-gray-500 mt-1">Last updated just now</p>
          </div>
          <div className="w-3 h-3 rounded-full bg-green-600 animate-pulse" />
        </div>
      </div>

      {/* Error Display */}
      {(error || connectionError) && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-700 font-medium">Connection Error</p>
          <p className="text-sm text-red-600 mt-1">{error || connectionError}</p>
        </div>
      )}

      {/* Main Dashboard */}
      <DashboardOverview />

      {/* Legacy Stats (Backup) */}
      <LegacyStatsSection />
    </div>
  );
}

function LegacyStatsSection() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  if (!data) return null;

  const s = data?.stats ?? {};
  const cards: [string, any][] = [
    ["Users", s.users],
    ["Tax profiles", s.profiles],
    ["Computed profiles", s.computed],
    ["Chat messages", s.messages],
    ["PDFs generated", s.pdfs],
    ["Signups (7d)", s.signups_7d],
    ["Pending deletions", s.pending_deletions],
  ];

  return (
    <div className="space-y-6 border-t border-gray-200 pt-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">System Metrics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Aggregated data — user financial data stays behind row-level security
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err === "forbidden"
            ? "You're not on the ADMIN_EMAILS list. Set it in your environment to access this page."
            : err}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map(([label, v]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-2xl font-bold text-blue-600">{v ?? 0}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {s.regime_split && Object.keys(s.regime_split).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Tax Regime Distribution</h3>
          <div className="mt-4 flex gap-6">
            {Object.entries(s.regime_split).map(([k, v]) => (
              <div key={k}>
                <span className="text-2xl font-bold text-gray-900">{String(v)}</span>
                <span className="ml-2 text-sm text-gray-500">{k} regime</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
        <h3 className="font-semibold text-gray-900">Operational Runbook</h3>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Run <code className="bg-gray-100 px-2 py-1 rounded">execute_pending_deletions()</code> daily</li>
          <li>Run <code className="bg-gray-100 px-2 py-1 rounded">purge_stale_intake_messages()</code> monthly (18-month window)</li>
          <li>Update tax rules in <code className="bg-gray-100 px-2 py-1 rounded">constants.ts</code> annually</li>
        </ul>
      </div>
    </div>
  );
}
