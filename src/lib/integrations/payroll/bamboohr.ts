import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * BambooHR Integration
 * Employee directory, compensation data sync
 */

export interface BambooHRConfig extends SyncConfig {
  domain: string; // bamboohr domain
  metadata: {
    companyName: string;
  };
}

export interface BambooHREmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  department: string;
  jobTitle: string;
  status: 'active' | 'inactive';
  reportsTo: string;
  location: string;
  payRate: number;
  payRateType: string;
}

export interface BambooHRTimeOff {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export interface BambooHRDocument {
  id: string;
  employeeId: string;
  name: string;
  type: string;
  uploadDate: string;
  category: string;
}

export class BambooHRAdapter extends DataSyncEngine {
  private logger = pino();
  private baseUrl = 'https://api.bamboohr.com/api/gateway.php';

  constructor() {
    super();
  }

  /**
   * Get authorization URL (API Key)
   */
  getAuthorizationUrl(domain: string): string {
    return `https://${domain}.bamboohr.com/login.php`;
  }

  /**
   * Get employees
   */
  async getEmployees(config: BambooHRConfig): Promise<BambooHREmployee[]> {
    const url = `${this.baseUrl}/${config.domain}/v1/employees/directory`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.employees.map((employee: any) => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.mobilePhone || employee.workPhone || '',
      hireDate: employee.hireDate,
      department: employee.department,
      jobTitle: employee.jobTitle,
      status: employee.employmentStatus === 'Active' ? 'active' : 'inactive',
      reportsTo: employee.reportsTo || '',
      location: employee.location || '',
      payRate: employee.payRate ? parseFloat(employee.payRate) : 0,
      payRateType: employee.payType || 'salary',
    }));
  }

  /**
   * Get employee details
   */
  async getEmployeeDetails(config: BambooHRConfig, employeeId: string): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/${config.domain}/v1/employees/${employeeId}`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Get time off records
   */
  async getTimeOff(
    config: BambooHRConfig,
    startDate: Date,
    endDate: Date
  ): Promise<BambooHRTimeOff[]> {
    const url = `${this.baseUrl}/${config.domain}/v1/time_off/request?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.timeOffRequests.map((record: any) => ({
      id: record.id,
      employeeId: record.employeeId,
      type: record.type,
      startDate: record.startDate,
      endDate: record.endDate,
      days: record.days,
      status: record.status,
    }));
  }

  /**
   * Get documents
   */
  async getDocuments(config: BambooHRConfig, employeeId: string): Promise<BambooHRDocument[]> {
    const url = `${this.baseUrl}/${config.domain}/v1/employees/${employeeId}/documents`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.documents.map((doc: any) => ({
      id: doc.id,
      employeeId,
      name: doc.fileName,
      type: doc.category,
      uploadDate: doc.uploadedDate,
      category: doc.category,
    }));
  }

  /**
   * Get compensation info
   */
  async getCompensation(config: BambooHRConfig, employeeId: string): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/${config.domain}/v1/employees/${employeeId}/compensation`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Create employee
   */
  async createEmployee(
    config: BambooHRConfig,
    employee: {
      firstName: string;
      lastName: string;
      email: string;
      hireDate: string;
      department: string;
      jobTitle: string;
    }
  ): Promise<{ id: string; status: string }> {
    const url = `${this.baseUrl}/${config.domain}/v1/employees`;

    const payload = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      hireDate: employee.hireDate,
      department: employee.department,
      jobTitle: employee.jobTitle,
    };

    const response = await this.makeRequest(config, 'POST', url, payload);

    return {
      id: response.id,
      status: 'created',
    };
  }

  /**
   * Update employee
   */
  async updateEmployee(
    config: BambooHRConfig,
    employeeId: string,
    updates: Record<string, any>
  ): Promise<{ id: string; status: string }> {
    const url = `${this.baseUrl}/${config.domain}/v1/employees/${employeeId}`;

    await this.makeRequest(config, 'POST', url, updates);

    return {
      id: employeeId,
      status: 'updated',
    };
  }

  /**
   * Get reports
   */
  async getReport(
    config: BambooHRConfig,
    reportId: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/${config.domain}/v1/reports/${reportId}?format=${format}`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: BambooHRConfig,
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    // BambooHR uses API key in Basic auth
    const auth = Buffer.from(`${config.accessToken}:x`).toString('base64');

    const headers: HeadersInit = {
      Authorization: `Basic ${auth}`,
      'Accept': 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`BambooHR API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const bambooConfig = config as BambooHRConfig;
    let recordsCount = 0;

    try {
      // Get employees
      const employees = await this.getEmployees(bambooConfig);
      recordsCount += employees.length;

      // Get time off records
      const lastSync = config.lastSyncAt || Date.now() - 86400000 * 90; // Last 90 days
      const timeOff = await this.getTimeOff(
        bambooConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += timeOff.length;

      // Get documents for each employee (limit to active employees)
      for (const employee of employees.slice(0, 10)) {
        try {
          const docs = await this.getDocuments(bambooConfig, employee.id);
          recordsCount += docs.length;
        } catch (err) {
          this.logger.warn({ employeeId: employee.id }, 'Failed to get documents');
        }
      }

      this.logger.info(
        { recordsCount, employees: employees.length, timeOff: timeOff.length },
        'BambooHR sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'BambooHR sync failed');
      throw error;
    }
  }
}
