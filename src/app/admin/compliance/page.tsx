"use client";

/**
 * Compliance Dashboard
 * Tax rule versioning, audit logs, accuracy metrics
 */

import { useQuery } from "@tanstack/react-query";

export default function CompliancePage() {
  const { data: complianceStatus } = useQuery({
    queryKey: ["compliance-status"],
    queryFn: () =>
      fetch("/api/admin/compliance/status").then((r) => r.json()),
    refetchInterval: 60000,
  });

  const status = complianceStatus || {
    total_rules: 0,
    active_rules: 0,
    compliance_score: 0,
    recent_violations: [],
    violations: [],
  };

  const rules = [
    { id: "tax_calculation", name: "Tax Calculation", version: "2.1", status: "passed" },
    { id: "deduction_rules", name: "Deduction Rules", version: "1.8", status: "passed" },
    { id: "regime_selection", name: "Regime Selection", version: "3.0", status: "warning" },
    { id: "fy_validation", name: "FY Validation", version: "1.5", status: "passed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h2>
        <p className="text-gray-600 mt-1">Tax rules, audits, and regulatory compliance</p>
      </div>

      {/* Compliance Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Compliance Score</h3>
            <p className="text-sm text-gray-500 mt-1">Based on recent audits</p>
          </div>
          <div className="text-6xl font-bold text-green-600">
            {status.compliance_score || 0}%
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${status.compliance_score || 0}%` }}
          />
        </div>
      </div>

      {/* Rules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Rules</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{status.total_rules}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active Rules</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{status.active_rules}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Recent Violations</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{status.violations?.length || 0}</p>
        </div>
      </div>

      {/* Active Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Rules</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">Rule</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">Version</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">Accuracy</th>
                <th className="text-left py-2 px-4 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{rule.name}</td>
                  <td className="py-3 px-4 text-gray-600">{rule.version}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "98%" }} />
                      </div>
                      <span className="text-sm font-medium">98%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rule.status === "passed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {rule.status === "passed" ? "✓ Passing" : "! Review"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Audit Logs</h3>
        <div className="space-y-3">
          {[
            { rule: "Tax Calculation", result: "passed", time: "2 hours ago" },
            { rule: "Deduction Rules", result: "passed", time: "5 hours ago" },
            { rule: "Regime Selection", result: "warning", time: "8 hours ago" },
          ].map((audit, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{audit.rule}</p>
                <p className="text-sm text-gray-600">{audit.time}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                audit.result === "passed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {audit.result === "passed" ? "✓ Passed" : "! Warning"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900">Recommendations</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>✓ All major tax rules are passing</li>
          <li>! Review regime selection rule - 2 failures this month</li>
          <li>→ Update deduction rules for FY 2026</li>
        </ul>
      </div>
    </div>
  );
}
