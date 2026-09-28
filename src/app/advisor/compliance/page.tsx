'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface ComplianceAlert {
  id: string;
  title: string;
  client: string;
  severity: 'info' | 'warning' | 'critical';
  due_date: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

const CompliancePage = () => {
  const [alerts] = useState<ComplianceAlert[]>([
    {
      id: '1',
      title: 'Q3 Estimated Tax Payments Due',
      client: 'All Active Clients',
      severity: 'critical',
      due_date: '2026-09-15',
      status: 'open',
    },
    {
      id: '2',
      title: 'Form 941 Quarterly Return Due',
      client: 'Acme Corp',
      severity: 'warning',
      due_date: '2026-10-31',
      status: 'acknowledged',
    },
    {
      id: '3',
      title: 'Annual W-2 Preparation',
      client: 'All Clients with Employees',
      severity: 'info',
      due_date: '2026-12-31',
      status: 'open',
    },
  ]);

  const [riskScores] = useState([
    { client: 'John Doe', score: 3, category: 'low', factors: ['High income', 'Complex deductions'] },
    { client: 'Jane Smith', score: 6, category: 'medium', factors: ['Multiple entities', 'Business income'] },
  ]);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      info: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Compliance Monitoring</h2>
        <p className="text-gray-600 mt-1">Stay on top of tax deadlines and regulatory changes</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Critical Alerts</p>
          <p className="text-3xl font-bold text-red-900 mt-2">1</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Warnings</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">2</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Resolved</p>
          <p className="text-3xl font-bold text-green-900 mt-2">15</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Avg Audit Risk</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">4.5/10</p>
        </div>
      </div>

      {/* Compliance Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Compliance Alerts</h3>
        </div>
        <div className="divide-y">
          {alerts.map((alert) => {
            const today = new Date();
            const dueDate = new Date(alert.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={alert.id} className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.client}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        Due: {new Date(alert.due_date).toLocaleDateString()} ({daysUntilDue} days)
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Mark Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Risk Scores */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={24} />
            Audit Risk Scores
          </h3>
        </div>
        <div className="divide-y">
          {riskScores.map((item, i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.client}</p>
                  <p className="text-sm text-gray-600 mt-1">Risk factors: {item.factors.join(', ')}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{item.score}/10</div>
                  <p className={`text-sm font-semibold mt-1 ${
                    item.category === 'low' ? 'text-green-600' :
                    item.category === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {item.category.toUpperCase()} RISK
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className={`h-2 rounded-full ${
                    item.category === 'low' ? 'bg-green-600' :
                    item.category === 'medium' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${(item.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Changes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Regulatory Changes</h3>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <p className="font-medium text-gray-900">IRS Announces 2026 Tax Brackets</p>
            <p className="text-sm text-gray-600 mt-1">Updated inflation adjustments effective January 1, 2026</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <p className="font-medium text-gray-900">Form 1042-S Due Date Extended</p>
            <p className="text-sm text-gray-600 mt-1">New deadline: March 15, 2026 for information returns</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;
