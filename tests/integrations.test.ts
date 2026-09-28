import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HdfcBankConnect,
  IciciOpenAPI,
  AxisBankConnect,
  SbiConnect,
  KotakMahindraBank,
  IdfcBankAPI,
} from '../src/lib/integrations/banks';
import {
  RazorpayIntegration,
  PhonePeUPI,
  StripePayment,
  InstamojoIntegration,
} from '../src/lib/integrations/fintech';
import { DataSyncEngine, WebhookHandler } from '../src/lib/integrations/sync-engine';

// Mock fetch
global.fetch = vi.fn();

describe('Banking APIs Integration', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = global.fetch as any;
    mockFetch.mockClear();
  });

  describe('HDFC Bank Connect', () => {
    it('should generate authorization URL', () => {
      const hdfc = new HdfcBankConnect({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost/callback',
        apiBaseUrl: 'https://api.hdfc.com',
      });

      const url = hdfc.getAuthorizationUrl('test-state');
      expect(url).toContain('client_id=test-client');
      expect(url).toContain('scope=accounts+transactions');
    });

    it('should exchange code for token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token123',
          refresh_token: 'refresh123',
          expires_in: 3600,
        }),
      });

      const hdfc = new HdfcBankConnect({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost/callback',
        apiBaseUrl: 'https://api.hdfc.com',
      });

      const result = await hdfc.exchangeCodeForToken('auth-code');
      expect(result.accessToken).toBe('token123');
      expect(result.refreshToken).toBe('refresh123');
    });

    it('should validate webhook signature', () => {
      const hdfc = new HdfcBankConnect({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost/callback',
        apiBaseUrl: 'https://api.hdfc.com',
      });

      const payload = 'test-payload';
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      expect(hdfc.validateWebhookSignature(payload, signature)).toBe(true);
    });
  });

  describe('ICICI Open API', () => {
    it('should fetch accounts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [
            {
              account_id: 'acc123',
              account_number: '1234567890',
              account_type: 'SAVINGS',
              holder_name: 'John Doe',
              balance: 50000,
              available_balance: 45000,
              currency: 'INR',
              status: 'ACTIVE',
            },
          ],
        }),
      });

      const icici = new IciciOpenAPI({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        apiKey: 'test-key',
        apiBaseUrl: 'https://api.icici.com',
        redirectUri: 'http://localhost/callback',
      });

      icici.setTokens('token123', 'refresh123', 3600);

      const accounts = await icici.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountNumber).toBe('1234567890');
    });

    it('should fetch transactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: [
            {
              transaction_id: 'txn123',
              account_id: 'acc123',
              amount: 1000,
              type: 'CREDIT',
              narration: 'Salary',
              value_date: '2024-01-01T00:00:00Z',
              posting_date: '2024-01-01T00:00:00Z',
              balance: 51000,
            },
          ],
        }),
      });

      const icici = new IciciOpenAPI({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        apiKey: 'test-key',
        apiBaseUrl: 'https://api.icici.com',
        redirectUri: 'http://localhost/callback',
      });

      icici.setTokens('token123', 'refresh123', 3600);

      const transactions = await icici.getTransactions(
        'acc123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(1000);
      expect(transactions[0].type).toBe('CREDIT');
    });
  });

  describe('Axis Bank Connect', () => {
    it('should handle token refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
      });

      const axis = new AxisBankConnect({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        apiBaseUrl: 'https://api.axis.com',
        redirectUri: 'http://localhost/callback',
      });

      axis.setTokens('old-token', 'refresh123', 3600);
      const result = await axis.refreshAccessToken();

      expect(result.accessToken).toBe('new-token');
    });
  });

  describe('SBI Connect', () => {
    it('should get account balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          availableBalance: 75000,
        }),
      });

      const sbi = new SbiConnect({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        apiBaseUrl: 'https://api.sbi.com',
        redirectUri: 'http://localhost/callback',
      });

      sbi.setTokens('token123', 'refresh123', 3600);
      const balance = await sbi.getBalance('1234567890');

      expect(balance).toBe(75000);
    });
  });

  describe('Kotak Mahindra Bank', () => {
    it('should initialize and handle tokens', () => {
      const kotak = new KotakMahindraBank({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        apiBaseUrl: 'https://api.kotak.com',
        redirectUri: 'http://localhost/callback',
      });

      kotak.setTokens('token123', 'refresh123', 3600);

      const url = kotak.getAuthorizationUrl('state123');
      expect(url).toContain('client_id=test-client');
    });
  });

  describe('IDFC Bank API', () => {
    it('should fetch accounts with proper schema validation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [
            {
              accountNumber: '9876543210',
              accountType: 'CURRENT',
              accountHolder: 'Jane Doe',
              balance: 100000,
              ledgerBalance: 95000,
              currency: 'INR',
              ifscCode: 'IDFC0000001',
              status: 'ACTIVE',
            },
          ],
        }),
      });

      const idfc = new IdfcBankAPI({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        apiBaseUrl: 'https://api.idfc.com',
        redirectUri: 'http://localhost/callback',
      });

      idfc.setTokens('token123', 'refresh123', 3600);

      const accounts = await idfc.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountType).toBe('CURRENT');
    });
  });
});

describe('Fintech Platforms Integration', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = global.fetch as any;
    mockFetch.mockClear();
  });

  describe('Razorpay Integration', () => {
    it('should create payment order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_123',
          amount: 100000,
          currency: 'INR',
        }),
      });

      const razorpay = new RazorpayIntegration({
        keyId: 'test-key',
        keySecret: 'test-secret',
      });

      const result = await razorpay.createOrder(1000, 'INR');

      expect(result.orderId).toBe('order_123');
      expect(result.amount).toBe(1000);
      expect(result.currency).toBe('INR');
    });

    it('should fetch payment details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'pay_123',
          entity: 'payment',
          amount: 100000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        }),
      });

      const razorpay = new RazorpayIntegration({
        keyId: 'test-key',
        keySecret: 'test-secret',
      });

      const payment = await razorpay.getPayment('pay_123');

      expect(payment.id).toBe('pay_123');
      expect(payment.status).toBe('captured');
    });

    it('should validate webhook signature', () => {
      const razorpay = new RazorpayIntegration({
        keyId: 'test-key',
        keySecret: 'test-secret',
      });

      const payload = 'test-payload';
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      expect(razorpay.validateWebhookSignature(payload, signature)).toBe(true);
    });

    it('should create invoice', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'inv_123',
          short_url: 'https://rzp.io/i/123',
        }),
      });

      const razorpay = new RazorpayIntegration({
        keyId: 'test-key',
        keySecret: 'test-secret',
      });

      const result = await razorpay.createInvoice('cust_123', 5000);

      expect(result.invoiceId).toBe('inv_123');
      expect(result.shortUrl).toContain('rzp.io');
    });

    it('should refund payment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'rfnd_123',
          amount: 50000,
        }),
      });

      const razorpay = new RazorpayIntegration({
        keyId: 'test-key',
        keySecret: 'test-secret',
      });

      const result = await razorpay.refundPayment('pay_123', 500);

      expect(result.refundId).toBe('rfnd_123');
      expect(result.amount).toBe(500);
    });
  });

  describe('PhonePe UPI', () => {
    it('should initiate payment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            instrumentResponse: {
              redirectUrl: 'https://phonepe.com/pay/123',
            },
          },
        }),
      });

      const phonepe = new PhonePeUPI({
        merchantId: 'test-merchant',
        merchantKey: 'test-key',
        saltKey: 'test-salt',
        apiBaseUrl: 'https://api.phonepe.com',
        redirectUrl: 'http://localhost/callback',
      });

      const result = await phonepe.initiatePayment('txn_123', 500);

      expect(result.transactionUrl).toContain('phonepe.com');
      expect(result.merchantTransactionId).toBe('txn_123');
    });

    it('should check transaction status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            merchantTransactionId: 'txn_123',
            transactionId: 'T123456',
            amount: 50000,
            state: 'SUCCESS',
            paymentInstrument: { type: 'UPI_INTENT' },
            transactionCompletionDateTime: new Date().toISOString(),
          },
          responseCode: 'APPROVED',
          message: 'Success',
        }),
      });

      const phonepe = new PhonePeUPI({
        merchantId: 'test-merchant',
        merchantKey: 'test-key',
        saltKey: 'test-salt',
        apiBaseUrl: 'https://api.phonepe.com',
        redirectUrl: 'http://localhost/callback',
      });

      const txn = await phonepe.checkTransactionStatus('txn_123');

      expect(txn.status).toBe('SUCCESS');
      expect(txn.amount).toBe(500);
    });

    it('should validate webhook signature', () => {
      const phonepe = new PhonePeUPI({
        merchantId: 'test-merchant',
        merchantKey: 'test-key',
        saltKey: 'test-salt',
        apiBaseUrl: 'https://api.phonepe.com',
        redirectUrl: 'http://localhost/callback',
      });

      const payload = 'test-payload';
      const crypto = require('crypto');
      const hash = crypto
        .createHash('sha256')
        .update(payload + 'test-salt')
        .digest('hex');
      const signature = `${hash}###1`;

      expect(phonepe.validateWebhookSignature(payload, signature)).toBe(true);
    });
  });

  describe('Stripe Payment', () => {
    it('should create payment intent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'pi_123',
          client_secret: 'secret_123',
        }),
      });

      const stripe = new StripePayment({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });

      const result = await stripe.createPaymentIntent(100, 'USD');

      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.clientSecret).toBe('secret_123');
    });

    it('should fetch charge details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'ch_123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          payment_method: 'card_123',
          created: Math.floor(Date.now() / 1000),
          updated: Math.floor(Date.now() / 1000),
        }),
      });

      const stripe = new StripePayment({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });

      const charge = await stripe.getCharge('ch_123');

      expect(charge.id).toBe('ch_123');
      expect(charge.status).toBe('succeeded');
    });

    it('should refund charge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'rfnd_123',
          amount: 10000,
        }),
      });

      const stripe = new StripePayment({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });

      const result = await stripe.refundCharge('ch_123', 100);

      expect(result.refundId).toBe('rfnd_123');
      expect(result.amount).toBe(100);
    });

    it('should create customer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cus_123',
          email: 'test@example.com',
        }),
      });

      const stripe = new StripePayment({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });

      const result = await stripe.createCustomer('test@example.com', 'Test User');

      expect(result.customerId).toBe('cus_123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('Instamojo Integration', () => {
    it('should create payment request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_request: {
            id: 'req_123',
            longurl: 'https://instamojo.com/pay/123',
            shorturl: 'https://imjo.in/123',
          },
        }),
      });

      const instamojo = new InstamojoIntegration({
        apiKey: 'test-key',
        authToken: 'test-token',
      });

      const result = await instamojo.createPaymentRequest(500, 'Product payment');

      expect(result.paymentRequestId).toBe('req_123');
      expect(result.longUrl).toContain('instamojo.com');
      expect(result.shortUrl).toContain('imjo.in');
    });

    it('should get payment request details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_request: {
            id: 'req_123',
            longurl: 'https://instamojo.com/pay/123',
            shorturl: 'https://imjo.in/123',
            amount: 500,
            status: 'completed',
            purpose: 'Product payment',
            transaction_id: 'txn_123',
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
      });

      const instamojo = new InstamojoIntegration({
        apiKey: 'test-key',
        authToken: 'test-token',
      });

      const payment = await instamojo.getPaymentRequest('req_123');

      expect(payment.id).toBe('req_123');
      expect(payment.amount).toBe(500);
    });

    it('should validate webhook signature', () => {
      const instamojo = new InstamojoIntegration({
        apiKey: 'test-key',
        authToken: 'test-token',
      });

      const crypto = require('crypto');
      const payload = {
        payment_request_id: 'req_123',
        payment_id: 'pay_123',
        status: 'completed',
      };

      const messageString = `${payload.payment_request_id}|${payload.payment_id}|${payload.status}`;
      const mac = crypto
        .createHmac('sha256', 'test-key')
        .update(messageString)
        .digest('hex');

      expect(instamojo.validateWebhookSignature(payload, mac)).toBe(true);
    });

    it('should refund payment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          refund: {
            id: 'ref_123',
          },
        }),
      });

      const instamojo = new InstamojoIntegration({
        apiKey: 'test-key',
        authToken: 'test-token',
      });

      const result = await instamojo.refundPayment('pay_123', 500);

      expect(result.refundId).toBe('ref_123');
    });
  });
});

describe('Data Sync Engine', () => {
  it('should register sync configuration', () => {
    const engine = new DataSyncEngine();

    engine.registerSync({
      integrationId: 'hdfc-001',
      integrationType: 'bank',
      userId: 'user-123',
      accessToken: 'token123',
      refreshToken: 'refresh123',
      expiresAt: Date.now() + 3600000,
      syncInterval: 3600000,
    });

    const status = engine.getSyncStatus('user-123', 'hdfc-001');
    expect(status).toBeDefined();
  });

  it('should check if token is expired', () => {
    const engine = new DataSyncEngine();

    engine.registerSync({
      integrationId: 'hdfc-001',
      integrationType: 'bank',
      userId: 'user-123',
      accessToken: 'token123',
      refreshToken: 'refresh123',
      expiresAt: Date.now() + 200000, // 200 seconds (less than 5 min)
      syncInterval: 3600000,
    });

    const isExpired = engine.isTokenExpired('user-123', 'hdfc-001');
    expect(isExpired).toBe(true);
  });

  it('should update token', () => {
    const engine = new DataSyncEngine();

    engine.registerSync({
      integrationId: 'hdfc-001',
      integrationType: 'bank',
      userId: 'user-123',
      accessToken: 'old-token',
      refreshToken: 'refresh123',
      syncInterval: 3600000,
    });

    engine.updateToken('user-123', 'hdfc-001', 'new-token', 3600);

    const status = engine.getSyncStatus('user-123', 'hdfc-001');
    expect(status).toBeDefined();
  });
});

describe('Webhook Handler', () => {
  it('should handle bank webhook', async () => {
    const engine = new DataSyncEngine();
    const handler = new WebhookHandler(engine);

    engine.registerSync({
      integrationId: 'hdfc-001',
      integrationType: 'bank',
      userId: 'user-123',
      accessToken: 'token123',
      refreshToken: 'refresh123',
      syncInterval: 3600000,
    });

    await handler.handleBankWebhook('user-123', 'hdfc-001', {
      type: 'transaction',
      transactionId: 'txn_123',
    });

    const status = engine.getSyncStatus('user-123', 'hdfc-001');
    expect(status).toBeDefined();
  });

  it('should handle payment webhook', async () => {
    const engine = new DataSyncEngine();
    const handler = new WebhookHandler(engine);

    engine.registerSync({
      integrationId: 'razorpay-001',
      integrationType: 'fintech',
      userId: 'user-123',
      accessToken: 'token123',
      syncInterval: 3600000,
    });

    await handler.handlePaymentWebhook('user-123', 'razorpay-001', {
      type: 'payment.captured',
      paymentId: 'pay_123',
    });

    const status = engine.getSyncStatus('user-123', 'razorpay-001');
    expect(status).toBeDefined();
  });
});
