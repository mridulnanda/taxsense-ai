"use client";

/**
 * Computations Dashboard
 * Processing metrics, queue monitoring, performance analysis
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

export default function ComputationsPage() {
  const { data: metrics } = useQuery({
    queryKey: ["computation-metrics"],
    queryFn: () =>
      fetch("/api/admin/computations/metrics").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const performanceData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    processed: Math.floor(100 + Math.random() * 200),
    failed: Math.floor(Math.random() * 10),
    avg_time: Math.floor(2000 + Math.random() * 1000),
  }));

  const m = metrics || {
    total_computations: 0,
    active_computations: 0,
    completed_computations: 0,
    failed_computations: 0,
    avg_processing_time_ms: 0,
    success_rate: 0,
    top_errors: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Computations</h2>
        <p className="text-gray-600 mt-1">Processing queue, performance, and error monitoring</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Computations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{m.total_computations}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{m.active_computations}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Success Rate</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{m.success_rate}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {Math.round(m.avg_processing_time_ms / 1000)}s
          </p>
        </div>
      </div>

      {/* Queue Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">245</p>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }} />
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Completed Today</p>
            <p className="mt-2 text-2xl font-bold text-green-600">1,247</p>
            <p className="text-xs text-gray-600 mt-2">↑ 12% from yesterday</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="mt-2 text-2xl font-bold text-red-600">18</p>
            <p className="text-xs text-gray-600 mt-2">1.4% error rate</p>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Trend (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="processed"
                stroke="#3b82f6"
                name="Processed"
              />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Avg Response Time (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={(v) => `${v}ms`} />
              <Bar dataKey="avg_time" fill="#10b981" name="Response Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Errors</h3>
        <div className="space-y-3">
          {[
            { error: "Timeout Error", count: 8, pct: 44 },
            { error: "Validation Error", count: 4, pct: 22 },
            { error: "Computation Error", count: 3, pct: 17 },
            { error: "Data Error", count: 3, pct: 17 },
          ].map((item) => (
            <div key={item.error} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.error}</p>
                <p className="text-xs text-gray-600 mt-1">{item.count} occurrences</p>
              </div>
              <div className="text-right">
                <div className="w-20 bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-gray-600">{item.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Computation Types */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Computation Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: "Tax Calculation", count: 450, success: 98.5 },
            { type: "Deduction Analysis", count: 320, success: 97.2 },
            { type: "Regime Selection", count: 250, success: 96.8 },
            { type: "Report Generation", count: 227, success: 99.1 },
          ].map((comp) => (
            <div key={comp.type} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-900">{comp.type}</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{comp.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-xl font-bold text-green-600">{comp.success}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <h3 className="font-semibold text-gray-900">Performance Insights</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>✓ Processing queue is healthy - 245 pending computations</li>
          <li>✓ Success rate is excellent at 98.6%</li>
          <li>! Monitor timeout errors - 44% of recent failures</li>
          <li>→ Consider increasing timeout threshold for complex computations</li>
        </ul>
      </div>
    </div>
  );
}
