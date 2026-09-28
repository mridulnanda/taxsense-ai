import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
} from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { onError } from '@apollo/client/link/error';
import { persistCache } from 'apollo-cache-persist';
import NetInfo from '@react-native-community/netinfo';

let apolloClient: ApolloClient<any> | null = null;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.taxsense.ai/graphql';

// Auth link to attach token to requests
const authLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let handle: any;

    Promise.resolve()
      .then(async () => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          operation.setContext({
            headers: {
              authorization: `Bearer ${token}`,
            },
          });
        }
      })
      .then(() => {
        handle = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      })
      .catch(observer.error.bind(observer));

    return () => {
      if (handle) handle.unsubscribe();
    };
  });
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Token expired, clear auth and redirect to login
        SecureStore.deleteItemAsync('authToken').catch(console.error);
        // Trigger logout action through store if needed
      }
    });
  }

  if (networkError) {
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      SecureStore.deleteItemAsync('authToken').catch(console.error);
    }
  }
});

// HTTP link
const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'include',
});

// Initialize Apollo Client
export async function initializeApolloClient() {
  if (apolloClient) {
    return apolloClient;
  }

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          user: {
            merge(existing, incoming) {
              return { ...existing, ...incoming };
            },
          },
          scenarios: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
      User: {
        keyFields: ['id'],
      },
      Scenario: {
        keyFields: ['id'],
      },
      IncomeEntry: {
        keyFields: ['id'],
      },
      DeductionEntry: {
        keyFields: ['id'],
      },
    },
  });

  // Persist cache to AsyncStorage
  try {
    await persistCache({
      cache,
      storage: AsyncStorage as any,
    });
  } catch (error) {
    console.error('Error persisting cache:', error);
  }

  const link = ApolloLink.from([errorLink, authLink, httpLink]);

  apolloClient = new ApolloClient({
    link,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
      query: {
        fetchPolicy: 'cache-first',
      },
    },
  });

  return apolloClient;
}

export function getApolloClient() {
  if (!apolloClient) {
    throw new Error('Apollo Client not initialized');
  }
  return apolloClient;
}

// Handle offline mode
export async function setupOfflineMode() {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    if (apolloClient) {
      apolloClient.cache.reset();
    }
  }
}

export async function clearCache() {
  if (apolloClient) {
    await apolloClient.cache.reset();
  }
  await AsyncStorage.removeItem('apollo-cache-persist');
}
