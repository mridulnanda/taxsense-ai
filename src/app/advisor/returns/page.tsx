'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Printer,
  Download,
  MoreVertical,
} from 'lucide-react';

interface TaxReturn {
  id: string;
  client_name: string;
  tax_year: number;
  return_type: string;
  status: 'draft' | 'review' | 'ready_for_signature' | 'filed' | 'accepted';
  due_date: string;
  assigned_to: string;
  gross_income: number;
  total_tax: number;
  estimated_refund: number;
}

const ReturnsPage = () => {
  const [returns, setReturns] = useState<TaxReturn[]>([
    {
      id: '1',
      client_name: 'John Doe',
      tax_year: 2025,
      return_type: '1040',
      status: 'draft',
      due_date: '2026-10-15',
      assigned_to: 'Sarah Johnson',
      gross_income: 125000,
      total_tax: 28500,
      estimated_refund: 2100,
    },
    {
      id: '2',
      client_name: 'Jane Smith',
      tax_year: 2025,
      return_type: '1120',
      status: 'review',
      due_date: '2026-09-15',
      assigned_to: 'Mike Wilson',
      gross_income: 500000,
      total_tax: 85000,
      estimated_refund: 5000,
    },
    {
      id: '3',
      client_name: 'Acme Corp',
      tax_year: 2025,
      return_type: '1120S',
      status: 'ready_for_signature',
      due_date: '2026-03-15',
      assigned_to: 'Sarah Johnson',
      gross_income: 750000,
      total_tax: 0,
      estimated_refund: 12000,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTaxYear, setFilterTaxYear] = useState(new Date().getFullYear());

  const filteredReturns = returns.filter((ret) => {
    const matchesSearch =
      ret.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.return_type.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || ret.status === filterStatus;
    const matchesYear = ret.tax_year === filterTaxYear;

    return matchesSearch && matchesStatus && matchesYear;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="text-yellow-600" size={20} />;
      case 'review':
        return <AlertCircle className="text-orange-600" size={20} />;
      case 'ready_for_signature':
        return <Clock className="text-blue-600" size={20} />;
      case 'filed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'accepted':
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      review: { bg: 'bg-orange-100', text: 'text-orange-800' },
      ready_for_signature: { bg: 'bg-blue-100', text: 'text-blue-800' },
      filed: { bg: 'bg-green-100', text: 'text-green-800' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800' },
    };

    const style = statusMap[status] || statusMap.draft;
    const label = status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        {label}
      </span>
    );
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tax Returns</h2>
          <p className="text-gray-600 mt-1">
            Manage {returns.length} tax returns in workflow
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          New Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox label="Draft" value={3} color="yellow" />
        <StatBox label="In Review" value={2} color="orange" />
        <StatBox label="Ready for Signature" value={1} color="blue" />
        <StatBox label="Filed" value={12} color="green" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by client name or return type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterTaxYear}
            onChange={(e) => setFilterTaxYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2025}>Tax Year 2025</option>
            <option value={2024}>Tax Year 2024</option>
            <option value={2023}>Tax Year 2023</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="ready_for_signature">Ready for Signature</option>
            <option value="filed">Filed</option>
            <option value="accepted">Accepted</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} />
            More
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Client
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Return Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Tax Year
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Tax Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Refund
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map((taxReturn) => {
              const daysUntilDue = getDaysUntilDue(taxReturn.due_date);
              const isOverdue = daysUntilDue < 0;

              return (
                <tr key={taxReturn.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <a
                      href={`/advisor/returns/${taxReturn.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {taxReturn.client_name}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm font-medium">{taxReturn.return_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{taxReturn.tax_year}</td>
                  <td className="px-6 py-4">{getStatusBadge(taxReturn.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span
                        className={`text-sm ${
                          isOverdue ? 'text-red-600 font-semibold' : ''
                        }`}
                      >
                        {new Date(taxReturn.due_date).toLocaleDateString()}
                        {!isOverdue && daysUntilDue >= 0 && (
                          <span className="text-gray-500"> ({daysUntilDue}d)</span>
                        )}
                        {isOverdue && (
                          <span className="text-red-600"> ({Math.abs(daysUntilDue)}d overdue)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{taxReturn.assigned_to}</td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    ${taxReturn.total_tax.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                    ${taxReturn.estimated_refund.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        title="View"
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <FileText size={18} />
                      </button>
                      <button title="Print" className="text-gray-400 hover:text-blue-600">
                        <Printer size={18} />
                      </button>
                      <button
                        title="Download"
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Download size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface StatBoxProps {
  label: string;
  value: number;
  color: 'yellow' | 'orange' | 'blue' | 'green';
}

const StatBox = ({ label, value, color }: StatBoxProps) => {
  const colorMap = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`${colorMap[color]} border rounded-lg p-4`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
};

export default ReturnsPage;
