# TaxSense AI GraphQL API

Production-ready GraphQL API layer for tax computation, optimization, and analysis.

## Overview

This module provides a complete GraphQL interface to the TaxSense AI tax engine, enabling:

- **Tax Computation**: Calculate tax for both old and new regimes
- **Regime Comparison**: Get recommendations on which regime to choose
- **Tax Optimization**: AI-powered recommendations for tax savings
- **Scenario Planning**: Compare multiple what-if scenarios
- **Analytics**: Advanced insights and breakdowns
- **Report Generation**: Export in PDF, JSON, CSV formats

## Architecture

```
┌─────────────────────────────────────────┐
│   Frontend (React/Next.js)              │
├─────────────────────────────────────────┤
│   GraphQL API (graphql-yoga)            │
│   /api/graphql                          │
├─────────────────────────────────────────┤
│   Resolvers                             │
│   ├─ Query: getTaxComputation           │
│   ├─ Query: getRecommendations          │
│   ├─ Query: getScenarios                │
│   ├─ Query: getAnalytics                │
│   ├─ Mutation: computeTax               │
│   ├─ Mutation: createScenario           │
│   └─ Mutation: exportReport             │
├─────────────────────────────────────────┤
│   Tax Engine                            │
│   ├─ computeBoth()                      │
│   ├─ hraExemption()                     │
│   ├─ slabTax()                          │
│   └─ computeSurcharge()                 │
├─────────────────────────────────────────┤
│   Optimizer                             │
│   ├─ generateRecommendations()          │
│   └─ ScenarioPlanner                    │
└─────────────────────────────────────────┘
```

## File Structure

```
src/lib/graphql/
├── schema.ts         # GraphQL type definitions and schema
├── types.ts          # TypeScript type definitions
├── resolvers.ts      # Query and mutation resolvers
├── index.ts          # Central export point
└── README.md         # This file

src/app/api/graphql/
└── route.ts          # Next.js API route handler

tests/
└── graphql.test.ts   # Comprehensive test suite (40+ tests)

docs/
├── GRAPHQL.md              # Complete API documentation
├── GRAPHQL_INTEGRATION.md  # Frontend integration guide
└── README.md               # Project overview
```

## Quick Start

### 1. Installation

```bash
npm install
```

This installs graphql-yoga and other required dependencies.

### 2. Start Development Server

```bash
npm run dev
```

GraphQL API available at: `http://localhost:3000/api/graphql`

### 3. Access GraphQL Playground

Open GraphQL Playground in your browser:
```
http://localhost:3000/api/graphql
```

### 4. Simple Query

```graphql
query {
  getTaxComputation(profile: {
    age: 35
    residentialStatus: resident
    deductions: {
      section80C: 150000
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
    old { totalTaxLiability }
    new { totalTaxLiability }
    recommended
    savings
  }
}
```

## API Features

### Queries

| Query | Purpose | Complexity |
|-------|---------|-----------|
| `getTaxComputation` | Compute tax for both regimes | 100 |
| `getRegimeComparison` | Compare old vs new regime | 100 |
| `getRecommendations` | AI optimization recommendations | 150 |
| `getScenarios` | Compare multiple scenarios | 300+ |
| `getAnalytics` | Advanced tax insights | 50 |
| `health` | Health check endpoint | 10 |

### Mutations

| Mutation | Purpose | Complexity |
|----------|---------|-----------|
| `computeTax` | Compute and save tax | 100 |
| `createScenario` | Create named scenario | 100 |
| `updateProfile` | Save user profile | 50 |
| `exportReport` | Export in PDF/JSON/CSV | 150 |
| `saveComparison` | Save scenario comparison | 100 |

### Subscriptions

| Subscription | Purpose |
|--------------|---------|
| `computationProgress` | Real-time computation updates |

## Validation

All inputs are validated using Zod schemas:

```typescript
// Age must be 18-125
// All amounts must be non-negative
// Required fields must be present
// Enum values must match defined options
```

### Error Examples

```json
{
  "errors": [{
    "message": "Validation error: age: Number must be greater than or equal to 18"
  }]
}
```

## Query Complexity Analysis

The API implements query complexity analysis to prevent abuse:

- **Max Depth**: 10 levels
- **Max Cost**: 5000 per query
- **Expensive Operations**: getScenarios, getRecommendations, exportReport

When exceeded:
```json
{
  "errors": [{
    "message": "Query too complex. Estimated cost: 6500, max allowed: 5000."
  }]
}
```

## Performance

Typical response times:

| Operation | Time |
|-----------|------|
| Simple computation | 50-100ms |
| With recommendations | 200-300ms |
| With scenarios (3+) | 500-800ms |
| Complex export | 1000-2000ms |

## Error Handling

Built-in error handling for:

- **Validation errors**: Invalid input data
- **Computation errors**: Tax engine failures
- **Complexity errors**: Query too expensive
- **Missing data**: Required fields absent
- **Type errors**: Incorrect field types

## Authentication

Currently accepts Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/graphql
```

For production, implement JWT verification (RS256/HS256).

## Testing

Run comprehensive test suite:

```bash
npm test
```

Test coverage includes:

- ✅ Query tests (getTaxComputation, getRecommendations, etc.)
- ✅ Mutation tests (computeTax, createScenario, etc.)
- ✅ Error handling and validation
- ✅ Complex scenarios with multiple income heads
- ✅ Edge cases (NRI, seniors, capital gains, etc.)
- ✅ 40+ test cases total

Run tests in watch mode:

```bash
npm run test:watch
```

## Integration

### Apollo Client
```typescript
import { getTaxComputation } from '@/lib/graphql';

const { data } = useQuery(GET_TAX_COMPUTATION, {
  variables: { profile },
});
```

### GraphQL Request
```typescript
const result = await client.request(getTaxComputation, { profile });
```

See [GRAPHQL_INTEGRATION.md](../../docs/GRAPHQL_INTEGRATION.md) for detailed frontend integration examples.

## Documentation

- **[GRAPHQL.md](../../docs/GRAPHQL.md)** - Complete API reference
- **[GRAPHQL_INTEGRATION.md](../../docs/GRAPHQL_INTEGRATION.md)** - Frontend integration guide

## Roadmap

### Phase 1 (Current)
- ✅ Core GraphQL API
- ✅ Tax computation queries
- ✅ Optimization recommendations
- ✅ Scenario planning
- ✅ Analytics and insights

### Phase 2
- [ ] Subscription support (real-time updates)
- [ ] Batch computation
- [ ] User profile management
- [ ] Report caching
- [ ] Advanced filtering

### Phase 3
- [ ] E-filing integration
- [ ] Historical analysis
- [ ] Portfolio analytics
- [ ] Family planning
- [ ] Offline support

## Security Considerations

1. **Input Validation**: All inputs validated with Zod
2. **Query Complexity**: Limited to prevent DoS
3. **Authentication**: Bearer token support (JWT in production)
4. **CORS**: Configured for secure cross-origin access
5. **Error Masking**: Detailed errors in dev, masked in production
6. **Rate Limiting**: Implementable at API gateway level

## Production Deployment

### Environment Variables
```bash
NODE_ENV=production
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.taxsense.ai/graphql
GRAPHQL_MAX_DEPTH=10
GRAPHQL_MAX_COST=5000
```

### Performance Tips
1. Enable Redis caching for repeated profiles
2. Use connection pooling for database
3. Implement rate limiting at API gateway
4. Enable gzip compression
5. Monitor query complexity
6. Set up APM monitoring (Datadog, New Relic)

### Monitoring
```typescript
// Response includes timing metadata
{
  "extensions": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req-123456789",
    "duration_ms": 152
  }
}
```

## Support

For issues, questions, or contributions:

1. Check [GRAPHQL.md](../../docs/GRAPHQL.md) for API documentation
2. Review test cases in `graphql.test.ts` for usage examples
3. See [GRAPHQL_INTEGRATION.md](../../docs/GRAPHQL_INTEGRATION.md) for integration help

## License

Proprietary - TaxSense AI
