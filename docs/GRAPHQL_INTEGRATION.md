# GraphQL Integration Guide for TaxSense AI

This guide helps frontend developers integrate the GraphQL API into their applications.

## Table of Contents
- [Setup](#setup)
- [Client Configuration](#client-configuration)
- [Usage Patterns](#usage-patterns)
- [Error Handling](#error-handling)
- [Caching Strategy](#caching-strategy)
- [Testing](#testing)
- [Migration Guide](#migration-guide)

## Setup

### 1. Install Dependencies

```bash
# Apollo Client (recommended)
npm install @apollo/client graphql

# Or: urql (lightweight alternative)
npm install urql graphql

# Or: graphql-request (simple client)
npm install graphql-request
```

### 2. Environment Configuration

Create `.env.local`:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3000/api/graphql
NEXT_PUBLIC_API_VERSION=1.0.0
```

For production:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.taxsense.ai/graphql
NEXT_PUBLIC_API_VERSION=1.0.0
```

## Client Configuration

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    credentials: 'include', // For cookies
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getTaxComputation: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});

// Wrap app with provider
export default function App({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
```

### GraphQL Request Setup (Simpler Alternative)

```typescript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/api/graphql',
  {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  }
);

export default client;
```

### URQL Setup

```typescript
import { createClient } from 'urql';

const client = createClient({
  url: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  },
});
```

## Usage Patterns

### 1. Query - Tax Computation (Apollo Client)

```typescript
import { gql, useQuery } from '@apollo/client';
import type { TaxProfileInput } from '@/lib/graphql/types';

const GET_TAX_COMPUTATION = gql`
  query GetTaxComputation($profile: TaxProfileInput!) {
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
`;

export function TaxComputationComponent() {
  const profile: TaxProfileInput = {
    age: 35,
    residentialStatus: 'resident',
    deductions: { /* ... */ },
    houseProperties: [],
    taxesPaid: 0,
  };

  const { data, loading, error } = useQuery(GET_TAX_COMPUTATION, {
    variables: { profile },
    skip: !profile, // Skip if profile not ready
  });

  if (loading) return <p>Computing tax...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Tax Computation Result</h2>
      <p>Old Regime: ₹{data.getTaxComputation.old.totalTaxLiability}</p>
      <p>New Regime: ₹{data.getTaxComputation.new.totalTaxLiability}</p>
      <p>Recommended: {data.getTaxComputation.recommended}</p>
      <p>Savings: ₹{data.getTaxComputation.savings}</p>
    </div>
  );
}
```

### 2. Query - Tax Computation (GraphQL Request)

```typescript
import { graphql } from 'graphql-request';

const getTaxComputation = graphql`
  query GetTaxComputation($profile: TaxProfileInput!) {
    getTaxComputation(profile: $profile) {
      old { totalTaxLiability }
      new { totalTaxLiability }
      recommended
      savings
    }
  }
`;

async function computeTax(profile: TaxProfileInput) {
  const result = await client.request(getTaxComputation, { profile });
  return result;
}
```

### 3. Mutation - Compute Tax (Apollo Client)

```typescript
import { gql, useMutation } from '@apollo/client';

const COMPUTE_TAX = gql`
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
`;

export function ComputeButton() {
  const [computeTax, { loading }] = useMutation(COMPUTE_TAX);

  const handleCompute = async () => {
    try {
      const result = await computeTax({
        variables: { profile },
        refetchQueries: ['GetUserProfile'], // Refresh related queries
      });
      console.log('Computation successful:', result.data);
    } catch (error) {
      console.error('Computation failed:', error);
    }
  };

  return <button onClick={handleCompute} disabled={loading}>Compute</button>;
}
```

### 4. Query - Scenarios (Complex Example)

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_SCENARIOS = gql`
  query GetScenarios($baseline: TaxProfileInput!, $scenarios: [ScenarioInput!]!) {
    getScenarios(baseline: $baseline, scenarios: $scenarios) {
      baseline {
        name
        computation {
          new { totalTaxLiability }
        }
      }
      scenarios {
        id
        name
        computation {
          new { totalTaxLiability }
        }
      }
      bestScenario {
        name
        computation {
          new { totalTaxLiability }
        }
      }
      maxSavings
    }
  }
`;

export function ScenarioComparison() {
  const [scenarios, setScenarios] = useState<ScenarioInput[]>([]);

  const { data, loading } = useQuery(GET_SCENARIOS, {
    variables: {
      baseline: currentProfile,
      scenarios,
    },
    skip: scenarios.length === 0,
  });

  if (!data) return null;

  return (
    <div>
      <h3>Best Scenario: {data.getScenarios.bestScenario.name}</h3>
      <p>Max Savings: ₹{data.getScenarios.maxSavings}</p>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Tax Liability</th>
          </tr>
        </thead>
        <tbody>
          {data.getScenarios.scenarios.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>₹{s.computation.new.totalTaxLiability}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. React Hook for Composition

```typescript
import { useQuery, gql } from '@apollo/client';

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($profile: TaxProfileInput!, $riskProfile: RiskProfile) {
    getRecommendations(profile: $profile, riskProfile: $riskProfile) {
      recommendations {
        id
        title
        estimatedSavings
        priority
      }
      totalPotentialSavings
    }
  }
`;

export function useRecommendations(profile: TaxProfileInput, risk = 'moderate') {
  const { data, loading, error, refetch } = useQuery(GET_RECOMMENDATIONS, {
    variables: { profile, riskProfile: risk },
  });

  return {
    recommendations: data?.getRecommendations.recommendations || [],
    totalSavings: data?.getRecommendations.totalPotentialSavings || 0,
    loading,
    error,
    refetch,
  };
}

// Usage
function MyComponent() {
  const { recommendations, totalSavings } = useRecommendations(profile);
  // ...
}
```

## Error Handling

### Global Error Handler

```typescript
import { ApolloClient, ApolloLink, concat } from '@apollo/client';

const errorLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    if (response.errors) {
      response.errors.forEach(error => {
        if (error.message.includes('Query too complex')) {
          console.error('Query complexity exceeded');
          // Show user-friendly message
        } else if (error.message.includes('Validation error')) {
          console.error('Validation failed:', error.message);
          // Handle validation errors
        }
      });
    }
    return response;
  });
});

const client = new ApolloClient({
  link: concat(errorLink, httpLink),
  cache,
});
```

### Component-Level Error Handling

```typescript
function TaxForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (profile: TaxProfileInput) => {
    try {
      const result = await client.mutate({
        mutation: COMPUTE_TAX,
        variables: { profile },
      });

      if (!result.data.computeTax.success) {
        setErrors({ general: result.data.computeTax.error });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('age')) {
          setErrors({ age: 'Invalid age (must be 18-125)' });
        } else if (error.message.includes('negative')) {
          setErrors({ general: 'All amounts must be non-negative' });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {errors.general && <div className="error">{errors.general}</div>}
    </form>
  );
}
```

## Caching Strategy

### Query Caching Configuration

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Cache by profile (using input as cache key)
        getTaxComputation: {
          keyArgs: ['profile'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        getRecommendations: {
          keyArgs: ['profile', 'riskProfile'],
        },
        // Cache indefinitely (manual invalidation)
        health: {
          read(value) {
            return value;
          },
        },
      },
    },
  },
});
```

### Manual Cache Management

```typescript
function useComputeTax() {
  const client = useApolloClient();

  const computeTax = async (profile: TaxProfileInput) => {
    const result = await client.mutate({
      mutation: COMPUTE_TAX,
      variables: { profile },
      refetchQueries: [
        { query: GET_TAX_COMPUTATION, variables: { profile } },
        { query: GET_RECOMMENDATIONS, variables: { profile } },
      ],
      awaitRefetchQueries: true,
    });

    return result;
  };

  return computeTax;
}
```

### Cache Invalidation

```typescript
// Clear entire cache
client.cache.reset();

// Clear specific query
client.cache.evict({ fieldName: 'getTaxComputation' });

// Refetch query
client.refetchQueries({ include: ['GetTaxComputation'] });
```

## Testing

### Unit Tests with Apollo Client

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

const mocks = [
  {
    request: {
      query: GET_TAX_COMPUTATION,
      variables: {
        profile: { age: 35, residentialStatus: 'resident', ... },
      },
    },
    result: {
      data: {
        getTaxComputation: {
          old: { totalTaxLiability: 285000 },
          new: { totalTaxLiability: 250000 },
          recommended: 'new',
          savings: 35000,
        },
      },
    },
  },
];

it('should compute tax', async () => {
  render(
    <MockedProvider mocks={mocks}>
      <TaxComputationComponent />
    </MockedProvider>
  );

  await waitFor(() => {
    expect(screen.getByText(/250000/)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { graphql } from 'graphql-request';

describe('Tax Computation API', () => {
  it('should compute tax for valid profile', async () => {
    const query = graphql`
      query {
        getTaxComputation(profile: {...}) {
          new { totalTaxLiability }
        }
      }
    `;

    const result = await client.request(query);
    expect(result.getTaxComputation.new.totalTaxLiability).toBeGreaterThan(0);
  });
});
```

## Migration Guide

### From REST API to GraphQL

**Before (REST):**
```typescript
const res = await fetch('/api/compute', {
  method: 'POST',
  body: JSON.stringify({ profile }),
});
const computation = await res.json();
```

**After (GraphQL):**
```typescript
const { data } = await client.query({
  query: GET_TAX_COMPUTATION,
  variables: { profile },
});
const computation = data.getTaxComputation;
```

### Query Modernization

**Before (Multiple REST calls):**
```typescript
const computation = await fetch('/api/compute').then(r => r.json());
const recommendations = await fetch('/api/recommendations').then(r => r.json());
const analytics = await fetch('/api/analytics').then(r => r.json());
```

**After (Single GraphQL query):**
```typescript
const { data } = await client.query({
  query: gql`
    query {
      getTaxComputation(profile: $profile) { ... }
      getRecommendations(profile: $profile) { ... }
      getAnalytics(computation: $computation) { ... }
    }
  `,
});
```

### Component Update Example

**Before:**
```typescript
function TaxReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/compute?age=${age}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [age]);

  return loading ? <Spinner /> : <Report data={data} />;
}
```

**After:**
```typescript
function TaxReport() {
  const { data, loading } = useQuery(GET_TAX_COMPUTATION, {
    variables: { profile },
  });

  return loading ? <Spinner /> : <Report data={data?.getTaxComputation} />;
}
```

## Best Practices

1. **Use Fragments for Reusable Selections**
   ```graphql
   fragment TaxDetails on RegimeComputation {
     totalTaxLiability
     effectiveRatePct
     netPayable
   }
   
   query {
     getTaxComputation(profile: $profile) {
       old { ...TaxDetails }
       new { ...TaxDetails }
     }
   }
   ```

2. **Optimize Query Depth**
   - Avoid unnecessary nested selections
   - Use separate queries for independent data

3. **Implement Loading States**
   - Show skeleton loaders during queries
   - Display error messages clearly
   - Handle refetching with optimism

4. **Cache Strategically**
   - Cache stable data (profiles)
   - Invalidate on mutations
   - Use persistent cache (localStorage) for offline support

5. **Monitor Performance**
   - Track query execution time
   - Monitor cache hit rates
   - Alert on query complexity warnings

6. **Security**
   - Never expose auth tokens in client code
   - Use httpOnly cookies for tokens
   - Validate all inputs before sending
   - Rate limit requests on client side

7. **Error Recovery**
   - Implement exponential backoff for retries
   - Provide clear error messages to users
   - Log errors for debugging
   - Offer alternative actions when queries fail
