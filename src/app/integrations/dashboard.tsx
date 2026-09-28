'use client';

import React, { useEffect, useState } from 'react';
import { integrationManager, type IntegrationStatus } from '@/lib/integrations/integration-manager';

/**
 * Integration Dashboard
 * Display connected accounts, sync status, error handling
 */

export default function IntegrationDashboard({ userId }: { userId: string }) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
    const interval = setInterval(loadIntegrations, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const loadIntegrations = () => {
    try {
      const integs = integrationManager.getAllIntegrations(userId);
      setIntegrations(integs);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load integrations', error);
      setLoading(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    syncing.add(integrationId);
    setSyncing(new Set(syncing));

    try {
      await integrationManager.triggerSync(userId, integrationId);
      loadIntegrations();
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      syncing.delete(integrationId);
      setSyncing(new Set(syncing));
    }
  };

  const handleDisconnect = (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      integrationManager.disconnect(userId, integrationId);
      loadIntegrations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '✓';
      case 'syncing':
        return '⟳';
      case 'error':
        return '✕';
      case 'disconnected':
        return '○';
      default:
        return '?';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading integrations...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Connected Integrations</h1>

      {integrations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No integrations connected yet</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Integration
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.integrationId}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(integration.status)}`}>
                      <span className="mr-1">{getStatusIcon(integration.status)}</span>
                      {integration.status}
                    </div>
                    <h3 className="text-xl font-semibold capitalize">
                      {integration.type.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">ID: {integration.integrationId}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(integration.integrationId)}
                    disabled={syncing.has(integration.integrationId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {syncing.has(integration.integrationId) ? 'Syncing...' : 'Sync Now'}
                  </button>

                  <button
                    onClick={() => handleDisconnect(integration.integrationId)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Records Synced</p>
                  <p className="text-lg font-semibold">{integration.recordCount || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase">Last Sync</p>
                  <p className="text-sm">
                    {integration.lastSyncAt
                      ? new Date(integration.lastSyncAt).toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase">Next Sync</p>
                  <p className="text-sm">
                    {integration.nextSyncAt
                      ? new Date(integration.nextSyncAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase">Sync Duration</p>
                  <p className="text-sm">{integration.syncDuration ? `${integration.syncDuration}ms` : 'N/A'}</p>
                </div>
              </div>

              {integration.errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">
                    <span className="font-semibold">Error:</span> {integration.errorMessage}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Add New Integration</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: 'QuickBooks', icon: '📊' },
            { name: 'Xero', icon: '📋' },
            { name: 'Chase Bank', icon: '🏦' },
            { name: 'ADP Payroll', icon: '👥' },
            { name: 'Coinbase', icon: '₿' },
            { name: 'Vanguard', icon: '📈' },
          ].map((integration) => (
            <button
              key={integration.name}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center"
            >
              <div className="text-2xl mb-2">{integration.icon}</div>
              <p className="font-medium text-sm">{integration.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
