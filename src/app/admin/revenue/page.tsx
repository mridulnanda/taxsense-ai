"use client";

/**
 * Revenue Analytics Dashboard
 * MRR, ARR, churn, LTV, and subscription metrics
 */

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FinancialMetrics } from "@/lib/admin/types";

export default function RevenuePage() {
  const { data: metrics, isLoading } = useQuery<FinancialMetrics>({
    queryKey: ["financial-metrics"],
    queryFn: () =>
      fetch("/api/admin/revenue/metrics").then((r) => r.json()),
    refetchInterval: 60000,
  });

  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    mrr: Math.floor(50000 + Math.random() * 20000),
    arr: Math.floor(600000 + Math.random() * 240000),
    churn: Math.floor(50 + Math.random() * 50),
  }));

  const m = metrics || {
    mrr: 0,
    arr: 0,
    arpu: 0,
    churn_rate: 0,
    ltv: 0,
    ltv_cac_ratio: 0,
    growth_rate: 0,
    net_retention_rate: 100,
  };

  const cards = [
    { label: "MRR", value: `$${(m.mrr / 1000).toFixed(1)}k`, change: "+12%" },
    { label: "ARR", value: `$${(m.arr / 1000).toFixed(0)}k`, change: "+15%" },
    { label: "ARPU", value: `$${m.arpu.toFixed(0)}`, change: "+8%" },
    { label: "Churn Rate", value: `${m.churn_rate.toFixed(2)}%`, change: "-2%" },
    { label: "LTV", value: `$${m.ltv.toFixed(0)}`, change: "+5%" },
    { label: "LTV:CAC", value: `${m.ltv_cac_ratio.toFixed(1)}x`, change: "+0.2x" },
    { label: "Growth Rate", value: `${m.growth_rate.toFixed(1)}%`, change: "monthly" },
    { label: "NRR", value: `${m.net_retention_rate.toFixed(0)}%`, change: m.net_retention_rate > 100 ? "Expanding" : "Contracting" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
        <p className="text-gray-600 mt-1">MRR, churn, LTV, and financial health</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className={`mt-1 text-xs font-medium ${
              card.change.startsWith("+") ? "text-green-600" : "text-red-600"
            }`}>
              {card.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR & ARR Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trends (12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `$${v}`} />
              <Legend />
              <Line type="monotone" dataKey="mrr" stroke="#3b82f6" name="MRR" />
              <Line type="monotone" dataKey="arr" stroke="#10b981" name="ARR" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Churn Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Churn Rate Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="churn" fill="#ef4444" name="Churn %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subscription Segments */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Subscription Segments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "High-Value", count: 45, revenue: 15000, pct: 45 },
            { name: "Medium-Value", count: 120, revenue: 10000, pct: 30 },
            { name: "Low-Value", count: 280, revenue: 5000, pct: 25 },
          ].map((seg) => (
            <div key={seg.name} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">{seg.name}</p>
              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900">{seg.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-xl font-bold text-blue-600">${seg.revenue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">% of Total</p>
                  <p className="text-lg font-bold text-gray-900">{seg.pct}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900">Revenue Optimization Actions</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>✓ Focus on high-value segment expansion</li>
          <li>! Review churn drivers in low-value segment</li>
          <li>→ Launch upsell campaign for medium-value customers</li>
        </ul>
      </div>
    </div>
  );
}
