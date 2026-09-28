import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TaxStackParamList } from '../types';

const Stack = createNativeStackNavigator<TaxStackParamList>();

// Placeholder screens
const TaxComputationHomeScreen = () => null;
const IncomeEntryScreen = () => null;
const DeductionsInputScreen = () => null;
const TaxCalculationResultsScreen = () => null;
const RegimeComparisonScreen = () => null;
const TaxPlanningScreen = () => null;
const WhatIfScenariosScreen = () => null;
const DeductionMaximizerScreen = () => null;
const QuarterlyTaxCalculatorScreen = () => null;
const RetirementPlanningScreen = () => null;
const InvestmentSuggestionsScreen = () => null;

export default function TaxStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="TaxComputationHome"
        component={TaxComputationHomeScreen}
        options={{ title: 'Tax Computation' }}
      />
      <Stack.Screen
        name="IncomeEntry"
        component={IncomeEntryScreen}
        options={{ title: 'Add Income' }}
      />
      <Stack.Screen
        name="DeductionsInput"
        component={DeductionsInputScreen}
        options={{ title: 'Add Deductions' }}
      />
      <Stack.Screen
        name="TaxCalculationResults"
        component={TaxCalculationResultsScreen}
        options={{ title: 'Results' }}
      />
      <Stack.Screen
        name="RegimeComparison"
        component={RegimeComparisonScreen}
        options={{ title: 'Regime Comparison' }}
      />
      <Stack.Screen
        name="TaxPlanning"
        component={TaxPlanningScreen}
        options={{ title: 'Tax Planning' }}
      />
      <Stack.Screen
        name="WhatIfScenarios"
        component={WhatIfScenariosScreen}
        options={{ title: 'What-If Scenarios' }}
      />
      <Stack.Screen
        name="DeductionMaximizer"
        component={DeductionMaximizerScreen}
        options={{ title: 'Deduction Maximizer' }}
      />
      <Stack.Screen
        name="QuarterlyTaxCalculator"
        component={QuarterlyTaxCalculatorScreen}
        options={{ title: 'Quarterly Tax' }}
      />
      <Stack.Screen
        name="RetirementPlanning"
        component={RetirementPlanningScreen}
        options={{ title: 'Retirement Planning' }}
      />
      <Stack.Screen
        name="InvestmentSuggestions"
        component={InvestmentSuggestionsScreen}
        options={{ title: 'Investment Suggestions' }}
      />
    </Stack.Navigator>
  );
}
