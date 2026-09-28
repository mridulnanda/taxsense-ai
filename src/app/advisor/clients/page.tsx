'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Mail, Phone, DollarSign, Calendar, MoreVertical } from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'prospect' | 'active' | 'churned' | 'paused';
  client_type: string;
  annual_income: number;
  date_acquired: string;
  tags: string[];
  lifetime_value: number;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  const itemsPerPage = 50;

  useEffect(() => {
    // Fetch clients from API
    const fetchClients = async () => {
      try {
        // Mock data for demonstration
        const mockClients: Client[] = [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1-555-0101',
            status: 'active',
            client_type: 'individual',
            annual_income: 125000,
            date_acquired: '2023-01-15',
            tags: ['high-income', 'tech'],
            lifetime_value: 4500,
          },
          {
            id: '2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone: '+1-555-0102',
            status: 'active',
            client_type: 'business',
            annual_income: 500000,
            date_acquired: '2022-06-20',
            tags: ['business', 'llc'],
            lifetime_value: 15000,
          },
          {
            id: '3',
            first_name: 'Mike',
            last_name: 'Johnson',
            email: 'mike@example.com',
            phone: '+1-555-0103',
            status: 'prospect',
            client_type: 'individual',
            annual_income: 75000,
            date_acquired: '2026-09-01',
            tags: ['prospect', 'referral'],
            lifetime_value: 0,
          },
        ];
        setClients(mockClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || client.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'churned':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(new Set(paginatedClients.map((c) => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  if (loading) {
    return <div className="text-center py-12">Loading clients...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Directory</h2>
          <p className="text-gray-600 mt-1">
            Manage {clients.length} clients across {clients.length} prospects
          </p>
        </div>
        <button
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="churned">Churned</option>
            <option value="paused">Paused</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} />
            More Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedClients.size > 0 && (
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Send Email ({selectedClients.size})
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 text-sm">
              Assign to Advisor
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 text-sm">
              Add Tags
            </button>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.size === paginatedClients.length && paginatedClients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Annual Income
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Lifetime Value
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Joined
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(client.id)}
                    onChange={() => handleSelectClient(client.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <a href={`/advisor/clients/${client.id}`} className="font-medium text-blue-600 hover:underline">
                    {client.first_name} {client.last_name}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} />
                      {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} />
                      {client.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(client.status)}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {client.client_type.charAt(0).toUpperCase() + client.client_type.slice(1)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign size={16} />
                    {(client.annual_income / 1000).toFixed(0)}k
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">
                  ${client.lifetime_value.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(client.date_acquired).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredClients.length)} of{' '}
            {filteredClients.length} clients
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onCreate={(newClient) => {
            setClients([...clients, newClient]);
            setShowNewClientModal(false);
          }}
        />
      )}
    </div>
  );
};

interface NewClientModalProps {
  onClose: () => void;
  onCreate: (client: Client) => void;
}

const NewClientModal = ({ onClose, onCreate }: NewClientModalProps) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    client_type: 'individual',
    annual_income: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: Date.now().toString(),
      ...formData,
      status: 'prospect',
      date_acquired: new Date().toISOString(),
      tags: [],
      lifetime_value: 0,
    };
    onCreate(newClient);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            placeholder="First Name"
            required
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Last Name"
            required
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.client_type}
            onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="trust">Trust</option>
            <option value="nonprofit">Non-profit</option>
          </select>
          <input
            type="number"
            placeholder="Annual Income"
            value={formData.annual_income}
            onChange={(e) => setFormData({ ...formData, annual_income: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientsPage;
