import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * Workday Integration
 * Enterprise ERP integration, global payroll, consolidated reporting
 */

export interface WorkdayConfig extends SyncConfig {
  tenantId: string;
  workerId: string;
  metadata: {
    organizationName: string;
    countryCode: string;
  };
}

export interface WorkdayWorker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  location: string;
  department: string;
  jobTitle: string;
  managerId: string;
  hireDate: string;
  status: string;
}

export interface WorkdayCompensation {
  workerId: string;
  effectiveDate: string;
  currency: string;
  baseAmount: number;
  frequency: string;
  components: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
}

export interface WorkdayPaySlip {
  id: string;
  workerId: string;
  payDate: string;
  grossPay: number;
  netPay: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  taxes: Record<string, number>;
}

export interface WorkdayReport {
  name: string;
  type: 'payroll' | 'compensation' | 'headcount' | 'financial';
  period: string;
  data: Record<string, any>;
}

export class WorkdayAdapter extends DataSyncEngine {
  private logger = pino();
  private baseUrl = 'https://api.workday.com/v1';

  constructor() {
    super();
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'hr payroll reporting',
      state,
    });

    return `https://api.workday.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code
   */
  async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get workers
   */
  async getWorkers(config: WorkdayConfig): Promise<WorkdayWorker[]> {
    const url = `${this.baseUrl}/tenants/${config.tenantId}/workers`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.data.map((worker: any) => ({
      id: worker.id,
      firstName: worker.personalInformation?.firstName || '',
      lastName: worker.personalInformation?.lastName || '',
      email: worker.contactInformation?.email || '',
      company: worker.employmentData?.company?.name || '',
      location: worker.employmentData?.location?.name || '',
      department: worker.employmentData?.department?.name || '',
      jobTitle: worker.employmentData?.jobTitle || '',
      managerId: worker.employmentData?.manager?.id || '',
      hireDate: worker.employmentData?.hireDate || '',
      status: worker.employmentData?.status || 'active',
    }));
  }

  /**
   * Get compensation
   */
  async getCompensation(
    config: WorkdayConfig,
    workerId: string
  ): Promise<WorkdayCompensation> {
    const url = `${this.baseUrl}/tenants/${config.tenantId}/workers/${workerId}/compensation`;
    const response = await this.makeRequest(config, 'GET', url);

    return {
      workerId,
      effectiveDate: response.effectiveDate,
      currency: response.currency,
      baseAmount: response.baseAmount,
      frequency: response.frequency,
      components: response.components.map((comp: any) => ({
        name: comp.name,
        amount: comp.amount,
        type: comp.type,
      })),
    };
  }

  /**
   * Get pay slips
   */
  async getPaySlips(
    config: WorkdayConfig,
    startDate: Date,
    endDate: Date
  ): Promise<WorkdayPaySlip[]> {
    const url = `${this.baseUrl}/tenants/${config.tenantId}/payslips?from_date=${startDate.toISOString()}&to_date=${endDate.toISOString()}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.data.map((slip: any) => ({
      id: slip.id,
      workerId: slip.workerId,
      payDate: slip.payDate,
      grossPay: slip.grossPay,
      netPay: slip.netPay,
      earnings: slip.earnings || {},
      deductions: slip.deductions || {},
      taxes: slip.taxes || {},
    }));
  }

  /**
   * Get financial impact report
   */
  async getFinancialReport(
    config: WorkdayConfig,
    reportType: string,
    period: string
  ): Promise<WorkdayReport> {
    const url = `${this.baseUrl}/tenants/${config.tenantId}/reports/${reportType}?period=${period}`;
    const response = await this.makeRequest(config, 'GET', url);

    return {
      name: reportType,
      type: 'financial',
      period,
      data: response.data,
    };
  }

  /**
   * Get headcount report
   */
  async getHeadcountReport(config: WorkdayConfig): Promise<WorkdayReport> {
    const url = `${this.baseUrl}/tenants/${config.tenantId}/reports/headcount`;
    const response = await this.makeRequest(config, 'GET', url);

    return {
      name: 'headcount',
      type: 'headcount',
      period: new Date().toISOString().split('T')[0],
      data: response.data,
    };
  }

  /**
   * Get organizational structure
   */
  async getOrgStructure(config: WorkdayConfig): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/tenants/${config.tenantId}/organizational-structure`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: WorkdayConfig,
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Workday-Tenant': config.tenantId,
    };

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Workday API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const workdayConfig = config as WorkdayConfig;
    let recordsCount = 0;

    try {
      // Get workers
      const workers = await this.getWorkers(workdayConfig);
      recordsCount += workers.length;

      // Get compensation for each worker
      for (const worker of workers) {
        try {
          await this.getCompensation(workdayConfig, worker.id);
        } catch (err) {
          this.logger.warn({ workerId: worker.id }, 'Failed to get compensation');
        }
      }

      // Get pay slips
      const lastSync = config.lastSyncAt || Date.now() - 86400000 * 30; // Last 30 days
      const payslips = await this.getPaySlips(
        workdayConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += payslips.length;

      this.logger.info(
        { recordsCount, workers: workers.length, payslips: payslips.length },
        'Workday sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'Workday sync failed');
      throw error;
    }
  }
}
