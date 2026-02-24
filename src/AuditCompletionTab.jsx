import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, ChevronRight, Shield, Clock } from "lucide-react";

const theme = {
  bg: "#0f1117", surface: "#1a1d27", surfaceHover: "#232735", card: "#1e2130",
  border: "#2a2e3f", borderLight: "#353a4f", primary: "#4f8cff", primaryDark: "#3a6fd8",
  primaryGlow: "rgba(79,140,255,0.15)", accent: "#00d4aa", text: "#e8eaf0",
  textMuted: "#8b90a5", textDim: "#5a5f75", danger: "#ff4d6a", warning: "#ffb84d", success: "#00d4aa",
};

// ─── GOING CONCERN CHECKLIST (ISA 570) ────────────────────────────────────────
const GOING_CONCERN_ITEMS = [
  { id: "gc1", category: "Financial Indicators", item: "Net liability or net current liability position", isa: "ISA 570.A3" },
  { id: "gc2", category: "Financial Indicators", item: "Fixed-term borrowings approaching maturity without realistic prospects of renewal or repayment", isa: "ISA 570.A3" },
  { id: "gc3", category: "Financial Indicators", item: "Negative operating cash flows from historical or prospective financial statements", isa: "ISA 570.A3" },
  { id: "gc4", category: "Financial Indicators", item: "Adverse key financial ratios (current ratio, debt-to-equity, interest cover)", isa: "ISA 570.A3" },
  { id: "gc5", category: "Financial Indicators", item: "Substantial operating losses or significant deterioration in assets used to generate cash flows", isa: "ISA 570.A3" },
  { id: "gc6", category: "Financial Indicators", item: "Inability to pay creditors on due dates or to comply with loan covenants", isa: "ISA 570.A3" },
  { id: "gc7", category: "Financial Indicators", item: "Arrears or discontinuance of dividends", isa: "ISA 570.A3" },
  { id: "gc8", category: "Operating Indicators", item: "Loss of key management without replacement", isa: "ISA 570.A4" },
  { id: "gc9", category: "Operating Indicators", item: "Loss of a major market, key customer, franchise, licence, or principal supplier", isa: "ISA 570.A4" },
  { id: "gc10", category: "Operating Indicators", item: "Labour difficulties or shortages of important supplies", isa: "ISA 570.A4" },
  { id: "gc11", category: "Operating Indicators", item: "Emergence of a highly successful competitor", isa: "ISA 570.A4" },
  { id: "gc12", category: "Other Indicators", item: "Non-compliance with capital or other statutory requirements (Companies Act)", isa: "ISA 570.A4" },
  { id: "gc13", category: "Other Indicators", item: "Pending legal or regulatory proceedings that may result in claims the entity cannot satisfy", isa: "ISA 570.A4" },
  { id: "gc14", category: "Other Indicators", item: "Changes in law/regulation or government policy expected to adversely affect the entity", isa: "ISA 570.A4" },
  { id: "gc15", category: "Other Indicators", item: "Uninsured or underinsured catastrophes when they occur", isa: "ISA 570.A4" },
];

// ─── SUBSEQUENT EVENTS CHECKLIST (ISA 560) ────────────────────────────────────
const SUBSEQUENT_EVENTS_ITEMS = [
  { id: "se1", category: "Adjusting Events (ISA 560.8)", item: "Settlement of a court case after the reporting period that confirms an obligation at year-end", isa: "IAS 10.3(a)" },
  { id: "se2", category: "Adjusting Events (ISA 560.8)", item: "Bankruptcy of a customer confirmed after year-end — evidence of receivable impairment at year-end", isa: "IAS 10.3(a)" },
  { id: "se3", category: "Adjusting Events (ISA 560.8)", item: "Discovery of fraud or errors showing the financial statements are incorrect", isa: "ISA 560.8" },
  { id: "se4", category: "Adjusting Events (ISA 560.8)", item: "Sale of inventories after reporting period at below cost — NRV adjustment needed", isa: "IAS 10.3(a), IAS 2" },
  { id: "se5", category: "Adjusting Events (ISA 560.8)", item: "Determination after year-end of the cost of assets purchased or proceeds received before year-end", isa: "IAS 10.3(b)" },
  { id: "se6", category: "Non-adjusting Events (ISA 560.10)", item: "Major business combination or disposal of a subsidiary after reporting period", isa: "IAS 10.22(a)" },
  { id: "se7", category: "Non-adjusting Events (ISA 560.10)", item: "Announcement of a plan to discontinue an operation", isa: "IAS 10.22(b)" },
  { id: "se8", category: "Non-adjusting Events (ISA 560.10)", item: "Major purchases/disposals of assets or expropriation of assets by government", isa: "IAS 10.22(c)" },
  { id: "se9", category: "Non-adjusting Events (ISA 560.10)", item: "Destruction of a major production plant by fire or natural disaster", isa: "IAS 10.22(d)" },
  { id: "se10", category: "Non-adjusting Events (ISA 560.10)", item: "Major restructuring announcements or commencement of implementation", isa: "IAS 10.22(e)" },
  { id: "se11", category: "Procedures Performed", item: "Reviewed minutes of board and committee meetings held after year-end", isa: "ISA 560.7(a)" },
  { id: "se12", category: "Procedures Performed", item: "Reviewed entity's latest interim financial information, budgets, and cash flow forecasts", isa: "ISA 560.7(b)" },
  { id: "se13", category: "Procedures Performed", item: "Inquired of management regarding any subsequent events that could affect the financial statements", isa: "ISA 560.7(c)" },
  { id: "se14", category: "Procedures Performed", item: "Read correspondence with entity's lawyers regarding litigation and claims", isa: "ISA 560.7(d)" },
  { id: "se15", category: "Procedures Performed", item: "Obtained written representations regarding subsequent events (ISA 580)", isa: "ISA 560.9" },
];

// ─── COMPLETION CHECKLIST ────────────────────────────────────────────────────
const COMPLETION_ITEMS = [
  { id: "c1", category: "Working Papers", item: "All audit working papers completed, cross-referenced, and reviewed", isa: "ISA 230" },
  { id: "c2", category: "Working Papers", item: "All review notes cleared and signed off", isa: "ISA 220.16" },
  { id: "c3", category: "Working Papers", item: "Documentation of significant matters, judgments, and conclusions", isa: "ISA 230.8" },
  { id: "c4", category: "Analytical Review", item: "Final analytical procedures performed on financial statements (ISA 520)", isa: "ISA 520.6" },
  { id: "c5", category: "Analytical Review", item: "Overall consistency of financial statements with auditor's understanding of the entity", isa: "ISA 520.6" },
  { id: "c6", category: "Misstatements", item: "Summary of uncorrected misstatements prepared and evaluated against materiality", isa: "ISA 450.5" },
  { id: "c7", category: "Misstatements", item: "Misstatements communicated to management and those charged with governance", isa: "ISA 450.8" },
  { id: "c8", category: "Misstatements", item: "Management representation on uncorrected misstatements obtained", isa: "ISA 450.14" },
  { id: "c9", category: "Representations", item: "Written management representations obtained per ISA 580", isa: "ISA 580.9" },
  { id: "c10", category: "Representations", item: "Management confirmed their responsibility for the financial statements", isa: "ISA 580.10" },
  { id: "c11", category: "Representations", item: "Management confirmed completeness of information provided to the auditor", isa: "ISA 580.11" },
  { id: "c12", category: "Communication", item: "Significant findings communicated to those charged with governance (ISA 260)", isa: "ISA 260.9" },
  { id: "c13", category: "Communication", item: "Management letter issued with findings and recommendations (ISA 265)", isa: "ISA 265.9" },
  { id: "c14", category: "Communication", item: "Auditor's independence communicated to those charged with governance", isa: "ISA 260.17" },
  { id: "c15", category: "Quality Control", item: "Engagement quality control review performed (if applicable)", isa: "ISQM 2, ISA 220" },
  { id: "c16", category: "Quality Control", item: "File assembly and archiving deadline noted (60 days per ISQM 1)", isa: "ISA 230.14" },
  { id: "c17", category: "Report", item: "Appropriate auditor's report form determined (unmodified, modified)", isa: "ISA 700" },
  { id: "c18", category: "Report", item: "Other information in annual report reviewed per ISA 720", isa: "ISA 720" },
  { id: "c19", category: "Report", item: "Signed auditor's report dated not earlier than completion of all audit evidence", isa: "ISA 700.41" },
];

// ─── AUDITOR'S REPORT OPINIONS (ISA 700-706) ────────────────────────────────
const OPINION_TYPES = [
  { id: "unmodified", label: "Unmodified Opinion", isa: "ISA 700", description: "Financial statements are prepared, in all material respects, in accordance with the applicable framework" },
  { id: "qualified", label: "Qualified Opinion", isa: "ISA 705", description: "Misstatements are material but not pervasive, or unable to obtain sufficient evidence but not pervasive" },
  { id: "adverse", label: "Adverse Opinion", isa: "ISA 705", description: "Misstatements are both material and pervasive to the financial statements" },
  { id: "disclaimer", label: "Disclaimer of Opinion", isa: "ISA 705", description: "Unable to obtain sufficient appropriate evidence and possible effects are both material and pervasive" },
];

export default function AuditCompletionTab({ engagement, risks, findings }) {
  const [completionView, setCompletionView] = useState("goingConcern");
  const [gcItems, setGcItems] = useState(GOING_CONCERN_ITEMS.map((i) => ({ ...i, present: "no", notes: "" })));
  const [seItems, setSeItems] = useState(SUBSEQUENT_EVENTS_ITEMS.map((i) => ({ ...i, status: "pending", notes: "" })));
  const [completionItems, setCompletionItems] = useState(COMPLETION_ITEMS.map((i) => ({ ...i, done: false, reviewer: "", date: "" })));
  const [opinionType, setOpinionType] = useState("unmodified");
  const [emphasisMatters, setEmphasisMatters] = useState("");
  const [keyAuditMatters, setKeyAuditMatters] = useState("");
  const [basisForOpinion, setBasisForOpinion] = useState("");

  const subTabs = [
    { id: "goingConcern", label: "Going Concern", icon: AlertTriangle },
    { id: "subsequentEvents", label: "Subsequent Events", icon: Clock },
    { id: "completion", label: "Completion Checklist", icon: CheckCircle },
    { id: "auditorsReport", label: "Auditor's Report", icon: Shield },
  ];

  const gcConcernsCount = gcItems.filter((i) => i.present === "yes").length;
  const seCompletedCount = seItems.filter((i) => i.status !== "pending").length;
  const completionProgress = Math.round((completionItems.filter((i) => i.done).length / completionItems.length) * 100);

  const generateAuditorsReport = () => {
    const selectedOpinion = OPINION_TYPES.find((o) => o.id === opinionType);
    const today = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
    const clientName = engagement.clientName || "[Client Name]";
    const yearEnd = engagement.yearEnd || "[Year End]";

    const opinionParagraph = opinionType === "unmodified"
      ? `In our opinion, the financial statements present fairly, in all material respects, the financial position of ${clientName} as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with International Financial Reporting Standards and the requirements of the Companies Act 71 of 2008.`
      : opinionType === "qualified"
      ? `In our opinion, except for the effects of the matter described in the Basis for Qualified Opinion section of our report, the financial statements present fairly, in all material respects, the financial position of ${clientName} as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with International Financial Reporting Standards and the requirements of the Companies Act 71 of 2008.`
      : opinionType === "adverse"
      ? `In our opinion, because of the significance of the matter discussed in the Basis for Adverse Opinion section of our report, the financial statements do not present fairly the financial position of ${clientName} as at ${yearEnd}, and its financial performance and cash flows for the year then ended in accordance with International Financial Reporting Standards and the requirements of the Companies Act 71 of 2008.`
      : `We do not express an opinion on the financial statements of ${clientName}. Because of the significance of the matter described in the Basis for Disclaimer of Opinion section of our report, we have not been able to obtain sufficient appropriate audit evidence to provide a basis for an audit opinion on these financial statements.`;

    const reportLines = [
      "INDEPENDENT AUDITOR'S REPORT",
      "",
      `To the Shareholders of ${clientName}`,
      "",
      "Report on the Audit of the Financial Statements",
      "",
      `${selectedOpinion.label}`,
      "",
      opinionParagraph,
      "",
      `Basis for ${selectedOpinion.label}`,
      "",
      basisForOpinion || (opinionType === "unmodified"
        ? "We conducted our audit in accordance with International Standards on Auditing (ISAs). Our responsibilities under those standards are further described in the Auditor's Responsibilities for the Audit of the Financial Statements section of our report. We are independent of the company in accordance with the Independent Regulatory Board for Auditors' Code of Professional Conduct for Registered Auditors (IRBA Code) and other independence requirements applicable to performing audits of financial statements in South Africa. We have fulfilled our other ethical responsibilities in accordance with the IRBA Code. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion."
        : basisForOpinion || "[Describe the matter giving rise to the modification]"),
    ];

    if (emphasisMatters.trim()) {
      reportLines.push("", "Emphasis of Matter", "", emphasisMatters);
    }
    if (keyAuditMatters.trim()) {
      reportLines.push("", "Key Audit Matters", "", keyAuditMatters);
    }

    reportLines.push(
      "",
      "Responsibilities of the Directors for the Financial Statements",
      "",
      `The directors are responsible for the preparation and fair presentation of the financial statements in accordance with International Financial Reporting Standards and the requirements of the Companies Act 71 of 2008, and for such internal control as the directors determine is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.`,
      "",
      "In preparing the financial statements, the directors are responsible for assessing the company's ability to continue as a going concern, disclosing, as applicable, matters related to going concern and using the going concern basis of accounting unless the directors either intend to liquidate the company or to cease operations, or have no realistic alternative but to do so.",
      "",
      "Auditor's Responsibilities for the Audit of the Financial Statements",
      "",
      "Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but is not a guarantee that an audit conducted in accordance with ISAs will always detect a material misstatement when it exists.",
      "",
      "Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements.",
      "",
      "AME Business Accountants",
      "Registered Auditors",
      `Date: ${today}`,
      "Johannesburg, South Africa"
    );

    return reportLines;
  };

  const downloadReport = () => {
    const lines = generateAuditorsReport();
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;max-width:700px;margin:40px auto;line-height:1.8;color:#222}h1{text-align:center;border-bottom:2px solid #1a1a2e;padding-bottom:12px}h2{color:#1a1a2e;margin-top:24px}</style></head><body>${lines.map((l) => l === "" ? "<br/>" : l.match(/^(INDEPENDENT|Report on|Basis for|Emphasis|Key Audit|Responsibilities|Auditor)/) ? `<h2>${l}</h2>` : `<p>${l}</p>`).join("")}</body></html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `auditors-report-${(engagement.clientName || "client").replace(/\s+/g, "-").toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const generateRepresentationLetter = () => {
    const clientName = engagement.clientName || "[Client Name]";
    const yearEnd = engagement.yearEnd || "[Year End]";
    const today = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;max-width:700px;margin:40px auto;line-height:1.8;color:#222}h1{font-size:18px;border-bottom:2px solid #1a1a2e;padding-bottom:8px}</style></head><body>
      <h1>WRITTEN REPRESENTATIONS — ISA 580</h1>
      <p><strong>${clientName}</strong></p>
      <p>${today}</p>
      <p>AME Business Accountants<br/>Registered Auditors<br/>Johannesburg</p>
      <p>Dear Sirs,</p>
      <p>This representation letter is provided in connection with your audit of the financial statements of ${clientName} for the year ended ${yearEnd}, for the purpose of expressing an opinion on whether the financial statements present fairly, in all material respects, in accordance with International Financial Reporting Standards.</p>
      <p>We confirm, to the best of our knowledge and belief, having made such inquiries as we considered necessary:</p>
      <p><strong>Financial Statements</strong></p>
      <ol>
        <li>We have fulfilled our responsibilities, as set out in the terms of the audit engagement, for the preparation and fair presentation of the financial statements in accordance with IFRS.</li>
        <li>Significant assumptions used in making accounting estimates are reasonable (ISA 540).</li>
        <li>Related party relationships and transactions have been appropriately accounted for and disclosed in accordance with IAS 24 (ISA 550).</li>
        <li>All events subsequent to the date of the financial statements that require adjustment or disclosure have been adjusted or disclosed (ISA 560, IAS 10).</li>
        <li>The effects of uncorrected misstatements are immaterial, both individually and in the aggregate, to the financial statements as a whole. A list of uncorrected misstatements is attached.</li>
      </ol>
      <p><strong>Information Provided</strong></p>
      <ol start="6">
        <li>We have provided you with access to all information of which we are aware that is relevant to the preparation of the financial statements.</li>
        <li>We have provided you with additional information that you have requested and given unrestricted access to persons within the entity.</li>
        <li>All transactions have been recorded in the accounting records and are reflected in the financial statements.</li>
        <li>We have disclosed to you the results of our assessment of the risk that the financial statements may be materially misstated as a result of fraud (ISA 240).</li>
        <li>We have disclosed to you all information in relation to fraud or suspected fraud affecting the entity involving management, employees with significant roles in internal control, or others.</li>
        <li>We have disclosed to you all information in relation to allegations of fraud or suspected fraud affecting the entity's financial statements.</li>
        <li>We have disclosed to you all known instances of non-compliance or suspected non-compliance with laws and regulations.</li>
        <li>We have disclosed to you all known actual or possible litigation and claims whose effects should be considered in the financial statements (ISA 501).</li>
      </ol>
      <p><strong>Going Concern</strong></p>
      <ol start="14">
        <li>We have assessed the entity's ability to continue as a going concern as required by IAS 1 and ISA 570, and are satisfied that the going concern basis of accounting is appropriate.</li>
        <li>We have disclosed all matters of which we are aware that are relevant to the entity's ability to continue as a going concern, including significant conditions and events, and our plans for future action.</li>
      </ol>
      <p style="margin-top:40px">Yours faithfully,</p>
      <p>_________________________<br/>Director<br/>${clientName}</p>
      <p>_________________________<br/>Financial Director<br/>${clientName}</p>
      <p>Date: _________________________</p>
    </body></html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `management-representations-${(clientName).replace(/\s+/g, "-").toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const renderChecklist = (items, setItems, statusField, options) => {
    const categories = [...new Set(items.map((i) => i.category))];
    return categories.map((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      return (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{cat}</div>
          {catItems.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 5 }}>
              <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 2 }}>
                {options.map((opt) => (
                  <button key={opt.value} onClick={() => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, [statusField]: opt.value } : i)))} title={opt.label} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${item[statusField] === opt.value ? opt.color : theme.border}`, background: item[statusField] === opt.value ? opt.color + "22" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    <opt.icon size={14} color={item[statusField] === opt.value ? opt.color : theme.textDim} />
                  </button>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>{item.item}</div>
                <div style={{ fontSize: 10, color: theme.textDim, marginTop: 2 }}>{item.isa}</div>
                <input
                  value={item.notes}
                  onChange={(e) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, notes: e.target.value } : i)))}
                  placeholder="Working paper ref / Notes..."
                  style={{ marginTop: 5, width: "100%", padding: "5px 8px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 11, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const active = completionView === tab.id;
          return (
            <button key={tab.id} onClick={() => setCompletionView(tab.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? theme.primary : theme.border}`, background: active ? theme.primaryGlow : theme.card, color: active ? theme.primary : theme.textMuted, cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 500, fontFamily: "inherit", transition: "all 0.2s" }}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── GOING CONCERN ──────────────────────────────────────── */}
      {completionView === "goingConcern" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Going Concern Assessment</h2>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 570 — Going concern evaluation indicators</p>
            </div>
            {gcConcernsCount > 0 && (
              <div style={{ padding: "6px 14px", background: theme.danger + "15", border: `1px solid ${theme.danger}33`, borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: theme.danger, fontWeight: 600 }}>{gcConcernsCount} indicator{gcConcernsCount > 1 ? "s" : ""} present</span>
              </div>
            )}
          </div>

          {renderChecklist(gcItems, setGcItems, "present", [
            { value: "yes", label: "Present", color: theme.danger, icon: AlertTriangle },
            { value: "no", label: "Not Present", color: theme.success, icon: CheckCircle },
            { value: "na", label: "N/A", color: theme.textMuted, icon: XCircle },
          ])}

          <div style={{ marginTop: 16, padding: 16, background: gcConcernsCount > 2 ? theme.danger + "15" : gcConcernsCount > 0 ? theme.warning + "15" : theme.success + "15", border: `1px solid ${gcConcernsCount > 2 ? theme.danger : gcConcernsCount > 0 ? theme.warning : theme.success}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: gcConcernsCount > 2 ? theme.danger : gcConcernsCount > 0 ? theme.warning : theme.success }}>
              {gcConcernsCount > 2 ? "Material Uncertainty — Significant going concern indicators identified" : gcConcernsCount > 0 ? "Indicators Present — Further evaluation required per ISA 570.16" : "No going concern indicators identified — Going concern basis appropriate"}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
              {gcConcernsCount > 2 ? "Consider the need for an Emphasis of Matter paragraph or modification to the auditor's report (ISA 570.18-21)" : gcConcernsCount > 0 ? "Evaluate management's assessment and the adequacy of related disclosures (ISA 570.12)" : "Document conclusion in the audit file as required by ISA 570.10"}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSEQUENT EVENTS ──────────────────────────────────── */}
      {completionView === "subsequentEvents" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Subsequent Events Review</h2>
            <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 560 — Events after the reporting period (IAS 10)</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Completed", count: seItems.filter((i) => i.status === "done").length, color: theme.success },
              { label: "Issues Found", count: seItems.filter((i) => i.status === "issue").length, color: theme.danger },
              { label: "Pending", count: seItems.filter((i) => i.status === "pending").length, color: theme.warning },
            ].map((s) => (
              <div key={s.label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {renderChecklist(seItems, setSeItems, "status", [
            { value: "done", label: "Completed / Not applicable", color: theme.success, icon: CheckCircle },
            { value: "issue", label: "Issue identified", color: theme.danger, icon: AlertTriangle },
            { value: "pending", label: "Pending", color: theme.warning, icon: Clock },
          ])}
        </div>
      )}

      {/* ── COMPLETION CHECKLIST ───────────────────────────────── */}
      {completionView === "completion" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Completion Checklist</h2>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>Final procedures before signing the auditor's report</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, height: 8, background: theme.surface, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${completionProgress}%`, height: "100%", background: completionProgress === 100 ? theme.success : theme.primary, borderRadius: 4, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: completionProgress === 100 ? theme.success : theme.primary }}>{completionProgress}%</span>
            </div>
          </div>

          {["Working Papers", "Analytical Review", "Misstatements", "Representations", "Communication", "Quality Control", "Report"].map((cat) => {
            const catItems = completionItems.filter((i) => i.category === cat);
            const catDone = catItems.filter((i) => i.done).length;
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.5px" }}>{cat}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>{catDone}/{catItems.length}</div>
                </div>
                {catItems.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 5 }}>
                    <button onClick={() => setCompletionItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))} style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${item.done ? theme.success : theme.borderLight}`, background: item.done ? theme.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 1, padding: 0 }}>
                      {item.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: item.done ? theme.textDim : theme.text, lineHeight: 1.5, textDecoration: item.done ? "line-through" : "none" }}>{item.item}</div>
                      <div style={{ fontSize: 10, color: theme.textDim, marginTop: 2 }}>{item.isa}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                        <input value={item.reviewer} onChange={(e) => setCompletionItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, reviewer: e.target.value } : i)))} placeholder="Reviewed by..." style={{ flex: 1, padding: "4px 8px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} />
                        <input type="date" value={item.date} onChange={(e) => setCompletionItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, date: e.target.value } : i)))} style={{ padding: "4px 8px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── AUDITOR'S REPORT ───────────────────────────────────── */}
      {completionView === "auditorsReport" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Independent Auditor's Report</h2>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 700-706 — Forming an opinion and reporting</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={generateRepresentationLetter} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: theme.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                <FileText size={14} /> Rep Letter
              </button>
              <button onClick={downloadReport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: theme.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                <Download size={14} /> Download Report
              </button>
            </div>
          </div>

          {/* Opinion Type Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {OPINION_TYPES.map((type) => (
              <button key={type.id} onClick={() => setOpinionType(type.id)} style={{ padding: "14px 12px", background: opinionType === type.id ? theme.primaryGlow : theme.card, border: `1px solid ${opinionType === type.id ? theme.primary : theme.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: opinionType === type.id ? theme.primary : theme.text }}>{type.label}</div>
                <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>{type.isa}</div>
                <div style={{ fontSize: 11, color: theme.textDim, marginTop: 6, lineHeight: 1.4 }}>{type.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Fields */}
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {opinionType !== "unmodified" && (
              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.text, display: "block", marginBottom: 6 }}>Basis for {OPINION_TYPES.find((o) => o.id === opinionType)?.label}</label>
                <textarea value={basisForOpinion} onChange={(e) => setBasisForOpinion(e.target.value)} placeholder="Describe the matter giving rise to the modification..." rows={3} style={{ width: "100%", padding: "10px 12px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            )}
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.text, display: "block", marginBottom: 6 }}>Emphasis of Matter (ISA 706)</label>
              <textarea value={emphasisMatters} onChange={(e) => setEmphasisMatters(e.target.value)} placeholder="Optional — matters appropriately presented that are of importance to users' understanding..." rows={2} style={{ width: "100%", padding: "10px 12px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.text, display: "block", marginBottom: 6 }}>Key Audit Matters (ISA 701)</label>
              <textarea value={keyAuditMatters} onChange={(e) => setKeyAuditMatters(e.target.value)} placeholder="Optional — matters of most significance in the audit of the financial statements..." rows={2} style={{ width: "100%", padding: "10px 12px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, color: "#1a1a2e", fontSize: 13, lineHeight: 1.8 }}>
            <h2 style={{ textAlign: "center", fontSize: 16, fontWeight: 800, borderBottom: "2px solid #1a1a2e", paddingBottom: 10, color: "#1a1a2e" }}>INDEPENDENT AUDITOR'S REPORT</h2>
            {generateAuditorsReport().slice(2).map((line, i) => (
              line === "" ? <br key={i} /> : line.match(/^(Report on|Basis for|Emphasis|Key Audit|Responsibilities|Auditor)/) ? <h3 key={i} style={{ fontSize: 14, fontWeight: 700, marginTop: 16, color: "#1a1a2e" }}>{line}</h3> : <p key={i} style={{ margin: "4px 0", color: "#333" }}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
