import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * FreshBooks Integration
 * OAuth2 authentication, invoice sync, payment tracking, expense categorization
 */

export interface FreshBooksConfig extends SyncConfig {
  accountId: string;
  metadata: {
    businessName: string;
    businessCountry: string;
  };
}

export interface FreshBooksInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  total: number;
  paid: number;
  currency: string;
  clientName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitCost: number;
    tax: number;
  }>;
}

export interface FreshBooksExpense {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  vendor: string;
  notes: string;
  receipt?: string;
}

export interface FreshBooksClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  province: string;
}

export class FreshBooksAdapter extends DataSyncEngine {
  private logger = pino();
  private baseUrl = 'https://api.freshbooks.com/accounting_account/account';

  constructor() {
    super();
  }

  /**
   * OAuth2 Authorization URL
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'admin:all',
      state,
    });

    return `https://auth.freshbooks.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
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

    const response = await fetch('https://auth.freshbooks.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OAuth exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get invoices
   */
  async getInvoices(config: FreshBooksConfig, status?: string): Promise<FreshBooksInvoice[]> {
    const url = `${this.baseUrl}/${config.accountId}/invoices/invoices`;
    const params = new URLSearchParams();

    if (status) {
      params.append('status', status);
    }

    const response = await this.makeRequest(
      config,
      'GET',
      `${url}?${params.toString()}`
    );

    return response.invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      date: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.invoice_status,
      total: invoice.total,
      paid: invoice.amount_paid || 0,
      currency: invoice.currency_code,
      clientName: invoice.customerid ? `Client ${invoice.customerid}` : 'N/A',
      items: invoice.lines.map((line: any) => ({
        name: line.name,
        quantity: line.qty,
        unitCost: line.unitcost,
        tax: line.taxAmount1 || 0,
      })),
    }));
  }

  /**
   * Get expenses
   */
  async getExpenses(config: FreshBooksConfig): Promise<FreshBooksExpense[]> {
    const url = `${this.baseUrl}/${config.accountId}/expenses/expenses`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.expenses.map((expense: any) => ({
      id: expense.id,
      date: expense.date,
      amount: expense.amount,
      currency: expense.currency_code,
      category: expense.category || 'Uncategorized',
      vendor: expense.vendor || '',
      notes: expense.notes || '',
      receipt: expense.receipt_image_url,
    }));
  }

  /**
   * Get clients
   */
  async getClients(config: FreshBooksConfig): Promise<FreshBooksClient[]> {
    const url = `${this.baseUrl}/${config.accountId}/customers/customers`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.customers.map((customer: any) => ({
      id: customer.id,
      name: customer.organization,
      email: customer.email || '',
      phone: customer.phone || '',
      country: customer.country || '',
      city: customer.city || '',
      province: customer.province || '',
    }));
  }

  /**
   * Create invoice
   */
  async createInvoice(
    config: FreshBooksConfig,
    invoice: {
      clientId: string;
      invoiceNumber: string;
      date: Date;
      dueDate: Date;
      items: Array<{
        name: string;
        quantity: number;
        unitCost: number;
      }>;
    }
  ): Promise<{ id: string; status: string }> {
    const payload = {
      invoice: {
        customerid: invoice.clientId,
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.date.toISOString().split('T')[0],
        due_date: invoice.dueDate.toISOString().split('T')[0],
        lines: invoice.items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          unitcost: item.unitCost,
        })),
      },
    };

    const url = `${this.baseUrl}/${config.accountId}/invoices/invoices`;
    const response = await this.makeRequest(config, 'POST', url, payload);

    return {
      id: response.invoice.id,
      status: response.invoice.invoice_status,
    };
  }

  /**
   * Record expense
   */
  async recordExpense(
    config: FreshBooksConfig,
    expense: {
      date: Date;
      amount: number;
      category: string;
      vendor: string;
      notes: string;
    }
  ): Promise<{ id: string; status: string }> {
    const payload = {
      expense: {
        date: expense.date.toISOString().split('T')[0],
        amount: expense.amount,
        category: expense.category,
        vendor: expense.vendor,
        notes: expense.notes,
      },
    };

    const url = `${this.baseUrl}/${config.accountId}/expenses/expenses`;
    const response = await this.makeRequest(config, 'POST', url, payload);

    return {
      id: response.expense.id,
      status: 'created',
    };
  }

  /**
   * Get profit & loss report
   */
  async getProfitAndLoss(
    config: FreshBooksConfig,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const url = `${this.baseUrl}/${config.accountId}/reports/profitloss?start_date=${start}&end_date=${end}`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Make HTTP request with OAuth
   */
  private async makeRequest(
    config: FreshBooksConfig,
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`FreshBooks API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const fbConfig = config as FreshBooksConfig;
    let recordsCount = 0;

    try {
      // Fetch invoices
      const invoices = await this.getInvoices(fbConfig);
      recordsCount += invoices.length;

      // Fetch expenses
      const expenses = await this.getExpenses(fbConfig);
      recordsCount += expenses.length;

      // Fetch clients
      const clients = await this.getClients(fbConfig);
      recordsCount += clients.length;

      this.logger.info(
        { recordsCount, invoices: invoices.length, expenses: expenses.length, clients: clients.length },
        'FreshBooks sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'FreshBooks sync failed');
      throw error;
    }
  }
}
