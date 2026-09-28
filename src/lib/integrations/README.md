# TaxSense AI - Fintech Integrations

Comprehensive integrations with India's major fintech platforms and banking APIs for seamless data ingestion and multi-platform deployment.

## Architecture Overview

The integration system is built on three core components:

1. **Bank Integrations**: Direct connections to major Indian banks for account and transaction data
2. **Fintech Platforms**: Payment gateway and UPI integrations for transaction processing
3. **Data Sync Engine**: Automatic data synchronization with rate limiting and retry logic
4. **Webhook System**: Real-time data updates via webhook handlers

## Directory Structure

```
integrations/
├── banks/
│   ├── hdfc.ts           # HDFC Bank Connect API
│   ├── icici.ts          # ICICI Bank Open API
│   ├── axis.ts           # Axis Bank Connect
│   ├── sbi.ts            # SBI Connect
│   ├── kotak.ts          # Kotak Mahindra Bank API
│   ├── idfc.ts           # IDFC Bank API
│   └── index.ts          # Exports
├── fintech/
│   ├── razorpay.ts       # Razorpay Integration
│   ├── phonepe.ts        # PhonePe UPI Integration
│   ├── stripe.ts         # Stripe Integration
│   ├── instamojo.ts      # Instamojo Integration
│   └── index.ts          # Exports
├── sync-engine.ts        # Data Sync Engine
└── README.md             # This file
```

## Banking APIs

### Overview

All banking integrations follow OAuth2/OAuth1 authentication patterns and provide:
- Account linking and sync
- Transaction history retrieval
- Balance queries
- Webhook support for real-time updates

### HDFC Bank Connect

```typescript
import { HdfcBankConnect } from '@/lib/integrations/banks';

const hdfc = new HdfcBankConnect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost/callback',
  apiBaseUrl: 'https://api.hdfc.com',
});

// Step 1: Get authorization URL
const authUrl = hdfc.getAuthorizationUrl('state-token');
// Redirect user to authUrl

// Step 2: Exchange code for token
const auth = await hdfc.exchangeCodeForToken('auth-code');
// Store auth.accessToken and auth.refreshToken

// Step 3: Fetch accounts
const accounts = await hdfc.getAccounts();

// Step 4: Fetch transactions
const transactions = await hdfc.getTransactions(
  accountNumber,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Step 5: Get balance
const balance = await hdfc.getBalance(accountNumber);
```

### ICICI Bank Open API

```typescript
import { IciciOpenAPI } from '@/lib/integrations/banks';

const icici = new IciciOpenAPI({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiKey: 'your-api-key',
  apiBaseUrl: 'https://api.icici.com',
  redirectUri: 'http://localhost/callback',
});

// Similar to HDFC, but includes API key header
const accounts = await icici.getAccounts();
```

### Axis Bank Connect

```typescript
import { AxisBankConnect } from '@/lib/integrations/banks';

const axis = new AxisBankConnect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiBaseUrl: 'https://api.axis.com',
  redirectUri: 'http://localhost/callback',
});

const accounts = await axis.getAccounts();
```

### SBI Connect

```typescript
import { SbiConnect } from '@/lib/integrations/banks';

const sbi = new SbiConnect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiBaseUrl: 'https://api.sbi.com',
  redirectUri: 'http://localhost/callback',
});

const accounts = await sbi.getAccounts();
```

### Kotak Mahindra Bank

```typescript
import { KotakMahindraBank } from '@/lib/integrations/banks';

const kotak = new KotakMahindraBank({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiBaseUrl: 'https://api.kotak.com',
  redirectUri: 'http://localhost/callback',
});

const accounts = await kotak.getAccounts();
```

### IDFC Bank API

```typescript
import { IdfcBankAPI } from '@/lib/integrations/banks';

const idfc = new IdfcBankAPI({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiBaseUrl: 'https://api.idfc.com',
  redirectUri: 'http://localhost/callback',
});

const accounts = await idfc.getAccounts();
```

## Fintech Platforms

### Razorpay Integration

```typescript
import { RazorpayIntegration } from '@/lib/integrations/fintech';

const razorpay = new RazorpayIntegration({
  keyId: 'your-key-id',
  keySecret: 'your-key-secret',
});

// Create payment order
const order = await razorpay.createOrder(
  1000,
  'INR',
  'receipt-123',
  { orderId: '123' }
);

// Get payment details
const payment = await razorpay.getPayment('pay_123');

// Create invoice
const invoice = await razorpay.createInvoice(
  'cust_123',
  5000,
  'Monthly subscription'
);

// Refund payment
const refund = await razorpay.refundPayment('pay_123', 500);

// Get payments for date range
const payments = await razorpay.getPayments(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Validate webhook signature
const isValid = razorpay.validateWebhookSignature(body, signature);
```

### PhonePe UPI Integration

```typescript
import { PhonePeUPI } from '@/lib/integrations/fintech';

const phonepe = new PhonePeUPI({
  merchantId: 'your-merchant-id',
  merchantKey: 'your-merchant-key',
  saltKey: 'your-salt-key',
  apiBaseUrl: 'https://api.phonepe.com',
  redirectUrl: 'http://localhost/callback',
});

// Initiate UPI payment
const payment = await phonepe.initiatePayment(
  'txn_123',
  500,
  'user@upi',
  'John Doe',
  '9876543210'
);

// Check transaction status
const txn = await phonepe.checkTransactionStatus('txn_123');

// Get transaction history
const txns = await phonepe.getTransactionHistory(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Validate webhook
const isValid = phonepe.validateWebhookSignature(payload, signature);
```

### Stripe Integration (International)

```typescript
import { StripePayment } from '@/lib/integrations/fintech';

const stripe = new StripePayment({
  secretKey: 'sk_test_...',
  publishableKey: 'pk_test_...',
  webhookSecret: 'whsec_...',
});

// Create payment intent
const intent = await stripe.createPaymentIntent(100, 'USD');

// Get charge details
const charge = await stripe.getCharge('ch_123');

// Create customer
const customer = await stripe.createCustomer(
  'test@example.com',
  'John Doe'
);

// Refund charge
const refund = await stripe.refundCharge('ch_123', 50);

// Validate webhook
const isValid = stripe.validateWebhookSignature(body, signature);
```

### Instamojo Integration (Small Merchants)

```typescript
import { InstamojoIntegration } from '@/lib/integrations/fintech';

const instamojo = new InstamojoIntegration({
  apiKey: 'your-api-key',
  authToken: 'your-auth-token',
});

// Create payment request
const request = await instamojo.createPaymentRequest(
  500,
  'Product payment',
  'John Doe',
  'john@example.com',
  '9876543210'
);

// Get payment request details
const payment = await instamojo.getPaymentRequest('req_123');

// Get all payment requests
const requests = await instamojo.getPaymentRequests('completed');

// Cancel payment request
await instamojo.cancelPaymentRequest('req_123');

// Refund payment
const refund = await instamojo.refundPayment('pay_123', 500);

// Validate webhook
const isValid = instamojo.validateWebhookSignature(payload, signature);
```

## Data Sync Engine

### Overview

The Data Sync Engine handles automatic synchronization with exponential backoff retry logic and rate limiting.

```typescript
import { DataSyncEngine, WebhookHandler } from '@/lib/integrations/sync-engine';

const syncEngine = new DataSyncEngine();

// Register sync configuration
syncEngine.registerSync({
  integrationId: 'hdfc-001',
  integrationType: 'bank',
  userId: 'user-123',
  accessToken: 'token123',
  refreshToken: 'refresh123',
  expiresAt: Date.now() + 3600000,
  syncInterval: 3600000, // 1 hour
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
});

// Start automatic sync
syncEngine.startSync('user-123', 'hdfc-001');

// Execute single sync manually
const result = await syncEngine.executeSync('user-123', 'hdfc-001');

// Check sync status
const status = syncEngine.getSyncStatus('user-123', 'hdfc-001');

// Update token
syncEngine.updateToken('user-123', 'hdfc-001', 'new-token', 3600);

// Check if token needs refresh
const isExpired = syncEngine.isTokenExpired('user-123', 'hdfc-001');

// Stop sync
syncEngine.stopSync('user-123', 'hdfc-001');
```

### Features

- **Automatic Scheduling**: Configurable sync intervals with persistent scheduling
- **Exponential Backoff**: Automatic retry with exponential backoff on failures
- **Rate Limiting**: Token bucket algorithm to prevent API rate limits
- **Token Management**: Automatic token refresh with expiry checking
- **Webhook Integration**: Real-time sync triggers from bank/payment webhooks

## Webhook System

### Bank Webhooks

```
POST /api/webhooks/bank
Headers:
  x-signature: <webhook-signature>
  x-bank-type: hdfc|icici|axis|sbi|kotak|idfc
```

### Payment Webhooks

```
POST /api/webhooks/payment
Headers:
  x-signature: <webhook-signature>
  x-provider: razorpay|phonepe|stripe|instamojo
```

### Example Webhook Handler

```typescript
import { WebhookHandler } from '@/lib/integrations/sync-engine';

const handler = new WebhookHandler(syncEngine);

// Handle bank webhook
await handler.handleBankWebhook('user-123', 'hdfc-001', {
  type: 'transaction',
  transactionId: 'txn_123',
});

// Handle payment webhook
await handler.handlePaymentWebhook('user-123', 'razorpay', {
  type: 'payment.captured',
  paymentId: 'pay_123',
});
```

## Environment Variables

```env
# HDFC Bank
HDFC_CLIENT_ID=your-client-id
HDFC_CLIENT_SECRET=your-client-secret
HDFC_SECRET=your-webhook-secret

# ICICI Bank
ICICI_CLIENT_ID=your-client-id
ICICI_CLIENT_SECRET=your-client-secret
ICICI_API_KEY=your-api-key

# Axis Bank
AXIS_CLIENT_ID=your-client-id
AXIS_CLIENT_SECRET=your-client-secret
AXIS_SECRET=your-webhook-secret

# SBI
SBI_CLIENT_ID=your-client-id
SBI_CLIENT_SECRET=your-client-secret
SBI_SECRET=your-webhook-secret

# Kotak
KOTAK_CLIENT_ID=your-client-id
KOTAK_CLIENT_SECRET=your-client-secret
KOTAK_SECRET=your-webhook-secret

# IDFC
IDFC_CLIENT_ID=your-client-id
IDFC_CLIENT_SECRET=your-client-secret
IDFC_SECRET=your-webhook-secret

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# PhonePe
PHONEPE_MERCHANT_ID=your-merchant-id
PHONEPE_MERCHANT_KEY=your-merchant-key
PHONEPE_SALT_KEY=your-salt-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Instamojo
INSTAMOJO_API_KEY=your-api-key
INSTAMOJO_AUTH_TOKEN=your-auth-token
```

## Error Handling

All integrations follow consistent error handling patterns:

```typescript
try {
  const transactions = await hdfc.getTransactions(
    accountNumber,
    fromDate,
    toDate
  );
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired or invalid
    await refreshToken();
  } else if (error.message.includes('429')) {
    // Rate limited
    await backoffAndRetry();
  } else {
    // Handle other errors
    logger.error(error);
  }
}
```

## Security Considerations

1. **Token Storage**: Always store tokens securely in encrypted database
2. **Webhook Validation**: All webhooks include signature validation
3. **Rate Limiting**: Implement both client-side and server-side rate limiting
4. **HTTPS Only**: All API communication is HTTPS encrypted
5. **API Key Rotation**: Regularly rotate API keys and secrets
6. **Audit Logging**: Log all API calls for compliance

## Testing

Run the comprehensive integration tests:

```bash
npm test -- tests/integrations.test.ts
```

Tests cover:
- Authentication flows
- Account and transaction retrieval
- Invoice and payment management
- Webhook signature validation
- Rate limiting and retry logic
- Error handling scenarios

## Monitoring & Observability

All integrations use Pino logger for structured logging:

```typescript
import pino from 'pino';

const logger = pino();

logger.info({ integrationId: 'hdfc-001' }, 'Sync completed');
logger.error({ error }, 'Sync failed');
logger.warn({ attempt }, 'Retry attempted');
```

## Support & Maintenance

- **Bank API Documentation**: Refer to individual bank's API docs
- **Webhook Testing**: Use ngrok or similar for local webhook testing
- **Rate Limits**: Check bank/platform rate limit docs
- **SLA**: Monitor sync failures and error rates

## Future Enhancements

1. **Investment Platforms**: NSE/BSE, mutual funds, crypto tracking
2. **Insurance APIs**: Policy and premium sync
3. **E-Filing Integration**: ITR XML generation and filing
4. **Enterprise ERPs**: Tally, QuickBooks, Zoho Books integration
5. **GraphQL API**: Unified schema for all integrations
6. **Batch Processing**: Bulk transaction import/export
7. **Multi-currency**: Support for international accounts
8. **Real-time Webhooks**: Enhanced webhook system with retry logic
