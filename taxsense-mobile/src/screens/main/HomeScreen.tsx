import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '@/stores/authStore';
import { useTaxStore } from '@/stores/taxStore';

const HomeScreen: React.FC<any> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const scenarios = useTaxStore((state) => state.scenarios);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load scenarios on mount
    setLoading(true);
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Feather name="user" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Scenarios</Text>
          <Text style={styles.statValue}>{scenarios.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active FY</Text>
          <Text style={styles.statValue}>{new Date().getFullYear()}</Text>
        </View>
      </View>

      {/* Recent Scenarios */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scenarios</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Scenarios')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : scenarios.length > 0 ? (
          scenarios.slice(0, 3).map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={styles.scenarioCard}
              onPress={() =>
                navigation.navigate('ScenarioDetail', {
                  scenarioId: scenario.id,
                })
              }
            >
              <View style={styles.scenarioInfo}>
                <Text style={styles.scenarioName}>{scenario.name}</Text>
                <Text style={styles.scenarioDescription}>
                  {scenario.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No scenarios yet</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateScenario')}
          >
            <Feather name="plus" size={24} color="#fff" />
            <Text style={styles.actionLabel}>New Scenario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Compute')}
          >
            <Feather name="calculator" size={24} color="#fff" />
            <Text style={styles.actionLabel}>Compute Tax</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Feather name="bar-chart-2" size={24} color="#fff" />
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 14,
    color: '#999',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  seeAll: {
    color: '#3b82f6',
    fontSize: 14,
  },
  scenarioCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  scenarioDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;
