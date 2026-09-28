import { z } from 'zod';
import crypto from 'crypto';

const AxisAccountSchema = z.object({
  accountNumber: z.string(),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
  customerName: z.string(),
  balance: z.number(),
  ledgerBalance: z.number(),
  currency: z.string().default('INR'),
  isActive: z.boolean(),
  lastModified: z.date().optional(),
});

const AxisTransactionSchema = z.object({
  transactionId: z.string(),
  accountNumber: z.string(),
  amount: z.number(),
  transactionType: z.enum(['DEBIT', 'CREDIT']),
  description: z.string(),
  date: z.date(),
  balanceAfter: z.number(),
});

export type AxisAccount = z.infer<typeof AxisAccountSchema>;
export type AxisTransaction = z.infer<typeof AxisTransactionSchema>;

interface AxisConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  redirectUri: string;
}

export class AxisBankConnect {
  private config: AxisConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: AxisConfig) {
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
   * Exchange code for token
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
      throw new Error(`Axis token exchange failed: ${response.statusText}`);
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
      throw new Error(`Axis token refresh failed: ${response.statusText}`);
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
  async getAccounts(): Promise<AxisAccount[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.config.apiBaseUrl}/v2/accounts`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Axis accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((account: any) =>
      AxisAccountSchema.parse({
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        customerName: account.customerName,
        balance: account.balance,
        ledgerBalance: account.ledgerBalance,
        currency: account.currency || 'INR',
        isActive: account.isActive,
        lastModified: account.lastModified ? new Date(account.lastModified) : undefined,
      })
    );
  }

  /**
   * Get transactions
   */
  async getTransactions(
    accountNumber: string,
    fromDate: Date,
    toDate: Date
  ): Promise<AxisTransaction[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/v2/accounts/${accountNumber}/transactions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Axis transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((txn: any) =>
      AxisTransactionSchema.parse({
        transactionId: txn.transactionId,
        accountNumber: txn.accountNumber,
        amount: txn.amount,
        transactionType: txn.transactionType,
        description: txn.description,
        date: new Date(txn.date),
        balanceAfter: txn.balanceAfter,
      })
    );
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string): Promise<number> {
    await this.ensureValidToken();

    const response = await fetch(
      `${this.config.apiBaseUrl}/v2/accounts/${accountNumber}/balance`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Axis balance: ${response.statusText}`);
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
   * Set tokens for session resumption
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }
}
