'use client';

import React, { useState } from 'react';
import { Plus, Download, Share2, Printer, MoreVertical, Search, Filter, FileText } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  client_name: string;
  report_type: string;
  created_date: string;
  generated_by: string;
  status: 'draft' | 'sent' | 'viewed';
  format: 'pdf' | 'excel' | 'word';
}

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      title: 'Tax Summary Report 2025',
      client_name: 'John Doe',
      report_type: 'tax_summary',
      created_date: '2026-09-20',
      generated_by: 'Sarah Johnson',
      status: 'sent',
      format: 'pdf',
    },
    {
      id: '2',
      title: 'Year-over-Year Analysis',
      client_name: 'Jane Smith',
      report_type: 'analysis',
      created_date: '2026-09-18',
      generated_by: 'Mike Wilson',
      status: 'viewed',
      format: 'excel',
    },
  ]);

  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Professional Reports</h2>
          <p className="text-gray-600 mt-1">{reports.length} reports generated</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Generate Report
        </button>
      </div>

      {/* Templates Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Tax Summary', description: 'Comprehensive tax overview' },
            { name: 'Planning Analysis', description: 'Tax planning recommendations' },
            { name: 'Compliance Checklist', description: 'Filing requirements checklist' },
            { name: 'Quarterly Estimates', description: 'Q1-Q4 estimated tax letters' },
            { name: 'Year-over-Year', description: 'Multi-year comparison' },
            { name: 'Custom Report', description: 'Build your own report' },
          ].map((template, i) => (
            <button
              key={i}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <p className="font-medium text-gray-900">{template.name}</p>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Report</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">By</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <a href="#" className="font-medium text-blue-600 hover:underline">
                      {report.title}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{report.client_name}</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(report.created_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(report.status)}`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{report.generated_by}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="text-gray-400 hover:text-blue-600">
                      <Download size={18} />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600">
                      <Share2 size={18} />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600">
                      <Printer size={18} />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Report</h2>
            <div className="space-y-4">
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Select Template</option>
                <option>Tax Summary</option>
                <option>Planning Analysis</option>
              </select>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Select Client</option>
                <option>John Doe</option>
                <option>Jane Smith</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
