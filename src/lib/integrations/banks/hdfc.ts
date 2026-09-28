import { z } from 'zod';
import crypto from 'crypto';

const HdfcAccountSchema = z.object({
  accountNumber: z.string(),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'OVERDRAFT']),
  balance: z.number(),
  currency: z.string().default('INR'),
  isActive: z.boolean().default(true),
});

const HdfcTransactionSchema = z.object({
  transactionId: z.string(),
  accountNumber: z.string(),
  amount: z.number(),
  transactionType: z.enum(['DEBIT', 'CREDIT']),
  description: z.string(),
  timestamp: z.date(),
  referenceNumber: z.string(),
  runningBalance: z.number(),
});

export type HdfcAccount = z.infer<typeof HdfcAccountSchema>;
export type HdfcTransaction = z.infer<typeof HdfcTransactionSchema>;

interface HdfcConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiBaseUrl: string;
}

interface HdfcAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}

export class HdfcBankConnect {
  private config: HdfcConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: HdfcConfig) {
    this.config = config;
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'accounts transactions',
      state,
    });

    return `${this.config.apiBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<HdfcAuthResponse> {
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
      throw new Error(`HDFC token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<HdfcAuthResponse> {
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
      throw new Error(`HDFC token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.refreshToken,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Check if token needs refresh
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
   * Fetch linked accounts
   */
  async getAccounts(): Promise<HdfcAccount[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.config.apiBaseUrl}/accounts`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HDFC accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.accounts.map((account: any) =>
      HdfcAccountSchema.parse({
        accountNumber: account.account_number,
        accountType: account.account_type,
        balance: account.balance,
        currency: account.currency || 'INR',
        isActive: account.is_active,
      })
    );
  }

  /**
   * Fetch transactions for an account
   */
  async getTransactions(
    accountNumber: string,
    fromDate: Date,
    toDate: Date
  ): Promise<HdfcTransaction[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      account_number: accountNumber,
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0],
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/accounts/${accountNumber}/transactions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch HDFC transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transactions.map((txn: any) =>
      HdfcTransactionSchema.parse({
        transactionId: txn.transaction_id,
        accountNumber: txn.account_number,
        amount: txn.amount,
        transactionType: txn.type,
        description: txn.description,
        timestamp: new Date(txn.timestamp),
        referenceNumber: txn.reference_number,
        runningBalance: txn.running_balance,
      })
    );
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string): Promise<number> {
    await this.ensureValidToken();

    const response = await fetch(
      `${this.config.apiBaseUrl}/accounts/${accountNumber}/balance`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch HDFC balance: ${response.statusText}`);
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
   * Set stored tokens (for resuming sessions)
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }
}
