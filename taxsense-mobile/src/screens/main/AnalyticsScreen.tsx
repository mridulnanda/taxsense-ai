import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTaxStore } from '@/stores/taxStore';

const AnalyticsScreen: React.FC = () => {
  const calculateTotalIncome = useTaxStore((state) => state.calculateTotalIncome);
  const calculateTotalDeductions = useTaxStore(
    (state) => state.calculateTotalDeductions
  );
  const taxComputation = useTaxStore((state) => state.taxComputation);

  const totalIncome = calculateTotalIncome();
  const totalDeductions = calculateTotalDeductions();
  const taxableIncome = totalIncome - totalDeductions;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Income Analysis</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              {
                width: `${
                  totalIncome > 0 ? (totalDeductions / totalIncome) * 100 : 0
                }%`,
              },
            ]}
          />
        </View>
        <View style={styles.stats}>
          <View>
            <Text style={styles.statLabel}>Total Income</Text>
            <Text style={styles.statValue}>
              {(totalIncome / 100000).toFixed(2)}L
            </Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Deductions</Text>
            <Text style={styles.statValue}>
              {(totalDeductions / 100000).toFixed(2)}L
            </Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Taxable</Text>
            <Text style={styles.statValue}>
              {(taxableIncome / 100000).toFixed(2)}L
            </Text>
          </View>
        </View>
      </View>

      {taxComputation && (
        <View style={styles.card}>
          <Text style={styles.title}>Tax Computation</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tax Amount</Text>
            <Text style={styles.value}>
              {(taxComputation.taxAmount / 100000).toFixed(2)}L
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Effective Tax Rate</Text>
            <Text style={styles.value}>
              {taxComputation.effectiveTaxRate.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Tax Payable</Text>
            <Text style={styles.value}>
              {(taxComputation.totalTaxPayable / 100000).toFixed(2)}L
            </Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>Insights</Text>
        <View style={styles.insight}>
          <Text style={styles.insightText}>
            Your deductions cover {totalIncome > 0 ? ((totalDeductions / totalIncome) * 100).toFixed(1) : 0}% of your income
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  progressBar: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progress: {
    backgroundColor: '#3b82f6',
    height: '100%',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  insight: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#1e40af',
  },
});

export default AnalyticsScreen;
