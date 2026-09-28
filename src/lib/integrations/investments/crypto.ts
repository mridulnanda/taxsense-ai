import { DataSyncEngine, SyncConfig } from '../sync-engine';
import pino from 'pino';

/**
 * Cryptocurrency Exchange Integrations
 * Coinbase, Kraken - holdings, transaction history, cost basis tracking
 */

export interface CryptoConfig extends SyncConfig {
  exchangeCode: 'coinbase' | 'kraken';
  metadata: {
    accountName: string;
  };
}

export interface CryptoHolding {
  id: string;
  symbol: string;
  amount: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
  acquiredDate: string;
}

export interface CryptoTransaction {
  id: string;
  timestamp: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'reward' | 'fee';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
}

export interface CryptoReward {
  id: string;
  timestamp: string;
  symbol: string;
  amount: number;
  type: string; // 'staking', 'interest', 'airdrop', etc.
}

export interface CryptoRebalance {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  reason: string;
}

export class CryptoAdapter extends DataSyncEngine {
  private logger = pino();
  private exchangeEndpoints: Record<string, string> = {
    coinbase: 'https://api.coinbase.com/v1',
    kraken: 'https://api.kraken.com/0',
  };

  constructor() {
    super();
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(
    exchangeCode: string,
    clientId: string,
    redirectUri: string,
    state: string
  ): string {
    const endpoint = this.exchangeEndpoints[exchangeCode];
    if (!endpoint) throw new Error(`Unsupported exchange: ${exchangeCode}`);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'wallet:accounts:read wallet:transactions:read',
      state,
    });

    return `${endpoint}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code
   */
  async exchangeCodeForToken(
    exchangeCode: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const endpoint = this.exchangeEndpoints[exchangeCode];
    if (!endpoint) throw new Error(`Unsupported exchange: ${exchangeCode}`);

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
   * Get cryptocurrency holdings
   */
  async getHoldings(config: CryptoConfig): Promise<CryptoHolding[]> {
    const endpoint = this.exchangeEndpoints[config.exchangeCode];
    const url = `${endpoint}/accounts`;

    const response = await this.makeRequest(config, 'GET', url);

    const holdings: CryptoHolding[] = [];

    if (config.exchangeCode === 'coinbase') {
      response.data?.forEach((account: any) => {
        if (parseFloat(account.balance.amount) > 0) {
          holdings.push({
            id: account.id,
            symbol: account.currency.code,
            amount: parseFloat(account.balance.amount),
            costBasis: parseFloat(account.native_balance.amount) || 0,
            currentPrice: 0, // Would be fetched separately
            currentValue: parseFloat(account.native_balance.amount) || 0,
            gain: 0,
            gainPercent: 0,
            acquiredDate: '', // Would track from transactions
          });
        }
      });
    }

    return holdings;
  }

  /**
   * Get transactions
   */
  async getTransactions(
    config: CryptoConfig,
    startDate: Date,
    endDate: Date
  ): Promise<CryptoTransaction[]> {
    const endpoint = this.exchangeEndpoints[config.exchangeCode];
    let url = `${endpoint}/transactions`;

    if (config.exchangeCode === 'kraken') {
      url = `${endpoint}/private/Ledger?start=${Math.floor(startDate.getTime() / 1000)}&end=${Math.floor(endDate.getTime() / 1000)}`;
    }

    const response = await this.makeRequest(config, 'GET', url);

    return this.parseTransactions(response, config.exchangeCode);
  }

  /**
   * Get staking/rewards
   */
  async getRewards(config: CryptoConfig, startDate: Date, endDate: Date): Promise<CryptoReward[]> {
    const endpoint = this.exchangeEndpoints[config.exchangeCode];

    if (config.exchangeCode === 'coinbase') {
      // Coinbase rewards endpoint
      const url = `${endpoint}/accounts`;
      const response = await this.makeRequest(config, 'GET', url);

      // Parse rewards from account history
      return [];
    }

    return [];
  }

  /**
   * Get current crypto prices
   */
  async getPrices(config: CryptoConfig, symbols: string[]): Promise<Record<string, number>> {
    const endpoint = this.exchangeEndpoints[config.exchangeCode];
    let url = `${endpoint}/prices`;

    if (config.exchangeCode === 'kraken') {
      url = `${endpoint}/public/Ticker?pair=${symbols.join(',')}`;
    }

    const response = await this.makeRequest(config, 'GET', url, false); // No auth needed for public prices

    return this.parsePrices(response, config.exchangeCode);
  }

  /**
   * Get transaction history for tax reporting
   */
  async getTaxReport(
    config: CryptoConfig,
    year: number
  ): Promise<{
    totalGains: number;
    totalLosses: number;
    transactions: CryptoTransaction[];
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const transactions = await this.getTransactions(config, startDate, endDate);

    let totalGains = 0;
    let totalLosses = 0;

    // Calculate gains/losses from sell transactions
    transactions.forEach((txn) => {
      if (txn.type === 'sell') {
        const gain = txn.total - (txn.amount * txn.price - txn.fee);
        if (gain > 0) {
          totalGains += gain;
        } else {
          totalLosses += Math.abs(gain);
        }
      }
    });

    return {
      totalGains,
      totalLosses,
      transactions,
    };
  }

  /**
   * Make request
   */
  private async makeRequest(
    config: CryptoConfig,
    method: string,
    url: string,
    authRequired: boolean = true
  ): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authRequired) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    }

    const options: RequestInit = { method, headers };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Crypto API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Parse transactions based on exchange
   */
  private parseTransactions(data: any, exchangeCode: string): CryptoTransaction[] {
    const transactions: CryptoTransaction[] = [];

    if (exchangeCode === 'coinbase') {
      data.data?.forEach((txn: any) => {
        transactions.push({
          id: txn.id,
          timestamp: txn.created_at,
          type: this.mapCoinbaseType(txn.type),
          symbol: txn.amount.currency || 'UNKNOWN',
          amount: parseFloat(txn.amount.amount),
          price: 0,
          total: parseFloat(txn.native_amount.amount),
          fee: 0,
          fromAddress: txn.from?.address,
          toAddress: txn.to?.address,
          txHash: txn.transaction?.hash,
        });
      });
    }

    return transactions;
  }

  /**
   * Map Coinbase transaction type
   */
  private mapCoinbaseType(type: string): CryptoTransaction['type'] {
    const typeMap: Record<string, CryptoTransaction['type']> = {
      'buy': 'buy',
      'sell': 'sell',
      'send': 'transfer_out',
      'receive': 'transfer_in',
      'reward': 'reward',
    };

    return typeMap[type] || 'transfer_out';
  }

  /**
   * Parse prices
   */
  private parsePrices(data: any, exchangeCode: string): Record<string, number> {
    const prices: Record<string, number> = {};

    if (exchangeCode === 'coinbase') {
      // Parse Coinbase price format
    } else if (exchangeCode === 'kraken') {
      // Parse Kraken OHLC format
    }

    return prices;
  }

  /**
   * Perform sync
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    const cryptoConfig = config as CryptoConfig;
    let recordsCount = 0;

    try {
      // Get holdings
      const holdings = await this.getHoldings(cryptoConfig);
      recordsCount += holdings.length;

      // Get transactions
      const lastSync = config.lastSyncAt || Date.now() - 86400000 * 365; // Last year
      const transactions = await this.getTransactions(
        cryptoConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += transactions.length;

      // Get rewards
      const rewards = await this.getRewards(
        cryptoConfig,
        new Date(lastSync),
        new Date()
      );
      recordsCount += rewards.length;

      this.logger.info(
        {
          recordsCount,
          holdings: holdings.length,
          transactions: transactions.length,
          rewards: rewards.length,
        },
        'Crypto sync completed'
      );

      return recordsCount;
    } catch (error) {
      this.logger.error({ error }, 'Crypto sync failed');
      throw error;
    }
  }
}
