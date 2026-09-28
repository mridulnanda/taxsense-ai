"use client";

/**
 * Dashboard Overview Page
 * Real-time metrics, trends, and key performance indicators
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAdminStore } from "@/lib/admin/store";
import { DashboardMetrics } from "@/lib/admin/types";

interface MetricCard {
  label: string;
  value: string | number;
  trend?: number;
  status?: "healthy" | "warning" | "critical";
}

export default function DashboardOverview() {
  const {
    metrics,
    setMetrics,
    isLoadingMetrics,
    setLoadingMetrics,
    dateRange,
  } = useAdminStore();

  // Fetch dashboard metrics
  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: () => fetch("/api/admin/metrics").then((r) => r.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setMetrics(data);
      setLoadingMetrics(false);
    } else if (isLoading) {
      setLoadingMetrics(true);
    }
  }, [data, isLoading, setMetrics, setLoadingMetrics]);

  const m = metrics || ({} as DashboardMetrics);

  const metricCards: MetricCard[] = [
    {
      label: "Active Users",
      value: m.active_users || 0,
      trend: m.active_users_trend,
      status: "healthy",
    },
    {
      label: "Total Users",
      value: m.total_users || 0,
      status: "healthy",
    },
    {
      label: "Signups Today",
      value: m.signups_today || 0,
      status: "healthy",
    },
    {
      label: "Active Computations",
      value: m.active_computations || 0,
      status: m.active_computations > 100 ? "warning" : "healthy",
    },
    {
      label: "Avg Processing Time",
      value: `${Math.round(m.avg_computation_time || 0)}ms`,
      status: m.avg_computation_time > 5000 ? "warning" : "healthy",
    },
    {
      label: "Error Rate",
      value: `${(m.error_rate || 0).toFixed(2)}%`,
      status: m.error_rate > 2 ? "critical" : "healthy",
    },
  ];

  // Sample trend data
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    activeUsers: Math.floor(1000 + Math.random() * 500),
    computations: Math.floor(5000 + Math.random() * 2000),
    revenue: Math.floor(10000 + Math.random() * 5000),
  }));

  const regimeData = [
    { name: "Income Tax", value: 45, color: "#3b82f6" },
    { name: "GST", value: 30, color: "#10b981" },
    { name: "Other", value: 25, color: "#f59e0b" },
  ];

  const systemHealth = m.system_health || "healthy";
  const healthColor =
    systemHealth === "healthy"
      ? "text-green-600"
      : systemHealth === "warning"
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="space-y-8">
      {/* System Health Banner */}
      <div
        className={`p-6 rounded-lg border-2 ${
          systemHealth === "healthy"
            ? "bg-green-50 border-green-200"
            : systemHealth === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              System Status
            </h2>
            <p className={`mt-1 font-semibold ${healthColor}`}>
              {systemHealth === "healthy"
                ? "✓ All Systems Operational"
                : systemHealth === "warning"
                  ? "⚠ Warning: Check alerts"
                  : "✕ Critical: Immediate action required"}
            </p>
          </div>
          <div className={`text-4xl ${healthColor}`}>
            {systemHealth === "healthy" ? "✓" : "!"}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                {card.trend !== undefined && (
                  <p
                    className={`mt-1 text-sm font-medium ${
                      card.trend > 0
                        ? "text-green-600"
                        : card.trend < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {card.trend > 0 ? "+" : ""}{card.trend}% from yesterday
                  </p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  card.status === "healthy"
                    ? "bg-green-100 text-green-600"
                    : card.status === "warning"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {card.status === "healthy"
                  ? "✓"
                  : card.status === "warning"
                    ? "!"
                    : "✕"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Trends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            30-Day Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Computation Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Computation Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regimeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {regimeData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Metric Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue & Performance Trends
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" />
            <Bar dataKey="computations" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Alerts
        </h3>
        <div className="space-y-3">
          {[
            {
              title: "High API Latency",
              severity: "warning",
              time: "5 minutes ago",
            },
            {
              title: "Computation Queue Backlog",
              severity: "warning",
              time: "2 hours ago",
            },
            {
              title: "All Systems Operational",
              severity: "healthy",
              time: "10 hours ago",
            },
          ].map((alert, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  alert.severity === "warning"
                    ? "bg-yellow-600"
                    : "bg-green-600"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {alert.title}
                </p>
                <p className="text-xs text-gray-500">{alert.time}</p>
              </div>
              <button className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
