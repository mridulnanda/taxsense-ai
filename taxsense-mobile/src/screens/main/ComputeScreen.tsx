import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTaxStore } from '@/stores/taxStore';
import { useUIStore } from '@/stores/uiStore';

const ComputeScreen: React.FC<any> = ({ navigation }) => {
  const calculateTotalIncome = useTaxStore((state) => state.calculateTotalIncome);
  const calculateTotalDeductions = useTaxStore(
    (state) => state.calculateTotalDeductions
  );
  const setTaxComputation = useTaxStore((state) => state.setTaxComputation);
  const [selectedRegime, setSelectedRegime] = useState<'OLD' | 'NEW'>('NEW');

  const totalIncome = calculateTotalIncome();
  const totalDeductions = calculateTotalDeductions();
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);

  const calculateTax = () => {
    // Simplified tax calculation
    let tax = 0;
    if (selectedRegime === 'NEW') {
      // New regime
      if (taxableIncome > 1500000) {
        tax = (taxableIncome - 1500000) * 0.3 + 112500;
      } else if (taxableIncome > 1250000) {
        tax = (taxableIncome - 1250000) * 0.25 + 75000;
      } else if (taxableIncome > 1000000) {
        tax = (taxableIncome - 1000000) * 0.2 + 25000;
      } else if (taxableIncome > 750000) {
        tax = (taxableIncome - 750000) * 0.15;
      } else if (taxableIncome > 500000) {
        tax = (taxableIncome - 500000) * 0.1;
      }
    } else {
      // Old regime
      if (taxableIncome > 1500000) {
        tax = (taxableIncome - 1500000) * 0.3 + 150000;
      } else if (taxableIncome > 1000000) {
        tax = (taxableIncome - 1000000) * 0.2 + 75000;
      } else if (taxableIncome > 500000) {
        tax = (taxableIncome - 500000) * 0.15;
      }
    }

    const surcharge = tax > 5000000 ? tax * 0.15 : 0;
    const cess = (tax + surcharge) * 0.04;
    const totalTax = tax + surcharge + cess;

    const computation = {
      id: `tax-${Date.now()}`,
      userId: '',
      financialYear: '2024-25',
      totalIncome,
      totalDeductions,
      taxableIncome,
      taxAmount: tax,
      surcharge,
      cess,
      totalTaxPayable: totalTax,
      effectiveTaxRate: (totalTax / totalIncome) * 100,
      regime: selectedRegime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTaxComputation(computation);
    Alert.alert('Success', `Total Tax: ${totalTax.toFixed(2)}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Total Income</Text>
        <Text style={styles.value}>
          {totalIncome.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          })}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Deductions</Text>
        <Text style={styles.value}>
          {totalDeductions.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          })}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Taxable Income</Text>
        <Text style={styles.value}>
          {taxableIncome.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax Regime</Text>
        <View style={styles.regimeButtons}>
          <TouchableOpacity
            style={[
              styles.regimeButton,
              selectedRegime === 'NEW' && styles.regimeButtonActive,
            ]}
            onPress={() => setSelectedRegime('NEW')}
          >
            <Text
              style={[
                styles.regimeButtonText,
                selectedRegime === 'NEW' && styles.regimeButtonTextActive,
              ]}
            >
              New Regime
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.regimeButton,
              selectedRegime === 'OLD' && styles.regimeButtonActive,
            ]}
            onPress={() => setSelectedRegime('OLD')}
          >
            <Text
              style={[
                styles.regimeButtonText,
                selectedRegime === 'OLD' && styles.regimeButtonTextActive,
              ]}
            >
              Old Regime
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.computeButton}
        onPress={calculateTax}
      >
        <Text style={styles.computeButtonText}>Calculate Tax</Text>
      </TouchableOpacity>
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
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  regimeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  regimeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  regimeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  regimeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  regimeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  computeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  computeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComputeScreen;
