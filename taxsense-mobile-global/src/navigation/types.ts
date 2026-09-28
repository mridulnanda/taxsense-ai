import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  OTPVerification: { phone: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  BiometricSetup: undefined;
  ProfileCreation: undefined;
  CountrySelection: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Dashboard: undefined;
  QuickActions: undefined;
  Notifications: undefined;
};

// Tax Stack
export type TaxStackParamList = {
  TaxComputationHome: undefined;
  IncomeEntry: undefined;
  DeductionsInput: undefined;
  TaxCalculationResults: { calculationId: string };
  RegimeComparison: { calculationId: string };
  TaxPlanning: undefined;
  WhatIfScenarios: undefined;
  DeductionMaximizer: undefined;
  QuarterlyTaxCalculator: undefined;
  RetirementPlanning: undefined;
  InvestmentSuggestions: undefined;
};

// Documents Stack
export type DocumentsStackParamList = {
  DocumentsHome: undefined;
  CameraScanner: undefined;
  DocumentUpload: undefined;
  DocumentList: { type?: string };
  DocumentDetail: { documentId: string };
  DocumentOCR: { documentId: string };
  DocumentOrganization: undefined;
};

// Compliance Stack
export type ComplianceStackParamList = {
  ComplianceHome: undefined;
  Deadlines: undefined;
  Checklist: undefined;
  AuditRisk: undefined;
  RequiredDocuments: undefined;
};

// Reports Stack
export type ReportsStackParamList = {
  ReportsHome: undefined;
  TaxSummary: { year: number };
  YearOverYear: undefined;
  Export: { reportId: string };
};

// Advisor Stack
export type AdvisorStackParamList = {
  AdvisorHome: undefined;
  FindAdvisor: undefined;
  AdvisorProfile: { advisorId: string };
  BookConsultation: { advisorId: string };
  ShareData: undefined;
  Messages: { advisorId: string };
  Consultations: undefined;
};

// Settings Stack
export type SettingsStackParamList = {
  SettingsHome: undefined;
  AccountSettings: undefined;
  SecuritySettings: undefined;
  NotificationPreferences: undefined;
  PrivacySettings: undefined;
  LanguageSettings: undefined;
  AppUpdate: undefined;
  Help: undefined;
  About: undefined;
};

// Bottom Tab Navigator
export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Tax: NavigatorScreenParams<TaxStackParamList>;
  Documents: NavigatorScreenParams<DocumentsStackParamList>;
  Compliance: NavigatorScreenParams<ComplianceStackParamList>;
  Reports: NavigatorScreenParams<ReportsStackParamList>;
  Advisor: NavigatorScreenParams<AdvisorStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Root: NavigatorScreenParams<RootTabParamList>;
};
