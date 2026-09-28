# GraphQL Queries and Mutations Reference

This document contains all GraphQL queries and mutations used in TaxSense AI mobile app.

## Authentication Queries

### Get Current User
```graphql
query GetCurrentUser {
  me {
    id
    email
    phone
    firstName
    lastName
    panNumber
    aadharNumber
    residentialAddress {
      street
      city
      state
      pincode
      country
    }
    occupationType
    financialYear
    createdAt
    updatedAt
  }
}
```

### Get User Profile
```graphql
query GetUserProfile($id: ID!) {
  user(id: $id) {
    id
    email
    firstName
    lastName
    panNumber
    occupationType
  }
}
```

## User Mutations

### Update User Profile
```graphql
mutation UpdateUserProfile($input: UpdateUserInput!) {
  updateUser(input: $input) {
    id
    firstName
    lastName
    panNumber
    occupationType
  }
}
```

### Update User Address
```graphql
mutation UpdateUserAddress($input: AddressInput!) {
  updateAddress(input: $input) {
    id
    street
    city
    state
    pincode
    country
  }
}
```

## Scenario Queries

### Get All Scenarios
```graphql
query GetScenarios($userId: ID!, $financialYear: String) {
  scenarios(
    userId: $userId
    financialYear: $financialYear
  ) {
    id
    name
    description
    financialYear
    status
    savings
    createdAt
    updatedAt
  }
}
```

### Get Scenario Details
```graphql
query GetScenarioDetail($id: ID!) {
  scenario(id: $id) {
    id
    name
    description
    financialYear
    status
    incomeEntries {
      id
      type
      description
      amount
      source
    }
    deductionEntries {
      id
      section
      description
      amount
      category
    }
    taxComputation {
      totalIncome
      totalDeductions
      taxableIncome
      taxAmount
      surcharge
      cess
      totalTaxPayable
      effectiveTaxRate
      regime
    }
  }
}
```

### Compare Scenarios
```graphql
query CompareScenarios($ids: [ID!]!) {
  scenariosComparison(ids: $ids) {
    id
    name
    totalIncome
    totalDeductions
    taxableIncome
    taxAmount
    totalTaxPayable
    regime
  }
}
```

## Scenario Mutations

### Create Scenario
```graphql
mutation CreateScenario($input: CreateScenarioInput!) {
  createScenario(input: $input) {
    id
    name
    description
    financialYear
    status
  }
}
```

### Variables
```json
{
  "input": {
    "userId": "user-123",
    "name": "FY 2024-25 Planning",
    "description": "Tax planning for financial year 2024-25",
    "financialYear": "2024-25"
  }
}
```

### Update Scenario
```graphql
mutation UpdateScenario($id: ID!, $input: UpdateScenarioInput!) {
  updateScenario(id: $id, input: $input) {
    id
    name
    description
    status
  }
}
```

### Delete Scenario
```graphql
mutation DeleteScenario($id: ID!) {
  deleteScenario(id: $id) {
    success
    message
  }
}
```

## Income Queries

### Get Income Entries
```graphql
query GetIncomeEntries($userId: ID!, $financialYear: String!) {
  incomeEntries(
    userId: $userId
    financialYear: $financialYear
  ) {
    id
    type
    description
    amount
    source
    createdAt
  }
}
```

### Get Income Entry Details
```graphql
query GetIncomeEntry($id: ID!) {
  incomeEntry(id: $id) {
    id
    type
    description
    amount
    source
    supportingDocuments {
      id
      fileName
      fileSize
      type
    }
    createdAt
    updatedAt
  }
}
```

## Income Mutations

### Add Income Entry
```graphql
mutation AddIncomeEntry($input: IncomeEntryInput!) {
  createIncomeEntry(input: $input) {
    id
    type
    description
    amount
    source
  }
}
```

### Variables
```json
{
  "input": {
    "userId": "user-123",
    "type": "SALARY",
    "description": "Monthly salary",
    "amount": 1000000,
    "financialYear": "2024-25",
    "source": "Employer"
  }
}
```

### Update Income Entry
```graphql
mutation UpdateIncomeEntry($id: ID!, $input: IncomeEntryInput!) {
  updateIncomeEntry(id: $id, input: $input) {
    id
    type
    amount
  }
}
```

### Delete Income Entry
```graphql
mutation DeleteIncomeEntry($id: ID!) {
  deleteIncomeEntry(id: $id) {
    success
  }
}
```

## Deduction Queries

### Get Deduction Entries
```graphql
query GetDeductionEntries($userId: ID!, $financialYear: String!) {
  deductionEntries(
    userId: $userId
    financialYear: $financialYear
  ) {
    id
    section
    description
    amount
    category
    createdAt
  }
}
```

### Get Deduction Entry Details
```graphql
query GetDeductionEntry($id: ID!) {
  deductionEntry(id: $id) {
    id
    section
    description
    amount
    category
    supportingDocuments {
      id
      fileName
      type
    }
  }
}
```

## Deduction Mutations

### Add Deduction Entry
```graphql
mutation AddDeductionEntry($input: DeductionEntryInput!) {
  createDeductionEntry(input: $input) {
    id
    section
    description
    amount
  }
}
```

### Variables
```json
{
  "input": {
    "userId": "user-123",
    "section": "SECTION_80C",
    "description": "Life Insurance Premium",
    "amount": 50000,
    "financialYear": "2024-25",
    "category": "Insurance"
  }
}
```

### Update Deduction Entry
```graphql
mutation UpdateDeductionEntry($id: ID!, $input: DeductionEntryInput!) {
  updateDeductionEntry(id: $id, input: $input) {
    id
    section
    amount
  }
}
```

### Delete Deduction Entry
```graphql
mutation DeleteDeductionEntry($id: ID!) {
  deleteDeductionEntry(id: $id) {
    success
  }
}
```

## Tax Computation

### Compute Tax
```graphql
mutation ComputeTax($input: TaxComputationInput!) {
  computeTax(input: $input) {
    id
    totalIncome
    totalDeductions
    taxableIncome
    taxAmount
    surcharge
    cess
    totalTaxPayable
    effectiveTaxRate
    regime
  }
}
```

### Variables
```json
{
  "input": {
    "userId": "user-123",
    "totalIncome": 1500000,
    "totalDeductions": 200000,
    "regime": "NEW",
    "financialYear": "2024-25"
  }
}
```

### Get Tax Computation History
```graphql
query GetTaxComputationHistory($userId: ID!, $financialYear: String!) {
  taxComputations(
    userId: $userId
    financialYear: $financialYear
  ) {
    id
    totalIncome
    totalDeductions
    taxableIncome
    taxAmount
    totalTaxPayable
    regime
    createdAt
  }
}
```

## Document Queries

### Get Documents
```graphql
query GetDocuments($userId: ID!, $type: DocumentType) {
  documents(userId: $userId, type: $type) {
    id
    type
    fileName
    fileSize
    uploadedAt
    scanStatus
  }
}
```

### Get Document
```graphql
query GetDocument($id: ID!) {
  document(id: $id) {
    id
    type
    fileName
    fileSize
    uploadedAt
    scanStatus
    extractedData
  }
}
```

## Document Mutations

### Upload Document
```graphql
mutation UploadDocument($file: Upload!, $type: DocumentType!) {
  uploadDocument(file: $file, type: $type) {
    id
    fileName
    type
    uploadedAt
  }
}
```

### Scan Document
```graphql
mutation ScanDocument($documentId: ID!) {
  scanDocument(documentId: $documentId) {
    id
    scanStatus
    extractedData
  }
}
```

### Delete Document
```graphql
mutation DeleteDocument($id: ID!) {
  deleteDocument(id: $id) {
    success
  }
}
```

## Analytics Queries

### Get Analytics Data
```graphql
query GetAnalytics($userId: ID!, $financialYear: String!) {
  analytics(userId: $userId, financialYear: $financialYear) {
    totalIncomeTrend {
      month
      value
      percentage
    }
    taxSavingsTrend {
      month
      value
    }
    deductionUtilization {
      section
      utilized
      available
      percentage
    }
    complianceScore
    optimizationPotential
  }
}
```

## Subscription Examples

### Subscribe to Tax Computation
```graphql
subscription OnTaxComputationUpdate($scenarioId: ID!) {
  taxComputationUpdated(scenarioId: $scenarioId) {
    id
    totalTaxPayable
    effectiveTaxRate
  }
}
```

## Pagination

### Paginated Query Example
```graphql
query GetScenariosPaginated(
  $userId: ID!
  $first: Int
  $after: String
) {
  scenarios(userId: $userId, first: $first, after: $after) {
    edges {
      node {
        id
        name
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Error Handling

All mutations return a response with potential errors:

```graphql
{
  data: {
    // Response data
  },
  errors: [
    {
      message: "Error message",
      extensions: {
        code: "VALIDATION_ERROR",
        field: "email"
      }
    }
  ]
}
```

## Rate Limiting

- **Query limit**: 100 requests per minute
- **Mutation limit**: 50 requests per minute
- **Subscription limit**: 10 concurrent connections

---

For the complete GraphQL schema, visit: https://api.taxsense.ai/graphql
