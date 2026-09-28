/**
 * Export and report generation
 * Generate tax reports in multiple formats: JSON, CSV, HTML
 */

import type { ComparisonResult, RegimeComputation, TaxProfile } from "../tax-engine";
import { generateTaxSummary, generateTaxInsights } from "./analytics";

export type ExportFormat = "json" | "csv" | "html" | "markdown";

/**
 * Export tax computation as JSON
 */
export function exportAsJSON(
  profile: TaxProfile,
  comparison: ComparisonResult,
  pretty: boolean = true
): string {
  const data = {
    profile,
    comparison: {
      recommended: comparison.recommended,
      savings: comparison.savings,
      old: {
        regime: comparison.old.regime,
        totalIncome: comparison.old.totalIncome,
        totalDeductions: comparison.old.totalDeductions,
        taxOnNormalIncome: comparison.old.taxOnNormalIncome,
        rebate87A: comparison.old.rebate87A,
        surcharge: comparison.old.surcharge,
        cess: comparison.old.cess,
        totalTaxLiability: comparison.old.totalTaxLiability,
        netPayable: comparison.old.netPayable,
        effectiveRatePct: comparison.old.effectiveRatePct,
      },
      new: {
        regime: comparison.new.regime,
        totalIncome: comparison.new.totalIncome,
        totalDeductions: comparison.new.totalDeductions,
        taxOnNormalIncome: comparison.new.taxOnNormalIncome,
        rebate87A: comparison.new.rebate87A,
        surcharge: comparison.new.surcharge,
        cess: comparison.new.cess,
        totalTaxLiability: comparison.new.totalTaxLiability,
        netPayable: comparison.new.netPayable,
        effectiveRatePct: comparison.new.effectiveRatePct,
      },
    },
    generatedAt: new Date().toISOString(),
  };

  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Export tax computation as CSV
 */
export function exportAsCSV(comparison: ComparisonResult): string {
  const rows = [
    ["Metric", "Old Regime", "New Regime"],
    ["Total Income", comparison.old.totalIncome, comparison.new.totalIncome],
    ["Total Deductions", comparison.old.totalDeductions, comparison.new.totalDeductions],
    ["Tax on Normal Income", comparison.old.taxOnNormalIncome, comparison.new.taxOnNormalIncome],
    ["Rebate 87A", comparison.old.rebate87A, comparison.new.rebate87A],
    ["Surcharge", comparison.old.surcharge, comparison.new.surcharge],
    ["Cess", comparison.old.cess, comparison.new.cess],
    ["Total Tax Liability", comparison.old.totalTaxLiability, comparison.new.totalTaxLiability],
    ["Net Payable/Refund", comparison.old.netPayable, comparison.new.netPayable],
    ["Effective Tax Rate %", comparison.old.effectiveRatePct, comparison.new.effectiveRatePct],
    ["", "", ""],
    ["Recommended Regime", comparison.recommended.toUpperCase(), ""],
    ["Potential Savings", comparison.savings, ""],
  ];

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

/**
 * Export tax computation as HTML report
 */
export function exportAsHTML(
  profile: TaxProfile,
  comparison: ComparisonResult,
  title: string = "Tax Computation Report"
): string {
  const recommended = comparison[comparison.recommended];
  const other = comparison[comparison.recommended === "old" ? "new" : "old"];

  const oldInsights = generateTaxInsights(comparison.old);
  const newInsights = generateTaxInsights(comparison.new);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #1a5490;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 5px;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .section {
      background: white;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin-top: 0;
      color: #1a5490;
      border-bottom: 2px solid #e8e8e8;
      padding-bottom: 10px;
    }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    .regime-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #1a5490;
    }
    .regime-box.recommended {
      background: #e8f5e9;
      border-left-color: #4caf50;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .metric:last-child {
      border-bottom: none;
    }
    .metric-label {
      font-weight: 500;
      color: #555;
    }
    .metric-value {
      color: #1a5490;
      font-weight: 600;
    }
    .highlight {
      background: #fff3cd;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #ffc107;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #333;
    }
    .positive { color: #4caf50; }
    .negative { color: #f44336; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>FY 2025-26 (AY 2026-27) | Generated: ${new Date().toLocaleString("en-IN")}</p>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="highlight">
      <strong>Recommended Regime:</strong> ${comparison.recommended.toUpperCase()}<br>
      <strong>Tax Savings:</strong> ₹${comparison.savings.toLocaleString("en-IN")}<br>
      <strong>Effective Tax Rate:</strong> ${recommended.effectiveRatePct.toFixed(2)}%
    </div>
  </div>

  <div class="section">
    <h2>Regime Comparison</h2>
    <div class="comparison">
      <div class="regime-box ${comparison.recommended === "old" ? "recommended" : ""}">
        <h3>Old Regime</h3>
        <div class="metric">
          <span class="metric-label">Total Income</span>
          <span class="metric-value">₹${comparison.old.totalIncome.toLocaleString("en-IN")}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Tax Liability</span>
          <span class="metric-value">₹${comparison.old.totalTaxLiability.toLocaleString("en-IN")}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Effective Rate</span>
          <span class="metric-value">${comparison.old.effectiveRatePct.toFixed(2)}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Net Payable</span>
          <span class="metric-value ${comparison.old.netPayable > 0 ? "negative" : "positive"}">
            ₹${comparison.old.netPayable.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div class="regime-box ${comparison.recommended === "new" ? "recommended" : ""}">
        <h3>New Regime</h3>
        <div class="metric">
          <span class="metric-label">Total Income</span>
          <span class="metric-value">₹${comparison.new.totalIncome.toLocaleString("en-IN")}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Tax Liability</span>
          <span class="metric-value">₹${comparison.new.totalTaxLiability.toLocaleString("en-IN")}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Effective Rate</span>
          <span class="metric-value">${comparison.new.effectiveRatePct.toFixed(2)}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Net Payable</span>
          <span class="metric-value ${comparison.new.netPayable > 0 ? "negative" : "positive"}">
            ₹${comparison.new.netPayable.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Tax Computation Details (${comparison.recommended.toUpperCase()} Regime)</h2>
    <table>
      <tr>
        <th>Component</th>
        <th>Amount (₹)</th>
      </tr>
      <tr>
        <td>Gross Total Income</td>
        <td>${recommended.grossTotalIncome.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td>Total Deductions</td>
        <td>(${recommended.totalDeductions.toLocaleString("en-IN")})</td>
      </tr>
      <tr>
        <td>Total Income (Taxable)</td>
        <td class="metric-value">${recommended.totalIncome.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Tax Computation</strong></td>
      </tr>
      <tr>
        <td>Tax on Normal Income</td>
        <td>${recommended.taxOnNormalIncome.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td>Rebate 87A</td>
        <td class="positive">(${recommended.rebate87A.toLocaleString("en-IN")})</td>
      </tr>
      <tr>
        <td>Surcharge</td>
        <td>${recommended.surcharge.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td>Cess (4%)</td>
        <td>${recommended.cess.toLocaleString("en-IN")}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Total Tax Liability</strong></td>
      </tr>
      <tr>
        <td><strong>Tax Due</strong></td>
        <td class="metric-value"><strong>₹${recommended.totalTaxLiability.toLocaleString("en-IN")}</strong></td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>This is an automated tax computation. Not a substitute for professional tax advice. Please consult a Chartered Accountant for filing.</p>
    <p>TaxSense AI • FY 2025-26 (AY 2026-27)</p>
  </div>
</body>
</html>
  `;
}

/**
 * Export tax computation as Markdown
 */
export function exportAsMarkdown(comparison: ComparisonResult): string {
  return `# Tax Computation Report

**Generated:** ${new Date().toLocaleString("en-IN")}
**FY:** 2025-26 (AY 2026-27)

## Summary

- **Recommended Regime:** ${comparison.recommended.toUpperCase()}
- **Potential Savings:** ₹${comparison.savings.toLocaleString("en-IN")}
- **Old Regime Tax:** ₹${comparison.old.totalTaxLiability.toLocaleString("en-IN")}
- **New Regime Tax:** ₹${comparison.new.totalTaxLiability.toLocaleString("en-IN")}

## Old Regime

| Item | Amount |
|------|--------|
| Total Income | ₹${comparison.old.totalIncome.toLocaleString("en-IN")} |
| Total Tax Liability | ₹${comparison.old.totalTaxLiability.toLocaleString("en-IN")} |
| Effective Tax Rate | ${comparison.old.effectiveRatePct.toFixed(2)}% |
| Net Payable | ₹${comparison.old.netPayable.toLocaleString("en-IN")} |

## New Regime

| Item | Amount |
|------|--------|
| Total Income | ₹${comparison.new.totalIncome.toLocaleString("en-IN")} |
| Total Tax Liability | ₹${comparison.new.totalTaxLiability.toLocaleString("en-IN")} |
| Effective Tax Rate | ${comparison.new.effectiveRatePct.toFixed(2)}% |
| Net Payable | ₹${comparison.new.netPayable.toLocaleString("en-IN")} |

---

*This is an automated tax computation. Not a substitute for professional tax advice.*
*TaxSense AI • FY 2025-26 (AY 2026-27)*
`;
}

/**
 * Generic export function
 */
export function exportComputation(
  profile: TaxProfile,
  comparison: ComparisonResult,
  format: ExportFormat,
  filename?: string
): { content: string; filename: string; mimeType: string } {
  let content: string;
  let mimeType: string;
  let ext: string;

  switch (format) {
    case "json":
      content = exportAsJSON(profile, comparison);
      mimeType = "application/json";
      ext = "json";
      break;
    case "csv":
      content = exportAsCSV(comparison);
      mimeType = "text/csv";
      ext = "csv";
      break;
    case "html":
      content = exportAsHTML(profile, comparison);
      mimeType = "text/html";
      ext = "html";
      break;
    case "markdown":
      content = exportAsMarkdown(comparison);
      mimeType = "text/markdown";
      ext = "md";
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  const finalFilename = filename || `taxsense_${new Date().toISOString().split("T")[0]}.${ext}`;

  return { content, filename: finalFilename, mimeType };
}
