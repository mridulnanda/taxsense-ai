import { z } from 'zod';
import crypto from 'crypto';

const KotakAccountSchema = z.object({
  accountId: z.string(),
  accountNumber: z.string(),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'INVESTMENT']),
  customerName: z.string(),
  balance: z.number(),
  minimumBalance: z.number(),
  currency: z.string().default('INR'),
  status: z.enum(['ACTIVE', 'BLOCKED', 'DORMANT']),
  createdDate: z.date().optional(),
});

const KotakTransactionSchema = z.object({
  transactionId: z.string(),
  accountId: z.string(),
  amount: z.number(),
  type: z.enum(['DEBIT', 'CREDIT']),
  description: z.string(),
  transactionDate: z.date(),
  entryDate: z.date(),
  balance: z.number(),
});

export type KotakAccount = z.infer<typeof KotakAccountSchema>;
export type KotakTransaction = z.infer<typeof KotakTransactionSchema>;

interface KotakConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  redirectUri: string;
}

export class KotakMahindraBank {
  private config: KotakConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: KotakConfig) {
    this.config = config;
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'accounts transactions',
      state,
    });

    return `${this.config.apiBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(`${this.config.apiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Kotak token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.config.apiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Kotak token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Ensure valid token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    if (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Get linked accounts
   */
  async getAccounts(): Promise<KotakAccount[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.config.apiBaseUrl}/accounts/list`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Kotak accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.accounts.map((account: any) =>
      KotakAccountSchema.parse({
        accountId: account.accountId,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        customerName: account.customerName,
        balance: account.balance,
        minimumBalance: account.minimumBalance,
        currency: account.currency || 'INR',
        status: account.status,
        createdDate: account.createdDate ? new Date(account.createdDate) : undefined,
      })
    );
  }

  /**
   * Get transactions
   */
  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<KotakTransaction[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0],
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/accounts/${accountId}/transactions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Kotak transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transactions.map((txn: any) =>
      KotakTransactionSchema.parse({
        transactionId: txn.transactionId,
        accountId: txn.accountId,
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        transactionDate: new Date(txn.transactionDate),
        entryDate: new Date(txn.entryDate),
        balance: txn.balance,
      })
    );
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string): Promise<number> {
    await this.ensureValidToken();

    const response = await fetch(
      `${this.config.apiBaseUrl}/accounts/${accountId}/balance`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Kotak balance: ${response.statusText}`);
    }

    const data = await response.json();
    return data.balance;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }

  /**
   * Set tokens
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }
}
