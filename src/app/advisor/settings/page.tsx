'use client';

import React, { useState } from 'react';
import { Save, Bell, Lock, Zap, Globe, FileText } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    organization_name: 'ABC Tax Advisors',
    email: 'admin@abctax.com',
    phone: '+1-555-0100',
    default_fee: 250,
    email_notifications: true,
    sms_notifications: false,
    two_factor_enabled: true,
    api_access_enabled: false,
    webhook_url: '',
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your organization and account settings</p>
      </div>

      {/* Organization Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={24} />
          Organization Settings
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Organization Name"
            value={settings.organization_name}
            onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="email"
            placeholder="Email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div>
            <label className="text-sm font-medium text-gray-700">Default Service Fee ($)</label>
            <input
              type="number"
              value={settings.default_fee}
              onChange={(e) => setSettings({ ...settings, default_fee: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell size={24} />
          Notification Settings
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Email notifications for deadlines and alerts</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.sms_notifications}
              onChange={(e) => setSettings({ ...settings, sms_notifications: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">SMS notifications for critical alerts</span>
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={24} />
          Security
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.two_factor_enabled}
              onChange={(e) => setSettings({ ...settings, two_factor_enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Enable two-factor authentication</span>
          </label>
          <button className="text-blue-600 hover:underline text-sm">Change password</button>
          <div className="border-t border-gray-200 pt-3 mt-3">
            <p className="text-sm text-gray-600">Active Sessions</p>
            <p className="text-xs text-gray-500 mt-1">Your current session and last login: Today at 9:30 AM</p>
          </div>
        </div>
      </div>

      {/* API & Integrations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={24} />
          API & Integrations
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.api_access_enabled}
              onChange={(e) => setSettings({ ...settings, api_access_enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-gray-700">Enable API access (Enterprise only)</span>
          </label>
          {settings.api_access_enabled && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://your-app.com/webhook"
                  value={settings.webhook_url}
                  onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
              <button className="text-blue-600 hover:underline text-sm">View API documentation</button>
            </>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
