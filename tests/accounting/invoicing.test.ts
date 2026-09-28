/**
 * Invoicing Engine Tests
 *
 * Comprehensive test suite for invoice creation, validation, payment tracking,
 * and integration with general ledger.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InvoiceEngine, PaymentLinkGenerator, TaxCalculator } from "../../src/lib/accounting/invoicing/engine";
import { Invoice, InvoiceStatus } from "../../src/lib/accounting/types";

describe("InvoiceEngine", () => {
  let invoice: Invoice;

  beforeEach(() => {
    invoice = InvoiceEngine.createInvoice({
      invoiceId: "inv-123",
      organizationId: "org-123",
      invoiceNumber: "INV-001",
      customerId: "cust-123",
      customerName: "Acme Corp",
      customerEmail: "billing@acme.com",
      customerAddress: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      },
      currencyCode: "USD",
      lineItems: [
        {
          id: "line-1",
          invoiceId: "inv-123",
          description: "Web Development",
          quantity: 40,
          unitPrice: 150,
          taxRate: 10,
          lineTotal: 6000,
          taxAmount: 600,
        },
      ],
    });
  });

  describe("Invoice Creation", () => {
    it("should create invoice with correct calculations", () => {
      expect(invoice.invoiceNumber).toBe("INV-001");
      expect(invoice.subtotal).toBe(6000);
      expect(invoice.taxAmount).toBe(600);
      expect(invoice.totalAmount).toBe(6600);
      expect(invoice.amountDue).toBe(6600);
      expect(invoice.status).toBe("DRAFT");
    });

    it("should apply discount correctly", () => {
      const invoiceWithDiscount = InvoiceEngine.createInvoice({
        invoiceId: "inv-124",
        organizationId: "org-123",
        invoiceNumber: "INV-002",
        customerId: "cust-123",
        customerName: "Acme Corp",
        customerEmail: "billing@acme.com",
        customerAddress: {},
        currencyCode: "USD",
        lineItems: [
          {
            id: "line-1",
            invoiceId: "inv-124",
            description: "Service",
            quantity: 10,
            unitPrice: 100,
            taxRate: 5,
            lineTotal: 1000,
            taxAmount: 50,
          },
        ],
        discountAmount: 100,
      });

      expect(invoiceWithDiscount.subtotal).toBe(1000);
      expect(invoiceWithDiscount.discountAmount).toBe(100);
      expect(invoiceWithDiscount.totalAmount).toBe(950); // 1000 + 50 - 100
    });

    it("should handle multiple line items", () => {
      const multiLineInvoice = InvoiceEngine.createInvoice({
        invoiceId: "inv-125",
        organizationId: "org-123",
        invoiceNumber: "INV-003",
        customerId: "cust-123",
        customerName: "Acme Corp",
        customerEmail: "billing@acme.com",
        customerAddress: {},
        currencyCode: "USD",
        lineItems: [
          {
            id: "line-1",
            invoiceId: "inv-125",
            description: "Item 1",
            quantity: 5,
            unitPrice: 100,
            lineTotal: 500,
          },
          {
            id: "line-2",
            invoiceId: "inv-125",
            description: "Item 2",
            quantity: 3,
            unitPrice: 200,
            lineTotal: 600,
          },
        ],
      });

      expect(multiLineInvoice.subtotal).toBe(1100);
      expect(multiLineInvoice.lineItems.length).toBe(2);
    });
  });

  describe("Invoice Validation", () => {
    it("should validate valid invoice", () => {
      const result = InvoiceEngine.validateInvoice(invoice);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidInvoice = { ...invoice, invoiceNumber: "" };
      const result = InvoiceEngine.validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invoice number is required");
    });

    it("should detect total calculation errors", () => {
      const brokenInvoice = {
        ...invoice,
        totalAmount: 999, // Wrong amount
      };
      const result = InvoiceEngine.validateInvoice(brokenInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("total calculation"))).toBe(true);
    });

    it("should detect amount paid exceeding total", () => {
      const invoiceWithOverpayment = {
        ...invoice,
        amountPaid: 10000,
      };
      const result = InvoiceEngine.validateInvoice(invoiceWithOverpayment);
      expect(result.isValid).toBe(false);
    });

    it("should warn if invoice date is after due date", () => {
      const futureInvoice = {
        ...invoice,
        invoiceDate: new Date("2025-01-01"),
        dueDate: new Date("2024-12-01"),
      };
      const result = InvoiceEngine.validateInvoice(futureInvoice);
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe("Invoice Posting", () => {
    it("should generate valid journal entries", () => {
      const result = InvoiceEngine.postInvoice(invoice);
      expect(result.success).toBe(true);
      expect(result.journalEntries).toBeDefined();
      expect(result.journalEntries?.length).toBeGreaterThan(0);
    });

    it("should fail posting for invalid invoice", () => {
      const invalidInvoice = { ...invoice, lineItems: [] };
      const result = InvoiceEngine.postInvoice(invalidInvoice);
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("should create correct double-entry entries", () => {
      const result = InvoiceEngine.postInvoice(invoice);
      if (result.success && result.journalEntries) {
        // Sum of debits should equal sum of credits
        const totalDebits = result.journalEntries
          .filter((j: any) => j.debit)
          .reduce((sum: number, j: any) => sum + j.debit, 0);
        const totalCredits = result.journalEntries
          .filter((j: any) => j.credit)
          .reduce((sum: number, j: any) => sum + j.credit, 0);

        expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
      }
    });
  });

  describe("Payment Recording", () => {
    it("should record full payment", () => {
      const result = InvoiceEngine.recordPayment(invoice, 6600);
      expect(result.success).toBe(true);
      expect(result.updatedInvoice?.amountPaid).toBe(6600);
      expect(result.updatedInvoice?.amountDue).toBe(0);
      expect(result.updatedInvoice?.status).toBe("PAID");
    });

    it("should record partial payment", () => {
      const result = InvoiceEngine.recordPayment(invoice, 3300);
      expect(result.success).toBe(true);
      expect(result.updatedInvoice?.amountPaid).toBe(3300);
      expect(result.updatedInvoice?.amountDue).toBe(3300);
      expect(result.updatedInvoice?.status).toBe("PARTIALLY_PAID");
    });

    it("should reject payment exceeding amount due", () => {
      const result = InvoiceEngine.recordPayment(invoice, 10000);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Payment amount exceeds");
    });

    it("should reject zero or negative payment", () => {
      const result = InvoiceEngine.recordPayment(invoice, 0);
      expect(result.success).toBe(false);
    });

    it("should generate correct journal entry for payment", () => {
      const result = InvoiceEngine.recordPayment(invoice, 6600);
      expect(result.journalEntry).toBeDefined();
      expect(result.journalEntry?.debit).toBe(6600);
      expect(result.journalEntry?.credit).toBe(6600);
    });

    it("should set paid date when fully paid", () => {
      const paymentDate = new Date("2024-10-15");
      const result = InvoiceEngine.recordPayment(invoice, 6600, paymentDate);
      expect(result.updatedInvoice?.paidAt).toEqual(paymentDate);
    });
  });

  describe("Invoice Status Management", () => {
    it("should transition from DRAFT to SENT", () => {
      const result = InvoiceEngine.sendInvoice(invoice);
      expect(result.success).toBe(true);
      expect(result.updatedInvoice?.status).toBe("SENT");
      expect(result.updatedInvoice?.sentAt).toBeDefined();
    });

    it("should not send cancelled invoice", () => {
      const cancelledInvoice = { ...invoice, status: "CANCELLED" as InvoiceStatus };
      const result = InvoiceEngine.sendInvoice(cancelledInvoice);
      expect(result.success).toBe(false);
    });

    it("should calculate days overdue correctly", () => {
      const pastDueInvoice = {
        ...invoice,
        dueDate: new Date("2024-09-20"),
        status: "SENT" as InvoiceStatus,
      };
      const asOf = new Date("2024-10-05");
      const daysOverdue = InvoiceEngine.calculateDaysOverdue(pastDueInvoice, asOf);
      expect(daysOverdue).toBe(15);
    });

    it("should return 0 days overdue for paid invoice", () => {
      const paidInvoice = { ...invoice, status: "PAID" as InvoiceStatus };
      const daysOverdue = InvoiceEngine.calculateDaysOverdue(paidInvoice);
      expect(daysOverdue).toBe(0);
    });
  });

  describe("Recurring Invoices", () => {
    it("should create monthly recurring schedule", () => {
      const startDate = new Date("2024-10-01");
      const endDate = new Date("2024-12-31");
      const result = InvoiceEngine.createRecurringInvoice(invoice, "MONTHLY", startDate, endDate);

      expect(result.frequency).toBe("MONTHLY");
      expect(result.schedule.length).toBe(3);
      expect(result.invoicesToCreate.length).toBe(3);
    });

    it("should create quarterly recurring schedule", () => {
      const startDate = new Date("2024-10-01");
      const endDate = new Date("2025-12-31");
      const result = InvoiceEngine.createRecurringInvoice(invoice, "QUARTERLY", startDate, endDate);

      expect(result.frequency).toBe("QUARTERLY");
      expect(result.schedule.length).toBe(4);
    });

    it("should create annual recurring schedule", () => {
      const startDate = new Date("2024-10-01");
      const endDate = new Date("2026-12-31");
      const result = InvoiceEngine.createRecurringInvoice(invoice, "ANNUAL", startDate, endDate);

      expect(result.frequency).toBe("ANNUAL");
      expect(result.schedule.length).toBe(3);
    });

    it("should generate correct due dates for recurring invoices", () => {
      const startDate = new Date("2024-10-01");
      const endDate = new Date("2024-12-31");
      const result = InvoiceEngine.createRecurringInvoice(invoice, "MONTHLY", startDate, endDate);

      // Each invoice should have due date 30 days after invoice date
      result.invoicesToCreate.forEach((inv) => {
        const daysDiff = Math.floor(
          (inv.dueDate.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(daysDiff).toBe(30);
      });
    });
  });

  describe("Batch Operations", () => {
    it("should update multiple invoice statuses", () => {
      const invoices = [invoice, { ...invoice, id: "inv-124" }];
      const updates = [
        { invoiceId: "inv-123", newStatus: "SENT" as InvoiceStatus },
        { invoiceId: "inv-124", newStatus: "PAID" as InvoiceStatus },
      ];

      const result = InvoiceEngine.batchUpdateStatus(invoices, updates);
      expect(result[0].status).toBe("SENT");
      expect(result[1].status).toBe("PAID");
    });
  });
});

describe("TaxCalculator", () => {
  it("should calculate line item tax correctly", () => {
    const amount = 1000;
    const taxRate = 10;
    const result = TaxCalculator.calculateLineItemTax(amount, taxRate);

    expect(result.mainTaxAmount).toBe(100);
    expect(result.totalTaxAmount).toBe(100);
    expect(result.totalWithTax).toBe(1100);
  });

  it("should calculate GST with CGST/SGST", () => {
    const result = TaxCalculator.calculateGST(1000, 18, false);
    expect(result.cgst).toBe(90);
    expect(result.sgst).toBe(90);
    expect(result.igst).toBe(0);
    expect(result.total).toBe(1180);
  });

  it("should calculate GST with IGST", () => {
    const result = TaxCalculator.calculateGST(1000, 18, true);
    expect(result.igst).toBe(180);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.total).toBe(1180);
  });
});

describe("PaymentLinkGenerator", () => {
  it("should generate PayPal payment link", () => {
    const link = PaymentLinkGenerator.generatePayPalLink(invoice);
    expect(link).toContain("paypal.com");
    expect(link).toContain(invoice.invoiceNumber);
    expect(link).toContain(invoice.totalAmount.toString());
  });

  it("should generate Razorpay payment link", () => {
    const link = PaymentLinkGenerator.generateRazorpayLink(invoice);
    expect(link).toContain("rzp.io");
    expect(link).toContain(invoice.id);
  });

  it("should generate Stripe payment link", async () => {
    const link = await PaymentLinkGenerator.generateStripeLink(invoice, "sk_test_xyz");
    expect(link).toContain("stripe.com");
  });
});
