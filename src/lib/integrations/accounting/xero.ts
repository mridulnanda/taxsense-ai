import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * Xero Cloud Accounting Integration
 * OAuth2 authentication, real-time sync, multi-currency support
 */

export interface XeroConfig extends SyncConfig {
  tenantId: string; // Xero Organization ID
  metadata: {
    businessName: string;
    countryCode: string;
  };
}

export interface XeroInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  amount: number;
  amountPaid: number;
  currency: string;
  contactName: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    accountCode: string;
    taxType: string;
  }>;
}

export interface XeroContact {
  id: string;
  name: string;
  email: string;
  type: 'CONTACT' | 'CUSTOMER' | 'VENDOR';
  phone: string;
  address: {
    street: string;
    city: string;
    country: string;
    postal: string;
  };
}

export interface XeroExpense {
  id: string;
  date: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  description: string;
  receipt?: string;
}

export class XeroAdapter extends DataSyncEngine {
  private logger = pino();
  private baseUrl = 'https://api.xero.com/api.xro/2.0';

  constructor() {
    super();
  }

  /**
   * OAuth2 Authorization URL
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'payroll offline_access',
      state,
    });

    return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
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
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
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
  async getInvoices(config: XeroConfig, status?: string): Promise<XeroInvoice[]> {
    let url = `${this.baseUrl}/Invoices`;

    if (status) {
      url += `?where=Status=="${status}"`;
    }

    const response = await this.makeRequest(config, 'GET', url);
    const invoices: XeroInvoice[] = [];

    if (response.Invoices) {
      response.Invoices.forEach((inv: any) => {
        invoices.push({
          id: inv.InvoiceID,
          invoiceNumber: inv.InvoiceNumber,
          date: inv.InvoiceDate,
          dueDate: inv.DueDate,
          status: inv.Status,
          amount: inv.Total,
          amountPaid: inv.AmountPaid || 0,
          currency: inv.CurrencyCode,
          contactName: inv.Contact?.Name || '',
          lineItems: inv.LineItems.map((item: any) => ({
            description: item.Description,
            quantity: item.Quantity,
            unitAmount: item.UnitAmount,
            accountCode: item.AccountCode,
            taxType: item.TaxType,
          })),
        });
      });
    }

    return invoices;
  }

  /**
   * Get contacts
   */
  async getContacts(config: XeroConfig): Promise<XeroContact[]> {
    const url = `${this.baseUrl}/Contacts`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.Contacts.map((contact: any) => ({
      id: contact.ContactID,
      name: contact.Name,
      email: contact.EmailAddress || '',
      type: contact.ContactStatus === 'ARCHIVED' ? 'CONTACT' : 'CUSTOMER',
      phone: contact.Phones?.find((p: any) => p.PhoneType === 'DEFAULT')?.PhoneNumber || '',
      address: {
        street: contact.Addresses?.[0]?.AddressLine1 || '',
        city: contact.Addresses?.[0]?.City || '',
        country: contact.Addresses?.[0]?.Country || '',
        postal: contact.Addresses?.[0]?.PostalCode || '',
      },
    }));
  }

  /**
   * Get expense claims
   */
  async getExpenses(config: XeroConfig, status?: string): Promise<XeroExpense[]> {
    const url = `${this.baseUrl}/ExpenseClaims`;
    const response = await this.makeRequest(config, 'GET', url);

    const expenses: XeroExpense[] = [];

    if (response.ExpenseClaims) {
      response.ExpenseClaims.forEach((claim: any) => {
        claim.Receipts.forEach((receipt: any) => {
          expenses.push({
            id: receipt.ReceiptID,
            date: receipt.ReceiptDate,
            amount: receipt.Total,
            currency: receipt.CurrencyCode,
            merchant: receipt.Merchant || '',
            category: this.categorizeExpense(receipt),
            description: receipt.Description || '',
            receipt: receipt.FileName,
          });
        });
      });
    }

    return expenses;
  }

  /**
   * Create invoice
   */
  async createInvoice(
    config: XeroConfig,
    invoice: {
      contactName: string;
      invoiceNumber: string;
      date: Date;
      dueDate: Date;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitAmount: number;
        accountCode: string;
      }>;
    }
  ): Promise<{ id: string; status: string }> {
    const payload = {
      Type: 'ACCREC',
      InvoiceNumber: invoice.invoiceNumber,
      InvoiceDate: invoice.date.toISOString().split('T')[0],
      DueDate: invoice.dueDate.toISOString().split('T')[0],
      Contact: { Name: invoice.contactName },
      LineItems: invoice.lineItems.map((item) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unitAmount,
        AccountCode: item.accountCode,
        TaxType: 'Tax on Sales',
      })),
    };

    const response = await this.makeRequest(config, 'POST', `${this.baseUrl}/Invoices`, payload);
    return {
      id: response.Invoices[0].InvoiceID,
      status: response.Invoices[0].Status,
    };
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet(
    config: XeroConfig,
    date: Date
  ): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/Reports/BalanceSheet?date=${date.toISOString().split('T')[0]}`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Get P&L statement
   */
  async getProfitAndLoss(
    config: XeroConfig,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    const url = `${this.baseUrl}/Reports/ProfitAndLoss?fromDate=${start}&toDate=${end}`;
    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Make HTTP request with OAuth
   */
  private async makeRequest(
    config: XeroConfig,
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${config.accessToken}`,
      'xero-tenant-id': config.tenantId,
      'Accept': 'application/json',
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
      throw new Error(`Xero API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Categorize expense
   */
  private categorizeExpense(receipt: any): string {
    const description = receipt.Description?.toLowerCase() || '';

    if (
      description.includes('meal') ||
      description.includes('food') ||
      description.includes('lunch') ||
      description.includes('dinner')
    ) {
      return 'Meals & Entertainment';
    }
    if (description.includes('travel') || description.includes('flight') || description.includes('hotel')) {
      return 'Travel';
    }
    if (description.includes('office') || description.includes('supplies')) {
      return 'Office Supplies';
    }

    return 'General Expense';
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const xeroConfig = config as XeroConfig;
    let recordsCount = 0;

    try {
      // Fetch invoices
      const invoices = await this.getInvoices(xeroConfig);
      recordsCount += invoices.length;

      // Fetch contacts
      const contacts = await this.getContacts(xeroConfig);
      recordsCount += contacts.length;

      // Fetch expenses
      const expenses = await this.getExpenses(xeroConfig);
      recordsCount += expenses.length;

      this.logger.info(
        { recordsCount, invoices: invoices.length, contacts: contacts.length, expenses: expenses.length },
        'Xero sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'Xero sync failed');
      throw error;
    }
  }
}
