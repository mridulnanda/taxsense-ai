# Cloud Accounting Platform - Implementation Guide

## Overview

This guide provides a step-by-step approach to building the accounting platform from the scaffolded architecture. All core domain logic has been implemented; this guide focuses on the API implementation and integration layers.

---

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Initialize API Framework

**Create API structure:**
```bash
# Chart of Accounts API
mkdir -p src/app/api/accounting/chart-of-accounts/{get,post,put,delete}
mkdir -p src/app/api/accounting/invoices/{get,post,put}
mkdir -p src/app/api/accounting/expenses
mkdir -p src/app/api/accounting/banking
mkdir -p src/app/api/accounting/reports
```

**Install dependencies:**
```bash
npm install express express-async-errors cors helmet rate-limit
npm install zod joi yup  # Validation
npm install p-retry exponential-backoff  # Retry logic
npm install slugify uuid  # Utilities
npm install --save-dev @types/express jest @testing-library/react
```

### 1.2 Create API Response Wrapper

**File**: `src/lib/api/response.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export class ApiErrorHandler {
  static success<T>(data: T, statusCode = 200): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }

  static error(code: string, message: string, statusCode = 400, details?: any[]): ApiResponse<never> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }
}
```

### 1.3 Create Database Connection Pool

**File**: `src/lib/db/pool.ts`

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
```

### 1.4 Set Up Authentication Middleware

**File**: `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "No token provided",
      code: "MISSING_TOKEN",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }
    req.user = user;
    next();
  });
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }
    next();
  };
};
```

### 1.5 Create Database Seeding Script

**File**: `scripts/seed-initial-data.ts`

```typescript
import pool from "../src/lib/db/pool";
import { ChartOfAccountsValidator } from "../src/lib/accounting/chart-of-accounts/engine";
import { COA_TEMPLATES } from "../src/lib/accounting/chart-of-accounts/engine";

async function seedInitialData() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create test organization
    const orgResult = await client.query(
      "INSERT INTO organizations (name, legal_name, country_code, base_currency) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Demo Organization", "Demo Org Inc.", "US", "USD"]
    );
    const orgId = orgResult.rows[0].id;

    // 2. Create test user
    await client.query(
      "INSERT INTO users (organization_id, email, name, role) VALUES ($1, $2, $3, $4)",
      [orgId, "admin@example.com", "Admin User", "ADMIN"]
    );

    // 3. Load chart of accounts template
    const template = COA_TEMPLATES.USA.SERVICE_BUSINESS;
    for (const account of template.accounts) {
      await client.query(
        `INSERT INTO chart_of_accounts 
         (organization_id, code, name, account_type, category, currency_code, normal_balance, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orgId,
          account.code,
          account.name,
          account.accountType,
          account.category,
          "USD",
          account.normalBalance,
          true,
        ]
      );
    }

    await client.query("COMMIT");
    console.log("✓ Seed data created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding data:", error);
    throw error;
  } finally {
    client.release();
  }
}

seedInitialData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

---

## Phase 2: Core APIs (Week 3-4)

### 2.1 Chart of Accounts Endpoints

**File**: `src/app/api/accounting/chart-of-accounts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/pool";
import { ChartOfAccountsValidator } from "@/lib/accounting/chart-of-accounts/engine";
import { ChartOfAccountSchema } from "@/lib/accounting/types";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get("x-organization-id");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM chart_of_accounts 
       WHERE organization_id = $1 AND is_active = TRUE AND is_archived = FALSE
       ORDER BY code ASC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM chart_of_accounts WHERE organization_id = $1",
      [organizationId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to fetch accounts" },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get("x-organization-id");
    const body = await req.json();

    // Validate input
    const validation = ChartOfAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO chart_of_accounts 
       (organization_id, code, name, description, account_type, category, currency_code, normal_balance, tags, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        organizationId,
        body.code,
        body.name,
        body.description || null,
        body.accountType,
        body.category,
        "USD",
        body.normalBalance,
        body.tags || [],
        true,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to create account" },
      },
      { status: 500 }
    );
  }
}
```

### 2.2 Invoicing Endpoints

**File**: `src/app/api/accounting/invoices/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/pool";
import { InvoiceEngine } from "@/lib/accounting/invoicing/engine";
import { InvoiceSchema } from "@/lib/accounting/types";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get("x-organization-id");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM invoices WHERE organization_id = $1 AND deleted_at IS NULL";
    const params: any[] = [organizationId];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += " ORDER BY invoice_date DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Fetch line items for each invoice
    const invoices = await Promise.all(
      result.rows.map(async (invoice) => {
        const itemsResult = await pool.query(
          "SELECT * FROM invoice_line_items WHERE invoice_id = $1",
          [invoice.id]
        );
        return {
          ...invoice,
          lineItems: itemsResult.rows,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: { page, limit },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to fetch invoices" },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const organizationId = req.headers.get("x-organization-id");
    const body = await req.json();

    // Validate input
    const validation = InvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid invoice data",
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    // Create invoice using engine
    const invoice = InvoiceEngine.createInvoice({
      invoiceId: `inv-${Date.now()}`,
      organizationId,
      ...body,
    });

    // Validate using engine
    const engineValidation = InvoiceEngine.validateInvoice(invoice as any);
    if (!engineValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invoice validation failed",
            details: engineValidation.errors,
          },
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Insert invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices 
       (organization_id, invoice_number, invoice_date, due_date, customer_id, customer_name, customer_email, 
        customer_address, currency_code, subtotal, tax_amount, total_amount, amount_due, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        organizationId,
        invoice.invoiceNumber,
        invoice.invoiceDate,
        invoice.dueDate,
        invoice.customerId,
        invoice.customerName,
        invoice.customerEmail,
        JSON.stringify(invoice.customerAddress),
        invoice.currencyCode,
        invoice.subtotal,
        invoice.taxAmount,
        invoice.totalAmount,
        invoice.amountDue,
        "DRAFT",
      ]
    );

    // Insert line items
    for (const item of invoice.lineItems) {
      await client.query(
        `INSERT INTO invoice_line_items 
         (invoice_id, description, quantity, unit_price, tax_rate, line_total, tax_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          invoiceResult.rows[0].id,
          item.description,
          item.quantity,
          item.unitPrice,
          item.taxRate || 0,
          item.lineTotal,
          item.taxAmount || 0,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        data: invoiceResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to create invoice" },
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
```

### 2.3 Invoice Payment Endpoint

**File**: `src/app/api/accounting/invoices/[id]/payment/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/pool";
import { InvoiceEngine } from "@/lib/accounting/invoicing/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();

  try {
    const organizationId = req.headers.get("x-organization-id");
    const { amount, paymentDate, paymentMethod } = await req.json();

    // Fetch invoice
    const invoiceResult = await client.query(
      "SELECT * FROM invoices WHERE id = $1 AND organization_id = $2",
      [params.id, organizationId]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    const invoice = invoiceResult.rows[0];

    // Record payment using engine
    const result = InvoiceEngine.recordPayment(
      invoice,
      amount,
      new Date(paymentDate),
      paymentMethod
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "PAYMENT_ERROR", message: result.error } },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Update invoice
    await client.query(
      `UPDATE invoices 
       SET amount_paid = amount_paid + $1, 
           amount_due = amount_due - $1, 
           status = $2,
           paid_at = $3
       WHERE id = $4`,
      [amount, result.updatedInvoice?.status, paymentDate || new Date(), params.id]
    );

    // Create journal entry for payment
    // (Implementation depends on journal structure)

    await client.query("COMMIT");

    const updatedInvoice = await pool.query(
      "SELECT * FROM invoices WHERE id = $1",
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedInvoice.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error recording payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to record payment" },
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
```

### 2.4 Reporting Endpoints

**File**: `src/app/api/accounting/reports/balance-sheet/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/pool";
import { FinancialReportEngine } from "@/lib/accounting/reporting/financial-reports";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get("x-organization-id");
    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get("startDate") || new Date().getFullYear() + "-01-01");
    const endDate = new Date(searchParams.get("endDate") || new Date());

    // Fetch accounts
    const accountsResult = await pool.query(
      "SELECT * FROM chart_of_accounts WHERE organization_id = $1 AND is_active = TRUE",
      [organizationId]
    );

    // Fetch journals
    const journalsResult = await pool.query(
      "SELECT * FROM journals WHERE organization_id = $1 AND status IN ('POSTED', 'LOCKED') AND posted_at >= $2 AND posted_at <= $3",
      [organizationId, startDate, endDate]
    );

    // Fetch journal entries
    const entriesResult = await pool.query(
      `SELECT je.* FROM journal_entries je
       JOIN journals j ON je.journal_id = j.id
       WHERE j.organization_id = $1 AND j.status IN ('POSTED', 'LOCKED')
       AND j.posted_at >= $2 AND j.posted_at <= $3`,
      [organizationId, startDate, endDate]
    );

    // Map results to domain objects
    const journals = journalsResult.rows.map((j) => ({
      ...j,
      entries: entriesResult.rows.filter((e: any) => e.journal_id === j.id),
    }));

    // Generate report using engine
    const report = FinancialReportEngine.generateBalanceSheet(
      accountsResult.rows,
      journals,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "REPORT_ERROR", message: "Failed to generate balance sheet" },
      },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Integration Layer (Week 5-6)

### 3.1 Payment Gateway Integration

**File**: `src/lib/payments/stripe-integration.ts`

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function createPaymentLink(invoice: any) {
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: invoice.lineItems.map((item) => ({
        price_data: {
          currency: invoice.currencyCode.toLowerCase(),
          product_data: {
            name: item.description,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
      },
    });

    return {
      success: true,
      paymentLink: paymentLink.url,
      externalLinkId: paymentLink.id,
    };
  } catch (error) {
    console.error("Stripe payment link creation error:", error);
    return {
      success: false,
      error: "Failed to create payment link",
    };
  }
}
```

### 3.2 Bank Integration with Plaid

**File**: `src/lib/banking/plaid-integration.ts`

```typescript
import { PlaidApi, Configuration } from "plaid";

const configuration = new Configuration({
  basePath: "https://sandbox.plaid.com", // Change to production
  apiKey: process.env.PLAID_CLIENT_ID || "",
});

const plaidClient = new PlaidApi(configuration);

export async function createLinkToken(userId: string) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Accounting Platform",
      language: "en",
      country_codes: ["US"],
      products: ["auth", "transactions"],
    });

    return {
      success: true,
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  } catch (error) {
    console.error("Plaid error:", error);
    return { success: false, error: "Failed to create link token" };
  }
}

export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      success: true,
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error) {
    console.error("Plaid exchange error:", error);
    return { success: false, error: "Failed to exchange token" };
  }
}
```

---

## Phase 4: UI Components (Week 7-8)

### 4.1 Invoice Form Component

**File**: `src/app/components/accounting/InvoiceForm.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceSchema } from "@/lib/accounting/types";

export function InvoiceForm() {
  const { control, register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(InvoiceSchema),
  });

  const { fields: lineItems, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const onSubmit = async (data) => {
    const response = await fetch("/api/accounting/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": "org-id", // From auth context
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      // Handle success
      console.log("Invoice created:", result.data);
    } else {
      // Handle error
      const error = await response.json();
      console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("invoiceNumber")}
          placeholder="Invoice Number"
          className="border p-2 rounded"
        />
        <input
          {...register("invoiceDate")}
          type="date"
          className="border p-2 rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          {...register("customerName")}
          placeholder="Customer Name"
          className="border p-2 rounded"
        />
        <input
          {...register("customerEmail")}
          type="email"
          placeholder="Customer Email"
          className="border p-2 rounded"
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-bold">Line Items</h3>
        {lineItems.map((field, index) => (
          <div key={field.id} className="grid grid-cols-4 gap-2">
            <input
              {...register(`lineItems.${index}.description`)}
              placeholder="Description"
              className="border p-2 rounded"
            />
            <input
              {...register(`lineItems.${index}.quantity`)}
              type="number"
              placeholder="Qty"
              className="border p-2 rounded"
            />
            <input
              {...register(`lineItems.${index}.unitPrice`)}
              type="number"
              placeholder="Price"
              className="border p-2 rounded"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="bg-red-500 text-white p-2 rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Add Line Item
        </button>
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white p-2 rounded w-full"
      >
        Create Invoice
      </button>
    </form>
  );
}
```

---

## Testing Strategy

### Unit Tests
- Domain logic tests (invoices, accounting)
- Type validation tests
- Calculation tests

### Integration Tests
- API endpoint tests
- Database interaction tests
- Payment gateway tests

### E2E Tests
- Complete invoice workflow (create → send → pay)
- Bank reconciliation workflow
- Report generation workflow

**Run tests**:
```bash
npm test                    # All tests
npm run test:accounting     # Accounting module only
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
```

---

## Deployment

### Local Development
```bash
npm run dev
# Open http://localhost:3000
```

### Staging
```bash
git push staging main
# Auto-deploys to staging.accounting.example.com
```

### Production
```bash
git push production main
# Auto-deploys to accounting.example.com
# Requires approval
```

---

## Next Steps

1. ✅ Architecture & domain logic complete
2. **TODO**: Implement Phase 1 APIs (2 weeks)
3. **TODO**: Implement Phase 2 APIs (2 weeks)
4. **TODO**: UI components & integrations (2 weeks)
5. **TODO**: Testing & deployment (2 weeks)

---

## Resources

- API Documentation: `/src/app/api/accounting/route-structure.md`
- Domain Types: `/src/lib/accounting/types.ts`
- Database Schema: `/migrations/001_accounting_platform_schema.sql`
- Testing Examples: `/tests/accounting/invoicing.test.ts`

---

**Questions?** Contact MNB Research technical team.
