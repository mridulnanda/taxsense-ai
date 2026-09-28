import { z } from 'zod';
import crypto from 'crypto';

const PhonePeTransactionSchema = z.object({
  merchantTransactionId: z.string(),
  transactionId: z.string().optional(),
  amount: z.number(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  paymentMethod: z.string(),
  payerVpa: z.string().optional(),
  payeeVpa: z.string().optional(),
  responseCode: z.string(),
  responseMessage: z.string(),
  timestamp: z.date(),
});

export type PhonePeTransaction = z.infer<typeof PhonePeTransactionSchema>;

interface PhonePeConfig {
  merchantId: string;
  merchantKey: string;
  saltKey: string;
  apiBaseUrl: string;
  redirectUrl: string;
}

export class PhonePeUPI {
  private config: PhonePeConfig;

  constructor(config: PhonePeConfig) {
    this.config = config;
  }

  /**
   * Generate checksum for request
   */
  private generateChecksum(
    payload: string,
    salt: string
  ): string {
    const hashString = `${payload}${salt}`;
    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Initiate UPI payment
   */
  async initiatePayment(
    merchantTransactionId: string,
    amount: number,
    vpa: string,
    name?: string,
    mobileNumber?: string
  ): Promise<{
    transactionUrl: string;
    merchantTransactionId: string;
  }> {
    const payloadObj = {
      merchantId: this.config.merchantId,
      merchantTransactionId,
      amount: Math.round(amount * 100), // Convert to paise
      mobileNumber: mobileNumber || '',
      paymentInstrument: {
        type: 'UPI_INTENT',
        targetApp: 'PHONEPE',
      },
      callbackUrl: this.config.redirectUrl,
      redirectUrl: this.config.redirectUrl,
    };

    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const checksum = this.generateChecksum(
      payload,
      this.config.saltKey
    ) + '###1';

    const response = await fetch(
      `${this.config.apiBaseUrl}/pg/v1/pay`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
        body: JSON.stringify({
          request: payload,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`PhonePe payment initiation failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.data.instrumentResponse) {
      return {
        transactionUrl: data.data.instrumentResponse.redirectUrl,
        merchantTransactionId,
      };
    }

    throw new Error(data.message || 'Failed to initiate payment');
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(
    merchantTransactionId: string
  ): Promise<PhonePeTransaction> {
    const payload = Buffer.from(
      `/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}`
    ).toString('base64');

    const checksum = this.generateChecksum(
      payload,
      this.config.saltKey
    ) + '###1';

    const response = await fetch(
      `${this.config.apiBaseUrl}/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': this.config.merchantId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check PhonePe transaction status: ${response.statusText}`);
    }

    const data = await response.json();

    return PhonePeTransactionSchema.parse({
      merchantTransactionId: data.data.merchantTransactionId,
      transactionId: data.data.transactionId,
      amount: data.data.amount / 100,
      status: data.data.state,
      paymentMethod: data.data.paymentInstrument?.type,
      payerVpa: data.data.payerVpa,
      payeeVpa: data.data.payeeVpa,
      responseCode: data.responseCode,
      responseMessage: data.message,
      timestamp: new Date(data.data.transactionCompletionDateTime),
    });
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    const [hash, keyIndex] = signature.split('###');
    const expectedHash = crypto
      .createHash('sha256')
      .update(payload + this.config.saltKey)
      .digest('hex');

    return hash === expectedHash;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    fromDate: Date,
    toDate: Date,
    limit: number = 100
  ): Promise<PhonePeTransaction[]> {
    const params = new URLSearchParams({
      merchantId: this.config.merchantId,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      limit: limit.toString(),
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/pg/v1/transaction/history?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-MERCHANT-ID': this.config.merchantId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch PhonePe transactions: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.transactions.map((txn: any) =>
      PhonePeTransactionSchema.parse({
        merchantTransactionId: txn.merchantTransactionId,
        transactionId: txn.transactionId,
        amount: txn.amount / 100,
        status: txn.state,
        paymentMethod: txn.paymentInstrument?.type,
        payerVpa: txn.payerVpa,
        payeeVpa: txn.payeeVpa,
        responseCode: txn.responseCode,
        responseMessage: txn.message,
        timestamp: new Date(txn.transactionCompletionDateTime),
      })
    );
  }
}
