"use client";

/**
 * Reports & Export Dashboard
 * Custom reports, scheduled exports, data download
 */

import { useState } from "react";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reports = [
    {
      id: "report_1",
      name: "Monthly Financial Summary",
      type: "financial",
      lastGenerated: "3 hours ago",
      status: "completed",
    },
    {
      id: "report_2",
      name: "User Growth Analysis",
      type: "users",
      lastGenerated: "1 day ago",
      status: "completed",
    },
    {
      id: "report_3",
      name: "Compliance Audit Trail",
      type: "compliance",
      lastGenerated: "2 days ago",
      status: "completed",
    },
    {
      id: "report_4",
      name: "Computation Accuracy Report",
      type: "accuracy",
      lastGenerated: "5 hours ago",
      status: "completed",
    },
  ];

  const exports = [
    { id: "export_1", title: "Users Database", format: "csv", size: "2.3 MB", created: "2 hours ago" },
    { id: "export_2", title: "Revenue Data", format: "json", size: "890 KB", created: "5 hours ago" },
    { id: "export_3", title: "Computations Log", format: "csv", size: "5.2 MB", created: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Exports</h2>
          <p className="text-gray-600 mt-1">Custom reports, scheduled exports, data downloads</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + New Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
          Reports
        </button>
        <button className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900">
          Export History
        </button>
        <button className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900">
          Scheduled Jobs
        </button>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{report.type}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                ✓ {report.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">Generated {report.lastGenerated}</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                View
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                Download
              </button>
              <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Schedule
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Detail (if selected) */}
      {selectedReport && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {reports.find((r) => r.id === selectedReport)?.name}
            </h3>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Report Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Data Points</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">15,420</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Time Period</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">30 days</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">Complete</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Export Options</h4>
              <div className="flex gap-3">
                {["PDF", "CSV", "JSON", "Excel"].map((format) => (
                  <button
                    key={format}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    ↓ {format}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Schedule Delivery</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Frequency</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>One-time</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email Recipients</label>
                  <input
                    type="email"
                    placeholder="admin@taxsense.ai"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Exports */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
        <div className="space-y-3">
          {exports.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  <p className="text-sm text-gray-600">{exp.format.toUpperCase()} • {exp.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500">{exp.created}</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  ↓ Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Export */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Export</h3>
        <p className="text-sm text-gray-700 mb-4">
          Generate custom exports on demand
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["Users", "Computations", "Revenue"].map((type) => (
            <button
              key={type}
              className="px-4 py-3 border border-blue-300 rounded-lg hover:bg-white transition-colors text-gray-900 font-medium"
            >
              Export {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
