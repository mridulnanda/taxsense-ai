import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApolloProvider } from '@apollo/client';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';

import Navigation from '@/navigation/Navigation';
import { initializeApolloClient } from '@/services/apollo';
import { database } from '@/services/database';
import { useUIStore } from '@/stores/uiStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

let apolloClient: any = null;

const App: React.FC = () => {
  const setOfflineIndicator = useUIStore((state) => state.setOfflineIndicator);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Apollo Client
        apolloClient = await initializeApolloClient();

        // Initialize local database
        await database.initialize();

        // Setup notifications
        setupNotifications();

        // Monitor network connectivity
        monitorNetworkStatus();

        // Hide splash screen
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  const setupNotifications = async () => {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  const monitorNetworkStatus = () => {
    NetInfo.addEventListener((state) => {
      setOfflineIndicator(!state.isConnected || !state.isInternetReachable);
    });
  };

  if (!apolloClient) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <Navigation />
      </ApolloProvider>
    </SafeAreaProvider>
  );
};

export default App;
