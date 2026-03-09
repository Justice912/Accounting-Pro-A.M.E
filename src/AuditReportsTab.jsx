import { useState } from "react";
import { Download, FileText, Mail, BarChart3, Calculator, ChevronRight } from "lucide-react";

// ─── LEAD SCHEDULES (Draftworx-style working paper pack) ────────────────────
const LEAD_SCHEDULES = [
  { id: "cash", code: "A1", title: "Cash & Cash Equivalents", objective: "Agree bank balances to confirmations and reconciliations", assertions: ["Existence", "Completeness", "Rights", "Valuation"], procedures: ["Obtain bank confirmations (ISA 505)", "Reperform bank reconciliations at year-end", "Test outstanding cheques and deposits in transit", "Verify bank statement cut-off", "Review foreign currency translations (IAS 21)", "Inspect petty cash count certificate"], isa: "ISA 500, ISA 505", wpRef: "A1.1–A1.6" },
  { id: "receivables", code: "B1", title: "Trade Receivables", objective: "Substantiate existence and valuation of receivables", assertions: ["Existence", "Rights", "Valuation", "Completeness"], procedures: ["Send debtor circularisation confirmations (ISA 505)", "Test subsequent cash receipts for existence", "Recalculate expected credit loss / provision for bad debts (IFRS 9)", "Review ageing analysis for recoverability", "Verify revenue cut-off at year-end (IFRS 15)", "Test related party balances (ISA 550, IAS 24)"], isa: "ISA 505, ISA 540, IFRS 9", wpRef: "B1.1–B1.6" },
  { id: "inventory", code: "C1", title: "Inventory", objective: "Verify existence, completeness and valuation of inventory", assertions: ["Existence", "Completeness", "Valuation", "Rights"], procedures: ["Attend physical inventory count (ISA 501)", "Perform test counts and trace to final listing", "Test pricing to recent invoices and cost records", "Perform NRV testing (IAS 2)", "Review slow-moving and obsolete stock provisions", "Verify cut-off for goods in transit"], isa: "ISA 501, IAS 2", wpRef: "C1.1–C1.6" },
  { id: "ppe", code: "D1", title: "Property, Plant & Equipment", objective: "Substantiate additions, disposals and depreciation", assertions: ["Existence", "Completeness", "Valuation", "Rights"], procedures: ["Vouch material additions to supporting documents", "Physically inspect significant additions", "Verify disposals to proceeds and authorisation", "Recalculate depreciation (IAS 16)", "Assess useful life estimates and residual values (ISA 540)", "Review impairment indicators (IAS 36)"], isa: "ISA 500, IAS 16, IAS 36", wpRef: "D1.1–D1.6" },
  { id: "revenue", code: "E1", title: "Revenue", objective: "Assess occurrence, cut-off and completeness of revenue", assertions: ["Occurrence", "Completeness", "Accuracy", "Cut-off"], procedures: ["Perform analytical review — compare to prior year, budget, industry", "Test sample of revenue transactions to source documents", "Test revenue cut-off around year-end (IFRS 15)", "Review credit notes issued post year-end", "Perform journal entry testing on revenue accounts (ISA 240)", "Assess fraud risk in revenue recognition (ISA 240 presumption)"], isa: "ISA 240, ISA 315, IFRS 15", wpRef: "E1.1–E1.6" },
  { id: "payables", code: "F1", title: "Trade Payables & Accruals", objective: "Test completeness and valuation of liabilities", assertions: ["Completeness", "Existence", "Valuation", "Accuracy"], procedures: ["Reconcile supplier statements to ledger balances", "Search for unrecorded liabilities after year-end", "Test subsequent payments for completeness", "Review accrual calculations and supporting documentation", "Verify payables ageing and dispute items", "Test related party payables (ISA 550)"], isa: "ISA 500, ISA 501", wpRef: "F1.1–F1.6" },
  { id: "payroll", code: "F2", title: "Payroll & Employee Benefits", objective: "Verify accuracy and completeness of payroll expenses and obligations", assertions: ["Occurrence", "Completeness", "Accuracy", "Classification"], procedures: ["Agree payroll summaries to general ledger", "Test sample of employees to HR records and contracts", "Recalculate PAYE, UIF, SDL deductions", "Verify EMP201/501 reconciliations to SARS", "Review leave pay and bonus accruals (IAS 19)", "Test directors' emoluments disclosure (Companies Act)"], isa: "ISA 500, IAS 19", wpRef: "F2.1–F2.6" },
  { id: "provisions", code: "F3", title: "Provisions & Contingencies", objective: "Assess recognition, measurement and disclosure of provisions", assertions: ["Existence", "Completeness", "Valuation", "Disclosure"], procedures: ["Obtain lawyer's letter for pending litigation (ISA 501)", "Review board minutes for contingent liabilities", "Assess probability and measurement of provisions (IAS 37)", "Verify disclosure of contingent assets and liabilities", "Review subsequent events for provision adjustments", "Evaluate management estimates (ISA 540)"], isa: "ISA 501, ISA 540, IAS 37", wpRef: "F3.1–F3.6" },
  { id: "loans", code: "F4", title: "Loans & Borrowings", objective: "Verify existence, terms, and classification of borrowings", assertions: ["Existence", "Completeness", "Valuation", "Classification"], procedures: ["Obtain loan confirmations from financial institutions", "Review loan agreements for covenants and terms", "Verify interest calculations and accruals", "Assess current/non-current classification", "Review compliance with loan covenants (ISA 570)", "Verify IFRS 16 lease liabilities where applicable"], isa: "ISA 505, ISA 570, IFRS 16", wpRef: "F4.1–F4.6" },
  { id: "equity", code: "G1", title: "Share Capital & Reserves", objective: "Verify share capital and movements in equity", assertions: ["Existence", "Completeness", "Accuracy", "Disclosure"], procedures: ["Agree share register to issued shares", "Verify share allotments and transfers to minutes", "Review CIPC records for consistency", "Verify dividend declarations and payments", "Review other comprehensive income components", "Assess compliance with Companies Act (MOI)"], isa: "ISA 500, IAS 1", wpRef: "G1.1–G1.6" },
  { id: "tax", code: "H1", title: "Taxation", objective: "Verify current and deferred tax balances and compliance", assertions: ["Accuracy", "Completeness", "Valuation", "Disclosure"], procedures: ["Reperform current tax computation", "Agree tax rates to Income Tax Act", "Verify provisional tax payments to SARS records", "Recalculate deferred tax (IAS 12)", "Review tax assessments and disputes with SARS", "Verify estimated tax payments and refunds"], isa: "ISA 500, IAS 12", wpRef: "H1.1–H1.6" },
  { id: "going-concern", code: "I1", title: "Going Concern", objective: "Evaluate management's going concern assessment", assertions: ["Disclosure", "Valuation"], procedures: ["Review cash flow forecasts for reasonableness", "Assess loan covenant compliance", "Evaluate subsequent events for going concern indicators", "Review budgets and profit forecasts", "Inquire of management regarding future plans", "Assess adequacy of going concern disclosures"], isa: "ISA 570", wpRef: "I1.1–I1.6" },
  { id: "related", code: "J1", title: "Related Parties", objective: "Identify and evaluate related party transactions and disclosures", assertions: ["Completeness", "Occurrence", "Disclosure", "Accuracy"], procedures: ["Obtain management's list of related parties", "Cross-check directors' interests register", "Review transactions for arm's length terms", "Search for undisclosed related party transactions", "Verify disclosures per IAS 24", "Review board minutes for related party approvals"], isa: "ISA 550, IAS 24", wpRef: "J1.1–J1.6" },
];

const REPORT_THEME = {
  card: "#1e2130", border: "#2a2e3f", primary: "#4f8cff", primaryGlow: "rgba(79,140,255,0.15)",
  accent: "#00d4aa", text: "#e8eaf0", textMuted: "#8b90a5", textDim: "#5a5f75",
  warning: "#ffb84d", danger: "#ff4d6a", success: "#00d4aa", surface: "#1a1d27",
};

const REPORT_FINDING_SEVERITY = {
  observation: { label: "Observation", color: "#6b7280" },
  low: { label: "Low", color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
  critical: { label: "Critical", color: "#991b1b" },
};

export default function AuditReportsTab({ engagement, risks, findings, theme, findingSeverity }) {
  const t = theme || REPORT_THEME;
  const severity = findingSeverity || REPORT_FINDING_SEVERITY;
  const [reportType, setReportType] = useState("management");
  const [reportView, setReportView] = useState("reports");
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [sampleInputs, setSampleInputs] = useState({ population: "", confidence: "90", expectedError: "1", tolerable: "" });

  const openFindings = findings.filter((f) => f.status === "open");
  const highRiskItems = risks.filter((r) => r.residualLikelihood * r.residualImpact >= 10);
  const completionRate = findings.length ? Math.round(((findings.length - openFindings.length) / findings.length) * 100) : 100;
  const issueValue = findings.length * 125000;
  const clientSlug = (engagement.clientName || "client").replace(/\s+/g, "-").toLowerCase();

  // ─── SAMPLING CALCULATOR (ISA 530) ───────────────────────────────────────
  const confidenceFactors = { "80": 1.61, "85": 1.90, "90": 2.31, "95": 3.0, "99": 4.61 };
  const samplePop = parseFloat(sampleInputs.population) || 0;
  const confidenceFactor = confidenceFactors[sampleInputs.confidence] || 2.31;
  const tolerableRate = parseFloat(sampleInputs.tolerable) || (parseFloat(engagement.materialityLevel) || 0);
  const expectedErrorRate = parseFloat(sampleInputs.expectedError) || 0;
  const sampleSize = tolerableRate > 0 ? Math.min(Math.ceil((confidenceFactor * samplePop) / tolerableRate), samplePop) : 0;

  // ─── DOWNLOAD HELPERS ────────────────────────────────────────────────────
  const downloadBlob = (content, type, name) => {
    const file = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const wrapWordDoc = (bodyHtml, title) => `<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;max-width:700px;margin:40px auto;line-height:1.7;color:#222;font-size:12pt}h1{font-size:16pt;border-bottom:2px solid #1a1a2e;padding-bottom:10px}h2{font-size:13pt;color:#1a1a2e;margin-top:18px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ccc;padding:6px 10px;font-size:10pt;text-align:left}th{background:#f0f0f0;font-weight:bold}ul{margin:4px 0 4px 20px}li{margin:3px 0}</style><title>${title}</title></head><body>${bodyHtml}</body></html>`;

  // ─── REPORT GENERATION ───────────────────────────────────────────────────
  const buildReportLines = () => [
    "AME PRO ACCOUNTING - PROFESSIONAL AUDIT REPORT",
    `Client: ${engagement.clientName || "[Client Name]"}`,
    `Year End: ${engagement.yearEnd || "[Year End]"}`,
    `Report Type: ${reportType === "management" ? "Management Letter" : reportType === "executive" ? "Executive Summary" : "Audit Completion Memo"}`,
    `Date: ${new Date().toLocaleDateString("en-ZA")}`,
    "", "1. EXECUTIVE DASHBOARD",
    `- Total Risks Assessed: ${risks.length}`,
    `- High/Critical Residual Risks: ${highRiskItems.length}`,
    `- Total Findings: ${findings.length}`,
    `- Open Findings: ${openFindings.length}`,
    `- Audit Completion: ${completionRate}%`,
    `- Estimated Exposure: R ${issueValue.toLocaleString("en-ZA")}`,
    "", "2. KEY OPEN FINDINGS",
    ...(openFindings.length ? openFindings.map((f, i) => `${i + 1}. [${f.ref}] ${f.title} (${severity[f.severity]?.label || f.severity})`) : ["No open findings."]),
    "", "3. HIGH RESIDUAL RISKS",
    ...(highRiskItems.length ? highRiskItems.map((r, i) => `${i + 1}. ${r.area} (Score ${r.residualLikelihood * r.residualImpact}) — ${r.response}`) : ["No high residual risks."]),
    "", "4. LEAD SCHEDULE PACK",
    ...LEAD_SCHEDULES.map((l) => `- ${l.code} ${l.title}: ${l.objective} [${l.isa}]`),
  ];

  const downloadWordReport = () => {
    const html = wrapWordDoc(`
      <h1>Professional Audit Report</h1>
      <p><strong>Client:</strong> ${engagement.clientName || "[Client Name]"}<br/>
      <strong>Year End:</strong> ${engagement.yearEnd || "[Year End]"}<br/>
      <strong>Report Type:</strong> ${reportType === "management" ? "Management Letter" : reportType === "executive" ? "Executive Summary" : "Audit Completion Memo"}<br/>
      <strong>Date:</strong> ${new Date().toLocaleDateString("en-ZA")}</p>
      <h2>1. Executive Dashboard</h2>
      <table><tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Total Risks Assessed</td><td>${risks.length}</td></tr>
      <tr><td>High/Critical Residual Risks</td><td>${highRiskItems.length}</td></tr>
      <tr><td>Total Findings</td><td>${findings.length}</td></tr>
      <tr><td>Open Findings</td><td>${openFindings.length}</td></tr>
      <tr><td>Audit Completion</td><td>${completionRate}%</td></tr>
      <tr><td>Estimated Exposure</td><td>R ${issueValue.toLocaleString("en-ZA")}</td></tr></table>
      <h2>2. Open Findings</h2>
      ${openFindings.length ? `<table><tr><th>Ref</th><th>Title</th><th>Severity</th><th>Recommendation</th></tr>${openFindings.map((f) => `<tr><td>${f.ref}</td><td>${f.title}</td><td>${severity[f.severity]?.label || f.severity}</td><td>${f.recommendation || ""}</td></tr>`).join("")}</table>` : "<p>No open findings.</p>"}
      <h2>3. Risk Assessment Summary</h2>
      ${risks.length ? `<table><tr><th>Area</th><th>Inherent Score</th><th>Residual Score</th><th>Response</th></tr>${risks.map((r) => `<tr><td>${r.area}</td><td>${r.inherentLikelihood * r.inherentImpact}</td><td>${r.residualLikelihood * r.residualImpact}</td><td>${r.response}</td></tr>`).join("")}</table>` : "<p>No risks assessed.</p>"}
      <h2>4. Lead Schedule Index</h2>
      <table><tr><th>Ref</th><th>Schedule</th><th>Objective</th><th>ISA</th></tr>
      ${LEAD_SCHEDULES.map((l) => `<tr><td>${l.code}</td><td>${l.title}</td><td>${l.objective}</td><td>${l.isa}</td></tr>`).join("")}</table>
    `, "Audit Report");
    downloadBlob(html, "application/msword;charset=utf-8", `audit-report-${clientSlug}.doc`);
  };

  // ─── ENGAGEMENT LETTER (ISA 210) ─────────────────────────────────────────
  const downloadEngagementLetter = () => {
    const clientName = engagement.clientName || "[Client Name]";
    const yearEnd = engagement.yearEnd || "[Year End]";
    const today = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
    const html = wrapWordDoc(`
      <h1>ENGAGEMENT LETTER</h1>
      <p style="text-align:right">${today}</p>
      <p>The Directors<br/><strong>${clientName}</strong><br/>[Address]</p>
      <p>Dear Directors,</p>
      <h2>1. Objective and Scope of the Audit</h2>
      <p>You have requested that we audit the financial statements of ${clientName}, which comprise the statement of financial position as at ${yearEnd}, and the statement of profit or loss and other comprehensive income, statement of changes in equity and statement of cash flows for the year then ended, and notes to the financial statements, including a summary of significant accounting policies.</p>
      <p>We are pleased to confirm our acceptance and our understanding of this audit engagement by means of this letter. Our audit will be conducted with the objective of our expressing an opinion on the financial statements.</p>
      <h2>2. Responsibilities of the Auditor</h2>
      <p>We will conduct our audit in accordance with International Standards on Auditing (ISAs). Those standards require that we comply with ethical requirements and plan and perform the audit to obtain reasonable assurance about whether the financial statements are free from material misstatement.</p>
      <p>An audit involves performing procedures to obtain audit evidence about the amounts and disclosures in the financial statements. The procedures selected depend on the auditor's judgment, including the assessment of the risks of material misstatement of the financial statements, whether due to fraud or error.</p>
      <p>An audit also includes evaluating the appropriateness of accounting policies used and the reasonableness of accounting estimates made by management, as well as evaluating the overall presentation of the financial statements.</p>
      <p>Because of the inherent limitations of an audit, together with the inherent limitations of internal control, there is an unavoidable risk that some material misstatements may not be detected, even though the audit is properly planned and performed in accordance with ISAs.</p>
      <h2>3. Responsibilities of Management</h2>
      <p>Our audit will be conducted on the basis that management and, where appropriate, those charged with governance acknowledge and understand that they have responsibility:</p>
      <ul>
        <li>For the preparation and fair presentation of the financial statements in accordance with International Financial Reporting Standards (IFRS);</li>
        <li>For such internal control as management determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error;</li>
        <li>To provide us with access to all information of which management is aware that is relevant to the preparation of the financial statements;</li>
        <li>To provide us with additional information that we may request for the purpose of the audit;</li>
        <li>To provide us with unrestricted access to persons within the entity from whom we determine it necessary to obtain audit evidence.</li>
      </ul>
      <h2>4. Reporting</h2>
      <p>We will provide you with an auditor's report on the financial statements in accordance with ISA 700 (Revised). The form and content of our report may need to be amended in light of our audit findings.</p>
      <p>We will also communicate to those charged with governance any significant deficiencies in internal control identified during our audit in accordance with ISA 265.</p>
      <h2>5. Fees</h2>
      <p>Our fees will be based on the time required by the individuals assigned to the engagement, plus out-of-pocket expenses. Individual hourly rates vary according to the degree of responsibility involved and the experience and skill required. We will advise you separately of our fee estimate.</p>
      <h2>6. Applicable Legislation</h2>
      <p>This engagement is subject to the provisions of the Auditing Profession Act 26 of 2005, the Companies Act 71 of 2008, and applicable regulations issued by the Independent Regulatory Board for Auditors (IRBA).</p>
      <p>Please sign and return the attached copy of this letter to indicate your acknowledgement of, and agreement with, the arrangements for our audit.</p>
      <p style="margin-top:32px">Yours faithfully,<br/><strong>AME Business Accountants</strong><br/>Registered Auditors</p>
      <p style="margin-top:40px">Acknowledged and agreed on behalf of ${clientName}:</p>
      <p>_________________________<br/>Director<br/>Date: _________________________</p>
    `, "Engagement Letter");
    downloadBlob(html, "application/msword;charset=utf-8", `engagement-letter-${clientSlug}.doc`);
  };

  // ─── LEAD SCHEDULE DOWNLOAD ──────────────────────────────────────────────
  const downloadLeadSchedule = (schedule) => {
    const clientName = engagement.clientName || "[Client Name]";
    const yearEnd = engagement.yearEnd || "[Year End]";
    const html = wrapWordDoc(`
      <h1>${schedule.code} — ${schedule.title}</h1>
      <table>
        <tr><td style="width:120px"><strong>Client:</strong></td><td>${clientName}</td></tr>
        <tr><td><strong>Year End:</strong></td><td>${yearEnd}</td></tr>
        <tr><td><strong>Standards:</strong></td><td>${schedule.isa}</td></tr>
        <tr><td><strong>WP Reference:</strong></td><td>${schedule.wpRef}</td></tr>
      </table>
      <h2>Audit Objective</h2>
      <p>${schedule.objective}</p>
      <h2>Assertions Tested</h2>
      <p>${schedule.assertions.join(" | ")}</p>
      <h2>Detailed Audit Procedures</h2>
      <table>
        <tr><th>No.</th><th>Procedure</th><th>WP Ref</th><th>Done By</th><th>Date</th><th>Findings</th></tr>
        ${schedule.procedures.map((p, i) => `<tr><td>${i + 1}</td><td>${p}</td><td></td><td></td><td></td><td></td></tr>`).join("")}
      </table>
      <h2>Conclusion</h2>
      <p>Based on the procedures performed, [satisfied / not satisfied] that ${schedule.title.toLowerCase()} is/are fairly stated in all material respects.</p>
      <table style="margin-top:24px">
        <tr><td style="width:200px">Prepared by:</td><td style="width:200px">_______________</td><td>Date: _______________</td></tr>
        <tr><td>Reviewed by:</td><td>_______________</td><td>Date: _______________</td></tr>
        <tr><td>Partner review:</td><td>_______________</td><td>Date: _______________</td></tr>
      </table>
    `, `Lead Schedule ${schedule.code}`);
    downloadBlob(html, "application/msword;charset=utf-8", `lead-schedule-${schedule.code.toLowerCase()}-${clientSlug}.doc`);
  };

  const downloadFullSchedulePack = () => {
    let allHtml = `<h1>AUDIT WORKING PAPER PACK</h1>
      <p><strong>Client:</strong> ${engagement.clientName || "[Client Name]"}<br/>
      <strong>Year End:</strong> ${engagement.yearEnd || "[Year End]"}<br/>
      <strong>Date:</strong> ${new Date().toLocaleDateString("en-ZA")}</p>
      <h2>Index</h2>
      <table><tr><th>Ref</th><th>Schedule</th><th>ISA</th></tr>
      ${LEAD_SCHEDULES.map((l) => `<tr><td>${l.code}</td><td>${l.title}</td><td>${l.isa}</td></tr>`).join("")}</table>
      <div style="page-break-after:always"></div>`;
    LEAD_SCHEDULES.forEach((schedule) => {
      allHtml += `
        <h1>${schedule.code} — ${schedule.title}</h1>
        <p><strong>Objective:</strong> ${schedule.objective}<br/><strong>Standards:</strong> ${schedule.isa}<br/><strong>Assertions:</strong> ${schedule.assertions.join(", ")}</p>
        <table><tr><th>No.</th><th>Procedure</th><th>WP Ref</th><th>Done</th><th>Date</th><th>Findings</th></tr>
        ${schedule.procedures.map((p, i) => `<tr><td>${i + 1}</td><td>${p}</td><td></td><td></td><td></td><td></td></tr>`).join("")}</table>
        <p>Conclusion: _______________________________________________</p>
        <p>Prepared by: _____________ Reviewed by: _____________ Date: _____________</p>
        <div style="page-break-after:always"></div>`;
    });
    downloadBlob(wrapWordDoc(allHtml, "Full Working Paper Pack"), "application/msword;charset=utf-8", `working-paper-pack-${clientSlug}.doc`);
  };

  const viewTabs = [
    { id: "reports", label: "Professional Reports", icon: BarChart3 },
    { id: "leadSchedules", label: "Lead Schedules", icon: FileText },
    { id: "engagement", label: "Engagement Letter", icon: Mail },
    { id: "sampling", label: "Sampling (ISA 530)", icon: Calculator },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Report Centre</h2>
          <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0" }}>Professional reports, lead schedules, engagement letters & sampling</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadWordReport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: t.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            <Download size={14} /> Full Report
          </button>
          <button onClick={downloadFullSchedulePack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: t.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            <FileText size={14} /> Full WP Pack
          </button>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          const active = reportView === tab.id;
          return (
            <button key={tab.id} onClick={() => setReportView(tab.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: `1px solid ${active ? t.primary : t.border}`, background: active ? t.primaryGlow : t.card, color: active ? t.primary : t.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: active ? 600 : 500 }}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── PROFESSIONAL REPORTS ───────────────────────────────────── */}
      {reportView === "reports" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Risks Assessed", value: risks.length, color: t.primary },
              { label: "High Residual", value: highRiskItems.length, color: t.warning },
              { label: "Open Findings", value: openFindings.length, color: t.danger },
              { label: "Completion", value: `${completionRate}%`, color: t.success },
              { label: "Exposure", value: `R${(issueValue / 1000).toFixed(0)}k`, color: t.primary },
            ].map((s) => (
              <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: t.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: t.textMuted, display: "block", marginBottom: 6 }}>Report Template</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontSize: 13, fontFamily: "inherit" }}>
              <option value="management">Management Letter Summary (ISA 265)</option>
              <option value="executive">Executive Audit Summary</option>
              <option value="completion">Audit Completion Memorandum</option>
            </select>
          </div>

          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, marginBottom: 12 }}>
              {reportType === "management" ? "Management Letter Extract (ISA 265)" : reportType === "executive" ? "Executive Audit Summary" : "Audit Completion Memorandum"}
            </h3>
            <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.8 }}>
              <p><strong>Client:</strong> {engagement.clientName || "[Client Name]"}</p>
              <p><strong>Reporting period:</strong> Year ended {engagement.yearEnd || "[Year End]"}</p>
              <p><strong>Materiality:</strong> R {parseInt(engagement.materialityLevel || "0").toLocaleString("en-ZA")} (Performance: R {parseInt(engagement.performanceMateriality || "0").toLocaleString("en-ZA")})</p>
              <p><strong>Overall status:</strong> {highRiskItems.length > 0 || openFindings.length > 0 ? "Attention required before sign-off" : "Ready for sign-off"}</p>
              <p><strong>Estimated exposure:</strong> R {issueValue.toLocaleString("en-ZA")}</p>

              {reportType === "management" && openFindings.length > 0 && (
                <>
                  <p style={{ marginTop: 12 }}><strong>Summary of Findings Communicated:</strong></p>
                  {openFindings.map((f, i) => (
                    <div key={f.id} style={{ marginTop: 8, padding: 12, background: t.surface, borderRadius: 8, borderLeft: `3px solid ${severity[f.severity]?.color || t.textMuted}` }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{i + 1}. [{f.ref}] {f.title}</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}><strong>Condition:</strong> {f.condition}</div>
                      <div style={{ fontSize: 12 }}><strong>Recommendation:</strong> {f.recommendation}</div>
                    </div>
                  ))}
                </>
              )}

              {reportType === "executive" && (
                <>
                  <p style={{ marginTop: 12 }}><strong>Risk Assessment Overview:</strong></p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
                    {[
                      { label: "Low Risk", count: risks.filter((r) => r.residualLikelihood * r.residualImpact < 6).length, color: t.success },
                      { label: "Medium Risk", count: risks.filter((r) => { const s = r.residualLikelihood * r.residualImpact; return s >= 6 && s < 10; }).length, color: t.warning },
                      { label: "High/Critical Risk", count: highRiskItems.length, color: t.danger },
                    ].map((r) => (
                      <div key={r.label} style={{ padding: 10, background: t.surface, borderRadius: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: r.color }}>{r.count}</div>
                        <div style={{ fontSize: 10, color: t.textMuted }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {reportType === "completion" && (
                <>
                  <p style={{ marginTop: 12 }}><strong>Completion Checklist Summary:</strong></p>
                  <div style={{ fontSize: 12, lineHeight: 2 }}>
                    <div>All working papers completed and reviewed: ______</div>
                    <div>Subsequent events reviewed to date: ______</div>
                    <div>Going concern assessment completed: ______</div>
                    <div>Management representations obtained: ______</div>
                    <div>Uncorrected misstatements below materiality: ______</div>
                    <div>Auditor's report form determined: ______</div>
                    <div>File assembly deadline (60 days): ______</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── LEAD SCHEDULES ─────────────────────────────────────────── */}
      {reportView === "leadSchedules" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: t.textMuted }}>{LEAD_SCHEDULES.length} Draftworx-style working paper schedules</div>
          </div>
          {LEAD_SCHEDULES.map((schedule) => {
            const isExpanded = expandedSchedule === schedule.id;
            return (
              <div key={schedule.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => setExpandedSchedule(isExpanded ? null : schedule.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: t.primaryGlow, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: t.primary }}>{schedule.code}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{schedule.title}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{schedule.isa} • {schedule.procedures.length} procedures</div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: t.textMuted, transform: isExpanded ? "rotate(90deg)" : "none", transition: "0.2s" }} />
                </button>
                {isExpanded && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>
                      <strong>Objective:</strong> {schedule.objective}<br />
                      <strong>Assertions:</strong> {schedule.assertions.join(", ")}<br />
                      <strong>WP Reference:</strong> {schedule.wpRef}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
                      <thead>
                        <tr style={{ background: t.surface }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted, borderBottom: `1px solid ${t.border}`, width: 30 }}>#</th>
                          <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted, borderBottom: `1px solid ${t.border}` }}>Procedure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.procedures.map((proc, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: "6px 10px", borderBottom: `1px solid ${t.border}22`, color: t.textDim }}>{idx + 1}</td>
                            <td style={{ padding: "6px 10px", borderBottom: `1px solid ${t.border}22`, color: t.text }}>{proc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => downloadLeadSchedule(schedule)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${t.primary}`, background: t.primaryGlow, color: t.primary, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}>
                      <Download size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />Download Working Paper
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ENGAGEMENT LETTER ──────────────────────────────────────── */}
      {reportView === "engagement" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Engagement Letter</h2>
            <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0" }}>ISA 210 — Agreeing the terms of audit engagements</p>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, padding: 28, color: "#1a1a2e", fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
            <h2 style={{ textAlign: "center", fontSize: 16, fontWeight: 800, borderBottom: "2px solid #1a1a2e", paddingBottom: 10, color: "#1a1a2e" }}>ENGAGEMENT LETTER</h2>
            <p>The Directors<br /><strong>{engagement.clientName || "[Client Name]"}</strong></p>
            <p>Dear Directors,</p>
            <p><strong>1. Objective and Scope</strong><br />You have requested that we audit the financial statements of {engagement.clientName || "[Client Name]"} for the year ended {engagement.yearEnd || "[Year End]"}, comprising the statement of financial position, statement of profit or loss and OCI, statement of changes in equity, statement of cash flows, and notes including significant accounting policies.</p>
            <p><strong>2. Auditor's Responsibilities</strong><br />We will conduct our audit in accordance with ISAs. We will comply with ethical requirements and plan/perform the audit to obtain reasonable assurance about whether the financial statements are free from material misstatement.</p>
            <p><strong>3. Management's Responsibilities</strong><br />Management acknowledges responsibility for: preparation and fair presentation of financial statements per IFRS; internal controls necessary for financial statements free from material misstatement; providing unrestricted access to all information and personnel.</p>
            <p><strong>4. Reporting</strong><br />We will issue an auditor's report per ISA 700 (Revised) and communicate significant deficiencies per ISA 265.</p>
            <p><strong>5. Applicable Legislation</strong><br />Subject to Auditing Profession Act 26 of 2005, Companies Act 71 of 2008, and IRBA regulations.</p>
            <p style={{ fontStyle: "italic", color: "#666" }}>Download the full engagement letter for signatures.</p>
          </div>

          <button onClick={downloadEngagementLetter} style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", background: t.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            <Download size={16} /> Download Engagement Letter (Word)
          </button>
        </div>
      )}

      {/* ── SAMPLING CALCULATOR ─────────────────────────────────────── */}
      {reportView === "sampling" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Sampling Calculator</h2>
            <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0" }}>ISA 530 — Audit sampling methodology</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Sampling Parameters</div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: t.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Population Size (R)</label>
                  <input type="number" value={sampleInputs.population} onChange={(e) => setSampleInputs({ ...sampleInputs, population: e.target.value })} placeholder="e.g. 5000000" style={{ width: "100%", padding: "8px 10px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Confidence Level</label>
                  <select value={sampleInputs.confidence} onChange={(e) => setSampleInputs({ ...sampleInputs, confidence: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, fontSize: 13, fontFamily: "inherit" }}>
                    <option value="80">80% (Low risk)</option>
                    <option value="85">85%</option>
                    <option value="90">90% (Moderate risk)</option>
                    <option value="95">95% (High risk)</option>
                    <option value="99">99% (Very high risk)</option>
                  </select>
                  <div style={{ fontSize: 10, color: t.textDim, marginTop: 3 }}>Factor: {confidenceFactor}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Tolerable Misstatement (R)</label>
                  <input type="number" value={sampleInputs.tolerable || engagement.materialityLevel} onChange={(e) => setSampleInputs({ ...sampleInputs, tolerable: e.target.value })} placeholder={engagement.materialityLevel ? `Materiality: R ${parseInt(engagement.materialityLevel).toLocaleString("en-ZA")}` : "Enter amount"} style={{ width: "100%", padding: "8px 10px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ fontSize: 10, color: t.textDim, marginTop: 3 }}>Usually equals overall materiality or performance materiality</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Expected Error Rate (%)</label>
                  <input type="number" step="0.5" value={sampleInputs.expectedError} onChange={(e) => setSampleInputs({ ...sampleInputs, expectedError: e.target.value })} style={{ width: "100%", padding: "8px 10px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Sample Size Result</div>
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: t.primary }}>{sampleSize || "—"}</div>
                <div style={{ fontSize: 13, color: t.textMuted }}>items to test</div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { label: "Population", value: samplePop ? `R ${samplePop.toLocaleString("en-ZA")}` : "—" },
                  { label: "Confidence Factor", value: confidenceFactor },
                  { label: "Tolerable Misstatement", value: tolerableRate ? `R ${tolerableRate.toLocaleString("en-ZA")}` : "—" },
                  { label: "Expected Error", value: `${expectedErrorRate}%` },
                  { label: "Formula", value: "n = (CF × Population) ÷ Tolerable" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${t.border}22` }}>
                    <span style={{ fontSize: 12, color: t.textMuted }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: 10, background: t.surface, borderRadius: 8, fontSize: 11, color: t.textDim, lineHeight: 1.5 }}>
                ISA 530.A11 — Sample size is a function of acceptable risk of incorrect conclusion, tolerable misstatement, and expected misstatement. Higher risk assessments require larger samples.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
