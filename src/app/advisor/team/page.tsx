'use client';

import React, { useState } from 'react';
import { Plus, Mail, Phone, Edit2, Trash2, Shield } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'partner' | 'manager' | 'associate' | 'staff';
  status: 'active' | 'pending_invite';
  clients_assigned: number;
  joined_date: string;
}

const TeamPage = () => {
  const [members] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@advisors.com',
      role: 'partner',
      status: 'active',
      clients_assigned: 34,
      joined_date: '2023-01-15',
    },
    {
      id: '2',
      name: 'Mike Wilson',
      email: 'mike@advisors.com',
      role: 'manager',
      status: 'active',
      clients_assigned: 28,
      joined_date: '2023-06-20',
    },
    {
      id: '3',
      name: 'Alex Chen',
      email: 'alex@advisors.com',
      role: 'associate',
      status: 'active',
      clients_assigned: 12,
      joined_date: '2024-01-10',
    },
  ]);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      partner: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      associate: 'bg-blue-100 text-blue-800',
      staff: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">{members.length} team members</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Invite Member
        </button>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Clients</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Mail size={14} />
                      {member.email}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                    <Shield size={14} className="inline mr-1" />
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold">{member.clients_assigned}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status === 'active' ? 'Active' : 'Pending Invite'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(member.joined_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="text-gray-400 hover:text-blue-600">
                      <Edit2 size={18} />
                    </button>
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

      {/* RBAC Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">Role-Based Access Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="font-medium text-gray-900">Partner</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Full access</li>
              <li>✓ Client management</li>
              <li>✓ Billing & payments</li>
              <li>✓ Team management</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900">Manager</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Client management</li>
              <li>✓ Return filing</li>
              <li>✓ Report generation</li>
              <li>✗ Billing access</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900">Associate</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ Return preparation</li>
              <li>✓ Document upload</li>
              <li>✓ Report generation</li>
              <li>✗ Client delete</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900">Staff</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>✓ View assigned clients</li>
              <li>✓ Upload documents</li>
              <li>✓ Task management</li>
              <li>✗ Billing access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
