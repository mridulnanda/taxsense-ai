/**
 * Invoicing Engine
 *
 * Core business logic for creating, validating, sending, and tracking invoices.
 * Includes payment tracking, recurring invoice management, and multi-currency support.
 */

import { Invoice, InvoiceLineItem, InvoiceStatus, CurrencyCode } from "../types";
import { differenceInDays, addMonths, addYears } from "date-fns";

/**
 * Invoice creation and validation
 */
export class InvoiceEngine {
  /**
   * Create a new invoice with automatic calculations
   */
  static createInvoice(input: CreateInvoiceInput): Invoice {
    const lineItems = input.lineItems.map((item, index) => ({
      id: `line-${index}`,
      invoiceId: input.invoiceId,
      ...item,
      lineTotal: item.quantity * item.unitPrice,
      taxAmount: item.taxRate ? (item.quantity * item.unitPrice * item.taxRate) / 100 : 0,
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalAmount = subtotal + taxAmount - (input.discountAmount || 0);

    return {
      id: input.invoiceId,
      organizationId: input.organizationId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate || new Date(),
      dueDate: input.dueDate || this.calculateDefaultDueDate(new Date(), input.paymentTermsDays),
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerAddress: input.customerAddress,
      currencyCode: input.currencyCode,
      lineItems,
      subtotal,
      taxAmount,
      discountAmount: input.discountAmount || 0,
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      status: "DRAFT",
      notes: input.notes,
      terms: input.terms,
      tags: input.tags || [],
      paymentLinks: [],
      attachments: [],
      linkedInvoiceIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Invoice;
  }

  /**
   * Validate invoice before posting
   */
  static validateInvoice(invoice: Invoice): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!invoice.invoiceNumber) errors.push("Invoice number is required");
    if (!invoice.customerId) errors.push("Customer is required");
    if (!invoice.customerId) errors.push("Customer email is required");
    if (invoice.lineItems.length === 0) errors.push("At least one line item is required");

    // Total validation
    const calculatedTotal = invoice.subtotal + invoice.taxAmount - invoice.discountAmount;
    if (Math.abs(calculatedTotal - invoice.totalAmount) > 0.01) {
      errors.push("Invoice total calculation error");
    }

    // Line items validation
    invoice.lineItems.forEach((item, index) => {
      if (item.quantity <= 0) errors.push(`Line item ${index + 1}: Quantity must be positive`);
      if (item.unitPrice < 0) errors.push(`Line item ${index + 1}: Unit price cannot be negative`);
    });

    // Date validation
    if (invoice.invoiceDate > invoice.dueDate) {
      warnings.push("Invoice date is after due date");
    }

    // Payment terms
    if (invoice.amountPaid > invoice.totalAmount) {
      errors.push("Amount paid cannot exceed total amount");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Post invoice (create journal entry)
   */
  static postInvoice(invoice: Invoice): PostingResult {
    const validation = this.validateInvoice(invoice);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Create journal entry
    const journalEntries = [
      {
        debit: invoice.totalAmount,
        creditAccount: "ACCOUNTS_RECEIVABLE",
        description: `Invoice ${invoice.invoiceNumber}`,
      },
      {
        credit: invoice.subtotal,
        debitAccount: "REVENUE",
        description: `Invoice ${invoice.invoiceNumber}`,
      },
    ];

    if (invoice.taxAmount > 0) {
      journalEntries.push({
        credit: invoice.taxAmount,
        debitAccount: "TAX_PAYABLE",
        description: `Tax on Invoice ${invoice.invoiceNumber}`,
      });
    }

    return {
      success: true,
      journalEntries,
    };
  }

  /**
   * Record payment against invoice
   */
  static recordPayment(
    invoice: Invoice,
    paymentAmount: number,
    paymentDate: Date = new Date(),
    paymentMethod: string
  ): PaymentResult {
    if (paymentAmount <= 0) {
      return { success: false, error: "Payment amount must be positive" };
    }

    if (paymentAmount > invoice.amountDue) {
      return {
        success: false,
        error: "Payment amount exceeds amount due",
      };
    }

    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const newAmountDue = invoice.totalAmount - newAmountPaid;
    const newStatus = this.calculateInvoiceStatus(
      newAmountDue,
      invoice.dueDate,
      invoice.status
    );

    return {
      success: true,
      updatedInvoice: {
        ...invoice,
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        paidAt: newAmountDue === 0 ? paymentDate : undefined,
      },
      journalEntry: {
        debit: paymentAmount,
        debitAccount: "CASH",
        credit: paymentAmount,
        creditAccount: "ACCOUNTS_RECEIVABLE",
        description: `Payment received: ${paymentMethod}`,
      },
    };
  }

  /**
   * Send invoice to customer
   */
  static sendInvoice(invoice: Invoice): SendResult {
    if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") {
      return { success: false, error: "Cannot send cancelled or refunded invoice" };
    }

    return {
      success: true,
      updatedInvoice: {
        ...invoice,
        status: "SENT",
        sentAt: new Date(),
      },
      notificationData: {
        recipientEmail: invoice.customerEmail,
        subject: `Invoice ${invoice.invoiceNumber}`,
        templateId: "invoice_email",
      },
    };
  }

  /**
   * Create recurring invoice
   */
  static createRecurringInvoice(
    baseInvoice: Invoice,
    frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL",
    startDate: Date,
    endDate?: Date
  ): RecurringInvoiceSchedule {
    const schedule: Date[] = [];
    let currentDate = startDate;

    while (!endDate || currentDate <= endDate) {
      schedule.push(new Date(currentDate));

      if (frequency === "MONTHLY") {
        currentDate = addMonths(currentDate, 1);
      } else if (frequency === "QUARTERLY") {
        currentDate = addMonths(currentDate, 3);
      } else if (frequency === "ANNUAL") {
        currentDate = addYears(currentDate, 1);
      }

      // Prevent infinite loops
      if (schedule.length > 120) break;
    }

    return {
      baseInvoice,
      frequency,
      schedule,
      invoicesToCreate: schedule.map((date) => ({
        ...baseInvoice,
        invoiceDate: date,
        dueDate: this.calculateDefaultDueDate(date, 30),
      })),
    };
  }

  /**
   * Calculate days overdue for aging report
   */
  static calculateDaysOverdue(invoice: Invoice, asOf: Date = new Date()): number {
    if (invoice.status === "PAID" || invoice.status === "REFUNDED") {
      return 0;
    }

    const daysOverdue = differenceInDays(asOf, invoice.dueDate);
    return daysOverdue > 0 ? daysOverdue : 0;
  }

  /**
   * Batch update invoice status
   */
  static batchUpdateStatus(
    invoices: Invoice[],
    updates: { invoiceId: string; newStatus: InvoiceStatus }[]
  ): Invoice[] {
    const updateMap = new Map(updates.map((u) => [u.invoiceId, u.newStatus]));

    return invoices.map((invoice) => {
      const newStatus = updateMap.get(invoice.id);
      return newStatus ? { ...invoice, status: newStatus } : invoice;
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static calculateDefaultDueDate(fromDate: Date, daysTerm: number = 30): Date {
    const dueDate = new Date(fromDate);
    dueDate.setDate(dueDate.getDate() + daysTerm);
    return dueDate;
  }

  private static calculateInvoiceStatus(
    amountDue: number,
    dueDate: Date,
    currentStatus: InvoiceStatus
  ): InvoiceStatus {
    if (amountDue === 0) return "PAID";
    if (amountDue < 0) return "REFUNDED";

    const now = new Date();
    if (now > dueDate) return "OVERDUE";

    return currentStatus === "SENT" || currentStatus === "VIEWED" ? currentStatus : "PARTIALLY_PAID";
  }
}

/**
 * Invoice templates (professional designs)
 */
export const INVOICE_TEMPLATES = {
  MODERN: "modern_blue",
  PROFESSIONAL: "corporate_gray",
  MINIMAL: "clean_white",
  COLORFUL: "vibrant_rainbow",
  CLASSIC: "business_black",
  CREATIVE: "artistic_gradient",
  INVOICE_WITH_LOGO: "branded_company",
  SERVICES: "service_focused",
  PRODUCTS: "ecommerce_style",
  NONPROFIT: "nonprofit_formal",
};

/**
 * Tax calculation helpers
 */
export class TaxCalculator {
  /**
   * Calculate applicable taxes for invoice
   */
  static calculateLineItemTax(
    amount: number,
    taxRate: number,
    additionalTaxes?: { name: string; rate: number }[]
  ): TaxCalculation {
    const mainTax = (amount * taxRate) / 100;
    const additionalTax = additionalTaxes
      ? additionalTaxes.reduce((sum, tax) => sum + (amount * tax.rate) / 100, 0)
      : 0;

    const totalTax = mainTax + additionalTax;

    return {
      mainTaxRate: taxRate,
      mainTaxAmount: mainTax,
      additionalTaxes: additionalTaxes || [],
      additionalTaxAmount: additionalTax,
      totalTaxAmount: totalTax,
      totalWithTax: amount + totalTax,
    };
  }

  /**
   * Handle multi-component tax (like GST in India)
   */
  static calculateGST(
    amount: number,
    gstRate: number,
    hasIGST: boolean = false
  ): { cgst: number; sgst: number; igst: number; total: number } {
    if (hasIGST) {
      return {
        cgst: 0,
        sgst: 0,
        igst: (amount * gstRate) / 100,
        total: amount + (amount * gstRate) / 100,
      };
    }

    const splitRate = gstRate / 2;
    return {
      cgst: (amount * splitRate) / 100,
      sgst: (amount * splitRate) / 100,
      igst: 0,
      total: amount + (amount * gstRate) / 100,
    };
  }
}

/**
 * Payment link and gateway integration
 */
export class PaymentLinkGenerator {
  /**
   * Generate payment link for Stripe
   */
  static generateStripeLink(
    invoice: Invoice,
    stripeApiKey: string
  ): Promise<string> {
    // Stripe implementation would go here
    // For now, return a placeholder
    return Promise.resolve(
      `https://pay.stripe.com/invoice/${invoice.id}`
    );
  }

  /**
   * Generate payment link for PayPal
   */
  static generatePayPalLink(invoice: Invoice): string {
    const params = new URLSearchParams({
      cmd: "_xclick",
      business: "merchant@example.com",
      item_name: `Invoice ${invoice.invoiceNumber}`,
      amount: invoice.totalAmount.toString(),
      currency_code: invoice.currencyCode,
      invoice: invoice.invoiceNumber,
      return: "https://app.accounting.io/invoices/confirmed",
      cancel_return: "https://app.accounting.io/invoices",
    });

    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }

  /**
   * Generate payment link for Razorpay (India)
   */
  static generateRazorpayLink(invoice: Invoice): string {
    // Razorpay implementation would go here
    return `https://rzp.io/i/invoice_${invoice.id}`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateInvoiceInput {
  invoiceId: string;
  organizationId: string;
  invoiceNumber: string;
  invoiceDate?: Date;
  dueDate?: Date;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: any; // Customer address object
  currencyCode: CurrencyCode;
  lineItems: InvoiceLineItem[];
  discountAmount?: number;
  paymentTermsDays?: number;
  notes?: string;
  terms?: string;
  tags?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PostingResult {
  success: boolean;
  errors?: string[];
  journalEntries?: any[];
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  updatedInvoice?: Invoice;
  journalEntry?: any;
}

export interface SendResult {
  success: boolean;
  error?: string;
  updatedInvoice?: Invoice;
  notificationData?: {
    recipientEmail: string;
    subject: string;
    templateId: string;
  };
}

export interface RecurringInvoiceSchedule {
  baseInvoice: Invoice;
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  schedule: Date[];
  invoicesToCreate: Invoice[];
}

export interface TaxCalculation {
  mainTaxRate: number;
  mainTaxAmount: number;
  additionalTaxes: { name: string; rate: number }[];
  additionalTaxAmount: number;
  totalTaxAmount: number;
  totalWithTax: number;
}
