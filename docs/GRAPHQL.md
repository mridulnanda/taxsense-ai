# TaxSense AI GraphQL API Documentation

Complete GraphQL API reference for TaxSense AI tax computation and optimization engine.

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Rate Limiting & Query Complexity](#rate-limiting--query-complexity)
- [Schema Overview](#schema-overview)
- [Queries](#queries)
- [Mutations](#mutations)
- [Subscriptions](#subscriptions)
- [Types Reference](#types-reference)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Performance Considerations](#performance-considerations)

## Getting Started

### Endpoint
```
POST /api/graphql
GET /api/graphql (GraphQL Playground in development)
```

### Quick Start
The simplest way to get started is with a basic tax computation query:

```graphql
query {
  getTaxComputation(profile: {
    age: 35
    residentialStatus: resident
    deductions: {
      section80C: 150000
      section80CCD1B: 50000
      section80D_selfFamily: 25000
      section80D_parents: 0
      parentsAreSenior: false
      section80E: 0
      section80G: 0
    }
    taxesPaid: 0
    houseProperties: []
  }) {
    old {
      totalTaxLiability
      effectiveRatePct
    }
    new {
      totalTaxLiability
      effectiveRatePct
    }
    recommended
    savings
  }
}
```

## Authentication

### Bearer Token
Include your authentication token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Context Fields
- `userId`: User identifier (extracted from JWT)
- `isAuthenticated`: Boolean flag
- `requestId`: Unique request identifier for tracking

### Future Enhancement
Currently, bearer tokens are accepted but not validated. In production, implement JWT verification using RS256 or HS256 algorithms.

## Rate Limiting & Query Complexity

### Query Complexity Analysis
The API includes built-in query complexity analysis to prevent abuse:

- **Maximum depth**: 10 levels
- **Maximum cost**: 5000 (cumulative)
- **Base field cost**: 5
- **Expensive operations cost**: 50
  - `getScenarios`
  - `getRecommendations`
  - `exportReport`

### Query Too Complex Error
```json
{
  "errors": [{
    "message": "Query too complex. Estimated cost: 6500, max allowed: 5000."
  }]
}
```

### Optimization Tips
1. Request only fields you need (use fragments)
2. Avoid deeply nested selections
3. Paginate when handling multiple scenarios
4. Cache computation results on client side
5. Use separate queries for independent data needs

## Schema Overview

### Core Types
- **TaxProfile**: Input profile with income details
- **TaxComputationResult**: Complete tax computation for both regimes
- **RegimeComputation**: Detailed computation for single regime
- **OptimizationReport**: AI-powered recommendations
- **Scenario**: What-if scenario for tax planning
- **TaxAnalytics**: Advanced analytics and insights

### Enumerations
```graphql
enum Regime { old, new }
enum ResidentialStatus { resident, nri }
enum HousePropertyUse { self_occupied, let_out }
enum Priority { critical, high, medium, low }
enum Difficulty { easy, medium, hard }
enum RiskLevel { none, low, medium, high }
enum RiskProfile { conservative, moderate, aggressive }
enum ExportFormat { PDF, JSON, CSV }
```

## Queries

### getTaxComputation
Computes tax liability for both old and new regime.

```graphql
query GetTax($profile: TaxProfileInput!) {
  getTaxComputation(profile: $profile) {
    old {
      totalTaxLiability
      effectiveRatePct
      notes
    }
    new {
      totalTaxLiability
      effectiveRatePct
      notes
    }
    recommended
    savings
    computedAt
  }
}
```

**Response Example:**
```json
{
  "data": {
    "getTaxComputation": {
      "old": {
        "totalTaxLiability": 285000,
        "effectiveRatePct": 19.0,
        "notes": ["Self-occupied home-loan interest capped at ₹2,00,000"]
      },
      "new": {
        "totalTaxLiability": 250000,
        "effectiveRatePct": 16.67,
        "notes": []
      },
      "recommended": "new",
      "savings": 35000,
      "computedAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

### getRegimeComparison
Compares old and new regime side-by-side with recommendation.

```graphql
query {
  getRegimeComparison(profile: {...}) {
    old { totalTaxLiability, effectiveRatePct }
    new { totalTaxLiability, effectiveRatePct }
    recommended
    savings
  }
}
```

### getRecommendations
Gets AI-powered tax optimization recommendations.

```graphql
query {
  getRecommendations(
    profile: {...}
    riskProfile: moderate
  ) {
    recommendations {
      id
      category
      priority
      title
      description
      estimatedSavings
      action
      difficulty
      timeline
      risk
    }
    totalPotentialSavings
    currentLiability
    optimizedLiability
    riskProfile
  }
}
```

**Categories:**
- `deduction`: Claim overlooked deductions
- `investment`: Suggested investments
- `planning`: Structural planning
- `structure`: Regime or entity structure
- `regime`: Old vs New regime optimization

**Timelines:**
- `immediate`: Act now
- `before_mar_31`: Before financial year end
- `next_fy`: Plan for next financial year

### getScenarios
Compare multiple what-if scenarios for tax planning.

```graphql
query {
  getScenarios(
    baseline: {...}
    scenarios: [
      {
        name: "Increased 80C"
        description: "Invest additional ₹50,000 in ELSS"
        profileChanges: {...}
      }
      {
        name: "Capital Gains"
        description: "Realize equity gains"
        profileChanges: {...}
      }
    ]
  ) {
    baseline {
      id
      name
      computation { ... }
    }
    scenarios {
      id
      name
      computation { ... }
    }
    bestScenario {
      id
      name
      computation { ... }
    }
    maxSavings
  }
}
```

### getAnalytics
Advanced tax analytics and insights.

```graphql
query {
  getAnalytics(computation: {...}) {
    effectiveTaxRate
    marginalRate
    taxPerRupee
    incomeHeadBreakdown {
      head
      income
      percentage
    }
    taxComposition {
      component
      amount
      percentage
    }
    metrics {
      totalIncome
      totalDeductions
      taxLiability
      netPayable
    }
  }
}
```

### health
Health check endpoint for monitoring.

```graphql
query {
  health {
    status
    timestamp
    version
  }
}
```

## Mutations

### computeTax
Compute and save tax result. Returns success/error status.

```graphql
mutation {
  computeTax(profile: {...}) {
    success
    computation { ... }
    error
  }
}
```

### createScenario
Create a named scenario for future reference.

```graphql
mutation {
  createScenario(
    baseline: {...}
    scenario: {
      name: "Scenario Name"
      description: "What changes in this scenario"
      profileChanges: {...}
    }
  ) {
    id
    name
    description
    computation { ... }
  }
}
```

### updateProfile
Save user's tax profile.

```graphql
mutation {
  updateProfile(
    userId: "user-123"
    profile: {...}
  ) {
    success
    profile { ... }
    error
  }
}
```

### exportReport
Export tax report in multiple formats.

```graphql
mutation {
  exportReport(
    computation: {...}
    format: PDF
  ) {
    success
    filename
    url
    format
    error
  }
}
```

**Supported Formats:**
- `PDF`: Downloadable PDF report
- `JSON`: Structured JSON data
- `CSV`: Spreadsheet-compatible format

### saveComparison
Save a scenario comparison for later analysis.

```graphql
mutation {
  saveComparison(
    baseline: {...}
    scenarios: [{...}]
    name: "Q4 Planning - 2025"
  ) {
    success
    comparisonId
    error
  }
}
```

## Subscriptions

### computationProgress
Real-time updates during computation (currently mock).

```graphql
subscription {
  computationProgress(computationId: "comp-123") {
    computationId
    stage
    progress
    message
    completed
  }
}
```

**Stages:**
- `parsing`: Validating input profile
- `computation`: Computing tax
- `analysis`: Generating insights
- `recommendations`: Creating recommendations
- `export`: Preparing output

## Types Reference

### TaxProfileInput
Complete tax profile for computation.

```graphql
input TaxProfileInput {
  name: String
  age: Int!               # 18-125
  residentialStatus: ResidentialStatus!
  salary: SalaryIncomeInput
  houseProperties: [HousePropertyInput!]
  capitalGains: CapitalGainsInput
  business: BusinessIncomeInput
  otherSources: OtherSourcesInput
  deductions: DeductionInputsInput!
  taxesPaid: Float!       # TDS + advance tax
}
```

### SalaryIncomeInput
```graphql
input SalaryIncomeInput {
  grossSalary: Float!                    # Salary before exemptions
  basicPlusDA: Float!                    # Base for HRA, NPS caps
  hraReceived: Float!                    # HRA component
  rentPaid: Float!                       # Actual rent paid
  isMetroCity: Boolean!                  # True for metro cities
  employerNpsContribution: Float!        # 80CCD(2)
  professionalTax: Float!                # Art. 276 (max ₹2,500)
}
```

### RegimeComputationOutput
Complete computation for single regime.

```graphql
type RegimeComputation {
  regime: Regime!
  heads: HeadwiseIncome!                 # Income by head
  salaryExemptions: SalaryExemptions!
  grossTotalIncome: Float!
  deductionsAllowed: [DeductionDetail!]!
  totalDeductions: Float!
  totalIncome: Float!                    # After deductions
  normalIncome: Float!                   # Slab-rate income
  slabLines: [SlabLine!]!                # Slab tax breakdown
  taxOnNormalIncome: Float!
  specialRateTax: SpecialRateTax!        # CG tax details
  taxBeforeRebate: Float!
  rebate87A: Float!
  rebateMarginalRelief: Float!
  surcharge: Float!
  cess: Float!
  totalTaxLiability: Float!
  netPayable: Float!                     # +ve payable, -ve refund
  effectiveRatePct: Float!               # Percentage
  notes: [String!]!                      # Computation notes
}
```

### TaxComputationResultOutput
Comparison of both regimes.

```graphql
type TaxComputationResult {
  old: RegimeComputation!
  new: RegimeComputation!
  recommended: Regime!        # Best option
  savings: Float!             # Tax difference
  computedAt: String!         # ISO timestamp
}
```

## Error Handling

### Standard GraphQL Errors
```json
{
  "errors": [{
    "message": "Validation error: age: Number must be greater than or equal to 18",
    "extensions": {
      "code": "GRAPHQL_VALIDATION_FAILED",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  }]
}
```

### Common Errors

#### Validation Error (422)
```
Validation error: age: Number must be greater than or equal to 18
Validation error: salary.grossSalary: Number must be greater than or equal to 0
```

#### Query Too Complex (400)
```
Query too complex. Estimated cost: 6500, max allowed: 5000.
Please reduce the number of fields or depth of nested queries.
```

#### Invalid Input (400)
```
Failed to compute tax: ...error details...
```

### Error Recovery
1. Check validation errors for required fields
2. Reduce query complexity
3. Verify all amounts are non-negative
4. Ensure age is between 18-125
5. Contact support if issue persists

## Examples

### Complete Tax Filing Example
```graphql
query FileTaxReturn {
  getTaxComputation(profile: {
    name: "Rajesh Kumar"
    age: 42
    residentialStatus: resident
    
    salary: {
      grossSalary: 1800000
      basicPlusDA: 1200000
      hraReceived: 400000
      rentPaid: 360000
      isMetroCity: true
      employerNpsContribution: 100000
      professionalTax: 2500
    }
    
    houseProperties: [
      {
        use: self_occupied
        annualRent: 0
        municipalTaxes: 0
        homeLoanInterest: 180000
      }
    ]
    
    capitalGains: {
      stcg111A: 50000
      stcgOther: 0
      ltcg112A: 100000
      ltcgOther: 0
    }
    
    otherSources: {
      savingsInterest: 20000
      fdInterest: 30000
      dividends: 15000
      familyPension: 0
      other: 0
    }
    
    deductions: {
      section80C: 150000
      section80CCD1B: 50000
      section80D_selfFamily: 50000
      section80D_parents: 25000
      parentsAreSenior: true
      section80E: 0
      section80G: 25000
    }
    
    taxesPaid: 300000
  }) {
    old {
      totalIncome
      totalTaxLiability
      netPayable
      notes
    }
    new {
      totalIncome
      totalTaxLiability
      netPayable
      notes
    }
    recommended
    savings
  }
}
```

### Scenario Planning Example
```graphql
query PlanTaxYear {
  getScenarios(
    baseline: { ... }
    scenarios: [
      {
        name: "Max Deductions"
        description: "Maximize 80C and 80D investments"
        profileChanges: {
          ... # Profile with max deductions
        }
      }
      {
        name: "Realize Gains"
        description: "Book capital gains this year"
        profileChanges: {
          ... # Profile with capital gains
        }
      }
    ]
  ) {
    bestScenario {
      name
      computation { ... }
    }
    maxSavings
  }
}
```

### Generate Recommendations
```graphql
query GetOptimization {
  getRecommendations(
    profile: { ... }
    riskProfile: moderate
  ) {
    recommendations(first: 10) {
      id
      title
      estimatedSavings
      priority
      action
    }
    totalPotentialSavings
  }
}
```

## Performance Considerations

### Query Optimization
1. **Request only needed fields**: Use GraphQL field selection
2. **Avoid nested queries**: Request independent data separately
3. **Cache results**: Store computation results on client
4. **Batch operations**: Combine related queries
5. **Monitor complexity**: Check response extensions for cost

### Response Times
- Simple computation: ~50-100ms
- With recommendations: ~200-300ms
- With scenarios (3+): ~500-800ms
- Complex export: ~1000-2000ms

### Scalability
- Current implementation: ~1000 QPS per instance
- Caching layer: Recommended for repeated profiles
- Database optimization: Index on userId, timestamp
- Background processing: Defer exports to job queue

### Monitoring
Response extensions include performance metadata:

```json
{
  "extensions": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req-1234567890",
    "duration_ms": 152
  }
}
```

### Best Practices
1. Use query fragments for repeated selections
2. Implement client-side caching (Apollo Client, SWR)
3. Monitor query costs in production
4. Set request timeouts (10-15 seconds)
5. Implement exponential backoff for retries
6. Log all errors for debugging
7. Use connection pooling for database

## Support & Troubleshooting

### Common Issues

**Q: Getting "Query too complex" error**
A: Reduce the number of fields requested or split into multiple queries.

**Q: Negative tax computation**
A: This indicates a refund is due. Check `netPayable` field (negative = refund).

**Q: Different results each time**
A: Ensure consistent input data. Verify all amounts in rupees.

**Q: High response times**
A: Check query complexity. Avoid scenario comparisons with >5 scenarios.

### Rate Limits
Current limits (subject to change):
- **Requests**: 60 per minute (by user/IP)
- **Query cost**: 5000 per request
- **Monthly**: 100,000 queries

Exceeding limits returns HTTP 429 (Too Many Requests).

## API Versioning

Current version: **1.0.0**

The API follows semantic versioning:
- **Major**: Breaking changes (rare)
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

Check `/api/graphql` endpoint `health` query for current version.

## Roadmap

### Upcoming Features
- [ ] Subscription support for real-time updates
- [ ] Batch computation for multiple profiles
- [ ] Historical comparison and trend analysis
- [ ] Integration with e-filing platforms
- [ ] Advanced portfolio analytics
- [ ] Multi-profile family planning
- [ ] Mobile app support with offline mode
