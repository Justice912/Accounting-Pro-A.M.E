import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, ClipboardCheck, Shield, FileText, Send, Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, Clock, Download, RotateCcw } from "lucide-react";
import AuditReportsTab from "./AuditReportsTab";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ISA_COMPONENTS = [
  { id: "revenue", name: "Revenue & Income", isa: "ISA 240, ISA 315, IFRS 15", risk: "high" },
  { id: "cash", name: "Cash & Bank", isa: "ISA 500, ISA 505", risk: "medium" },
  { id: "receivables", name: "Trade Receivables", isa: "ISA 500, ISA 505, ISA 540", risk: "medium" },
  { id: "payables", name: "Trade Payables & Accruals", isa: "ISA 500, ISA 501", risk: "medium" },
  { id: "inventory", name: "Inventory", isa: "ISA 501, IAS 2", risk: "high" },
  { id: "ppe", name: "Property, Plant & Equipment", isa: "ISA 500, IAS 16, IAS 36", risk: "medium" },
  { id: "payroll", name: "Payroll & Employee Benefits", isa: "ISA 500, IAS 19", risk: "medium" },
  { id: "provisions", name: "Provisions & Contingencies", isa: "ISA 501, ISA 540, IAS 37", risk: "high" },
  { id: "loans", name: "Loans & Borrowings", isa: "ISA 505, ISA 570, IFRS 16", risk: "medium" },
  { id: "equity", name: "Share Capital & Reserves", isa: "ISA 500, IAS 1", risk: "low" },
  { id: "tax", name: "Taxation", isa: "ISA 500, IAS 12", risk: "medium" },
  { id: "related", name: "Related Parties", isa: "ISA 550, IAS 24", risk: "high" },
];

const ASSERTIONS = ["Completeness", "Occurrence", "Accuracy", "Cut-off", "Classification", "Existence", "Rights & Obligations", "Valuation"];
const SCOTABD = ["Statement", "Completeness", "Occurrence", "Timing", "Accuracy", "Balance", "Disclosure"];

const RISK_LEVELS = {
  low: { label: "Low", color: "#22c55e", bg: "#dcfce7" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#fef3c7" },
  high: { label: "High", color: "#ef4444", bg: "#fee2e2" },
  critical: { label: "Critical", color: "#991b1b", bg: "#fecaca" },
};

const FINDING_SEVERITY = {
  observation: { label: "Observation", color: "#6b7280", icon: "○" },
  low: { label: "Low", color: "#22c55e", icon: "●" },
  medium: { label: "Medium", color: "#f59e0b", icon: "●" },
  high: { label: "High", color: "#ef4444", icon: "●" },
  critical: { label: "Critical", color: "#991b1b", icon: "◆" },
};

const DEFAULT_RISKS = [
  { id: 1, area: "Revenue Recognition", description: "Risk of material misstatement due to fraud in revenue recognition per ISA 240", inherentLikelihood: 4, inherentImpact: 5, controls: "Segregation of duties, automated invoice matching, monthly analytical review", controlEffectiveness: 3, residualLikelihood: 2, residualImpact: 4, response: "Extended substantive testing, cut-off testing, journal entry analysis" },
  { id: 2, area: "Management Override", description: "Risk of management override of controls per ISA 240 — presumed risk", inherentLikelihood: 3, inherentImpact: 5, controls: "Board oversight, independent audit committee, whistleblower policy", controlEffectiveness: 2, residualLikelihood: 2, residualImpact: 4, response: "Journal entry testing, review of estimates, evaluate business rationale of significant transactions" },
  { id: 3, area: "Going Concern", description: "Risk that entity may not continue as a going concern per ISA 570", inherentLikelihood: 2, inherentImpact: 5, controls: "Cash flow monitoring, covenant tracking, board review of forecasts", controlEffectiveness: 3, residualLikelihood: 1, residualImpact: 5, response: "Review cash flow forecasts, assess loan covenants, evaluate subsequent events" },
];

const DEFAULT_FINDINGS = [
  { id: 1, ref: "F-001", title: "Lack of segregation of duties in cash receipting", component: "Cash & Bank", severity: "high", condition: "One individual is responsible for receiving, recording, and depositing cash receipts without independent review.", criteria: "ISA 315 — Effective internal controls require adequate segregation of duties to prevent and detect errors or fraud.", cause: "Small finance team with limited staff capacity.", effect: "Increased risk of misappropriation of cash receipts going undetected.", recommendation: "Assign cash receipt recording to a different staff member than the person handling physical cash. Implement daily supervisory review of cash receipts journal.", managementResponse: "", targetDate: "", status: "open" },
  { id: 2, ref: "F-002", title: "Revenue cut-off error identified", component: "Revenue & Income", severity: "medium", condition: "Three sales invoices totaling R245,000 dated in January were recorded in the December general ledger.", criteria: "IFRS 15 — Revenue should be recognised when control passes to the customer. IAS 1 requires proper period allocation.", cause: "Month-end close procedures do not include a formal cut-off review checklist.", effect: "Revenue overstated by R245,000 at year-end (below materiality but noted for management attention).", recommendation: "Implement a formal month-end cut-off checklist that requires matching of delivery notes to invoice dates. Review all invoices within 5 days of year-end.", managementResponse: "", targetDate: "", status: "open" },
];



// ─── AUDIT PROCEDURES DATABASE ────────────────────────────────────────────────
const AUDIT_PROCEDURES = {
  revenue: [
    { ref: "A-01", procedure: "Obtain and review revenue recognition policy for compliance with IFRS 15", assertion: "Accuracy", riskRating: "high" },
    { ref: "A-02", procedure: "Perform analytical review: compare revenue to prior year, budget, and industry trends", assertion: "Completeness", riskRating: "medium" },
    { ref: "A-03", procedure: "Test a sample of sales transactions to source documents (invoices, delivery notes, contracts)", assertion: "Occurrence", riskRating: "high" },
    { ref: "A-04", procedure: "Test revenue cut-off: examine transactions around year-end for proper period allocation", assertion: "Cut-off", riskRating: "high" },
    { ref: "A-05", procedure: "Review credit notes issued post year-end for evidence of prior period adjustments", assertion: "Occurrence", riskRating: "medium" },
    { ref: "A-06", procedure: "Perform fraud risk assessment per ISA 240 — presumption of fraud in revenue recognition", assertion: "Occurrence", riskRating: "high" },
    { ref: "A-07", procedure: "Test journal entries posted to revenue accounts for unusual or manual entries", assertion: "Accuracy", riskRating: "high" },
    { ref: "A-08", procedure: "Verify disclosure of revenue streams and accounting policies per IAS 1 and IFRS 15", assertion: "Classification", riskRating: "low" },
    { ref: "A-09", procedure: "Evaluate related party sales transactions per ISA 550 and IAS 24", assertion: "Occurrence", riskRating: "high" },
    { ref: "A-10", procedure: "Recalculate VAT on output tax and agree to VAT201 returns", assertion: "Accuracy", riskRating: "medium" },
  ],
  cash: [
    { ref: "B-01", procedure: "Obtain bank confirmations for all bank accounts per ISA 505", assertion: "Existence", riskRating: "high" },
    { ref: "B-02", procedure: "Obtain and review bank reconciliations at year-end", assertion: "Completeness", riskRating: "medium" },
    { ref: "B-03", procedure: "Test reconciling items: trace outstanding deposits and cheques to post year-end bank statement", assertion: "Existence", riskRating: "medium" },
    { ref: "B-04", procedure: "Perform bank transfer test (kiting test) around year-end", assertion: "Cut-off", riskRating: "high" },
    { ref: "B-05", procedure: "Verify all bank accounts are disclosed, including dormant and closed accounts", assertion: "Completeness", riskRating: "medium" },
    { ref: "B-06", procedure: "Test a sample of payments to supporting invoices and authorisation", assertion: "Occurrence", riskRating: "medium" },
    { ref: "B-07", procedure: "Review petty cash: count, reconcile, and verify replenishments", assertion: "Existence", riskRating: "low" },
    { ref: "B-08", procedure: "Inspect bank facility letters for covenants, guarantees, and overdraft limits", assertion: "Rights & Obligations", riskRating: "medium" },
  ],
  receivables: [
    { ref: "C-01", procedure: "Obtain debtors age analysis and agree total to trial balance", assertion: "Completeness", riskRating: "medium" },
    { ref: "C-02", procedure: "Send debtor confirmations per ISA 505 for a sample of balances", assertion: "Existence", riskRating: "high" },
    { ref: "C-03", procedure: "For non-replies, perform alternative procedures: subsequent receipts, invoices, delivery notes", assertion: "Existence", riskRating: "medium" },
    { ref: "C-04", procedure: "Evaluate the ECL/impairment provision per IFRS 9 — review methodology and assumptions", assertion: "Valuation", riskRating: "high" },
    { ref: "C-05", procedure: "Review post year-end credit notes and returns for evidence of overstatement", assertion: "Valuation", riskRating: "medium" },
    { ref: "C-06", procedure: "Test receivables cut-off: match invoices to delivery notes around year-end", assertion: "Cut-off", riskRating: "medium" },
    { ref: "C-07", procedure: "Review related party receivables per ISA 550 and IAS 24 for arm's length terms", assertion: "Rights & Obligations", riskRating: "high" },
    { ref: "C-08", procedure: "Verify adequacy of disclosure: trade vs other receivables, ECL methodology, credit risk", assertion: "Classification", riskRating: "low" },
  ],
  payables: [
    { ref: "D-01", procedure: "Obtain creditors age analysis and agree total to trial balance", assertion: "Completeness", riskRating: "medium" },
    { ref: "D-02", procedure: "Reconcile supplier statements to creditors ledger for major suppliers", assertion: "Completeness", riskRating: "medium" },
    { ref: "D-03", procedure: "Search for unrecorded liabilities: review post year-end payments and invoices received after year-end", assertion: "Completeness", riskRating: "high" },
    { ref: "D-04", procedure: "Test a sample of creditor balances to supplier invoices and GRN documentation", assertion: "Existence", riskRating: "medium" },
    { ref: "D-05", procedure: "Review accruals: verify calculation basis, recalculate material accruals (leave, bonuses, utilities)", assertion: "Valuation", riskRating: "medium" },
    { ref: "D-06", procedure: "Test payables cut-off: match GRNs and invoices around year-end", assertion: "Cut-off", riskRating: "medium" },
    { ref: "D-07", procedure: "Verify VAT input tax claims agree to supplier invoices and are valid tax invoices", assertion: "Accuracy", riskRating: "medium" },
  ],
  inventory: [
    { ref: "E-01", procedure: "Attend physical stock count per ISA 501 — observe counting procedures and perform test counts", assertion: "Existence", riskRating: "high" },
    { ref: "E-02", procedure: "Test count sheets: trace test counts to final inventory listing and vice versa", assertion: "Completeness", riskRating: "high" },
    { ref: "E-03", procedure: "Test inventory costing methodology per IAS 2 (FIFO, weighted average) — recalculate for a sample", assertion: "Valuation", riskRating: "high" },
    { ref: "E-04", procedure: "Assess net realisable value (NRV): compare cost to selling price less costs to sell for a sample", assertion: "Valuation", riskRating: "high" },
    { ref: "E-05", procedure: "Review slow-moving, obsolete, and damaged inventory — evaluate write-down adequacy", assertion: "Valuation", riskRating: "medium" },
    { ref: "E-06", procedure: "Test inventory cut-off: examine last GRNs and despatch notes before and after year-end", assertion: "Cut-off", riskRating: "high" },
    { ref: "E-07", procedure: "Verify inventory held by third parties — obtain confirmation or inspect", assertion: "Existence", riskRating: "medium" },
    { ref: "E-08", procedure: "Test inventory roll-forward/roll-back from count date to year-end (if count not at year-end)", assertion: "Completeness", riskRating: "medium" },
  ],
  ppe: [
    { ref: "F-01", procedure: "Obtain fixed asset register and agree totals (cost, accumulated depreciation, NBV) to trial balance", assertion: "Completeness", riskRating: "medium" },
    { ref: "F-02", procedure: "Test additions: vouch a sample to supplier invoices, contracts, and board approvals", assertion: "Occurrence", riskRating: "medium" },
    { ref: "F-03", procedure: "Test disposals: verify proceeds, profit/loss on disposal, and authorisation", assertion: "Completeness", riskRating: "medium" },
    { ref: "F-04", procedure: "Recalculate depreciation for a sample of assets — verify useful lives, residual values, and methods per IAS 16", assertion: "Valuation", riskRating: "medium" },
    { ref: "F-05", procedure: "Perform physical verification of a sample of assets per the register", assertion: "Existence", riskRating: "medium" },
    { ref: "F-06", procedure: "Assess indicators of impairment per IAS 36 — review impairment testing where applicable", assertion: "Valuation", riskRating: "high" },
    { ref: "F-07", procedure: "Review capitalisation policy: verify items are correctly capitalised vs expensed", assertion: "Classification", riskRating: "medium" },
    { ref: "F-08", procedure: "If revaluation model used: verify valuer's competence (ISA 500), assumptions, and disclosure", assertion: "Valuation", riskRating: "high" },
  ],
  payroll: [
    { ref: "G-01", procedure: "Perform analytical review: compare total payroll cost month-on-month, to prior year, and to budget", assertion: "Completeness", riskRating: "medium" },
    { ref: "G-02", procedure: "Test gross-to-net calculation for a sample of employees — verify deductions, PAYE, UIF, SDL", assertion: "Accuracy", riskRating: "medium" },
    { ref: "G-03", procedure: "Test for ghost employees: compare payroll register to HR records, ID documents, and bank accounts", assertion: "Occurrence", riskRating: "high" },
    { ref: "G-04", procedure: "Agree EMP201 monthly submissions to payroll summaries and verify proof of payment to SARS", assertion: "Accuracy", riskRating: "medium" },
    { ref: "G-05", procedure: "Review EMP501 annual reconciliation — verify IRP5 certificates agree to payroll records", assertion: "Completeness", riskRating: "medium" },
    { ref: "G-06", procedure: "Verify directors' emoluments and related disclosures per Companies Act and IAS 24", assertion: "Completeness", riskRating: "high" },
    { ref: "G-07", procedure: "Test leave provision: verify leave balances and rates used in calculation", assertion: "Valuation", riskRating: "medium" },
    { ref: "G-08", procedure: "Review bonus and 13th cheque accruals — verify calculation basis and approval", assertion: "Valuation", riskRating: "medium" },
  ],
  provisions: [
    { ref: "H-01", procedure: "Obtain lawyer's letter per ISA 501 — assess completeness and evaluate pending litigation", assertion: "Completeness", riskRating: "high" },
    { ref: "H-02", procedure: "Evaluate IAS 37 recognition criteria: present obligation, probable outflow, reliable estimate", assertion: "Valuation", riskRating: "high" },
    { ref: "H-03", procedure: "Review warranty provisions: test underlying data, claims history, and estimation methodology", assertion: "Valuation", riskRating: "medium" },
    { ref: "H-04", procedure: "Assess contingent liabilities: review board minutes, legal correspondence, and management representations", assertion: "Completeness", riskRating: "high" },
    { ref: "H-05", procedure: "Verify no hidden reserves — ensure provisions are not overstated to smooth profits", assertion: "Valuation", riskRating: "medium" },
    { ref: "H-06", procedure: "Evaluate uncertain tax positions per IFRIC 23 — assess probability and measurement", assertion: "Valuation", riskRating: "high" },
    { ref: "H-07", procedure: "Verify adequacy of disclosure: nature, timing, uncertainties, and movement schedules", assertion: "Classification", riskRating: "medium" },
  ],
  loans: [
    { ref: "I-01", procedure: "Obtain bank/lender confirmations per ISA 505 for all loan balances", assertion: "Existence", riskRating: "high" },
    { ref: "I-02", procedure: "Inspect loan agreements: terms, interest rates, repayment schedule, covenants, and security", assertion: "Rights & Obligations", riskRating: "medium" },
    { ref: "I-03", procedure: "Recalculate interest expense and accrued interest at year-end", assertion: "Accuracy", riskRating: "medium" },
    { ref: "I-04", procedure: "Verify covenant compliance — assess impact of any breaches on classification and going concern", assertion: "Valuation", riskRating: "high" },
    { ref: "I-05", procedure: "Assess going concern per ISA 570: debt maturity, refinancing, and cash flow forecasts", assertion: "Valuation", riskRating: "high" },
    { ref: "I-06", procedure: "Review lease agreements per IFRS 16: verify right-of-use assets and lease liabilities", assertion: "Completeness", riskRating: "medium" },
    { ref: "I-07", procedure: "Verify current/non-current classification of loan balances per IAS 1", assertion: "Classification", riskRating: "medium" },
    { ref: "I-08", procedure: "Review related party loans per ISA 550 — arm's length terms, interest, and disclosure", assertion: "Rights & Obligations", riskRating: "high" },
  ],
  equity: [
    { ref: "J-01", procedure: "Agree share capital to CIPC records and MOI", assertion: "Existence", riskRating: "low" },
    { ref: "J-02", procedure: "Verify share movements during the year: new issues, buy-backs, transfers", assertion: "Completeness", riskRating: "low" },
    { ref: "J-03", procedure: "Verify dividends declared and paid — board resolution, withholding tax, solvency and liquidity test", assertion: "Accuracy", riskRating: "medium" },
    { ref: "J-04", procedure: "Review reserves movements and ensure proper disclosure per IAS 1", assertion: "Classification", riskRating: "low" },
  ],
  tax: [
    { ref: "K-01", procedure: "Obtain SARS statement of account and agree balances to general ledger", assertion: "Completeness", riskRating: "medium" },
    { ref: "K-02", procedure: "Recalculate current tax provision using applicable tax rate and adjusting for permanent/temporary differences", assertion: "Accuracy", riskRating: "high" },
    { ref: "K-03", procedure: "Verify deferred tax calculation per IAS 12 — review temporary differences and applicable rates", assertion: "Valuation", riskRating: "high" },
    { ref: "K-04", procedure: "Review provisional tax payments (IRP6) — verify accuracy and timely submission", assertion: "Completeness", riskRating: "medium" },
    { ref: "K-05", procedure: "Recalculate VAT reconciliation: output tax vs input tax, agree to VAT201 returns", assertion: "Accuracy", riskRating: "medium" },
    { ref: "K-06", procedure: "Verify tax rate reconciliation disclosure — explain effective vs statutory rate differences", assertion: "Classification", riskRating: "medium" },
  ],
  related: [
    { ref: "L-01", procedure: "Identify all related parties per IAS 24: directors, shareholders, subsidiaries, key management", assertion: "Completeness", riskRating: "high" },
    { ref: "L-02", procedure: "Review transactions with related parties: verify arm's length terms and commercial substance", assertion: "Occurrence", riskRating: "high" },
    { ref: "L-03", procedure: "Inspect board minutes for related party approvals and conflict of interest declarations", assertion: "Completeness", riskRating: "medium" },
    { ref: "L-04", procedure: "Obtain management representations regarding completeness of related party disclosures", assertion: "Completeness", riskRating: "medium" },
    { ref: "L-05", procedure: "Verify IAS 24 disclosure: nature of relationship, transactions, balances, terms, and key management compensation", assertion: "Classification", riskRating: "high" },
  ],
};

// ─── SYSTEM PROMPT FOR AUDIT AI ───────────────────────────────────────────────
const AUDIT_SYSTEM_PROMPT = `You are an expert External Auditor AI assistant integrated into AME Pro Accounting software. You specialise in South African external/statutory audits aligned with International Standards on Auditing (ISAs), IFRS, and IRBA requirements.

Your knowledge covers:
- All ISAs (ISA 200-810) with practical application guidance
- IFRS and IFRS for SMEs financial reporting standards
- South African specific: Companies Act 71 of 2008, IRBA Code, King IV, SARS compliance
- Draftworx and CaseWare audit software navigation
- Risk-based audit methodology: planning, execution, completion, reporting
- Materiality calculations (ISA 320), sampling (ISA 530), analytical procedures (ISA 520)
- Fraud considerations (ISA 240), going concern (ISA 570), subsequent events (ISA 560)
- Audit opinions: unmodified, qualified, adverse, disclaimer (ISA 700-706)
- ISQM 1 & 2, ISA 220 quality management

When answering:
1. Always cite the relevant ISA or standard
2. Give practical, actionable guidance — not just theory
3. Use South African context (SARS, CIPC, IRBA, JSE where relevant)
4. Reference Draftworx navigation paths when discussing audit procedures
5. Be concise but thorough — think like a senior audit manager coaching a clerk
6. Format responses clearly with headings and steps where appropriate

Respond ONLY in JSON format: {"response": "your response text here"}`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const theme = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceHover: "#232735",
  card: "#1e2130",
  border: "#2a2e3f",
  borderLight: "#353a4f",
  primary: "#4f8cff",
  primaryDark: "#3a6fd8",
  primaryGlow: "rgba(79,140,255,0.15)",
  accent: "#00d4aa",
  accentDark: "#00b892",
  text: "#e8eaf0",
  textMuted: "#8b90a5",
  textDim: "#5a5f75",
  danger: "#ff4d6a",
  warning: "#ffb84d",
  success: "#00d4aa",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AuditModule() {
  const [activeTab, setActiveTab] = useState("programs");
  const [risks, setRisks] = useState(DEFAULT_RISKS);
  const [findings, setFindings] = useState(DEFAULT_FINDINGS);
  const [engagement, setEngagement] = useState({
    clientName: "",
    yearEnd: "",
    auditType: "statutory",
    materialityLevel: "",
    performanceMateriality: "",
  });

  const tabs = [
    { id: "programs", label: "Audit Programs", icon: ClipboardCheck },
    { id: "risk", label: "Risk Assessment", icon: Shield },
    { id: "findings", label: "Findings Tracker", icon: AlertTriangle },
    { id: "reports", label: "Audit Reports", icon: FileText },
    { id: "chatbot", label: "Audit AI Assistant", icon: MessageSquare },
  ];

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "calc(100vh - 120px)", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${theme.surface} 0%, #161929 100%)`, borderBottom: `1px solid ${theme.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff" }}>EA</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>External Audit Module</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>AME Pro Accounting • ISA Compliant</div>
          </div>
        </div>
        <EngagementBar engagement={engagement} setEngagement={setEngagement} />
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: "0 16px", gap: 2 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: active ? theme.primaryGlow : "transparent", color: active ? theme.primary : theme.textMuted, border: "none", borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 500, transition: "all 0.2s", fontFamily: "inherit" }}>
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px", maxHeight: "calc(100vh - 230px)", overflowY: "auto" }}>
        {activeTab === "programs" && <AuditProgramsTab engagement={engagement} />}
        {activeTab === "risk" && <RiskAssessmentTab engagement={engagement} risks={risks} setRisks={setRisks} />}
        {activeTab === "findings" && <FindingsTab engagement={engagement} findings={findings} setFindings={setFindings} />}
        {activeTab === "reports" && <AuditReportsTab engagement={engagement} risks={risks} findings={findings} />}
        {activeTab === "chatbot" && <ChatbotTab />}
      </div>
    </div>
  );
}

// ─── ENGAGEMENT BAR ───────────────────────────────────────────────────────────
function EngagementBar({ engagement, setEngagement }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
        {engagement.clientName || "Set Engagement Details"}
        <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s" }} />
      </button>
      {expanded && (
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 6, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 18, width: 320, zIndex: 50, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: theme.primary }}>Engagement Details</div>
          {[
            { key: "clientName", label: "Client Name", type: "text", placeholder: "e.g. ABC Trading (Pty) Ltd" },
            { key: "yearEnd", label: "Year End", type: "date" },
            { key: "materialityLevel", label: "Overall Materiality (R)", type: "number", placeholder: "e.g. 500000" },
            { key: "performanceMateriality", label: "Performance Materiality (R)", type: "number", placeholder: "e.g. 375000" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4 }}>{label}</label>
              <input type={type} value={engagement[key]} onChange={(e) => setEngagement({ ...engagement, [key]: e.target.value })} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          ))}
          <button onClick={() => setExpanded(false)} style={{ width: "100%", padding: "8px", background: theme.primary, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Save</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: AUDIT PROGRAMS & CHECKLISTS
// ═══════════════════════════════════════════════════════════════════════════════
function AuditProgramsTab({ engagement }) {
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [generatedPrograms, setGeneratedPrograms] = useState({});
  const [expandedProgram, setExpandedProgram] = useState(null);

  const toggleComponent = (id) => {
    setSelectedComponents((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedComponents(ISA_COMPONENTS.map((c) => c.id));
  };

  const generatePrograms = () => {
    const programs = {};
    selectedComponents.forEach((id) => {
      const procedures = AUDIT_PROCEDURES[id] || [];
      programs[id] = procedures.map((p) => ({
        ...p,
        status: "pending",
        workingPaperRef: "",
        performedBy: "",
        reviewedBy: "",
        notes: "",
      }));
    });
    setGeneratedPrograms(programs);
    if (selectedComponents.length > 0) setExpandedProgram(selectedComponents[0]);
  };

  const updateProcedureStatus = (componentId, refId, status) => {
    setGeneratedPrograms((prev) => ({
      ...prev,
      [componentId]: prev[componentId].map((p) => p.ref === refId ? { ...p, status } : p),
    }));
  };

  const getProgress = (componentId) => {
    const procs = generatedPrograms[componentId] || [];
    const done = procs.filter((p) => p.status !== "pending").length;
    return procs.length > 0 ? Math.round((done / procs.length) * 100) : 0;
  };

  return (
    <div>
      {Object.keys(generatedPrograms).length === 0 ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Select Financial Statement Components</h2>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>Choose which areas to generate audit programs for</p>
            </div>
            <button onClick={selectAll} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.primary, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Select All</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {ISA_COMPONENTS.map((comp) => {
              const selected = selectedComponents.includes(comp.id);
              return (
                <button key={comp.id} onClick={() => toggleComponent(comp.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: selected ? theme.primaryGlow : theme.card, border: `1px solid ${selected ? theme.primary : theme.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "inherit" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${selected ? theme.primary : theme.borderLight}`, background: selected ? theme.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: theme.text }}>{comp.name}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>{comp.isa}</div>
                    <span style={{ display: "inline-block", marginTop: 5, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: RISK_LEVELS[comp.risk].bg, color: RISK_LEVELS[comp.risk].color }}>{RISK_LEVELS[comp.risk].label} Risk</span>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedComponents.length > 0 && (
            <button onClick={generatePrograms} style={{ marginTop: 20, padding: "12px 28px", background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 15px rgba(79,140,255,0.3)" }}>
              Generate {selectedComponents.length} Audit Program{selectedComponents.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Audit Programs {engagement.clientName && `— ${engagement.clientName}`}
            </h2>
            <button onClick={() => { setGeneratedPrograms({}); setExpandedProgram(null); }} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textMuted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {Object.entries(generatedPrograms).map(([componentId, procedures]) => {
            const comp = ISA_COMPONENTS.find((c) => c.id === componentId);
            const isExpanded = expandedProgram === componentId;
            const progress = getProgress(componentId);
            return (
              <div key={componentId} style={{ marginBottom: 8, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setExpandedProgram(isExpanded ? null : componentId)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ChevronRight size={16} style={{ color: theme.textMuted, transform: isExpanded ? "rotate(90deg)" : "none", transition: "0.2s" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{comp.name}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{procedures.length} procedures • {comp.isa}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 120, height: 6, background: theme.surface, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? theme.success : theme.primary, borderRadius: 3, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 12, color: theme.textMuted, width: 35, textAlign: "right" }}>{progress}%</span>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ padding: "0 18px 18px" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                            {["Ref", "Procedure", "Assertion", "Risk", "Status"].map((h) => (
                              <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: theme.textMuted, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {procedures.map((proc) => (
                            <tr key={proc.ref} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                              <td style={{ padding: "10px", color: theme.primary, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 11 }}>{proc.ref}</td>
                              <td style={{ padding: "10px", color: theme.text, lineHeight: 1.5, minWidth: 300 }}>{proc.procedure}</td>
                              <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                <span style={{ padding: "3px 8px", borderRadius: 4, background: theme.surface, color: theme.textMuted, fontSize: 11 }}>{proc.assertion}</span>
                              </td>
                              <td style={{ padding: "10px" }}>
                                <span style={{ padding: "3px 8px", borderRadius: 4, background: RISK_LEVELS[proc.riskRating].bg, color: RISK_LEVELS[proc.riskRating].color, fontSize: 10, fontWeight: 600 }}>{RISK_LEVELS[proc.riskRating].label}</span>
                              </td>
                              <td style={{ padding: "10px" }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {["pending", "done", "issue", "na"].map((s) => (
                                    <button key={s} onClick={() => updateProcedureStatus(componentId, proc.ref, s)} title={s === "done" ? "Complete" : s === "issue" ? "Finding" : s === "na" ? "N/A" : "Pending"} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${proc.status === s ? (s === "done" ? theme.success : s === "issue" ? theme.danger : theme.textMuted) : theme.border}`, background: proc.status === s ? (s === "done" ? theme.success + "22" : s === "issue" ? theme.danger + "22" : theme.surface) : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                                      {s === "done" && <CheckCircle size={13} color={proc.status === s ? theme.success : theme.textDim} />}
                                      {s === "issue" && <XCircle size={13} color={proc.status === s ? theme.danger : theme.textDim} />}
                                      {s === "pending" && <Clock size={13} color={proc.status === s ? theme.textMuted : theme.textDim} />}
                                      {s === "na" && <span style={{ fontSize: 9, color: proc.status === s ? theme.textMuted : theme.textDim, fontWeight: 700 }}>N/A</span>}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: RISK ASSESSMENT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
function RiskAssessmentTab({ engagement, risks, setRisks }) {
  const [showAddRisk, setShowAddRisk] = useState(false);

  const getRiskScore = (likelihood, impact) => likelihood * impact;
  const getRiskLevel = (score) => {
    if (score >= 16) return "critical";
    if (score >= 10) return "high";
    if (score >= 5) return "medium";
    return "low";
  };

  const addRisk = (risk) => {
    setRisks([...risks, { ...risk, id: Date.now() }]);
    setShowAddRisk(false);
  };

  const removeRisk = (id) => setRisks(risks.filter((r) => r.id !== id));

  const heatMapData = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => {
      const likelihood = col + 1;
      const impact = 5 - row;
      const matchingRisks = risks.filter((r) => r.residualLikelihood === likelihood && r.residualImpact === impact);
      return { likelihood, impact, risks: matchingRisks, score: likelihood * impact };
    })
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Risk Assessment Matrix</h2>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 315 — Identifying and assessing risks of material misstatement</p>
        </div>
        <button onClick={() => setShowAddRisk(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: theme.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
          <Plus size={15} /> Add Risk
        </button>
      </div>

      {/* Risk Heat Map */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Residual Risk Heat Map</div>
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingRight: 8, paddingTop: 0, paddingBottom: 4 }}>
            {[5, 4, 3, 2, 1].map((i) => (
              <div key={i} style={{ height: 52, display: "flex", alignItems: "center", fontSize: 11, color: theme.textMuted }}>{i}</div>
            ))}
            <div style={{ fontSize: 10, color: theme.textDim, marginTop: 4, transform: "rotate(-90deg)", transformOrigin: "center", whiteSpace: "nowrap", position: "relative", left: -10 }}>Impact →</div>
          </div>
          <div style={{ flex: 1 }}>
            {heatMapData.map((row, ri) => (
              <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 4 }}>
                {row.map((cell, ci) => {
                  const level = getRiskLevel(cell.score);
                  return (
                    <div key={ci} style={{ height: 52, borderRadius: 6, background: cell.risks.length > 0 ? RISK_LEVELS[level].color + "33" : theme.surface, border: `1px solid ${cell.risks.length > 0 ? RISK_LEVELS[level].color + "55" : theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {cell.risks.length > 0 && (
                        <div title={cell.risks.map((r) => r.area).join(", ")} style={{ width: 24, height: 24, borderRadius: "50%", background: RISK_LEVELS[level].color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{cell.risks.length}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 11, color: theme.textMuted }}>{i}</div>
              ))}
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: theme.textDim, marginTop: 4 }}>Likelihood →</div>
          </div>
        </div>
      </div>

      {/* Risk Register */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {risks.map((risk) => {
          const inherentScore = getRiskScore(risk.inherentLikelihood, risk.inherentImpact);
          const residualScore = getRiskScore(risk.residualLikelihood, risk.residualImpact);
          const inherentLevel = getRiskLevel(inherentScore);
          const residualLevel = getRiskLevel(residualScore);
          return (
            <div key={risk.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{risk.area}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, lineHeight: 1.5 }}>{risk.description}</div>
                </div>
                <button onClick={() => removeRisk(risk.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                  <Trash2 size={14} color={theme.textDim} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={{ padding: 10, background: theme.surface, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, marginBottom: 6 }}>INHERENT RISK</div>
                  <span style={{ padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 700, background: RISK_LEVELS[inherentLevel].bg, color: RISK_LEVELS[inherentLevel].color }}>{inherentScore} — {RISK_LEVELS[inherentLevel].label}</span>
                  <div style={{ fontSize: 11, color: theme.textDim, marginTop: 6 }}>L:{risk.inherentLikelihood} × I:{risk.inherentImpact}</div>
                </div>
                <div style={{ padding: 10, background: theme.surface, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, marginBottom: 6 }}>CONTROLS</div>
                  <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.5 }}>{risk.controls}</div>
                </div>
                <div style={{ padding: 10, background: theme.surface, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, marginBottom: 6 }}>RESIDUAL RISK</div>
                  <span style={{ padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 700, background: RISK_LEVELS[residualLevel].bg, color: RISK_LEVELS[residualLevel].color }}>{residualScore} — {RISK_LEVELS[residualLevel].label}</span>
                  <div style={{ fontSize: 11, color: theme.textDim, marginTop: 6 }}>L:{risk.residualLikelihood} × I:{risk.residualImpact}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, padding: 10, background: theme.primaryGlow, borderRadius: 8, border: `1px solid ${theme.primary}33` }}>
                <div style={{ fontSize: 10, color: theme.primary, fontWeight: 600, marginBottom: 4 }}>AUDIT RESPONSE</div>
                <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.5 }}>{risk.response}</div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddRisk && <AddRiskModal onAdd={addRisk} onClose={() => setShowAddRisk(false)} />}
    </div>
  );
}

function AddRiskModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ area: "", description: "", inherentLikelihood: 3, inherentImpact: 3, controls: "", controlEffectiveness: 2, residualLikelihood: 2, residualImpact: 2, response: "" });
  const update = (key, val) => setForm({ ...form, [key]: val });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: 500, maxHeight: "85vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 18, color: theme.primary }}>Add Risk Assessment</h3>
        {[
          { key: "area", label: "Risk Area", placeholder: "e.g. Inventory Valuation" },
          { key: "description", label: "Description", placeholder: "Describe the risk of material misstatement", textarea: true },
        ].map(({ key, label, placeholder, textarea }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
            {textarea ? (
              <textarea value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} rows={2} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            ) : (
              <input value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            )}
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { key: "inherentLikelihood", label: "Inherent Likelihood (1-5)" },
            { key: "inherentImpact", label: "Inherent Impact (1-5)" },
            { key: "residualLikelihood", label: "Residual Likelihood (1-5)" },
            { key: "residualImpact", label: "Residual Impact (1-5)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
              <input type="number" min={1} max={5} value={form[key]} onChange={(e) => update(key, parseInt(e.target.value) || 1)} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        {[
          { key: "controls", label: "Controls Identified", placeholder: "Describe controls that mitigate this risk" },
          { key: "response", label: "Planned Audit Response", placeholder: "Describe the audit procedures to address this risk" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
            <textarea value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} rows={2} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => form.area && onAdd(form)} style={{ padding: "9px 18px", background: theme.primary, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Add Risk</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: FINDINGS TRACKER & MANAGEMENT LETTER
// ═══════════════════════════════════════════════════════════════════════════════
function FindingsTab({ engagement, findings, setFindings }) {
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [showLetter, setShowLetter] = useState(false);

  const addFinding = (finding) => {
    const nextRef = `F-${String(findings.length + 1).padStart(3, "0")}`;
    setFindings([...findings, { ...finding, id: Date.now(), ref: nextRef, status: "open" }]);
    setShowAddFinding(false);
  };

  const removeFinding = (id) => setFindings(findings.filter((f) => f.id !== id));
  const updateFinding = (id, updates) => setFindings(findings.map((f) => f.id === id ? { ...f, ...updates } : f));

  const stats = {
    total: findings.length,
    open: findings.filter((f) => f.status === "open").length,
    resolved: findings.filter((f) => f.status === "resolved").length,
    high: findings.filter((f) => f.severity === "high" || f.severity === "critical").length,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Findings Tracker</h2>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 265 — Communicating deficiencies in internal control</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowLetter(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "transparent", border: `1px solid ${theme.accent}`, borderRadius: 8, color: theme.accent, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            <FileText size={14} /> Generate Management Letter
          </button>
          <button onClick={() => setShowAddFinding(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: theme.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            <Plus size={14} /> Add Finding
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Total Findings", value: stats.total, color: theme.primary },
          { label: "Open", value: stats.open, color: theme.warning },
          { label: "Resolved", value: stats.resolved, color: theme.success },
          { label: "High/Critical", value: stats.high, color: theme.danger },
        ].map((s) => (
          <div key={s.label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Findings List */}
      {findings.map((finding) => (
        <div key={finding.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 18, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: theme.primary, fontWeight: 700 }}>{finding.ref}</span>
              <span style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: FINDING_SEVERITY[finding.severity]?.color + "22", color: FINDING_SEVERITY[finding.severity]?.color }}>{FINDING_SEVERITY[finding.severity]?.label}</span>
              <span style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, background: finding.status === "resolved" ? theme.success + "22" : theme.warning + "22", color: finding.status === "resolved" ? theme.success : theme.warning }}>{finding.status === "resolved" ? "Resolved" : "Open"}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => updateFinding(finding.id, { status: finding.status === "open" ? "resolved" : "open" })} style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 5, color: theme.textMuted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{finding.status === "open" ? "Resolve" : "Reopen"}</button>
              <button onClick={() => removeFinding(finding.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}><Trash2 size={14} color={theme.textDim} /></button>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{finding.title}</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>{finding.component}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Condition (What we found)", value: finding.condition },
              { label: "Criteria (What should be)", value: finding.criteria },
              { label: "Cause", value: finding.cause },
              { label: "Effect", value: finding.effect },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: 10, background: theme.surface, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.5 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: 10, background: theme.primaryGlow, borderRadius: 8, border: `1px solid ${theme.primary}33` }}>
            <div style={{ fontSize: 10, color: theme.primary, fontWeight: 700, marginBottom: 4 }}>RECOMMENDATION</div>
            <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.5 }}>{finding.recommendation}</div>
          </div>
        </div>
      ))}

      {showAddFinding && <AddFindingModal onAdd={addFinding} onClose={() => setShowAddFinding(false)} />}
      {showLetter && <ManagementLetterModal findings={findings} engagement={engagement} onClose={() => setShowLetter(false)} />}
    </div>
  );
}

function AddFindingModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: "", component: "Revenue & Income", severity: "medium", condition: "", criteria: "", cause: "", effect: "", recommendation: "" });
  const update = (key, val) => setForm({ ...form, [key]: val });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: 540, maxHeight: "85vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 18, color: theme.primary }}>Add Audit Finding</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Finding Title</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Inventory not counted at year-end" style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Component</label>
            <select value={form.component} onChange={(e) => update("component", e.target.value)} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              {ISA_COMPONENTS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Severity</label>
            <select value={form.severity} onChange={(e) => update("severity", e.target.value)} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              {Object.entries(FINDING_SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {[
          { key: "condition", label: "Condition (What we found)", placeholder: "Describe what the audit revealed" },
          { key: "criteria", label: "Criteria (What should be)", placeholder: "Reference the applicable ISA, IFRS, or policy" },
          { key: "cause", label: "Cause", placeholder: "Root cause of the deficiency" },
          { key: "effect", label: "Effect", placeholder: "Impact or potential impact on the financial statements" },
          { key: "recommendation", label: "Recommendation", placeholder: "What should management do to address this" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
            <textarea value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} rows={2} style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => form.title && onAdd(form)} style={{ padding: "9px 18px", background: theme.primary, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Add Finding</button>
        </div>
      </div>
    </div>
  );
}

function ManagementLetterModal({ findings, engagement, onClose }) {
  const openFindings = findings.filter((f) => f.status === "open");
  const today = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 36, width: 650, maxHeight: "85vh", overflowY: "auto", color: "#1a1a2e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#1a1a2e" }}>Management Letter</h2>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>ISA 265 — Communication of Deficiencies</div>
          </div>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Close</button>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.8, color: "#333" }}>
          <p><strong>Date:</strong> {today}</p>
          <p><strong>To:</strong> The Directors<br />{engagement.clientName || "[Client Name]"}</p>
          <p><strong>Re:</strong> Management Letter — Audit for the year ended {engagement.yearEnd || "[Year End]"}</p>
          <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />
          <p>Dear Directors,</p>
          <p>In connection with our audit of the financial statements of {engagement.clientName || "[Client Name]"} for the year ended {engagement.yearEnd || "[Year End]"}, we wish to draw your attention to certain matters involving internal control and other operational matters that came to our attention during our audit procedures.</p>
          <p>Our audit was not designed specifically to identify all internal control deficiencies. The matters reported herein are limited to those which came to our attention during the normal course of our audit.</p>

          {openFindings.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#666" }}>No open findings to report.</p>
          ) : (
            openFindings.map((f, i) => (
              <div key={f.id} style={{ marginTop: 20, padding: 16, background: "#f8f9fa", borderRadius: 8, borderLeft: `4px solid ${FINDING_SEVERITY[f.severity]?.color}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{i + 1}. {f.title}</div>
                <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                  <div><strong>Condition:</strong> {f.condition}</div>
                  <div><strong>Criteria:</strong> {f.criteria}</div>
                  <div><strong>Cause:</strong> {f.cause}</div>
                  <div><strong>Effect:</strong> {f.effect}</div>
                  <div><strong>Recommendation:</strong> {f.recommendation}</div>
                  <div style={{ fontStyle: "italic", color: "#888" }}><strong>Management Response:</strong> {f.managementResponse || "Awaiting response"}</div>
                </div>
              </div>
            ))
          )}

          <p style={{ marginTop: 24 }}>We would appreciate a written response to each finding, indicating the action to be taken and the expected completion date. This letter is intended solely for the use of management and those charged with governance and is not intended for any other purpose.</p>
          <p>Yours faithfully,<br /><strong>AME Business Accountants</strong><br />Registered Auditors</p>
        </div>
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: AI AUDIT ASSISTANT CHATBOT
// ═══════════════════════════════════════════════════════════════════════════════
function ChatbotTab() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to the Audit AI Assistant! I'm your expert external audit advisor, specialising in ISA standards, IFRS, South African compliance (SARS, IRBA, Companies Act), and Draftworx navigation.\n\nAsk me anything — audit procedures, risk assessments, materiality calculations, how to handle specific audit findings, ISA requirements, or Draftworx guidance. I'll give you practical, actionable answers with the relevant standards cited." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const conversationHistory = messages.filter((m) => m.role !== "system").slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: AUDIT_SYSTEM_PROMPT,
          messages: [...conversationHistory, { role: "user", content: userMsg }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((item) => item.text || "").join("\n") || "I apologize, I couldn't process that request. Please try again.";

      let cleanText = text;
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        if (parsed.response) cleanText = parsed.response;
      } catch { cleanText = text; }

      setMessages((prev) => [...prev, { role: "assistant", content: cleanText }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting to the AI service. Please check your connection and try again. Error: " + error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "How do I calculate materiality per ISA 320?",
    "What are the ISA 240 fraud procedures?",
    "How to assess going concern per ISA 570?",
    "Explain the audit sampling process (ISA 530)",
    "What should be in the management representation letter?",
    "How do I navigate Draftworx for risk assessment?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 4px", marginBottom: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "user" ? theme.primary : theme.card, border: msg.role === "user" ? "none" : `1px solid ${theme.border}`, color: theme.text, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 4px", background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: 13 }}>
              Analysing your query...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => setInput(q)} style={{ padding: "6px 12px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, color: theme.textMuted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 6 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ask about ISA standards, audit procedures, Draftworx navigation..." style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "none", color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: 42, height: 42, borderRadius: 8, background: input.trim() ? theme.primary : theme.surface, border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
          <Send size={17} color={input.trim() ? "#fff" : theme.textDim} />
        </button>
      </div>
    </div>
  );
}
