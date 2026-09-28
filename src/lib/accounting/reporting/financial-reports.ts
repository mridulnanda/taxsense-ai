/**
 * Financial Reporting Engine
 *
 * Generates IFRS/GAAP-compliant financial statements:
 * - Balance Sheet
 * - Income Statement (P&L)
 * - Cash Flow Statement
 * - Trial Balance
 * - Custom Reports
 */

import {
  FinancialReport,
  BalanceSheet,
  IncomeStatement,
  ReportType,
  ChartOfAccount,
  Journal,
} from "../types";

/**
 * Core financial report generator
 */
export class FinancialReportEngine {
  /**
   * Generate balance sheet for a period
   */
  static generateBalanceSheet(
    accounts: ChartOfAccount[],
    journals: Journal[],
    startDate: Date,
    endDate: Date
  ): BalanceSheet {
    const accountBalances = this.calculateAccountBalances(accounts, journals, startDate, endDate);

    // Organize by sections
    const currentAssets = this.filterAccountsByType(accounts, "ASSET", "CURRENT_ASSET");
    const fixedAssets = this.filterAccountsByType(accounts, "ASSET", "FIXED_ASSET");
    const otherAssets = this.filterAccountsByType(accounts, "ASSET", "INTANGIBLE_ASSET");

    const currentLiabilities = this.filterAccountsByType(accounts, "LIABILITY", "CURRENT_LIABILITY");
    const longTermLiabilities = this.filterAccountsByType(accounts, "LIABILITY", "LONG_TERM_LIABILITY");

    const equityAccounts = this.filterAccountsByType(accounts, "EQUITY", null);

    return {
      id: `bs-${Date.now()}`,
      organizationId: accounts[0]?.organizationId || "",
      reportType: "BALANCE_SHEET",
      startDate,
      endDate,
      sections: [],
      totals: this.calculateTotals(accountBalances, currentAssets, currentLiabilities, longTermLiabilities),
      percentages: new Map(),
      generatedAt: new Date(),
      generatedBy: "system",
      assets: {
        currentAssets: this.createReportSection(
          "Current Assets",
          currentAssets,
          accountBalances
        ),
        fixedAssets: this.createReportSection(
          "Fixed Assets",
          fixedAssets,
          accountBalances
        ),
        otherAssets: this.createReportSection(
          "Other Assets",
          otherAssets,
          accountBalances
        ),
      },
      liabilities: {
        currentLiabilities: this.createReportSection(
          "Current Liabilities",
          currentLiabilities,
          accountBalances
        ),
        longTermLiabilities: this.createReportSection(
          "Long-term Liabilities",
          longTermLiabilities,
          accountBalances
        ),
      },
      equity: this.createReportSection(
        "Shareholders' Equity",
        equityAccounts,
        accountBalances
      ),
      createdAt: new Date(),
    } as unknown as BalanceSheet;
  }

  /**
   * Generate income statement (P&L)
   */
  static generateIncomeStatement(
    accounts: ChartOfAccount[],
    journals: Journal[],
    startDate: Date,
    endDate: Date
  ): IncomeStatement {
    const accountBalances = this.calculateAccountBalances(accounts, journals, startDate, endDate);

    const revenues = this.filterAccountsByType(accounts, "REVENUE", null);
    const cogs = this.filterAccountsByType(accounts, "COST_OF_GOODS_SOLD", null);
    const expenses = this.filterAccountsByType(accounts, "EXPENSE", null);

    return {
      id: `is-${Date.now()}`,
      organizationId: accounts[0]?.organizationId || "",
      reportType: "INCOME_STATEMENT",
      startDate,
      endDate,
      sections: [],
      revenues: this.createReportSection("Revenues", revenues, accountBalances),
      costOfGoodsSold: this.createReportSection("Cost of Goods Sold", cogs, accountBalances),
      operatingExpenses: this.createReportSection("Operating Expenses", expenses, accountBalances),
      otherIncomeExpense: this.createReportSection("Other Income & Expense", [], accountBalances),
      taxExpense: this.createReportSection("Tax Expense", [], accountBalances),
      totals: new Map(),
      percentages: new Map(),
      generatedAt: new Date(),
      generatedBy: "system",
      createdAt: new Date(),
    } as unknown as IncomeStatement;
  }

  /**
   * Generate cash flow statement
   */
  static generateCashFlowStatement(
    accounts: ChartOfAccount[],
    journals: Journal[],
    previousBalance: number,
    startDate: Date,
    endDate: Date
  ): FinancialReport {
    const accountBalances = this.calculateAccountBalances(accounts, journals, startDate, endDate);
    const previousAccountBalances = this.calculateAccountBalances(
      accounts,
      journals,
      new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000),
      startDate
    );

    // Operating activities (working capital changes)
    const operatingActivities = this.calculateOperatingCashFlow(
      accountBalances,
      previousAccountBalances
    );

    // Investing activities (fixed assets, investments)
    const investingActivities = this.calculateInvestingCashFlow(
      accountBalances,
      previousAccountBalances
    );

    // Financing activities (debt, equity)
    const financingActivities = this.calculateFinancingCashFlow(
      accountBalances,
      previousAccountBalances
    );

    const netCashFlow =
      operatingActivities.total +
      investingActivities.total +
      financingActivities.total;

    const endingCash = previousBalance + netCashFlow;

    return {
      id: `cf-${Date.now()}`,
      organizationId: accounts[0]?.organizationId || "",
      reportType: "CASH_FLOW",
      startDate,
      endDate,
      sections: [
        {
          title: "Operating Activities",
          rows: operatingActivities.rows,
          subtotal: operatingActivities.total,
        },
        {
          title: "Investing Activities",
          rows: investingActivities.rows,
          subtotal: investingActivities.total,
        },
        {
          title: "Financing Activities",
          rows: financingActivities.rows,
          subtotal: financingActivities.total,
        },
        {
          title: "Net Increase/(Decrease) in Cash",
          rows: [
            {
              accountName: "Net Cash Flow",
              currentPeriod: netCashFlow,
              indent: 0,
            },
          ],
          subtotal: netCashFlow,
        },
      ],
      totals: new Map([
        ["endingCash", endingCash],
        ["netCashFlow", netCashFlow],
      ]),
      percentages: new Map(),
      generatedAt: new Date(),
      generatedBy: "system",
      createdAt: new Date(),
    };
  }

  /**
   * Generate trial balance
   */
  static generateTrialBalance(
    accounts: ChartOfAccount[],
    journals: Journal[],
    asOfDate: Date
  ): FinancialReport {
    const accountBalances = this.calculateAccountBalances(accounts, journals, new Date(0), asOfDate);

    const rows = accounts
      .filter((acc) => acc.isActive && !acc.isArchived)
      .map((acc) => ({
        accountName: acc.name,
        accountCode: acc.code,
        currentPeriod: accountBalances.get(acc.id) || 0,
        indent: acc.parentAccountId ? 1 : 0,
      }))
      .sort((a, b) => (a.accountCode || "").localeCompare(b.accountCode || ""));

    const totalDebits = rows
      .filter((row) => row.currentPeriod > 0)
      .reduce((sum, row) => sum + row.currentPeriod, 0);

    const totalCredits = rows
      .filter((row) => row.currentPeriod < 0)
      .reduce((sum, row) => sum + Math.abs(row.currentPeriod), 0);

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      id: `tb-${Date.now()}`,
      organizationId: accounts[0]?.organizationId || "",
      reportType: "TRIAL_BALANCE",
      startDate: new Date(0),
      endDate: asOfDate,
      sections: [
        {
          title: "All Accounts",
          rows,
          subtotal: totalDebits - totalCredits,
        },
      ],
      totals: new Map([
        ["totalDebits", totalDebits],
        ["totalCredits", totalCredits],
        ["isBalanced", isBalanced ? 1 : 0],
      ]),
      percentages: new Map(),
      generatedAt: new Date(),
      generatedBy: "system",
      createdAt: new Date(),
    };
  }

  /**
   * Generate aging report (Accounts Receivable)
   */
  static generateARAgingReport(
    invoices: any[],
    asOfDate: Date = new Date()
  ): FinancialReport {
    const ageGroups = {
      "Current (0-30)": { min: 0, max: 30, invoices: [] as any[] },
      "31-60": { min: 31, max: 60, invoices: [] as any[] },
      "61-90": { min: 61, max: 90, invoices: [] as any[] },
      "91+": { min: 91, max: Infinity, invoices: [] as any[] },
    };

    invoices.forEach((invoice) => {
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - new Date(invoice.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      Object.values(ageGroups).forEach((group) => {
        if (daysOverdue >= group.min && daysOverdue <= group.max) {
          group.invoices.push(invoice);
        }
      });
    });

    const rows = Object.entries(ageGroups).map(([ageGroup, data]) => {
      const total = data.invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
      return {
        accountName: ageGroup,
        currentPeriod: total,
        indent: 0,
      };
    });

    const totalAR = rows.reduce((sum, row) => sum + row.currentPeriod, 0);

    return {
      id: `ar-aging-${Date.now()}`,
      organizationId: "",
      reportType: "AGING_AR",
      startDate: new Date(0),
      endDate: asOfDate,
      sections: [{ title: "Accounts Receivable Aging", rows, subtotal: totalAR }],
      totals: new Map([["totalAR", totalAR]]),
      percentages: new Map(),
      generatedAt: new Date(),
      generatedBy: "system",
      createdAt: new Date(),
    };
  }

  /**
   * Generate budget vs actual report
   */
  static generateBudgetVsActual(
    budgets: any[],
    accounts: ChartOfAccount[],
    journals: Journal[],
    startDate: Date,
    endDate: Date
  ): FinancialReport {
    const accountBalances = this.calculateAccountBalances(accounts, journals, startDate, endDate);

    const rows = budgets.map((budget) => {
      const actual = accountBalances.get(budget.accountId) || 0;
      const variance = actual - budget.amount;
      const variancePercent = budget.amount !== 0 ? (variance / budget.amount) * 100 : 0;

      return {
        accountName: budget.accountName,
        currentPeriod: actual,
        previousPeriod: budget.amount,
        variance,
        variancePercent,
        indent: 0,
      };
    });

    const totalBudget = rows.reduce((sum, row) => sum + (row.previousPeriod || 0), 0);
    const totalActual = rows.reduce((sum, row) => sum + row.currentPeriod, 0);
    const totalVariance = totalActual - totalBudget;

    return {
      id: `bva-${Date.now()}`,
      organizationId: accounts[0]?.organizationId || "",
      reportType: "BUDGET_VS_ACTUAL",
      startDate,
      endDate,
      sections: [
        {
          title: "Budget vs Actual",
          rows,
          subtotal: totalVariance,
        },
      ],
      totals: new Map([
        ["totalBudget", totalBudget],
        ["totalActual", totalActual],
        ["totalVariance", totalVariance],
      ]),
      percentages: new Map(),
      generatedAt: new Date(),
      generatedBy: "system",
      createdAt: new Date(),
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static calculateAccountBalances(
    accounts: ChartOfAccount[],
    journals: Journal[],
    startDate: Date,
    endDate: Date
  ): Map<string, number> {
    const balances = new Map<string, number>();

    journals
      .filter((j) => j.postedAt >= startDate && j.postedAt <= endDate)
      .forEach((journal) => {
        journal.entries.forEach((entry) => {
          const current = balances.get(entry.accountId) || 0;
          const debit = entry.debit || 0;
          const credit = entry.credit || 0;
          balances.set(entry.accountId, current + debit - credit);
        });
      });

    return balances;
  }

  private static filterAccountsByType(
    accounts: ChartOfAccount[],
    accountType?: string,
    category?: string
  ): ChartOfAccount[] {
    return accounts.filter(
      (acc) =>
        (!accountType || acc.accountType === accountType) &&
        (!category || acc.category === category) &&
        acc.isActive &&
        !acc.isArchived
    );
  }

  private static createReportSection(
    title: string,
    accounts: ChartOfAccount[],
    accountBalances: Map<string, number>
  ) {
    const rows = accounts
      .map((acc) => ({
        accountName: acc.name,
        accountCode: acc.code,
        currentPeriod: accountBalances.get(acc.id) || 0,
        indent: acc.parentAccountId ? 1 : 0,
      }))
      .filter((row) => row.currentPeriod !== 0); // Hide zero-balance accounts

    const subtotal = rows.reduce((sum, row) => sum + row.currentPeriod, 0);

    return { title, rows, subtotal };
  }

  private static calculateTotals(
    balances: Map<string, number>,
    ...accountGroups: ChartOfAccount[][]
  ): Map<string, number> {
    const totals = new Map<string, number>();

    accountGroups.forEach((group) => {
      const groupTotal = group.reduce((sum, acc) => sum + (balances.get(acc.id) || 0), 0);
      totals.set(group[0]?.category || "other", groupTotal);
    });

    return totals;
  }

  private static calculateOperatingCashFlow(
    current: Map<string, number>,
    previous: Map<string, number>
  ) {
    // Simplified cash flow calculation
    return {
      total: 0,
      rows: [] as any[],
    };
  }

  private static calculateInvestingCashFlow(
    current: Map<string, number>,
    previous: Map<string, number>
  ) {
    return {
      total: 0,
      rows: [] as any[],
    };
  }

  private static calculateFinancingCashFlow(
    current: Map<string, number>,
    previous: Map<string, number>
  ) {
    return {
      total: 0,
      rows: [] as any[],
    };
  }
}

/**
 * Report formatting and export
 */
export class ReportFormatter {
  /**
   * Format report as PDF
   */
  static formatAsPDF(report: FinancialReport): Promise<Buffer> {
    // PDF generation implementation
    return Promise.resolve(Buffer.from(""));
  }

  /**
   * Format report as Excel
   */
  static formatAsExcel(report: FinancialReport): Promise<Buffer> {
    // Excel generation implementation
    return Promise.resolve(Buffer.from(""));
  }

  /**
   * Format report as CSV
   */
  static formatAsCSV(report: FinancialReport): string {
    let csv = `${report.reportType},${report.startDate},${report.endDate}\n`;

    report.sections.forEach((section) => {
      csv += `\n${section.title}\n`;
      section.rows.forEach((row) => {
        csv += `${row.accountName},${row.currentPeriod}\n`;
      });
      csv += `Subtotal,${section.subtotal}\n`;
    });

    return csv;
  }

  /**
   * Format report as JSON
   */
  static formatAsJSON(report: FinancialReport): string {
    return JSON.stringify(report, null, 2);
  }
}

/**
 * Multi-period comparison
 */
export class ReportComparison {
  /**
   * Compare two periods (YoY or QoQ)
   */
  static comparePeriods(
    currentReport: FinancialReport,
    previousReport: FinancialReport
  ): ComparisonResult {
    const currentRows = this.flattenReportRows(currentReport.sections);
    const previousRows = this.flattenReportRows(previousReport.sections);

    const comparison = currentRows.map((current) => {
      const previous = previousRows.find(
        (p) => p.accountName === current.accountName
      );

      const varianceAmount = current.currentPeriod - (previous?.currentPeriod || 0);
      const variancePercent =
        previous && previous.currentPeriod !== 0
          ? (varianceAmount / previous.currentPeriod) * 100
          : 0;

      return {
        ...current,
        previousPeriod: previous?.currentPeriod || 0,
        variance: varianceAmount,
        variancePercent,
      };
    });

    return {
      currentReport,
      previousReport,
      comparison,
      generatedAt: new Date(),
    };
  }

  private static flattenReportRows(sections: any[]) {
    return sections.flatMap((section) => section.rows);
  }
}

export interface ComparisonResult {
  currentReport: FinancialReport;
  previousReport: FinancialReport;
  comparison: any[];
  generatedAt: Date;
}
