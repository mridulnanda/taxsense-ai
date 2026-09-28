import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * International Banking Integrations
 * UK (PSD2): Barclays, HSBC, Lloyds
 * Canada: RBC, TD, Scotiabank, BMO
 * Singapore: DBS, OCBC, UOB
 * Australia: CBA, Westpac, ANZ, NAB
 */

export interface InternationalBankConfig extends SyncConfig {
  bankCode: string;
  region: 'uk' | 'canada' | 'singapore' | 'australia';
  metadata: {
    accountNumber: string;
    swiftCode?: string;
    iban?: string;
  };
}

export interface InternationalTransaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  type: 'debit' | 'credit';
  description: string;
  counterparty: string;
  category: string;
  reference: string;
}

export interface InternationalAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  iban?: string;
  swiftCode?: string;
}

export class InternationalBankAdapter extends DataSyncEngine {
  private logger = pino();
  private regionEndpoints: Record<string, Record<string, string>> = {
    uk: {
      barclays: 'https://api.barclays.com/v1',
      hsbc: 'https://api.hsbc.co.uk/v1',
      lloyds: 'https://api.lloydsbankinggroup.com/v1',
    },
    canada: {
      rbc: 'https://api.rbc.com/v1',
      td: 'https://api.tdbank.ca/v1',
      scotiabank: 'https://api.scotiabank.ca/v1',
      bmo: 'https://api.bmo.com/v1',
    },
    singapore: {
      dbs: 'https://api.dbs.com/v1',
      ocbc: 'https://api.ocbc.com/v1',
      uob: 'https://api.uob.com/v1',
    },
    australia: {
      cba: 'https://api.commbank.com.au/v1',
      westpac: 'https://api.westpac.com.au/v1',
      anz: 'https://api.anz.com.au/v1',
      nab: 'https://api.nab.com.au/v1',
    },
  };

  constructor() {
    super();
  }

  /**
   * Get authorization URL (PSD2/OAuth2)
   */
  getAuthorizationUrl(
    region: string,
    bankCode: string,
    clientId: string,
    redirectUri: string,
    state: string
  ): string {
    const endpoint = this.regionEndpoints[region]?.[bankCode];
    if (!endpoint) throw new Error(`Unsupported bank: ${region}/${bankCode}`);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'accounts transactions',
      state,
    });

    return `${endpoint}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    region: string,
    bankCode: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const endpoint = this.regionEndpoints[region]?.[bankCode];
    if (!endpoint) throw new Error(`Unsupported bank: ${region}/${bankCode}`);

    const payload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };

    const response = await fetch(`${endpoint}/oauth/token`, {
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
  async getAccounts(config: InternationalBankConfig): Promise<InternationalAccount[]> {
    const endpoint = this.regionEndpoints[config.region]?.[config.metadata.bankCode];
    if (!endpoint) throw new Error(`Unsupported bank`);

    const url = `${endpoint}/accounts`;
    const response = await this.makeRequest(config, 'GET', url);

    return response.accounts.map((account: any) => ({
      id: account.accountId,
      name: account.name,
      type: account.type,
      balance: account.balance.amount,
      currency: account.balance.currency,
      iban: account.iban,
      swiftCode: account.swiftCode,
    }));
  }

  /**
   * Get transactions
   */
  async getTransactions(
    config: InternationalBankConfig,
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InternationalTransaction[]> {
    const endpoint = this.regionEndpoints[config.region]?.[config.metadata.bankCode];
    if (!endpoint) throw new Error(`Unsupported bank`);

    const url = `${endpoint}/accounts/${accountId}/transactions?from_date=${startDate.toISOString()}&to_date=${endDate.toISOString()}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.transactions.map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      amount: Math.abs(txn.amount),
      currency: txn.currency,
      type: txn.amount < 0 ? 'debit' : 'credit',
      description: txn.description,
      counterparty: txn.counterparty || txn.description,
      category: this.categorizeTransaction(txn, config.region),
      reference: txn.reference || txn.id,
    }));
  }

  /**
   * Get exchange rates (for multi-currency accounts)
   */
  async getExchangeRates(
    config: InternationalBankConfig,
    baseCurrency: string
  ): Promise<Record<string, number>> {
    const endpoint = this.regionEndpoints[config.region]?.[config.metadata.bankCode];
    if (!endpoint) throw new Error(`Unsupported bank`);

    const url = `${endpoint}/exchange-rates?base=${baseCurrency}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.rates || {};
  }

  /**
   * Get payment limits
   */
  async getPaymentLimits(
    config: InternationalBankConfig,
    accountId: string
  ): Promise<{
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
    currency: string;
  }> {
    const endpoint = this.regionEndpoints[config.region]?.[config.metadata.bankCode];
    if (!endpoint) throw new Error(`Unsupported bank`);

    const url = `${endpoint}/accounts/${accountId}/payment-limits`;

    const response = await this.makeRequest(config, 'GET', url);

    return {
      dailyLimit: response.dailyLimit,
      weeklyLimit: response.weeklyLimit,
      monthlyLimit: response.monthlyLimit,
      currency: response.currency,
    };
  }

  /**
   * Initiate international transfer
   */
  async initiateTransfer(
    config: InternationalBankConfig,
    transfer: {
      accountId: string;
      beneficiaryName: string;
      beneficiaryIban: string;
      amount: number;
      currency: string;
      reference: string;
    }
  ): Promise<{ id: string; status: string; fee: number }> {
    const endpoint = this.regionEndpoints[config.region]?.[config.metadata.bankCode];
    if (!endpoint) throw new Error(`Unsupported bank`);

    const url = `${endpoint}/accounts/${transfer.accountId}/transfers`;

    const payload = {
      beneficiary: {
        name: transfer.beneficiaryName,
        iban: transfer.beneficiaryIban,
      },
      amount: transfer.amount,
      currency: transfer.currency,
      reference: transfer.reference,
    };

    const response = await this.makeRequest(config, 'POST', url, payload);

    return {
      id: response.transferId,
      status: response.status,
      fee: response.fee || 0,
    };
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: InternationalBankConfig,
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    };

    // Add region-specific headers if needed
    if (config.region === 'uk') {
      headers['X-Request-Id'] = crypto.randomUUID();
    }

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Bank API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Categorize transaction
   */
  private categorizeTransaction(txn: any, region: string): string {
    const desc = txn.description?.toLowerCase() || '';

    const categories: Record<string, string[]> = {
      Income: ['salary', 'payroll', 'bonus', 'commission'],
      Transfer: ['transfer', 'xfer', 'bank transfer'],
      Utilities: ['utility', 'power', 'water', 'gas', 'electric'],
      Groceries: ['grocery', 'supermarket', 'food', 'market'],
      Dining: ['restaurant', 'cafe', 'bar', 'pizza', 'burger'],
      Medical: ['medical', 'pharmacy', 'doctor', 'hospital', 'clinic'],
      Transportation: ['taxi', 'uber', 'fuel', 'petrol', 'parking', 'transit'],
      Entertainment: ['cinema', 'movie', 'theatre', 'entertainment', 'sports'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => desc.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const intlConfig = config as InternationalBankConfig;
    let recordsCount = 0;

    try {
      const accounts = await this.getAccounts(intlConfig);
      recordsCount += accounts.length;

      // Fetch transactions for each account
      for (const account of accounts) {
        const lastSync = config.lastSyncAt || Date.now() - 86400000;
        const transactions = await this.getTransactions(
          intlConfig,
          account.id,
          new Date(lastSync),
          new Date()
        );
        recordsCount += transactions.length;
      }

      this.logger.info(
        { region: intlConfig.region, bankCode: intlConfig.metadata.bankCode, recordsCount },
        'International bank sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'International bank sync failed');
      throw error;
    }
  }
}
