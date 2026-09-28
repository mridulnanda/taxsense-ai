"use client";

/**
 * Settings & Configuration Dashboard
 * System settings, integrations, security configuration
 */

import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    require_2fa: true,
    session_timeout: 30,
    api_rate_limit: 1000,
    notification_email: "admin@taxsense.ai",
  });

  const handleSave = async () => {
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      alert("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings & Configuration</h2>
        <p className="text-gray-600 mt-1">System configuration, security, and integrations</p>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Require 2FA for Admin Users</p>
              <p className="text-sm text-gray-500 mt-1">Force two-factor authentication</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_2fa}
                onChange={(e) => setSettings({ ...settings, require_2fa: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block">
              <p className="font-medium text-gray-900">Session Timeout (minutes)</p>
              <input
                type="number"
                value={settings.session_timeout}
                onChange={(e) =>
                  setSettings({ ...settings, session_timeout: parseInt(e.target.value) })
                }
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Auto-logout after inactivity</p>
            </label>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
        <div className="space-y-4">
          <label className="block">
            <p className="font-medium text-gray-900">Rate Limit (requests/minute)</p>
            <input
              type="number"
              value={settings.api_rate_limit}
              onChange={(e) =>
                setSettings({ ...settings, api_rate_limit: parseInt(e.target.value) })
              }
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
        <label className="block">
          <p className="font-medium text-gray-900">Admin Email</p>
          <input
            type="email"
            value={settings.notification_email}
            onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">Critical alerts sent to this address</p>
        </label>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrations</h3>
        <div className="space-y-4">
          {[
            { name: "Slack", connected: false, icon: "💬" },
            { name: "Email Service", connected: true, icon: "📧" },
            { name: "Sentry", connected: false, icon: "⚠️" },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {integration.icon} {integration.name}
                </p>
              </div>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  integration.connected
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                {integration.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h3>
        <div className="space-y-3">
          {[
            { name: "Real-time Analytics", enabled: true },
            { name: "Advanced Reporting", enabled: true },
            { name: "Custom Dashboards", enabled: false },
            { name: "API Access", enabled: true },
          ].map((flag) => (
            <div key={flag.name} className="flex items-center justify-between">
              <p className="text-gray-900">{flag.name}</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  flag.enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {flag.enabled ? "✓ Enabled" : "✕ Disabled"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Settings
        </button>
        <button className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
