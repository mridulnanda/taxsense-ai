"use client";

/**
 * User Management Dashboard
 * Directory, search, role management, audit trail
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminUser, UserRole } from "@/lib/admin/types";

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-800" },
  { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-800" },
  { value: "analyst", label: "Analyst", color: "bg-green-100 text-green-800" },
  { value: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-800" },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [showAddUser, setShowAddUser] = useState(false);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users", searchQuery, selectedRole],
    queryFn: () =>
      fetch(
        `/api/admin/users?search=${searchQuery}&role=${selectedRole}`
      ).then((r) => r.json()),
    refetchInterval: 60000,
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.includes(searchQuery) || u.name.includes(searchQuery);
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage admins, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add User
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as UserRole | "all")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Add User Form */}
      {showAddUser && <AddUserForm onClose={() => setShowAddUser(false)} />}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                User
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                2FA
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ROLES.find((r) => r.value === user.role)?.color
                      }`}
                    >
                      {ROLES.find((r) => r.value === user.role)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        user.two_fa_enabled
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {user.two_fa_enabled ? "✓ Enabled" : "✕ Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 font-medium">
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: "User added", user: "admin@taxsense.ai", time: "2 hours ago" },
            { action: "Role updated", user: "manager@taxsense.ai", time: "5 hours ago" },
            { action: "User disabled", user: "viewer@taxsense.ai", time: "1 day ago" },
          ].map((log, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-500">{log.user}</p>
              </div>
              <p className="text-sm text-gray-500">{log.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "viewer" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      onClose();
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create User
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
