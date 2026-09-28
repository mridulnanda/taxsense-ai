import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * Investment Broker Integrations
 * Interactive Brokers, Charles Schwab, Fidelity, Vanguard
 */

export interface BrokerConfig extends SyncConfig {
  brokerCode: 'interactive_brokers' | 'schwab' | 'fidelity' | 'vanguard';
  accountNumber: string;
  metadata: {
    accountType: string; // 'individual', 'joint', 'ira', 'roth', 'sep', '401k'
  };
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
  purchaseDate: string;
}

export interface Transaction {
  id: string;
  date: string;
  symbol: string;
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee' | 'adjustment';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
  notes: string;
}

export interface Dividend {
  id: string;
  symbol: string;
  date: string;
  amount: number;
  sharesOwned: number;
  perShare: number;
  taxable: boolean;
}

export interface RealizedGain {
  id: string;
  symbol: string;
  openDate: string;
  closeDate: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  proceeds: number;
  costBasis: number;
  gain: number;
  gainType: 'short_term' | 'long_term';
  heldDays: number;
}

export class BrokerAdapter extends DataSyncEngine {
  private logger = pino();
  private brokerEndpoints: Record<string, string> = {
    interactive_brokers: 'https://api.interactivebrokers.com/v1',
    schwab: 'https://api.schwab.com/v1',
    fidelity: 'https://api.fidelity.com/v1',
    vanguard: 'https://api.vanguard.com/v1',
  };

  constructor() {
    super();
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(
    brokerCode: string,
    clientId: string,
    redirectUri: string,
    state: string
  ): string {
    const endpoint = this.brokerEndpoints[brokerCode];
    if (!endpoint) throw new Error(`Unsupported broker: ${brokerCode}`);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'accounts positions transactions',
      state,
    });

    return `${endpoint}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code
   */
  async exchangeCodeForToken(
    brokerCode: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const endpoint = this.brokerEndpoints[brokerCode];
    if (!endpoint) throw new Error(`Unsupported broker: ${brokerCode}`);

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
   * Get positions
   */
  async getPositions(config: BrokerConfig): Promise<Position[]> {
    const endpoint = this.brokerEndpoints[config.brokerCode];
    const url = `${endpoint}/accounts/${config.accountNumber}/positions`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.positions.map((pos: any) => ({
      id: pos.positionId,
      symbol: pos.symbol,
      quantity: pos.quantity,
      costBasis: pos.costBasis,
      currentPrice: pos.currentPrice,
      currentValue: pos.currentValue,
      gain: pos.gain,
      gainPercent: pos.gainPercent,
      purchaseDate: pos.purchaseDate,
    }));
  }

  /**
   * Get transactions
   */
  async getTransactions(
    config: BrokerConfig,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const endpoint = this.brokerEndpoints[config.brokerCode];
    const url = `${endpoint}/accounts/${config.accountNumber}/transactions?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;

    const response = await this.makeRequest(config, 'GET', url);

    return response.transactions.map((txn: any) => ({
      id: txn.transactionId,
      date: txn.date,
      symbol: txn.symbol,
      type: this.mapTransactionType(txn.type),
      quantity: txn.quantity || 0,
      price: txn.price || 0,
      amount: txn.amount,
      commission: txn.commission || 0,
      notes: txn.description || '',
    }));
  }

  /**
   * Get dividends
   */
  async getDividends(config: BrokerConfig, year?: number): Promise<Dividend[]> {
    const endpoint = this.brokerEndpoints[config.brokerCode];
    let url = `${endpoint}/accounts/${config.accountNumber}/dividends`;

    if (year) {
      url += `?year=${year}`;
    }

    const response = await this.makeRequest(config, 'GET', url);

    return response.dividends.map((div: any) => ({
      id: div.dividendId,
      symbol: div.symbol,
      date: div.paymentDate,
      amount: div.amount,
      sharesOwned: div.shares,
      perShare: div.amount / div.shares,
      taxable: div.taxable !== false,
    }));
  }

  /**
   * Get realized gains/losses (for tax reporting)
   */
  async getRealizedGains(
    config: BrokerConfig,
    year?: number
  ): Promise<RealizedGain[]> {
    const endpoint = this.brokerEndpoints[config.brokerCode];
    let url = `${endpoint}/accounts/${config.accountNumber}/realized-gains`;

    if (year) {
      url += `?year=${year}`;
    }

    const response = await this.makeRequest(config, 'GET', url);

    return response.gains.map((gain: any) => {
      const heldDays = Math.floor(
        (new Date(gain.closeDate).getTime() - new Date(gain.openDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        id: gain.gainId,
        symbol: gain.symbol,
        openDate: gain.openDate,
        closeDate: gain.closeDate,
        quantity: gain.quantity,
        openPrice: gain.openPrice,
        closePrice: gain.closePrice,
        proceeds: gain.proceeds,
        costBasis: gain.costBasis,
        gain: gain.gain,
        gainType: heldDays > 365 ? 'long_term' : 'short_term',
        heldDays,
      };
    });
  }

  /**
   * Get account summary
   */
  async getAccountSummary(config: BrokerConfig): Promise<Record<string, any>> {
    const endpoint = this.brokerEndpoints[config.brokerCode];
    const url = `${endpoint}/accounts/${config.accountNumber}`;

    return this.makeRequest(config, 'GET', url);
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: BrokerConfig,
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
      throw new Error(`Broker API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Map transaction type
   */
  private mapTransactionType(
    type: string
  ): 'buy' | 'sell' | 'dividend' | 'interest' | 'fee' | 'adjustment' {
    const typeMap: Record<string, any> = {
      'BUY': 'buy',
      'SELL': 'sell',
      'DIV': 'dividend',
      'DIVIDEND': 'dividend',
      'INT': 'interest',
      'INTEREST': 'interest',
      'FEE': 'fee',
      'ADJ': 'adjustment',
      'ADJUSTMENT': 'adjustment',
    };

    return typeMap[type.toUpperCase()] || 'adjustment';
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const brokerConfig = config as BrokerConfig;
    let recordsCount = 0;

    try {
      // Get positions
      const positions = await this.getPositions(brokerConfig);
      recordsCount += positions.length;

      // Get transactions
      const lastSync = config.lastSyncAt || Date.now() - 86400000 * 365; // Last year
      const transactions = await this.getTransactions(
        brokerConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += transactions.length;

      // Get dividends for current year
      const currentYear = new Date().getFullYear();
      const dividends = await this.getDividends(brokerConfig, currentYear);
      recordsCount += dividends.length;

      // Get realized gains
      const gains = await this.getRealizedGains(brokerConfig, currentYear);
      recordsCount += gains.length;

      this.logger.info(
        {
          recordsCount,
          positions: positions.length,
          transactions: transactions.length,
          dividends: dividends.length,
          gains: gains.length,
        },
        'Broker sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'Broker sync failed');
      throw error;
    }
  }
}
