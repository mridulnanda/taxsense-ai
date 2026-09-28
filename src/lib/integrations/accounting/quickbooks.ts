import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * QuickBooks Online Integration
 * OAuth2 authentication, real-time sync via webhooks
 */

export interface QBOConfig extends SyncConfig {
  realmId: string; // QuickBooks Company ID
  metadata: {
    businessName: string;
    countryCode: string;
  };
}

export interface QBOTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  accountId: string;
  type: 'invoice' | 'bill' | 'expense' | 'payment' | 'credit_memo';
}

export interface QBOAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface QBOReport {
  name: string;
  type: 'ProfitAndLoss' | 'BalanceSheet' | 'TrialBalance' | 'CashFlow';
  data: Record<string, any>;
  generatedAt: Date;
}

export class QuickBooksOnlineAdapter extends DataSyncEngine {
  private logger = pino();
  private baseUrl = 'https://api.quickbooks.com/v2/companies';
  private apiVersion = '4.0';

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
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: redirectUri,
      state,
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
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
    });

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/tokens/introspect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
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
   * Fetch chart of accounts
   */
  async getChartOfAccounts(config: QBOConfig): Promise<QBOAccount[]> {
    const query = "SELECT * FROM Account";
    const response = await this.executeQuery(config, query);

    return response.QueryResponse.Account.map((account: any) => ({
      id: account.id,
      name: account.Name,
      type: account.AccountType,
      balance: account.CurrentBalance || 0,
      currency: 'USD',
    }));
  }

  /**
   * Fetch transactions
   */
  async getTransactions(
    config: QBOConfig,
    startDate: Date,
    endDate: Date
  ): Promise<QBOTransaction[]> {
    const dateStart = startDate.toISOString().split('T')[0];
    const dateEnd = endDate.toISOString().split('T')[0];

    const query = `SELECT * FROM Transaction WHERE TxnDate >= '${dateStart}' AND TxnDate <= '${dateEnd}'`;
    const response = await this.executeQuery(config, query);

    const transactions: QBOTransaction[] = [];

    if (response.QueryResponse.Transaction) {
      response.QueryResponse.Transaction.forEach((txn: any) => {
        transactions.push({
          id: txn.Id,
          date: txn.TxnDate,
          amount: txn.TotalAmt,
          description: txn.DocNumber || '',
          category: this.categorizeTransaction(txn),
          accountId: txn.DepositToAccountRef?.value || '',
          type: this.getTransactionType(txn),
        });
      });
    }

    return transactions;
  }

  /**
   * Fetch financial reports
   */
  async getReport(
    config: QBOConfig,
    reportType: 'ProfitAndLoss' | 'BalanceSheet' | 'TrialBalance' | 'CashFlow'
  ): Promise<QBOReport> {
    const url = `${this.baseUrl}/${config.metadata.businessName}/reports/${reportType}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${reportType}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      name: reportType,
      type: reportType,
      data,
      generatedAt: new Date(),
    };
  }

  /**
   * Create journal entry
   */
  async createJournalEntry(
    config: QBOConfig,
    entry: {
      date: Date;
      description: string;
      lines: Array<{
        accountId: string;
        amount: number;
        type: 'debit' | 'credit';
        description: string;
      }>;
    }
  ): Promise<{ id: string; status: string }> {
    const payload = {
      TxnDate: entry.date.toISOString().split('T')[0],
      DocNumber: `JE-${Date.now()}`,
      Line: entry.lines.map((line) => ({
        Amount: Math.abs(line.amount),
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: line.type === 'debit' ? 'Debit' : 'Credit',
          AccountRef: { value: line.accountId },
        },
        Description: line.description,
      })),
    };

    const url = `${this.baseUrl}/${config.metadata.businessName}/journalentry`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create journal entry: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.JournalEntry.Id,
      status: 'created',
    };
  }

  /**
   * Execute QuickBooks query
   */
  private async executeQuery(config: QBOConfig, query: string): Promise<any> {
    const url = `${this.baseUrl}/${config.metadata.businessName}/query`;

    const response = await fetch(`${url}?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Categorize transaction based on type
   */
  private categorizeTransaction(txn: any): string {
    if (txn.TxnType === 'Invoice') return 'Income';
    if (txn.TxnType === 'Bill') return 'Expense';
    if (txn.TxnType === 'Expense') return 'Expense';
    if (txn.TxnType === 'Payment') return 'Payment';
    return 'Other';
  }

  /**
   * Get transaction type
   */
  private getTransactionType(
    txn: any
  ): 'invoice' | 'bill' | 'expense' | 'payment' | 'credit_memo' {
    const typeMap: Record<string, any> = {
      Invoice: 'invoice',
      Bill: 'bill',
      Expense: 'expense',
      Payment: 'payment',
      CreditMemo: 'credit_memo',
    };
    return typeMap[txn.TxnType] || 'expense';
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const qboConfig = config as QBOConfig;
    let recordsCount = 0;

    try {
      // Fetch accounts
      const accounts = await this.getChartOfAccounts(qboConfig);
      recordsCount += accounts.length;

      // Fetch transactions from last sync
      const lastSync = config.lastSyncAt || Date.now() - 86400000; // Last 24 hours
      const transactions = await this.getTransactions(
        qboConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += transactions.length;

      this.logger.info(
        { recordsCount, accounts: accounts.length, transactions: transactions.length },
        'QuickBooks sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'QuickBooks sync failed');
      throw error;
    }
  }
}
