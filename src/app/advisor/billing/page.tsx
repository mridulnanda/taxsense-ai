'use client';

import React, { useState } from 'react';
import { Plus, Download, Eye, Send, Trash2 } from 'lucide-react';

const BillingPage = () => {
  const [invoices] = useState([
    { id: '1', client: 'John Doe', amount: 2500, status: 'paid', date: '2026-09-01' },
    { id: '2', client: 'Jane Smith', amount: 5000, status: 'sent', date: '2026-09-15' },
    { id: '3', client: 'Acme Corp', amount: 7500, status: 'draft', date: '2026-09-20' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Invoices</h2>
          <p className="text-gray-600 mt-1">Manage client invoices and payment tracking</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border border-green-200">
          <p className="text-sm text-green-600">Revenue (MTD)</p>
          <p className="text-3xl font-bold text-green-900 mt-2">$45,230</p>
          <p className="text-xs text-green-700 mt-2">↑ 18% vs last month</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
          <p className="text-sm text-blue-600">Outstanding</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">$12,500</p>
          <p className="text-xs text-blue-700 mt-2">2 invoices pending</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border border-purple-200">
          <p className="text-sm text-purple-600">Annual MRR</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">$45K</p>
          <p className="text-xs text-purple-700 mt-2">Recurring revenue</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Invoice</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-blue-600">INV-{invoice.id}</td>
                <td className="px-6 py-4 text-sm">{invoice.client}</td>
                <td className="px-6 py-4 font-semibold">${invoice.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="text-gray-400 hover:text-blue-600">
                      <Eye size={18} />
                    </button>
                    {invoice.status === 'draft' && (
                      <button className="text-gray-400 hover:text-blue-600">
                        <Send size={18} />
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingPage;
