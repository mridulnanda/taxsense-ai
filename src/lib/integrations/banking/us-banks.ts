import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * US Banking Integrations
 * Chase, Bank of America, Wells Fargo, US Bank, Citibank
 * Using Open Banking/Plaid-like standards
 */

export interface USBankConfig extends SyncConfig {
  bankCode: 'chase' | 'boa' | 'wellsfargo' | 'usbank' | 'citibank';
  metadata: {
    accountNumber: string;
    routingNumber: string;
  };
}

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  merchant: string;
  category: string;
  balance: number;
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export class USBankAdapter extends DataSyncEngine {
  private logger = pino();
  private bankEndpoints: Record<string, string> = {
    chase: 'https://api.chase.com/v1',
    boa: 'https://api.bankofamerica.com/v1',
    wellsfargo: 'https://api.wellsfargo.com/v1',
    usbank: 'https://api.usbank.com/v1',
    citibank: 'https://api.citibank.com/v1',
  };

  constructor() {
    super();
  }

  /**
   * Authorize with bank (OAuth2)
   */
  getAuthorizationUrl(bankCode: string, clientId: string, redirectUri: string, state: string): string {
    const bankUrl = this.bankEndpoints[bankCode];
    if (!bankUrl) throw new Error(`Unsupported bank: ${bankCode}`);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'accounts transactions',
      state,
    });

    return `${bankUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    bankCode: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const bankUrl = this.bankEndpoints[bankCode];
    if (!bankUrl) throw new Error(`Unsupported bank: ${bankCode}`);

    const payload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };

    const response = await fetch(`${bankUrl}/oauth/token`, {
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
   * Get accounts
   */
  async getAccounts(config: USBankConfig): Promise<BankAccount[]> {
    const bankUrl = this.bankEndpoints[config.metadata.bankCode];
    const url = `${bankUrl}/accounts`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.accounts.map((account: any) => ({
      id: account.accountId,
      name: account.name,
      type: account.type,
      balance: account.balance.amount,
      currency: account.balance.currency,
      lastUpdated: new Date(account.lastUpdated),
    }));
  }

  /**
   * Get transactions
   */
  async getTransactions(
    config: USBankConfig,
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BankTransaction[]> {
    const bankUrl = this.bankEndpoints[config.metadata.bankCode];
    const url = `${bankUrl}/accounts/${accountId}/transactions?from_date=${startDate.toISOString()}&to_date=${endDate.toISOString()}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.transactions.map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      amount: Math.abs(txn.amount),
      type: txn.amount < 0 ? 'debit' : 'credit',
      description: txn.description,
      merchant: txn.merchant || txn.description,
      category: this.categorizeTransaction(txn),
      balance: txn.running_balance,
    }));
  }

  /**
   * Get balances
   */
  async getBalances(config: USBankConfig): Promise<Array<{ accountId: string; balance: number }>> {
    const accounts = await this.getAccounts(config);
    return accounts.map((account) => ({
      accountId: account.id,
      balance: account.balance,
    }));
  }

  /**
   * Initiate bank reconciliation
   */
  async startReconciliation(
    config: USBankConfig,
    accountId: string,
    statementBalance: number,
    statementDate: Date
  ): Promise<{
    reconciled: boolean;
    differences: number;
    pendingTransactions: string[];
  }> {
    const bankUrl = this.bankEndpoints[config.metadata.bankCode];
    const url = `${bankUrl}/accounts/${accountId}/reconciliation`;

    const payload = {
      statementBalance,
      statementDate: statementDate.toISOString().split('T')[0],
    };

    const response = await this.makeRequest(config, 'POST', url, payload);

    return {
      reconciled: response.status === 'reconciled',
      differences: response.differences || 0,
      pendingTransactions: response.pendingTransactions || [],
    };
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: USBankConfig,
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
      throw new Error(`Bank API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Categorize transaction
   */
  private categorizeTransaction(txn: any): string {
    const desc = txn.description?.toLowerCase() || '';

    if (desc.includes('salary') || desc.includes('payroll')) return 'Income';
    if (desc.includes('transfer') || desc.includes('xfer')) return 'Transfer';
    if (desc.includes('gas') || desc.includes('fuel')) return 'Gas';
    if (desc.includes('grocery') || desc.includes('food')) return 'Groceries';
    if (desc.includes('restaurant') || desc.includes('cafe')) return 'Dining';
    if (desc.includes('medical') || desc.includes('pharma')) return 'Medical';
    if (desc.includes('utility') || desc.includes('power')) return 'Utilities';

    return 'Other';
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const usBankConfig = config as USBankConfig;
    let recordsCount = 0;

    try {
      const accounts = await this.getAccounts(usBankConfig);
      recordsCount += accounts.length;

      // Fetch transactions for each account
      for (const account of accounts) {
        const lastSync = config.lastSyncAt || Date.now() - 86400000;
        const transactions = await this.getTransactions(
          usBankConfig,
          account.id,
          new Date(lastSync),
          new Date()
        );
        recordsCount += transactions.length;
      }

      this.logger.info(
        { bankCode: usBankConfig.metadata.bankCode, recordsCount },
        'US bank sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'US bank sync failed');
      throw error;
    }
  }
}
