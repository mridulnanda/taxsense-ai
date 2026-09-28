import { z } from 'zod';
import crypto from 'crypto';

const StripeChargeSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['succeeded', 'failed', 'pending']),
  paymentMethod: z.string(),
  customerId: z.string().optional(),
  receiptEmail: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  created: z.date(),
  updated: z.date(),
});

export type StripeCharge = z.infer<typeof StripeChargeSchema>;

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  apiBaseUrl?: string;
  webhookSecret?: string;
}

export class StripePayment {
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = { apiBaseUrl: 'https://api.stripe.com/v1', ...config };
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.secretKey}:`).toString(
      'base64'
    );
    return `Basic ${credentials}`;
  }

  /**
   * Create payment intent for international payments
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'USD',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const params = new URLSearchParams({
      amount: Math.round(amount * 100).toString(), // Convert to cents
      currency,
      payment_method_types: 'card',
    });

    if (customerId) {
      params.append('customer', customerId);
    }

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value);
      });
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/payment_intents`,
      {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Stripe payment intent creation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
    };
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<StripeCharge> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/charges/${chargeId}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe charge: ${response.statusText}`);
    }

    const data = await response.json();
    return StripeChargeSchema.parse({
      id: data.id,
      amount: data.amount / 100,
      currency: data.currency.toUpperCase(),
      status: data.status,
      paymentMethod: data.payment_method || 'unknown',
      customerId: data.customer,
      receiptEmail: data.receipt_email,
      description: data.description,
      metadata: data.metadata,
      created: new Date(data.created * 1000),
      updated: new Date(data.updated * 1000),
    });
  }

  /**
   * Get charges for a date range
   */
  async getCharges(
    fromDate: Date,
    toDate: Date,
    limit: number = 100
  ): Promise<StripeCharge[]> {
    const params = new URLSearchParams({
      created: `{"gte": ${Math.floor(fromDate.getTime() / 1000)}, "lte": ${Math.floor(toDate.getTime() / 1000)}}`,
      limit: limit.toString(),
      expand: 'data.payment_method',
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/charges?${params}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe charges: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((charge: any) =>
      StripeChargeSchema.parse({
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        paymentMethod: charge.payment_method || 'unknown',
        customerId: charge.customer,
        receiptEmail: charge.receipt_email,
        description: charge.description,
        metadata: charge.metadata,
        created: new Date(charge.created * 1000),
        updated: new Date(charge.updated * 1000),
      })
    );
  }

  /**
   * Refund charge
   */
  async refundCharge(
    chargeId: string,
    amount?: number,
    reason?: string
  ): Promise<{ refundId: string; amount: number }> {
    const params = new URLSearchParams();

    if (amount) {
      params.append('amount', Math.round(amount * 100).toString());
    }

    if (reason) {
      params.append('reason', reason);
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/charges/${chargeId}/refunds`,
      {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to refund Stripe charge: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      refundId: data.id,
      amount: data.amount / 100,
    };
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    webhookBody: string,
    signature: string
  ): boolean {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const hash = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(webhookBody)
      .digest('hex');

    const timestampedHash = `t=${Math.floor(Date.now() / 1000)},v1=${hash}`;
    const signatureParts = signature.split(',');

    for (const part of signatureParts) {
      if (part.startsWith('v1=')) {
        const receivedHash = part.substring(3);
        return crypto.timingSafeEqual(
          Buffer.from(hash),
          Buffer.from(receivedHash)
        );
      }
    }

    return false;
  }

  /**
   * Create customer
   */
  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<{ customerId: string; email: string }> {
    const params = new URLSearchParams({
      email,
    });

    if (name) {
      params.append('name', name);
    }

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value);
      });
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/customers`,
      {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Stripe customer: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      customerId: data.id,
      email: data.email,
    };
  }
}
