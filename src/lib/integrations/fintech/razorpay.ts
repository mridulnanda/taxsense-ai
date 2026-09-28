import { z } from 'zod';
import crypto from 'crypto';

const RazorpayPaymentSchema = z.object({
  id: z.string(),
  entity: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['created', 'authorized', 'captured', 'failed', 'refunded']),
  method: z.string(),
  description: z.string().optional(),
  customerId: z.string().optional(),
  email: z.string().optional(),
  contact: z.string().optional(),
  fee: z.number().optional(),
  tax: z.number().optional(),
  vat: z.number().optional(),
  receiptNumber: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const RazorpayInvoiceSchema = z.object({
  id: z.string(),
  entity: z.string(),
  number: z.string().optional(),
  customerId: z.string(),
  status: z.enum(['issued', 'partially_paid', 'paid', 'cancelled', 'expired']),
  amount: z.number(),
  currency: z.string().default('INR'),
  description: z.string().optional(),
  receivedAmount: z.number().optional(),
  dueDate: z.date().optional(),
  issuedAt: z.date(),
  expiredAt: z.date().optional(),
  paidAt: z.date().optional(),
  createdAt: z.date(),
});

export type RazorpayPayment = z.infer<typeof RazorpayPaymentSchema>;
export type RazorpayInvoice = z.infer<typeof RazorpayInvoiceSchema>;

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  apiBaseUrl?: string;
}

export class RazorpayIntegration {
  private config: RazorpayConfig;

  constructor(config: RazorpayConfig) {
    this.config = { apiBaseUrl: 'https://api.razorpay.com/v1', ...config };
  }

  /**
   * Get basic auth header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.config.keyId}:${this.config.keySecret}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Create payment order
   */
  async createOrder(
    amount: number,
    currency: string = 'INR',
    receipt?: string,
    notes?: Record<string, string>
  ): Promise<{ orderId: string; amount: number; currency: string }> {
    const payload = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const response = await fetch(`${this.config.apiBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Razorpay order: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      orderId: data.id,
      amount: data.amount / 100, // Convert back to rupees
      currency: data.currency,
    };
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<RazorpayPayment> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/payments/${paymentId}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Razorpay payment: ${response.statusText}`);
    }

    const data = await response.json();
    return RazorpayPaymentSchema.parse({
      id: data.id,
      entity: data.entity,
      amount: data.amount / 100,
      currency: data.currency,
      status: data.status,
      method: data.method,
      description: data.description,
      customerId: data.customer_id,
      email: data.email,
      contact: data.contact,
      fee: data.fee ? data.fee / 100 : undefined,
      tax: data.tax ? data.tax / 100 : undefined,
      vat: data.vat ? data.vat / 100 : undefined,
      receiptNumber: data.receipt,
      createdAt: new Date(data.created_at * 1000),
      updatedAt: new Date(data.updated_at * 1000),
    });
  }

  /**
   * Get payments for a date range
   */
  async getPayments(
    fromDate: Date,
    toDate: Date,
    limit: number = 100
  ): Promise<RazorpayPayment[]> {
    const params = new URLSearchParams({
      from: Math.floor(fromDate.getTime() / 1000).toString(),
      to: Math.floor(toDate.getTime() / 1000).toString(),
      count: limit.toString(),
    });

    const response = await fetch(
      `${this.config.apiBaseUrl}/payments?${params}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Razorpay payments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items.map((payment: any) =>
      RazorpayPaymentSchema.parse({
        id: payment.id,
        entity: payment.entity,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        customerId: payment.customer_id,
        email: payment.email,
        contact: payment.contact,
        fee: payment.fee ? payment.fee / 100 : undefined,
        tax: payment.tax ? payment.tax / 100 : undefined,
        vat: payment.vat ? payment.vat / 100 : undefined,
        receiptNumber: payment.receipt,
        createdAt: new Date(payment.created_at * 1000),
        updatedAt: new Date(payment.updated_at * 1000),
      })
    );
  }

  /**
   * Create invoice
   */
  async createInvoice(
    customerId: string,
    amount: number,
    description?: string,
    dueDate?: Date
  ): Promise<{ invoiceId: string; shortUrl: string }> {
    const payload = {
      customer_id: customerId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      description,
      due_date: dueDate ? Math.floor(dueDate.getTime() / 1000) : undefined,
    };

    const response = await fetch(`${this.config.apiBaseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Razorpay invoice: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      invoiceId: data.id,
      shortUrl: data.short_url,
    };
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<RazorpayInvoice> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/invoices/${invoiceId}`,
      {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Razorpay invoice: ${response.statusText}`);
    }

    const data = await response.json();
    return RazorpayInvoiceSchema.parse({
      id: data.id,
      entity: data.entity,
      number: data.invoice_number,
      customerId: data.customer_id,
      status: data.status,
      amount: data.amount / 100,
      currency: data.currency,
      description: data.description,
      receivedAmount: data.amount_paid ? data.amount_paid / 100 : undefined,
      dueDate: data.expire_by ? new Date(data.expire_by * 1000) : undefined,
      issuedAt: new Date(data.issued_at * 1000),
      expiredAt: data.expired_at ? new Date(data.expired_at * 1000) : undefined,
      paidAt: data.paid_at ? new Date(data.paid_at * 1000) : undefined,
      createdAt: new Date(data.created_at * 1000),
    });
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    webhookBody: string,
    webhookSignature: string
  ): boolean {
    const hash = crypto
      .createHmac('sha256', this.config.keySecret)
      .update(webhookBody)
      .digest('hex');

    return hash === webhookSignature;
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>
  ): Promise<{ refundId: string; amount: number }> {
    const payload: any = {
      notes: notes || {},
    };

    if (amount) {
      payload.amount = Math.round(amount * 100);
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/payments/${paymentId}/refund`,
      {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to refund payment: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      refundId: data.id,
      amount: data.amount / 100,
    };
  }
}
