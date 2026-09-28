import { z } from 'zod';
import crypto from 'crypto';

const IciciAccountSchema = z.object({
  accountId: z.string(),
  accountNumber: z.string(),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'SALARY']),
  holderName: z.string(),
  balance: z.number(),
  availableBalance: z.number(),
  currency: z.string().default('INR'),
  status: z.enum(['ACTIVE', 'DORMANT', 'CLOSED']),
  lastActivityDate: z.date().optional(),
});

const IciciTransactionSchema = z.object({
  transactionId: z.string(),
  accountId: z.string(),
  amount: z.number(),
  type: z.enum(['DEBIT', 'CREDIT']),
  narration: z.string(),
  valueDate: z.date(),
  postingDate: z.date(),
  balance: z.number(),
  chequeNumber: z.string().optional(),
  utrNumber: z.string().optional(),
});

export type IciciAccount = z.infer<typeof IciciAccountSchema>;
export type IciciTransaction = z.infer<typeof IciciTransactionSchema>;

interface IciciConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  apiBaseUrl: string;
  redirectUri: string;
}

interface IciciAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class IciciOpenAPI {
  private config: IciciConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: IciciConfig) {
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
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<IciciAuthResponse> {
    const response = await fetch(`${this.config.apiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': this.config.apiKey,
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
      throw new Error(`ICICI token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<IciciAuthResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.config.apiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': this.config.apiKey,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`ICICI token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  /**
   * Ensure token validity
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
   * Get all linked accounts
   */
  async getAccounts(): Promise<IciciAccount[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.config.apiBaseUrl}/accounts`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ICICI accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.accounts.map((account: any) =>
      IciciAccountSchema.parse({
        accountId: account.account_id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        holderName: account.holder_name,
        balance: account.balance,
        availableBalance: account.available_balance,
        currency: account.currency || 'INR',
        status: account.status,
        lastActivityDate: account.last_activity_date
          ? new Date(account.last_activity_date)
          : undefined,
      })
    );
  }

  /**
   * Get transactions for account
   */
  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date,
    limit: number = 100
  ): Promise<IciciTransaction[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0],
      limit: limit.toString(),
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/accounts/${accountId}/transactions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ICICI transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transactions.map((txn: any) =>
      IciciTransactionSchema.parse({
        transactionId: txn.transaction_id,
        accountId: txn.account_id,
        amount: txn.amount,
        type: txn.type,
        narration: txn.narration,
        valueDate: new Date(txn.value_date),
        postingDate: new Date(txn.posting_date),
        balance: txn.balance,
        chequeNumber: txn.cheque_number,
        utrNumber: txn.utr_number,
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
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ICICI balance: ${response.statusText}`);
    }

    const data = await response.json();
    return data.balance;
  }

  /**
   * Validate webhook signature using API Key
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }

  /**
   * Set stored tokens
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }
}
