import { z } from 'zod';
import crypto from 'crypto';

const SbiAccountSchema = z.object({
  accountNumber: z.string(),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'OVERDRAFT']),
  accountHolder: z.string(),
  balance: z.number(),
  availableBalance: z.number(),
  currency: z.string().default('INR'),
  branchCode: z.string(),
  ifscCode: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DORMANT']),
});

const SbiTransactionSchema = z.object({
  transactionId: z.string(),
  accountNumber: z.string(),
  amount: z.number(),
  type: z.enum(['DEBIT', 'CREDIT']),
  narration: z.string(),
  transactionDate: z.date(),
  valueDate: z.date(),
  balance: z.number(),
  referenceNumber: z.string().optional(),
});

export type SbiAccount = z.infer<typeof SbiAccountSchema>;
export type SbiTransaction = z.infer<typeof SbiTransactionSchema>;

interface SbiConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  redirectUri: string;
  apiVersion?: string;
}

export class SbiConnect {
  private config: SbiConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: SbiConfig) {
    this.config = { apiVersion: 'v1', ...config };
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'accounts transactions profile',
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
      throw new Error(`SBI token exchange failed: ${response.statusText}`);
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
      throw new Error(`SBI token refresh failed: ${response.statusText}`);
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
  async getAccounts(): Promise<SbiAccount[]> {
    await this.ensureValidToken();

    const response = await fetch(
      `${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch SBI accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.accounts.map((account: any) =>
      SbiAccountSchema.parse({
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        accountHolder: account.accountHolder,
        balance: account.balance,
        availableBalance: account.availableBalance,
        currency: account.currency || 'INR',
        branchCode: account.branchCode,
        ifscCode: account.ifscCode,
        status: account.status,
      })
    );
  }

  /**
   * Get transactions
   */
  async getTransactions(
    accountNumber: string,
    fromDate: Date,
    toDate: Date,
    limit: number = 100
  ): Promise<SbiTransaction[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      limit: limit.toString(),
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts/${accountNumber}/transactions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch SBI transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transactions.map((txn: any) =>
      SbiTransactionSchema.parse({
        transactionId: txn.transactionId,
        accountNumber: txn.accountNumber,
        amount: txn.amount,
        type: txn.type,
        narration: txn.narration,
        transactionDate: new Date(txn.transactionDate),
        valueDate: new Date(txn.valueDate),
        balance: txn.balance,
        referenceNumber: txn.referenceNumber,
      })
    );
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string): Promise<number> {
    await this.ensureValidToken();

    const response = await fetch(
      `${this.config.apiBaseUrl}/${this.config.apiVersion}/accounts/${accountNumber}/balance`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch SBI balance: ${response.statusText}`);
    }

    const data = await response.json();
    return data.availableBalance;
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
