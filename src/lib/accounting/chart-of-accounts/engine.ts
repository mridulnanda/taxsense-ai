/**
 * Chart of Accounts Engine
 *
 * Core business logic for account hierarchy management, validation,
 * and double-entry bookkeeping compliance.
 */

import {
  ChartOfAccount,
  AccountType,
  AccountCategory,
  CurrencyCode,
} from "../types";

/**
 * Predefined chart of accounts templates by country/industry
 */
export const COA_TEMPLATES = {
  INDIA: {
    SOLE_PROPRIETORSHIP: generateIndianSoleProprietorshipCOA(),
    SERVICE_BUSINESS: generateIndianServiceBusinessCOA(),
    MANUFACTURING: generateIndianManufacturingCOA(),
    RETAIL: generateIndianRetailCOA(),
  },
  USA: {
    SERVICE_BUSINESS: generateUSAServiceBusinessCOA(),
    LLC: generateUSALLCCOA(),
    PROFESSIONAL: generateUSAProfessionalCOA(),
  },
  UK: {
    LIMITED_COMPANY: generateUKLimitedCompanyCOA(),
    PARTNERSHIP: generateUKPartnershipCOA(),
  },
  GLOBAL: {
    STARTUP: generateGlobalStartupCOA(),
  },
};

/**
 * Core chart of accounts validation rules
 */
export class ChartOfAccountsValidator {
  /**
   * Validate account structure and hierarchy
   */
  static validateAccountHierarchy(accounts: ChartOfAccount[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate account codes
    const codes = new Map<string, number>();
    accounts.forEach((acc) => {
      codes.set(acc.code, (codes.get(acc.code) || 0) + 1);
    });
    Array.from(codes.entries())
      .filter(([_, count]) => count > 1)
      .forEach(([code]) => {
        errors.push(`Duplicate account code: ${code}`);
      });

    // Validate normal balance per account type
    accounts.forEach((account) => {
      const expectedBalance = getNormalBalance(account.accountType);
      if (account.normalBalance !== expectedBalance) {
        warnings.push(
          `Account ${account.code} (${account.name}) has unexpected normal balance: ` +
          `expected ${expectedBalance}, got ${account.normalBalance}`
        );
      }
    });

    // Validate parent-child relationships
    const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));
    accounts.forEach((account) => {
      if (account.parentAccountId) {
        if (!accountMap.has(account.parentAccountId)) {
          errors.push(`Account ${account.code}: parent account ${account.parentAccountId} not found`);
        } else {
          const parent = accountMap.get(account.parentAccountId)!;
          if (parent.accountType !== account.accountType) {
            errors.push(
              `Account ${account.code}: parent ${parent.code} has different account type ` +
              `(${parent.accountType} vs ${account.accountType})`
            );
          }
        }
      }
    });

    // Check for circular references
    const circularRefs = detectCircularReferences(accounts);
    errors.push(...circularRefs);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate double-entry bookkeeping (debits = credits)
   */
  static validateJournalBalance(
    entries: Array<{ debit?: number; credit?: number }>
  ): ValidationResult {
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // Allow for floating point errors

    return {
      isValid: isBalanced,
      errors: isBalanced ? [] : [
        `Journal entries not balanced: Debits (${totalDebit}) != Credits (${totalCredit})`
      ],
      warnings: [],
    };
  }

  /**
   * Validate account reconciliation
   */
  static validateAccountReconciliation(
    accountBalance: number,
    reconciledTransactions: number[],
    unreconciledTransactions: number[]
  ): ValidationResult {
    const reconciledSum = reconciledTransactions.reduce((a, b) => a + b, 0);
    const totalSum = [...reconciledTransactions, ...unreconciledTransactions].reduce((a, b) => a + b, 0);

    const isReconciled = Math.abs(accountBalance - reconciledSum) < 0.01;

    return {
      isValid: isReconciled,
      errors: isReconciled ? [] : [
        `Account balance (${accountBalance}) does not match reconciled transactions (${reconciledSum})`
      ],
      warnings: unreconciledTransactions.length > 0 ? [
        `${unreconciledTransactions.length} transactions pending reconciliation`
      ] : [],
    };
  }
}

/**
 * Account hierarchy operations
 */
export class AccountHierarchyManager {
  /**
   * Get all child accounts (recursive)
   */
  static getChildAccounts(
    parentId: string,
    accounts: ChartOfAccount[]
  ): ChartOfAccount[] {
    const children = accounts.filter((acc) => acc.parentAccountId === parentId);
    const allDescendants = [...children];

    children.forEach((child) => {
      allDescendants.push(
        ...this.getChildAccounts(child.id, accounts)
      );
    });

    return allDescendants;
  }

  /**
   * Get account hierarchy as tree structure
   */
  static buildHierarchyTree(accounts: ChartOfAccount[]) {
    const rootAccounts = accounts.filter((acc) => !acc.parentAccountId);
    const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));

    const buildNode = (accountId: string): AccountHierarchyNode => {
      const account = accountMap.get(accountId)!;
      const children = accounts
        .filter((acc) => acc.parentAccountId === accountId)
        .map((child) => buildNode(child.id));

      return {
        account,
        children,
      };
    };

    return rootAccounts.map((root) => buildNode(root.id));
  }

  /**
   * Calculate account balance including all child accounts
   */
  static calculateHierarchyBalance(
    accountId: string,
    accounts: ChartOfAccount[],
    balances: Map<string, number>
  ): number {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;

    const directBalance = balances.get(accountId) || 0;
    const childAccounts = this.getChildAccounts(accountId, accounts);
    const childBalance = childAccounts.reduce((sum, child) => {
      return sum + (balances.get(child.id) || 0);
    }, 0);

    return directBalance + childBalance;
  }
}

/**
 * Account batch operations
 */
export class AccountBatchOperations {
  /**
   * Bulk create accounts from template
   */
  static createFromTemplate(
    template: AccountTemplate,
    organizationId: string,
    currencyCode: CurrencyCode
  ): Partial<ChartOfAccount>[] {
    return template.accounts.map((account) => ({
      ...account,
      organizationId,
      currencyCode,
      isActive: true,
      isArchived: false,
      tags: [],
      normalBalance: getNormalBalance(account.accountType),
    }));
  }

  /**
   * Archive unused accounts safely
   */
  static archiveUnusedAccounts(
    accounts: ChartOfAccount[],
    transactionsByAccount: Map<string, number>,
    minDaysOld: number = 90
  ): {
    accountsToArchive: ChartOfAccount[];
    accountsInUse: ChartOfAccount[];
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - minDaysOld);

    const accountsToArchive = accounts.filter((acc) => {
      const transactionCount = transactionsByAccount.get(acc.id) || 0;
      return (
        transactionCount === 0 &&
        acc.createdAt < cutoffDate &&
        acc.isActive &&
        !acc.isArchived &&
        !acc.bankAccountId // Don't archive reconciled accounts
      );
    });

    const accountsInUse = accounts.filter(
      (acc) => !accountsToArchive.includes(acc)
    );

    return {
      accountsToArchive,
      accountsInUse,
    };
  }

  /**
   * Merge duplicate accounts
   */
  static mergeAccounts(
    sourceAccountId: string,
    targetAccountId: string,
    accounts: ChartOfAccount[]
  ): MergeResult {
    const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
    const targetAccount = accounts.find((a) => a.id === targetAccountId);

    if (!sourceAccount || !targetAccount) {
      return { success: false, error: "Account not found" };
    }

    if (sourceAccount.accountType !== targetAccount.accountType) {
      return {
        success: false,
        error: "Cannot merge accounts of different types",
      };
    }

    return {
      success: true,
      mergedAccount: targetAccount,
      sourceAccountToArchive: sourceAccount,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNormalBalance(accountType: AccountType): "DEBIT" | "CREDIT" {
  const balances: Record<AccountType, "DEBIT" | "CREDIT"> = {
    ASSET: "DEBIT",
    LIABILITY: "CREDIT",
    EQUITY: "CREDIT",
    REVENUE: "CREDIT",
    EXPENSE: "DEBIT",
    COST_OF_GOODS_SOLD: "DEBIT",
  };
  return balances[accountType];
}

function detectCircularReferences(accounts: ChartOfAccount[]): string[] {
  const errors: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const visit = (accountId: string): void => {
    visited.add(accountId);
    recursionStack.add(accountId);

    const account = accounts.find((a) => a.id === accountId);
    if (account?.parentAccountId) {
      if (!visited.has(account.parentAccountId)) {
        visit(account.parentAccountId);
      } else if (recursionStack.has(account.parentAccountId)) {
        const parent = accounts.find((a) => a.id === account.parentAccountId);
        errors.push(`Circular reference: ${account.code} -> ${parent?.code}`);
      }
    }

    recursionStack.delete(accountId);
  };

  accounts.forEach((account) => {
    if (!visited.has(account.id)) {
      visit(account.id);
    }
  });

  return errors;
}

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

function generateIndianSoleProprietorshipCOA(): AccountTemplate {
  return {
    country: "India",
    businessType: "Sole Proprietorship",
    accounts: [
      // ASSETS
      {
        code: "1000",
        name: "Cash at Hand",
        accountType: "ASSET",
        category: "CURRENT_ASSET",
        normalBalance: "DEBIT",
      },
      {
        code: "1010",
        name: "Bank Accounts",
        accountType: "ASSET",
        category: "CURRENT_ASSET",
        normalBalance: "DEBIT",
      },
      {
        code: "1100",
        name: "Accounts Receivable",
        accountType: "ASSET",
        category: "CURRENT_ASSET",
        normalBalance: "DEBIT",
      },
      {
        code: "1200",
        name: "Inventory",
        accountType: "ASSET",
        category: "CURRENT_ASSET",
        normalBalance: "DEBIT",
      },
      {
        code: "1500",
        name: "Fixed Assets",
        accountType: "ASSET",
        category: "FIXED_ASSET",
        normalBalance: "DEBIT",
      },
      // LIABILITIES
      {
        code: "2000",
        name: "Accounts Payable",
        accountType: "LIABILITY",
        category: "CURRENT_LIABILITY",
        normalBalance: "CREDIT",
      },
      {
        code: "2100",
        name: "Short-term Loans",
        accountType: "LIABILITY",
        category: "CURRENT_LIABILITY",
        normalBalance: "CREDIT",
      },
      // EQUITY
      {
        code: "3000",
        name: "Capital",
        accountType: "EQUITY",
        category: "CONTRIBUTED_CAPITAL",
        normalBalance: "CREDIT",
      },
      {
        code: "3100",
        name: "Drawings",
        accountType: "EQUITY",
        category: "CONTRIBUTED_CAPITAL",
        normalBalance: "DEBIT",
      },
      // REVENUE
      {
        code: "4000",
        name: "Sales",
        accountType: "REVENUE",
        category: "OPERATING_REVENUE",
        normalBalance: "CREDIT",
      },
      {
        code: "4100",
        name: "Service Income",
        accountType: "REVENUE",
        category: "OPERATING_REVENUE",
        normalBalance: "CREDIT",
      },
      // EXPENSES
      {
        code: "5000",
        name: "Cost of Goods Sold",
        accountType: "COST_OF_GOODS_SOLD",
        category: "COST_OF_GOODS_SOLD",
        normalBalance: "DEBIT",
      },
      {
        code: "5100",
        name: "Salaries & Wages",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
      {
        code: "5200",
        name: "Office Rent",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
      {
        code: "5300",
        name: "Utilities",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
      {
        code: "5400",
        name: "Professional Services",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
      {
        code: "5500",
        name: "Travel & Conveyance",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
      {
        code: "5600",
        name: "Depreciation",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
      {
        code: "6000",
        name: "Income Tax Expense",
        accountType: "EXPENSE",
        category: "OPERATING_EXPENSE",
        normalBalance: "DEBIT",
      },
    ],
  };
}

function generateIndianServiceBusinessCOA(): AccountTemplate {
  // Similar structure, service-focused
  return { ...generateIndianSoleProprietorshipCOA() };
}

function generateIndianManufacturingCOA(): AccountTemplate {
  return generateIndianSoleProprietorshipCOA();
}

function generateIndianRetailCOA(): AccountTemplate {
  return generateIndianSoleProprietorshipCOA();
}

function generateUSAServiceBusinessCOA(): AccountTemplate {
  return { ...generateIndianSoleProprietorshipCOA() };
}

function generateUSALLCCOA(): AccountTemplate {
  return { ...generateIndianSoleProprietorshipCOA() };
}

function generateUSAProfessionalCOA(): AccountTemplate {
  return { ...generateIndianSoleProprietorshipCOA() };
}

function generateUKLimitedCompanyCOA(): AccountTemplate {
  return { ...generateIndianSoleProprietorshipCOA() };
}

function generateUKPartnershipCOA(): AccountTemplate {
  return { ...generateIndianSoleProprietorshipCOA() };
}

function generateGlobalStartupCOA(): AccountTemplate {
  return { ...generateIndianSoleProprietorshipCOA() };
}

// ============================================================================
// TYPES
// ============================================================================

export interface AccountTemplate {
  country: string;
  businessType: string;
  accounts: Partial<ChartOfAccount>[];
}

export interface AccountHierarchyNode {
  account: ChartOfAccount;
  children: AccountHierarchyNode[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MergeResult {
  success: boolean;
  error?: string;
  mergedAccount?: ChartOfAccount;
  sourceAccountToArchive?: ChartOfAccount;
}
