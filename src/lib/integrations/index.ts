/**
 * TaxSense Global - Enterprise Integration Layer
 * Production-grade integrations with accounting, banking, payroll, and investment platforms
 */

// Core sync engine
export { DataSyncEngine, WebhookHandler, type SyncConfig, type SyncResult } from './sync-engine';

// Integration manager
export { IntegrationManager, integrationManager, type IntegrationStatus } from './integration-manager';

// Accounting integrations
export * from './accounting';

// Banking integrations
export * from './banking';

// Payroll integrations
export * from './payroll';

// Investment integrations
export * from './investments';
