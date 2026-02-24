import { useState } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle, Calculator, FileText, ChevronDown, ChevronRight } from "lucide-react";

// ─── THEME (shared with AuditModule) ─────────────────────────────────────────
const theme = {
  bg: "#0f1117", surface: "#1a1d27", surfaceHover: "#232735", card: "#1e2130",
  border: "#2a2e3f", borderLight: "#353a4f", primary: "#4f8cff", primaryDark: "#3a6fd8",
  primaryGlow: "rgba(79,140,255,0.15)", accent: "#00d4aa", text: "#e8eaf0",
  textMuted: "#8b90a5", textDim: "#5a5f75", danger: "#ff4d6a", warning: "#ffb84d", success: "#00d4aa",
};

// ─── ENGAGEMENT ACCEPTANCE CHECKLIST (ISA 220, ISQM 1) ──────────────────────
const ACCEPTANCE_CHECKLIST = [
  { id: "a1", section: "Client Integrity", item: "Assessed identity and business reputation of client, principal owners, key management, and related parties", isa: "ISQM 1.30, ISA 220.12" },
  { id: "a2", section: "Client Integrity", item: "No knowledge of money laundering, fraud, or questionable financial reporting practices", isa: "ISQM 1.30" },
  { id: "a3", section: "Client Integrity", item: "Reviewed predecessor auditor communication (where applicable) per ISA 300.A4", isa: "ISA 300.A4" },
  { id: "a4", section: "Competence & Resources", item: "Firm has competence, capability, and resources to perform the engagement", isa: "ISQM 1.30(b), ISA 220.12" },
  { id: "a5", section: "Competence & Resources", item: "Engagement team has appropriate industry knowledge and experience", isa: "ISA 220.14" },
  { id: "a6", section: "Competence & Resources", item: "Sufficient time allocated for planning, execution, and completion", isa: "ISA 220.14" },
  { id: "a7", section: "Independence & Ethics", item: "Independence confirmed — no financial, business, or personal relationships creating threats", isa: "IRBA Code, ISA 220.11" },
  { id: "a8", section: "Independence & Ethics", item: "Engagement partner has confirmed compliance with ethical requirements", isa: "ISA 220.9" },
  { id: "a9", section: "Independence & Ethics", item: "No non-audit services that could impair independence", isa: "IRBA Code 600" },
  { id: "a10", section: "Regulatory & Legal", item: "Entity is not subject to legal or regulatory prohibitions for the firm", isa: "ISQM 1.30" },
  { id: "a11", section: "Regulatory & Legal", item: "Companies Act 71 of 2008 requirements assessed (Section 90-92)", isa: "Companies Act s90" },
  { id: "a12", section: "Regulatory & Legal", item: "IRBA registration of firm and engagement partner confirmed", isa: "Auditing Profession Act" },
  { id: "a13", section: "Risk Assessment", item: "Preliminary engagement risk assessed as acceptable", isa: "ISQM 1.30" },
  { id: "a14", section: "Risk Assessment", item: "Scope limitations — none identified that would affect our ability to express an opinion", isa: "ISA 210.6" },
  { id: "a15", section: "Terms of Engagement", item: "Engagement letter prepared and signed by both parties per ISA 210", isa: "ISA 210.9" },
  { id: "a16", section: "Terms of Engagement", item: "Preconditions for audit confirmed — acceptable financial reporting framework, management responsibilities acknowledged", isa: "ISA 210.6" },
];

// ─── MATERIALITY BENCHMARKS ──────────────────────────────────────────────────
const MATERIALITY_BENCHMARKS = [
  { id: "revenue", label: "Total Revenue", percentRange: "0.5% – 1%", typicalPercent: 0.75, guidance: "Common for profit-making entities. ISA 320.A3" },
  { id: "totalAssets", label: "Total Assets", percentRange: "1% – 2%", typicalPercent: 1.5, guidance: "Asset-intensive entities, holding companies. ISA 320.A3" },
  { id: "profitBeforeTax", label: "Profit Before Tax", percentRange: "5% – 10%", typicalPercent: 7.5, guidance: "Most common for profit-making entities. ISA 320.A3" },
  { id: "totalExpenditure", label: "Total Expenditure", percentRange: "0.5% – 1%", typicalPercent: 0.75, guidance: "Non-profit/public entities. ISA 320.A3" },
  { id: "netAssets", label: "Net Assets / Equity", percentRange: "2% – 5%", typicalPercent: 3, guidance: "Entities where equity is key benchmark. ISA 320.A3" },
  { id: "grossProfit", label: "Gross Profit", percentRange: "1% – 2%", typicalPercent: 1.5, guidance: "Trading entities with volatile profit. ISA 320.A3" },
];

// ─── AUDIT STRATEGY ITEMS (ISA 300) ─────────────────────────────────────────
const STRATEGY_SECTIONS = [
  { id: "scope", title: "Scope of the Audit", items: [
    "Identify the financial reporting framework (IFRS / IFRS for SMEs / other)",
    "Determine entities or business units to be included",
    "Confirm reporting period and audit deadlines",
    "Identify components for group audit consideration (ISA 600)",
    "Determine extent of work on opening balances (ISA 510)",
  ]},
  { id: "reporting", title: "Reporting Objectives", items: [
    "Expected form and content of auditor's report",
    "Any additional reporting requirements (regulatory, contractual)",
    "Key audit matters to be communicated (ISA 701, if applicable)",
    "Communication plan with those charged with governance (ISA 260)",
  ]},
  { id: "significant", title: "Significant Factors & Resources", items: [
    "Identify significant risks per ISA 315 (including fraud risks per ISA 240)",
    "Determine materiality for planning purposes (ISA 320)",
    "Assess areas requiring specialised skills or experts (ISA 620)",
    "Identify related party relationships and transactions (ISA 550)",
    "Consider going concern indicators (ISA 570)",
    "Assess IT environment and controls",
    "Evaluate prior year audit findings and their resolution",
  ]},
  { id: "nature", title: "Nature, Timing & Extent", items: [
    "Determine audit approach: substantive vs combined (controls reliance)",
    "Plan interim audit procedures and timing",
    "Schedule inventory count attendance (ISA 501)",
    "Plan confirmation procedures — banks, debtors, creditors, lawyers (ISA 505)",
    "Determine sample sizes based on assessed risk levels (ISA 530)",
    "Schedule engagement quality review (ISA 220, ISQM 2)",
  ]},
];

export default function AuditPlanningTab({ engagement, setEngagement }) {
  const [planView, setPlanView] = useState("acceptance");
  const [acceptanceItems, setAcceptanceItems] = useState(
    ACCEPTANCE_CHECKLIST.map((item) => ({ ...item, status: "pending", notes: "" }))
  );
  const [materialityInputs, setMaterialityInputs] = useState({
    revenue: "", totalAssets: "", profitBeforeTax: "", totalExpenditure: "", netAssets: "", grossProfit: "",
    selectedBenchmark: "profitBeforeTax", customPercent: "",
  });
  const [strategyItems, setStrategyItems] = useState(
    STRATEGY_SECTIONS.map((s) => ({
      ...s,
      items: s.items.map((item, idx) => ({ id: `${s.id}-${idx}`, text: item, done: false, notes: "" })),
      expanded: false,
    }))
  );

  const acceptanceProgress = Math.round(
    (acceptanceItems.filter((i) => i.status !== "pending").length / acceptanceItems.length) * 100
  );

  const updateAcceptanceStatus = (id, status) => {
    setAcceptanceItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const updateAcceptanceNotes = (id, notes) => {
    setAcceptanceItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  // Materiality calculations
  const selectedBenchmark = MATERIALITY_BENCHMARKS.find((b) => b.id === materialityInputs.selectedBenchmark);
  const benchmarkValue = parseFloat(materialityInputs[materialityInputs.selectedBenchmark]) || 0;
  const percentUsed = parseFloat(materialityInputs.customPercent) || selectedBenchmark?.typicalPercent || 0;
  const overallMateriality = benchmarkValue * (percentUsed / 100);
  const performanceMateriality = overallMateriality * 0.75;
  const trivialThreshold = overallMateriality * 0.05;

  const applyMateriality = () => {
    setEngagement({
      ...engagement,
      materialityLevel: Math.round(overallMateriality).toString(),
      performanceMateriality: Math.round(performanceMateriality).toString(),
    });
  };

  const toggleStrategySection = (sectionId) => {
    setStrategyItems((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, expanded: !s.expanded } : s))
    );
  };

  const toggleStrategyItem = (sectionId, itemId) => {
    setStrategyItems((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : s
      )
    );
  };

  const strategyProgress = (() => {
    const allItems = strategyItems.flatMap((s) => s.items);
    return allItems.length ? Math.round((allItems.filter((i) => i.done).length / allItems.length) * 100) : 0;
  })();

  const subTabs = [
    { id: "acceptance", label: "Engagement Acceptance", icon: CheckCircle },
    { id: "materiality", label: "Materiality Calculator", icon: Calculator },
    { id: "strategy", label: "Audit Strategy", icon: FileText },
  ];

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const active = planView === tab.id;
          return (
            <button key={tab.id} onClick={() => setPlanView(tab.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? theme.primary : theme.border}`, background: active ? theme.primaryGlow : theme.card, color: active ? theme.primary : theme.textMuted, cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 500, fontFamily: "inherit", transition: "all 0.2s" }}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── ENGAGEMENT ACCEPTANCE ───────────────────────────────────── */}
      {planView === "acceptance" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Engagement Acceptance & Continuance</h2>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISQM 1 & ISA 220 — Client acceptance procedures</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, height: 8, background: theme.surface, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${acceptanceProgress}%`, height: "100%", background: acceptanceProgress === 100 ? theme.success : theme.primary, borderRadius: 4, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: acceptanceProgress === 100 ? theme.success : theme.primary }}>{acceptanceProgress}%</span>
            </div>
          </div>

          {/* Group by section */}
          {["Client Integrity", "Competence & Resources", "Independence & Ethics", "Regulatory & Legal", "Risk Assessment", "Terms of Engagement"].map((section) => {
            const sectionItems = acceptanceItems.filter((i) => i.section === section);
            return (
              <div key={section} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{section}</div>
                {sectionItems.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 2 }}>
                      {["yes", "no", "na"].map((s) => (
                        <button key={s} onClick={() => updateAcceptanceStatus(item.id, s)} title={s === "yes" ? "Yes/Confirmed" : s === "no" ? "No/Issue" : "N/A"} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${item.status === s ? (s === "yes" ? theme.success : s === "no" ? theme.danger : theme.textMuted) : theme.border}`, background: item.status === s ? (s === "yes" ? theme.success + "22" : s === "no" ? theme.danger + "22" : theme.surface) : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                          {s === "yes" && <CheckCircle size={14} color={item.status === s ? theme.success : theme.textDim} />}
                          {s === "no" && <XCircle size={14} color={item.status === s ? theme.danger : theme.textDim} />}
                          {s === "na" && <span style={{ fontSize: 9, color: item.status === s ? theme.textMuted : theme.textDim, fontWeight: 700 }}>N/A</span>}
                        </button>
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>{item.item}</div>
                      <div style={{ fontSize: 10, color: theme.textDim, marginTop: 3 }}>{item.isa}</div>
                      <input
                        value={item.notes}
                        onChange={(e) => updateAcceptanceNotes(item.id, e.target.value)}
                        placeholder="Notes..."
                        style={{ marginTop: 6, width: "100%", padding: "5px 8px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 11, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Summary */}
          <div style={{ marginTop: 20, padding: 16, background: theme.primaryGlow, border: `1px solid ${theme.primary}33`, borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>Acceptance Decision</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Confirmed", count: acceptanceItems.filter((i) => i.status === "yes").length, color: theme.success },
                { label: "Issues", count: acceptanceItems.filter((i) => i.status === "no").length, color: theme.danger },
                { label: "N/A", count: acceptanceItems.filter((i) => i.status === "na").length, color: theme.textMuted },
                { label: "Pending", count: acceptanceItems.filter((i) => i.status === "pending").length, color: theme.warning },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{s.label}</div>
                </div>
              ))}
            </div>
            {acceptanceItems.some((i) => i.status === "no") && (
              <div style={{ marginTop: 12, padding: 10, background: theme.danger + "15", border: `1px solid ${theme.danger}33`, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: theme.danger, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} /> Issues identified — engagement acceptance requires partner review
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MATERIALITY CALCULATOR ─────────────────────────────────── */}
      {planView === "materiality" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Materiality Calculator</h2>
            <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 320 — Materiality in planning and performing an audit</p>
          </div>

          {/* Benchmark Inputs */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Financial Statement Benchmarks</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {MATERIALITY_BENCHMARKS.map((bench) => (
                <div key={bench.id}>
                  <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>{bench.label}</label>
                  <input
                    type="number"
                    value={materialityInputs[bench.id]}
                    onChange={(e) => setMaterialityInputs({ ...materialityInputs, [bench.id]: e.target.value })}
                    placeholder="R 0.00"
                    style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${materialityInputs.selectedBenchmark === bench.id ? theme.primary : theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ fontSize: 10, color: theme.textDim, marginTop: 3 }}>{bench.percentRange}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark Selection & Calculation */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Selected Benchmark</div>
              <select
                value={materialityInputs.selectedBenchmark}
                onChange={(e) => setMaterialityInputs({ ...materialityInputs, selectedBenchmark: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 13, fontFamily: "inherit", marginBottom: 12 }}
              >
                {MATERIALITY_BENCHMARKS.map((b) => (
                  <option key={b.id} value={b.id}>{b.label} ({b.percentRange})</option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{selectedBenchmark?.guidance}</div>
              <label style={{ fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Percentage Applied (%)</label>
              <input
                type="number"
                step="0.1"
                value={materialityInputs.customPercent || selectedBenchmark?.typicalPercent || ""}
                onChange={(e) => setMaterialityInputs({ ...materialityInputs, customPercent: e.target.value })}
                placeholder={selectedBenchmark?.typicalPercent?.toString()}
                style={{ width: "100%", padding: "8px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Results */}
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Materiality Calculation</div>
              {[
                { label: "Overall Materiality (ISA 320.10)", value: overallMateriality, color: theme.primary, detail: `${selectedBenchmark?.label || ""}: R ${benchmarkValue.toLocaleString("en-ZA")} × ${percentUsed}%` },
                { label: "Performance Materiality (ISA 320.11)", value: performanceMateriality, color: theme.accent, detail: "75% of overall materiality" },
                { label: "Trivial / Clearly Trivial (ISA 450.A2)", value: trivialThreshold, color: theme.textMuted, detail: "5% of overall materiality" },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 14, padding: 12, background: theme.surface, borderRadius: 8, borderLeft: `3px solid ${row.color}` }}>
                  <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: row.color, marginTop: 4 }}>R {Math.round(row.value).toLocaleString("en-ZA")}</div>
                  <div style={{ fontSize: 10, color: theme.textDim, marginTop: 2 }}>{row.detail}</div>
                </div>
              ))}
              <button onClick={applyMateriality} disabled={!overallMateriality} style={{ width: "100%", padding: "10px", background: overallMateriality ? theme.primary : theme.surface, color: overallMateriality ? "#fff" : theme.textDim, border: "none", borderRadius: 8, cursor: overallMateriality ? "pointer" : "default", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                Apply to Engagement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT STRATEGY ─────────────────────────────────────────── */}
      {planView === "strategy" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Overall Audit Strategy</h2>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>ISA 300 — Planning an audit of financial statements</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, height: 8, background: theme.surface, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${strategyProgress}%`, height: "100%", background: strategyProgress === 100 ? theme.success : theme.primary, borderRadius: 4, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: strategyProgress === 100 ? theme.success : theme.primary }}>{strategyProgress}%</span>
            </div>
          </div>

          {strategyItems.map((section) => {
            const sectionDone = section.items.filter((i) => i.done).length;
            return (
              <div key={section.id} style={{ marginBottom: 8, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => toggleStrategySection(section.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ChevronRight size={16} style={{ color: theme.textMuted, transform: section.expanded ? "rotate(90deg)" : "none", transition: "0.2s" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{section.title}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{sectionDone}/{section.items.length} completed</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: theme.surface, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${section.items.length ? (sectionDone / section.items.length) * 100 : 0}%`, height: "100%", background: sectionDone === section.items.length ? theme.success : theme.primary, borderRadius: 3 }} />
                    </div>
                  </div>
                </button>
                {section.expanded && (
                  <div style={{ padding: "0 18px 14px" }}>
                    {section.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${theme.border}22` }}>
                        <button onClick={() => toggleStrategyItem(section.id, item.id)} style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${item.done ? theme.success : theme.borderLight}`, background: item.done ? theme.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 1, padding: 0 }}>
                          {item.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                        </button>
                        <div style={{ fontSize: 13, color: item.done ? theme.textDim : theme.text, lineHeight: 1.5, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</div>
                      </div>
                    ))}
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
