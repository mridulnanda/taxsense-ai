/**
 * TaxSense AI GraphQL API Route
 * Next.js API route for GraphQL endpoint using graphql-yoga
 * Includes CORS, query complexity analysis, and error handling
 */

import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from '@/lib/graphql/schema';
import { queryResolvers, mutationResolvers } from '@/lib/graphql/resolvers';
import type { GraphQLContext } from '@/lib/graphql/types';

// ============================================================================
// QUERY COMPLEXITY ANALYZER
// ============================================================================

interface ComplexityContext {
  depth: number;
  maxDepth: number;
  cost: number;
  maxCost: number;
}

const DEFAULT_COMPLEXITY_COST = 1;
const DEFAULT_FIELD_COST = 5;
const MAX_DEPTH = 10;
const MAX_COST = 5000; // Prevent expensive queries

function analyzeQueryComplexity(ast: any, context: ComplexityContext, parentType = ''): number {
  if (!ast || context.depth > context.maxDepth) {
    return context.cost;
  }

  if (ast.selections) {
    context.depth++;
    for (const selection of ast.selections) {
      if (selection.kind === 'Field') {
        // Estimate cost based on field name
        const fieldCost = isExpensiveField(selection.name.value) ? 50 : DEFAULT_FIELD_COST;
        context.cost += fieldCost;

        if (selection.selectionSet) {
          analyzeQueryComplexity(selection.selectionSet, context, selection.name.value);
        }
      }
    }
    context.depth--;
  }

  return context.cost;
}

function isExpensiveField(fieldName: string): boolean {
  const expensiveFields = ['getScenarios', 'getRecommendations', 'exportReport'];
  return expensiveFields.includes(fieldName);
}

// ============================================================================
// SCHEMA AND SERVER SETUP
// ============================================================================

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: queryResolvers,
    Mutation: mutationResolvers,
  },
});

const yoga = createYoga({
  schema,
  // Context factory
  context: async ({ request }: { request: Request }) => {
    const context: GraphQLContext = {
      isAuthenticated: false,
      requestId: `req-${Date.now()}-${Math.random()}`,
    };

    // Extract authentication if available
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // In production, verify JWT token
      context.isAuthenticated = true;
    }

    return context;
  },

  // Plugin for request logging and complexity analysis
  plugins: [
    {
      onRequest: async ({ request }: { request: Request }) => {
        const startTime = Date.now();
        const requestId = `req-${startTime}-${Math.random()}`;

        // Log request
        console.log({
          requestId,
          method: request.method,
          url: request.url,
          timestamp: new Date().toISOString(),
        });
      },

      onParse: async ({ request, document }: { request: Request; document: any }) => {
        // Analyze query complexity
        if (document.definitions[0]) {
          const definition = document.definitions[0] as any;
          if (definition.operation === 'query' || definition.operation === 'mutation') {
            const complexityContext: ComplexityContext = {
              depth: 0,
              maxDepth: MAX_DEPTH,
              cost: 0,
              maxCost: MAX_COST,
            };

            const cost = analyzeQueryComplexity(definition.selectionSet, complexityContext);

            if (cost > MAX_COST) {
              throw new Error(
                `Query too complex. Estimated cost: ${cost}, max allowed: ${MAX_COST}. ` +
                `Please reduce the number of fields or depth of nested queries.`
              );
            }
          }
        }
      },

      onResult: async ({ result, context, setResult }: { result: any; context: any; setResult: (r: any) => void }) => {
        // Add timing to response extensions
        const resultWithTiming = {
          ...result,
          extensions: {
            ...result.extensions,
            timestamp: new Date().toISOString(),
            requestId: context?.requestId || 'unknown',
          },
        };
        setResult(resultWithTiming);
      },
    },
  ],

  // GraphQL playground disabled in production
  graphiql: process.env.NODE_ENV !== 'production',

  // Masking errors in production
  maskedErrors: process.env.NODE_ENV === 'production',
});

// ============================================================================
// NEXT.JS API ROUTE HANDLERS
// ============================================================================

export async function GET(request: Request) {
  // Redirect to GraphQL playground if enabled
  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(request.url);
    if (url.pathname === '/api/graphql') {
      return new Response(getGraphQLPlaygroundHTML(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  return yoga.handleRequest(request, {
    request,
  });
}

export async function POST(request: Request) {
  return yoga.handleRequest(request, {
    request,
  });
}

export async function OPTIONS(request: Request) {
  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Apollo-Tracing',
    'X-GraphQL-Document',
  ].join(', ');

  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': allowedHeaders,
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ============================================================================
// GRAPHQL PLAYGROUND HTML
// ============================================================================

function getGraphQLPlaygroundHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=utf-8/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>TaxSense AI GraphQL Playground</title>
        <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
        <link rel="icon" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
        <script src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('load', function (event) {
            GraphQLPlayground.init(document.getElementById('root'), {
              endpoint: '/api/graphql',
              subscriptionsEndpoint: '/api/graphql',
            })
          })
        </script>
      </body>
    </html>
  `;
}
