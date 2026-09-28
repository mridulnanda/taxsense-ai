# Cloud Accounting Platform - API Routes

## Structure Overview

```
/api/accounting/
├── /chart-of-accounts/
│   ├── GET    /                    # List all accounts
│   ├── POST   /                    # Create account
│   ├── GET    /:id                 # Get account details
│   ├── PUT    /:id                 # Update account
│   ├── DELETE /:id                 # Archive account
│   ├── GET    /:id/balance         # Get account balance
│   ├── POST   /:id/reconcile       # Mark account reconciled
│   └── POST   /template/:country   # Load template
│
├── /invoices/
│   ├── GET    /                    # List invoices (paginated, filterable)
│   ├── POST   /                    # Create invoice
│   ├── GET    /:id                 # Get invoice details
│   ├── PUT    /:id                 # Update invoice
│   ├── DELETE /:id                 # Delete invoice (draft only)
│   ├── POST   /:id/send            # Send to customer
│   ├── POST   /:id/payment         # Record payment
│   ├── POST   /:id/payment-link    # Generate payment link
│   ├── POST   /:id/approve         # Approve invoice
│   ├── POST   /:id/duplicate       # Duplicate invoice
│   ├── POST   /recurring/create    # Create recurring invoice
│   ├── GET    /aging-report        # AR aging report
│   └── GET    /dashboard/metrics   # Invoice metrics
│
├── /expenses/
│   ├── GET    /                    # List expenses
│   ├── POST   /                    # Create expense
│   ├── GET    /:id                 # Get expense
│   ├── PUT    /:id                 # Update expense
│   ├── DELETE /:id                 # Delete expense
│   ├── POST   /:id/approve         # Approve expense
│   ├── POST   /:id/reject          # Reject expense
│   ├── POST   /:id/reimburse       # Mark reimbursed
│   ├── POST   /receipt-scan        # OCR receipt
│   ├── POST   /mileage/log         # Log mileage
│   └── GET    /dashboard/metrics   # Expense metrics
│
├── /banking/
│   ├── /accounts/
│   │   ├── GET    /                    # List bank accounts
│   │   ├── POST   /                    # Create bank account
│   │   ├── GET    /:id                 # Get account details
│   │   ├── POST   /:id/connect        # Initiate Plaid connection
│   │   ├── POST   /:id/sync           # Manual sync transactions
│   │   └── DELETE /:id                 # Delete bank account
│   │
│   ├── /transactions/
│   │   ├── GET    /                    # List transactions
│   │   ├── GET    /:id                 # Get transaction
│   │   ├── PUT    /:id/match          # Match to invoice/expense
│   │   ├── PUT    /:id/categorize     # Categorize transaction
│   │   ├── PUT    /:id/reconcile      # Mark reconciled
│   │   └── POST   /ai-categorize      # AI categorization batch
│   │
│   └── /reconciliation/
│       ├── GET    /                    # Get reconciliation status
│       ├── POST   /                    # Create reconciliation
│       ├── GET    /:id                 # Get reconciliation details
│       ├── PUT    /:id/approve        # Approve reconciliation
│       ├── POST   /:id/auto-reconcile # Run auto-reconcile
│       └── GET    /:id/discrepancies  # Get discrepancies
│
├── /reports/
│   ├── GET    /balance-sheet        # Balance sheet
│   ├── GET    /income-statement     # P&L statement
│   ├── GET    /cash-flow            # Cash flow
│   ├── GET    /trial-balance        # Trial balance
│   ├── GET    /aging-ar             # AR aging
│   ├── GET    /aging-ap             # AP aging
│   ├── GET    /budget-vs-actual     # Budget comparison
│   ├── POST   /custom               # Create custom report
│   ├── GET    /custom/:id           # Get custom report
│   ├── GET    /:type/export         # Export report (PDF/Excel)
│   └── GET    /dashboard            # Executive dashboard
│
├── /journals/
│   ├── GET    /                     # List journals
│   ├── POST   /                     # Create journal entry
│   ├── GET    /:id                  # Get journal details
│   ├── PUT    /:id                  # Update journal (draft only)
│   ├── DELETE /:id                  # Delete journal (draft only)
│   ├── POST   /:id/post             # Post journal
│   ├── POST   /:id/approve          # Approve journal
│   └── GET    /ledger               # General ledger
│
├── /integrations/
│   ├── GET    /                     # List integrations
│   ├── POST   /stripe/connect       # Stripe setup
│   ├── POST   /paypal/connect       # PayPal setup
│   ├── POST   /razorpay/connect     # Razorpay setup (India)
│   ├── POST   /salesforce/sync      # Salesforce sync
│   ├── POST   /hubspot/sync         # HubSpot sync
│   ├── GET    /webhooks             # List webhooks
│   ├── POST   /webhooks             # Create webhook
│   └── GET    /available            # List available integrations
│
├── /organizations/
│   ├── GET    /me                   # Get current org
│   ├── PUT    /me                   # Update org settings
│   ├── POST   /users                # Invite user
│   ├── GET    /users                # List users
│   ├── PUT    /users/:id            # Update user role
│   ├── DELETE /users/:id            # Remove user
│   ├── GET    /audit-log            # Audit trail
│   ├── POST   /backup               # Request backup
│   └── GET    /usage                # Usage statistics
│
└── /settings/
    ├── GET    /preferences          # Get preferences
    ├── PUT    /preferences          # Update preferences
    ├── GET    /tax-settings         # Get tax config
    ├── PUT    /tax-settings         # Update tax config
    └── GET    /localization/:country # Get country rules
```

## Authentication & Authorization

- All endpoints require `Authorization: Bearer <token>` header
- Token obtained via `/auth/login` or OAuth2 flow
- Role-based access control (RBAC):
  - `ADMIN`: Full access
  - `ACCOUNTANT`: Create/edit/approve transactions, view reports
  - `MANAGER`: View reports, limited transaction approval
  - `EMPLOYEE`: Create expenses, view invoices
  - `VIEWER`: Read-only access

## Request/Response Format

### List Endpoints
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  },
  "meta": {
    "generatedAt": "2024-09-28T10:30:00Z",
    "version": "1.0"
  }
}
```

### Create/Update Endpoints
```json
{
  "data": {...},
  "meta": {
    "action": "created|updated",
    "timestamp": "2024-09-28T10:30:00Z"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "amount",
        "message": "Must be positive"
      }
    ]
  },
  "timestamp": "2024-09-28T10:30:00Z"
}
```

## Key Features

### Invoicing API
- Multi-currency support
- Automated payment reminders
- Payment gateway integration (Stripe, PayPal, Razorpay)
- Recurring invoice scheduling
- Invoice templates (50+ designs)
- Email delivery tracking (sent, viewed)
- Multi-recipient approvals

### Banking API
- Plaid integration (1000+ banks globally)
- Open Banking/PSD2 support
- Real-time transaction sync
- AI-powered auto-categorization
- Duplicate detection
- One-click reconciliation
- Multi-account management

### Reporting API
- IFRS/GAAP-compliant reports
- Year-over-year comparison
- Drill-down analysis
- Custom report builder
- Real-time dashboard
- Export to PDF/Excel/CSV
- Scheduled report delivery

### Accounting API
- Double-entry bookkeeping validation
- Unlimited chart of accounts
- Account hierarchy management
- Bulk operations
- Audit trail on all changes
- Approval workflows
- Tax integration

## Pagination & Filtering

All list endpoints support:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (e.g., `sort=created_at:desc`)
- `filter` (e.g., `filter=status:paid,amount:>1000`)
- `search` (text search)

## Rate Limiting

- 1000 requests/hour for standard users
- 10,000 requests/hour for enterprise
- 429 Too Many Requests when exceeded

## Webhooks

Subscribe to events:
- `invoice.created`, `invoice.sent`, `invoice.paid`
- `expense.approved`, `expense.reimbursed`
- `transaction.categorized`, `transaction.reconciled`
- `report.generated`

## Implementation Priority

### Phase 1 (MVP - Week 1-2)
- Chart of Accounts CRUD
- Invoice creation & basic management
- Expense logging
- Bank connection (Plaid)
- Basic reports (Balance Sheet, P&L)

### Phase 2 (Week 3-4)
- Payment links & tracking
- Bank reconciliation
- AI categorization
- Recurring invoices
- AR aging report

### Phase 3 (Week 5-6)
- Multi-entity support
- Budget tracking
- Advanced reporting
- Workflow approvals
- Integrations (Stripe, Salesforce)

### Phase 4 (Week 7-8)
- Mobile app
- Advanced analytics
- ML-powered insights
- Compliance automation
- Full production deployment
