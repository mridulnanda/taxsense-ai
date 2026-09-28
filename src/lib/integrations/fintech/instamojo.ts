import { z } from 'zod';
import crypto from 'crypto';

const InstamojoPaymentSchema = z.object({
  id: z.string(),
  longurl: z.string(),
  shorturl: z.string(),
  amount: z.number(),
  status: z.enum(['initiated', 'completed', 'failed', 'refunded']),
  purpose: z.string().optional(),
  buyerName: z.string().optional(),
  buyerEmail: z.string().optional(),
  buyerPhone: z.string().optional(),
  createdAt: z.date(),
  modifiedAt: z.date(),
  transactionId: z.string().optional(),
});

export type InstamojoPayment = z.infer<typeof InstamojoPaymentSchema>;

interface InstamojoConfig {
  apiKey: string;
  authToken: string;
  apiBaseUrl?: string;
}

export class InstamojoIntegration {
  private config: InstamojoConfig;

  constructor(config: InstamojoConfig) {
    this.config = { apiBaseUrl: 'https://www.instamojo.com/api/1.1', ...config };
  }

  /**
   * Get headers with authentication
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.authToken}`,
      'Content-Type': 'application/json',
      'X-API-KEY': this.config.apiKey,
    };
  }

  /**
   * Create payment request
   */
  async createPaymentRequest(
    amount: number,
    purpose: string,
    buyerName?: string,
    buyerEmail?: string,
    buyerPhone?: string,
    redirectUrl?: string,
    webhookUrl?: string
  ): Promise<{
    paymentRequestId: string;
    longUrl: string;
    shortUrl: string;
  }> {
    const payload = {
      amount,
      purpose,
      buyer_name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      redirect_url: redirectUrl || '',
      webhook: webhookUrl,
      send_email: !!buyerEmail,
      send_sms: !!buyerPhone,
    };

    const response = await fetch(
      `${this.config.apiBaseUrl}/payment-requests/`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Instamojo payment request: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      paymentRequestId: data.payment_request.id,
      longUrl: data.payment_request.longurl,
      shortUrl: data.payment_request.shorturl,
    };
  }

  /**
   * Get payment request details
   */
  async getPaymentRequest(requestId: string): Promise<InstamojoPayment> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/payment-requests/${requestId}/`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Instamojo payment request: ${response.statusText}`);
    }

    const data = await response.json();
    const pr = data.payment_request;

    return InstamojoPaymentSchema.parse({
      id: pr.id,
      longurl: pr.longurl,
      shorturl: pr.shorturl,
      amount: pr.amount,
      status: pr.status,
      purpose: pr.purpose,
      buyerName: pr.buyer_name,
      buyerEmail: pr.email,
      buyerPhone: pr.phone,
      createdAt: new Date(pr.created_at),
      modifiedAt: new Date(pr.modified_at),
      transactionId: pr.transaction_id,
    });
  }

  /**
   * Get all payment requests
   */
  async getPaymentRequests(
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<InstamojoPayment[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/payment-requests/?${params}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Instamojo payment requests: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payment_requests.map((pr: any) =>
      InstamojoPaymentSchema.parse({
        id: pr.id,
        longurl: pr.longurl,
        shorturl: pr.shorturl,
        amount: pr.amount,
        status: pr.status,
        purpose: pr.purpose,
        buyerName: pr.buyer_name,
        buyerEmail: pr.email,
        buyerPhone: pr.phone,
        createdAt: new Date(pr.created_at),
        modifiedAt: new Date(pr.modified_at),
        transactionId: pr.transaction_id,
      })
    );
  }

  /**
   * Cancel payment request
   */
  async cancelPaymentRequest(requestId: string): Promise<void> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/payment-requests/${requestId}/cancel/`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel Instamojo payment request: ${response.statusText}`);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    payload: Record<string, any>,
    mac: string
  ): boolean {
    // Create the message string in the order expected
    const messageString = `${payload.payment_request_id}|${payload.payment_id}|${payload.status}`;

    const calculatedMac = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(messageString)
      .digest('hex');

    return calculatedMac === mac;
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ refundId: string }> {
    const payload: any = {};

    if (amount) {
      payload.refund_amount = amount;
    }

    if (reason) {
      payload.reason = reason;
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/payments/${paymentId}/refund/`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to refund Instamojo payment: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      refundId: data.refund.id,
    };
  }
}
