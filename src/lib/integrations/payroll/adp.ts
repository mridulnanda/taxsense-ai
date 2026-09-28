import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * ADP Payroll Integration
 * Employee data sync, payroll data import, tax withholding info
 */

export interface ADPConfig extends SyncConfig {
  clientId: string;
  clientSecret: string;
  companyCode: string;
  metadata: {
    companyName: string;
    taxId: string;
  };
}

export interface ADPEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ssn: string; // masked in real implementation
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  department: string;
  salary: number;
  payFrequency: string;
}

export interface ADPPayroll {
  id: string;
  payDate: string;
  employeeId: string;
  grossPay: number;
  netPay: number;
  taxes: {
    federal: number;
    state: number;
    fica: number;
    other: number;
  };
  deductions: {
    health: number;
    dental: number;
    vision: number;
    retirement: number;
    other: number;
  };
}

export interface ADPTaxInfo {
  employeeId: string;
  w2Withheld: number;
  federalWithheld: number;
  stateWithheld: number;
  ficaWithheld: number;
  ytdGrossPay: number;
  ytdNetPay: number;
}

export class ADPAdapter extends DataSyncEngine {
  private logger = pino();
  private baseUrl = 'https://api.adp.com/hr/v2';

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
      scope: 'hr payroll',
      state,
    });

    return `https://api.adp.com/auth/oauth/v2/authorize?${params.toString()}`;
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

    const response = await fetch('https://api.adp.com/auth/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload).toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get employees
   */
  async getEmployees(config: ADPConfig): Promise<ADPEmployee[]> {
    const url = `${this.baseUrl}/companies/${config.companyCode}/workers`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.workers.map((worker: any) => ({
      id: worker.associateOID,
      firstName: worker.person?.legalName?.givenName || '',
      lastName: worker.person?.legalName?.familyName || '',
      email: worker.person?.contact?.emails?.[0]?.emailAddress || '',
      ssn: worker.person?.governmentIDs?.[0]?.idValue?.substring(0, 5) + '****', // Masked
      hireDate: worker.employment?.hireDate || '',
      status: worker.employment?.employmentStatus?.statusCode || 'active',
      department: worker.workerDates?.departmentCode || '',
      salary: worker.compensation?.baseRemuneration?.grossPayAmount || 0,
      payFrequency: worker.compensation?.payPeriodCode || 'monthly',
    }));
  }

  /**
   * Get payroll records
   */
  async getPayrollRecords(
    config: ADPConfig,
    startDate: Date,
    endDate: Date
  ): Promise<ADPPayroll[]> {
    const url = `${this.baseUrl}/companies/${config.companyCode}/payroll-results?from_date=${startDate.toISOString()}&to_date=${endDate.toISOString()}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.payrollResults.map((payroll: any) => ({
      id: payroll.payrollResultID,
      payDate: payroll.payDate,
      employeeId: payroll.associateOID,
      grossPay: payroll.grossPay,
      netPay: payroll.netPay,
      taxes: {
        federal: payroll.taxes?.federalIncomeTax || 0,
        state: payroll.taxes?.stateIncomeTax || 0,
        fica: payroll.taxes?.ficaTax || 0,
        other: payroll.taxes?.otherTaxes || 0,
      },
      deductions: {
        health: payroll.deductions?.healthInsurance || 0,
        dental: payroll.deductions?.dentalInsurance || 0,
        vision: payroll.deductions?.visionInsurance || 0,
        retirement: payroll.deductions?.retirementPlan || 0,
        other: payroll.deductions?.otherDeductions || 0,
      },
    }));
  }

  /**
   * Get tax information
   */
  async getTaxInfo(config: ADPConfig, employeeId: string): Promise<ADPTaxInfo> {
    const url = `${this.baseUrl}/companies/${config.companyCode}/workers/${employeeId}/tax-information`;
    const response = await this.makeRequest(config, 'GET', url);

    return {
      employeeId,
      w2Withheld: response.w2Withheld || 0,
      federalWithheld: response.federalWithheld || 0,
      stateWithheld: response.stateWithheld || 0,
      ficaWithheld: response.ficaWithheld || 0,
      ytdGrossPay: response.ytdGrossPay || 0,
      ytdNetPay: response.ytdNetPay || 0,
    };
  }

  /**
   * Get W2 data
   */
  async getW2Data(config: ADPConfig, year: number): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/companies/${config.companyCode}/w2-forms?year=${year}`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.w2Forms || {};
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: ADPConfig,
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`ADP API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const adpConfig = config as ADPConfig;
    let recordsCount = 0;

    try {
      // Get employees
      const employees = await this.getEmployees(adpConfig);
      recordsCount += employees.length;

      // Get payroll records
      const lastSync = config.lastSyncAt || Date.now() - 86400000 * 7; // Last 7 days
      const payrolls = await this.getPayrollRecords(
        adpConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += payrolls.length;

      this.logger.info({ recordsCount, employees: employees.length, payrolls: payrolls.length }, 'ADP sync completed');

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'ADP sync failed');
      throw error;
    }
  }
}
