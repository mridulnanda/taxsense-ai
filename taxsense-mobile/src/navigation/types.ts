import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Splash: undefined;
};

export type AuthStackParamList = {
  SignUp: undefined;
  Login: undefined;
  OTPVerification: { phone: string };
  ResetPassword: undefined;
  ConfirmResetPassword: { token: string };
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  ScenarioDetail: { scenarioId: string };
  CreateScenario: undefined;
  CompareScenarios: { scenarioIds: string[] };
  IncomeEntry: { scenarioId: string };
  DeductionEntry: { scenarioId: string };
  DocumentScanner: { documentType: string };
  ReportView: { scenarioId: string };
  Analytics: undefined;
  Settings: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Scenarios: undefined;
  Compute: undefined;
  Analytics: undefined;
  Profile: undefined;
};
