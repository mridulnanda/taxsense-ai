# TaxSense AI GraphQL API Quick Reference

Fast lookup guide for all GraphQL operations.

## Queries

### getTaxComputation
Compute tax liability for both old and new regimes.

```graphql
query GetTaxComputation($profile: TaxProfileInput!) {
  getTaxComputation(profile: $profile) {
    old {
      regime
      heads { salary houseProperty capitalGains business otherSources }
      grossTotalIncome
      totalIncome
      normalIncome
      taxOnNormalIncome
      specialRateTax { stcg111A ltcg112A ltcgOther }
      taxBeforeRebate
      rebate87A
      surcharge
      cess
      totalTaxLiability
      netPayable
      effectiveRatePct
      notes
    }
    new { /* same as old */ }
    recommended
    savings
    computedAt
  }
}
```

**Variables:**
```json
{
  "profile": {
    "name": "string (optional)",
    "age": 35,
    "residentialStatus": "resident",
    "salary": {
      "grossSalary": 1500000,
      "basicPlusDA": 1000000,
      "hraReceived": 300000,
      "rentPaid": 300000,
      "isMetroCity": true,
      "employerNpsContribution": 50000,
      "professionalTax": 2500
    },
    "houseProperties": [
      {
        "use": "self-occupied",
        "annualRent": 0,
        "municipalTaxes": 0,
        "homeLoanInterest": 150000
      }
    ],
    "capitalGains": {
      "stcg111A": 50000,
      "stcgOther": 0,
      "ltcg112A": 100000,
      "ltcgOther": 0
    },
    "business": {
      "netIncome": 500000,
      "presumptive": false
    },
    "otherSources": {
      "savingsInterest": 10000,
      "fdInterest": 20000,
      "dividends": 15000,
      "familyPension": 0,
      "other": 5000
    },
    "deductions": {
      "section80C": 150000,
      "section80CCD1B": 50000,
      "section80D_selfFamily": 25000,
      "section80D_parents": 0,
      "parentsAreSenior": false,
      "section80E": 0,
      "section80G": 10000
    },
    "taxesPaid": 50000
  }
}
```

**Response Time:** 50-100ms

---

### getRegimeComparison
Compare old and new regime side-by-side.

```graphql
query GetRegimeComparison($profile: TaxProfileInput!) {
  getRegimeComparison(profile: $profile) {
    old { totalTaxLiability effectiveRatePct }
    new { totalTaxLiability effectiveRatePct }
    recommended
    savings
  }
}
```

**Response Time:** 50-100ms

---

### getRecommendations
Get AI-powered tax optimization recommendations.

```graphql
query GetRecommendations(
  $profile: TaxProfileInput!
  $riskProfile: RiskProfile
) {
  getRecommendations(
    profile: $profile
    riskProfile: $riskProfile
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
      prerequisites
    }
    totalPotentialSavings
    currentLiability
    optimizedLiability
    riskProfile
  }
}
```

**Variables:**
```json
{
  "profile": { /* same as getTaxComputation */ },
  "riskProfile": "conservative | moderate | aggressive"
}
```

**Response Time:** 200-300ms

---

### getScenarios
Compare multiple what-if scenarios.

```graphql
query GetScenarios(
  $baseline: TaxProfileInput!
  $scenarios: [ScenarioInput!]!
) {
  getScenarios(baseline: $baseline, scenarios: $scenarios) {
    baseline {
      id
      name
      computation {
        old { totalTaxLiability }
        new { totalTaxLiability }
        recommended
        savings
      }
    }
    scenarios {
      id
      name
      description
      computation { /* same as baseline */ }
    }
    bestScenario { /* same structure */ }
    maxSavings
  }
}
```

**Variables:**
```json
{
  "baseline": { /* TaxProfileInput */ },
  "scenarios": [
    {
      "name": "Increased 80C",
      "description": "Invest ₹50k more in ELSS",
      "profileChanges": { /* TaxProfileInput */ }
    }
  ]
}
```

**Response Time:** 500-800ms (3+ scenarios)

---

### getAnalytics
Advanced tax analytics and insights.

```graphql
query GetAnalytics($computation: TaxComputationResult!) {
  getAnalytics(computation: $computation) {
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
      surcharge
      cess
      effectiveRatePct
      netPayable
    }
  }
}
```

**Response Time:** 50ms

---

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

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

**Response Time:** <10ms

---

## Mutations

### computeTax
Compute and save tax result.

```graphql
mutation ComputeTax($profile: TaxProfileInput!) {
  computeTax(profile: $profile) {
    success
    computation {
      old { totalTaxLiability }
      new { totalTaxLiability }
      recommended
      savings
    }
    error
  }
}
```

**Response Time:** 100-150ms

---

### createScenario
Create and save a scenario.

```graphql
mutation CreateScenario(
  $baseline: TaxProfileInput!
  $scenario: ScenarioInput!
) {
  createScenario(baseline: $baseline, scenario: $scenario) {
    id
    name
    description
    computation {
      old { totalTaxLiability }
      new { totalTaxLiability }
      recommended
      savings
    }
  }
}
```

**Response Time:** 100-150ms

---

### updateProfile
Save user's tax profile.

```graphql
mutation UpdateProfile(
  $userId: String!
  $profile: TaxProfileInput!
) {
  updateProfile(userId: $userId, profile: $profile) {
    success
    profile
    error
  }
}
```

**Response Time:** 50-100ms

---

### exportReport
Export tax report in multiple formats.

```graphql
mutation ExportReport(
  $computation: TaxComputationResult!
  $format: ExportFormat!
) {
  exportReport(computation: $computation, format: $format) {
    success
    filename
    url
    format
    error
  }
}
```

**Variables:**
```json
{
  "computation": { /* TaxComputationResult */ },
  "format": "PDF | JSON | CSV"
}
```

**Response Time:** 500-2000ms

---

### saveComparison
Save scenario comparison for later analysis.

```graphql
mutation SaveComparison(
  $baseline: TaxProfileInput!
  $scenarios: [ScenarioInput!]!
  $name: String!
) {
  saveComparison(
    baseline: $baseline
    scenarios: $scenarios
    name: $name
  ) {
    success
    comparisonId
    error
  }
}
```

**Response Time:** 100-150ms

---

## Subscriptions

### computationProgress
Real-time updates during computation.

```graphql
subscription OnComputationProgress($computationId: String!) {
  computationProgress(computationId: $computationId) {
    computationId
    stage
    progress
    message
    completed
  }
}
```

**Stages:**
- `parsing` - Validating input
- `computation` - Computing tax
- `analysis` - Generating insights
- `recommendations` - Creating recommendations
- `export` - Preparing output

---

## Type Definitions

### Enums

```graphql
enum Regime { old, new }
enum ResidentialStatus { resident, nri }
enum HousePropertyUse { self_occupied, let_out }
enum RecommendationCategory { deduction, investment, planning, structure, regime }
enum Priority { critical, high, medium, low }
enum Difficulty { easy, medium, hard }
enum Timeline { immediate, before_mar_31, next_fy }
enum RiskLevel { none, low, medium, high }
enum RiskProfile { conservative, moderate, aggressive }
enum ExportFormat { PDF, JSON, CSV }
```

---

## Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| Validation error | Invalid input | Check field types and ranges |
| Query too complex | Cost > 5000 | Reduce query depth or split queries |
| Missing field | Required field absent | Add all required input fields |
| Invalid enum | Wrong enum value | Use allowed enum values |
| Negative amount | Amount < 0 | All amounts must be >= 0 |
| Age out of range | Age < 18 or > 125 | Age must be 18-125 |

---

## Common Patterns

### Minimal Query (Salary Only)
```graphql
query {
  getTaxComputation(profile: {
    age: 35
    residentialStatus: resident
    salary: {
      grossSalary: 1500000
      basicPlusDA: 1000000
      hraReceived: 300000
      rentPaid: 300000
      isMetroCity: true
      employerNpsContribution: 50000
      professionalTax: 0
    }
    deductions: {
      section80C: 0
      section80CCD1B: 0
      section80D_selfFamily: 0
      section80D_parents: 0
      parentsAreSenior: false
      section80E: 0
      section80G: 0
    }
    taxesPaid: 0
    houseProperties: []
  }) {
    new { totalTaxLiability }
  }
}
```

### Complete Profile Query
See GRAPHQL.md for full example.

### Batch Multiple Queries
```graphql
query {
  computation: getTaxComputation(profile: {...}) {
    old { totalTaxLiability }
    new { totalTaxLiability }
  }
  recommendations: getRecommendations(profile: {...}) {
    recommendations { id title estimatedSavings }
    totalPotentialSavings
  }
  analytics: getAnalytics(computation: {...}) {
    effectiveTaxRate
    metrics { taxLiability }
  }
}
```

---

## Rate Limits

| Resource | Limit | Window |
|----------|-------|--------|
| Requests | 60 | Per minute |
| Query Cost | 5000 | Per query |
| Monthly | 100,000 | Per month |

---

## Response Format

All responses include metadata:

```json
{
  "data": { /* query result */ },
  "extensions": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req-123456789",
    "duration_ms": 152
  }
}
```

---

## Authentication

Include Bearer token in headers:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.taxsense.ai/graphql
```

---

## Endpoint

```
POST https://api.taxsense.ai/graphql
GET https://api.taxsense.ai/graphql (Playground - dev only)
```

---

## More Information

- See [GRAPHQL.md](GRAPHQL.md) for complete documentation
- See [GRAPHQL_INTEGRATION.md](GRAPHQL_INTEGRATION.md) for client setup
- See [README.md](../src/lib/graphql/README.md) for implementation details
