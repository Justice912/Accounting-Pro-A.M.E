import { useState } from "react";
import { Download, FileText } from "lucide-react";

const LEAD_SCHEDULES = [
  { id: "cash", code: "A1", title: "Cash & Cash Equivalents", objective: "Agree bank balances to confirmations and reconciliations", procedures: ["Bank confirmations", "Reperform reconciliations", "Cut-off testing"], isa: "ISA 500, ISA 505" },
  { id: "receivables", code: "B1", title: "Trade Receivables", objective: "Substantiate existence and valuation of receivables", procedures: ["Debtor confirmations", "Subsequent receipts", "Expected credit loss review"], isa: "ISA 505, ISA 540" },
  { id: "inventory", code: "C1", title: "Inventory", objective: "Verify existence, completeness and valuation of inventory", procedures: ["Attend stock count", "Price testing", "NRV testing"], isa: "ISA 501, IAS 2" },
  { id: "ppe", code: "D1", title: "Property, Plant & Equipment", objective: "Substantiate additions, disposals and depreciation", procedures: ["Vouch additions", "Inspect disposals", "Recalculate depreciation"], isa: "ISA 500, IAS 16" },
  { id: "revenue", code: "E1", title: "Revenue", objective: "Assess occurrence, cut-off and completeness of revenue", procedures: ["Journal testing", "Cut-off testing", "Analytical procedures"], isa: "ISA 240, ISA 315, IFRS 15" },
  { id: "payables", code: "F1", title: "Trade Payables", objective: "Test completeness and valuation of liabilities", procedures: ["Supplier statement reconciliations", "Unrecorded liabilities search", "Subsequent payments"], isa: "ISA 500, ISA 501" },
  { id: "tax", code: "G1", title: "Taxation", objective: "Verify current and deferred tax balances and compliance", procedures: ["Tax computation re-performance", "SARS return agreement", "Deferred tax recalculation"], isa: "ISA 500, IAS 12" },
  { id: "going-concern", code: "H1", title: "Going Concern", objective: "Evaluate management's going concern assessment", procedures: ["Cash flow forecast challenge", "Loan covenant assessment", "Subsequent event review"], isa: "ISA 570" },
];

const REPORT_THEME = {
  card: "#1e2130",
  border: "#2a2e3f",
  primary: "#4f8cff",
  primaryGlow: "rgba(79,140,255,0.15)",
  accent: "#00d4aa",
  text: "#e8eaf0",
  textMuted: "#8b90a5",
  warning: "#ffb84d",
  danger: "#ff4d6a",
  success: "#00d4aa",
  surface: "#1a1d27",
};

const REPORT_FINDING_SEVERITY = {
  observation: { label: "Observation", color: "#6b7280" },
  low: { label: "Low", color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
  critical: { label: "Critical", color: "#991b1b" },
};

export default function AuditReportsTab({ engagement, risks, findings, theme, findingSeverity }) {
  const activeTheme = theme || REPORT_THEME;
  const activeFindingSeverity = findingSeverity || REPORT_FINDING_SEVERITY;
  const [reportType, setReportType] = useState("management");
  const [reportView, setReportView] = useState("reports");

  const openFindings = findings.filter((f) => f.status === "open");
  const highRiskItems = risks.filter((r) => r.residualLikelihood * r.residualImpact >= 10);
  const completionRate = findings.length ? Math.round(((findings.length - openFindings.length) / findings.length) * 100) : 100;
  const issueValue = findings.length * 125000;

  const reportLines = [
    "AME PRO ACCOUNTING - PROFESSIONAL AUDIT REPORT",
    `Client: ${engagement.clientName || "[Client Name]"}`,
    `Year End: ${engagement.yearEnd || "[Year End]"}`,
    `Report Type: ${reportType === "management" ? "Management Letter" : reportType === "executive" ? "Executive Summary" : "Audit Completion Memo"}`,
    `Date: ${new Date().toLocaleDateString("en-ZA")}`,
    "",
    "1. EXECUTIVE DASHBOARD",
    `- Total Risks Assessed: ${risks.length}`,
    `- High/Critical Residual Risks: ${highRiskItems.length}`,
    `- Total Findings: ${findings.length}`,
    `- Open Findings: ${openFindings.length}`,
    `- Audit Completion: ${completionRate}%`,
    `- Estimated Exposure: R ${issueValue.toLocaleString("en-ZA")}`,
    "",
    "2. KEY OPEN FINDINGS",
    ...(openFindings.length ? openFindings.map((f, index) => `${index + 1}. [${f.ref}] ${f.title} (${activeFindingSeverity[f.severity]?.label || f.severity})`) : ["No open findings."]),
    "",
    "3. HIGH RESIDUAL RISKS",
    ...(highRiskItems.length ? highRiskItems.map((r, index) => `${index + 1}. ${r.area} (Score ${r.residualLikelihood * r.residualImpact}) — ${r.response}`) : ["No high residual risks."]),
    "",
    "4. DRAFTWORX-STYLE LEAD SCHEDULE PACK",
    ...LEAD_SCHEDULES.map((l) => `- ${l.code} ${l.title}: ${l.objective} [${l.isa}]`),
  ];

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

  const createSimplePdf = (lines) => {
    const esc = (t) => String(t).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    let y = 800;
    const textOps = ["BT", "/F1 10 Tf", "1 0 0 1 50 800 Tm"];
    lines.slice(0, 55).forEach((line, idx) => {
      if (idx === 0) {
        textOps.push(`(${esc(line)}) Tj`);
      } else {
        y -= 14;
        textOps.push(`1 0 0 1 50 ${y} Tm (${esc(line)}) Tj`);
      }
    });
    textOps.push("ET");
    const stream = textOps.join("\n");
    return [
      "%PDF-1.4",
      "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
      "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
      "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj",
      "4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
      `5 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`,
      "xref",
      "0 6",
      "0000000000 65535 f ",
      "0000000010 00000 n ",
      "0000000060 00000 n ",
      "0000000117 00000 n ",
      "0000000243 00000 n ",
      "0000000313 00000 n ",
      "trailer<< /Root 1 0 R /Size 6 >>",
      "startxref",
      "0",
      "%%EOF",
    ].join("\n");
  };

  const downloadPdfReport = () => {
    downloadBlob(createSimplePdf(reportLines), "application/pdf", `audit-report-${(engagement.clientName || "client").replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const downloadWordReport = () => {
    const html = `
      <html><head><meta charset="utf-8" /><title>Audit Report</title></head>
      <body style="font-family: Calibri, Arial, sans-serif;">
        <h1>Professional Audit Report</h1>
        <p><strong>Client:</strong> ${engagement.clientName || "[Client Name]"}</p>
        <p><strong>Year End:</strong> ${engagement.yearEnd || "[Year End]"}</p>
        <p><strong>Report Type:</strong> ${reportType}</p>
        <h2>Executive Dashboard</h2>
        <ul>${reportLines.slice(7, 13).map((l) => `<li>${l}</li>`).join("")}</ul>
        <h2>Open Findings</h2>
        <ul>${openFindings.length ? openFindings.map((f) => `<li>${f.ref} - ${f.title}</li>`).join("") : "<li>No open findings.</li>"}</ul>
        <h2>Lead Schedule Index</h2>
        <ul>${LEAD_SCHEDULES.map((l) => `<li>${l.code} ${l.title} (${l.isa})</li>`).join("")}</ul>
      </body></html>
    `;
    downloadBlob(html, "application/msword;charset=utf-8", `audit-report-${(engagement.clientName || "client").replace(/\s+/g, "-").toLowerCase()}.doc`);
  };

  const downloadLeadSchedule = (schedule, format) => {
    const lines = [
      `${schedule.code} - ${schedule.title}`,
      `Objective: ${schedule.objective}`,
      `Standards: ${schedule.isa}`,
      "",
      "Planned Procedures:",
      ...schedule.procedures.map((p, i) => `${i + 1}. ${p}`),
      "",
      "Prepared by: _____________________",
      "Reviewed by: _____________________",
      "Date: _____________________",
    ];

    if (format === "word") {
      const html = `<html><body><h2>${schedule.code} - ${schedule.title}</h2><p><strong>Objective:</strong> ${schedule.objective}</p><p><strong>Standards:</strong> ${schedule.isa}</p><ol>${schedule.procedures.map((p) => `<li>${p}</li>`).join("")}</ol><p>Prepared by: _____________</p><p>Reviewed by: _____________</p></body></html>`;
      downloadBlob(html, "application/msword;charset=utf-8", `lead-schedule-${schedule.code.toLowerCase()}.doc`);
    } else {
      downloadBlob(createSimplePdf(lines), "application/pdf", `lead-schedule-${schedule.code.toLowerCase()}.pdf`);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Audit Report Centre</h2>
          <p style={{ fontSize: 13, color: activeTheme.textMuted, margin: "4px 0 0" }}>Professional audit reports and Draftworx-style lead schedules</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadPdfReport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: activeTheme.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            <Download size={14} /> Download PDF
          </button>
          <button onClick={downloadWordReport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: activeTheme.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            <FileText size={14} /> Download Word
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setReportView("reports")} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${activeTheme.border}`, background: reportView === "reports" ? activeTheme.primaryGlow : activeTheme.card, color: reportView === "reports" ? activeTheme.primary : activeTheme.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>Professional Reports</button>
        <button onClick={() => setReportView("leadSchedules")} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${activeTheme.border}`, background: reportView === "leadSchedules" ? activeTheme.primaryGlow : activeTheme.card, color: reportView === "leadSchedules" ? activeTheme.primary : activeTheme.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>Lead Schedules</button>
      </div>

      {reportView === "reports" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Risks Assessed", value: risks.length, color: activeTheme.primary },
              { label: "High Residual Risks", value: highRiskItems.length, color: activeTheme.warning },
              { label: "Open Findings", value: openFindings.length, color: activeTheme.danger },
              { label: "Audit Completion", value: `${completionRate}%`, color: activeTheme.success },
            ].map((s) => (
              <div key={s.label} style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: activeTheme.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: activeTheme.textMuted, display: "block", marginBottom: 6 }}>Report Template</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${activeTheme.border}`, background: activeTheme.surface, color: activeTheme.text, fontSize: 13, fontFamily: "inherit" }}>
              <option value="management">Management Letter Summary</option>
              <option value="executive">Executive Audit Summary</option>
              <option value="completion">Audit Completion Memo</option>
            </select>
          </div>

          <div style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}`, borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, marginBottom: 12 }}>
              {reportType === "management" ? "Management Letter Extract" : reportType === "executive" ? "Executive Summary" : "Completion Memo"}
            </h3>
            <div style={{ fontSize: 13, color: activeTheme.textMuted, lineHeight: 1.7 }}>
              <p><strong>Client:</strong> {engagement.clientName || "[Client Name]"}</p>
              <p><strong>Reporting period:</strong> Year ended {engagement.yearEnd || "[Year End]"}</p>
              <p><strong>Overall status:</strong> {highRiskItems.length > 0 || openFindings.length > 0 ? "Attention required before sign-off" : "Ready for sign-off"}</p>
              <p><strong>Estimated potential exposure:</strong> R {issueValue.toLocaleString("en-ZA")}</p>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
          {LEAD_SCHEDULES.map((schedule) => (
            <div key={schedule.id} style={{ background: activeTheme.card, border: `1px solid ${activeTheme.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: activeTheme.primary, fontWeight: 700 }}>{schedule.code}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{schedule.title}</div>
              <div style={{ fontSize: 11, color: activeTheme.textMuted, marginTop: 4 }}>{schedule.isa}</div>
              <p style={{ fontSize: 12, color: activeTheme.textMuted, margin: "10px 0" }}>{schedule.objective}</p>
              <ul style={{ margin: "0 0 10px 18px", color: activeTheme.textMuted, fontSize: 12 }}>
                {schedule.procedures.map((proc, idx) => <li key={idx}>{proc}</li>)}
              </ul>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => downloadLeadSchedule(schedule, "pdf")} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${activeTheme.primary}`, background: "transparent", color: activeTheme.primary, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>PDF</button>
                <button onClick={() => downloadLeadSchedule(schedule, "word")} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${activeTheme.accent}`, background: "transparent", color: activeTheme.accent, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>Word</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
