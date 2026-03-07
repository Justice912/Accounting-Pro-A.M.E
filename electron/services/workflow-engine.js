/**
 * Workflow Engine — Structured workflow orchestration for AI conversations.
 * Every domain has workflow templates that structure AI responses into step-by-step outputs.
 */

const WORKFLOWS = {
  // ==================== SA TAX ====================
  'tax-calculation': {
    name: 'Tax Calculation',
    domain: 'sa-tax',
    description: 'Structured tax computation workflow',
    keywords: ['calculate', 'tax', 'paye', 'provisional', 'cgt', 'capital gains', 'income tax', 'compute', 'how much tax', 'liability', 'taxable income'],
    steps: [
      { name: 'Gather Facts', instruction: 'Identify all relevant income sources, deductions, and taxpayer details from the query. Ask clarifying questions if critical information is missing.', outputFormat: 'Bullet list of facts' },
      { name: 'Identify Legislation', instruction: 'Cite the specific sections of the Income Tax Act, VAT Act, or other legislation that apply to this scenario.', outputFormat: 'Table of applicable sections' },
      { name: 'Calculate', instruction: 'Perform the step-by-step calculation showing all working. Use current tax year rates and thresholds.', outputFormat: 'Formatted calculation with R amounts' },
      { name: 'Verify', instruction: 'Cross-check the calculation for common errors: bracket application, rebate eligibility, exemption limits, deduction caps.', outputFormat: 'Verification checklist' },
      { name: 'Report', instruction: 'Summarise the final tax position with effective tax rate and practical next steps for the taxpayer/practitioner.', outputFormat: 'Summary with actionable recommendations' },
    ],
  },
  'compliance-review': {
    name: 'Compliance Review',
    domain: 'sa-tax',
    description: 'Tax compliance assessment workflow',
    keywords: ['compliance', 'review', 'deadline', 'filing', 'sars', 'penalty', 'requirement', 'obligation', 'return'],
    steps: [
      { name: 'Identify Requirements', instruction: 'List all relevant tax compliance obligations applicable to the entity/individual.', outputFormat: 'Numbered list of obligations' },
      { name: 'Review Documents', instruction: 'Assess which documents/submissions are needed and their current status.', outputFormat: 'Status table' },
      { name: 'Check Deadlines', instruction: 'Map out all relevant deadlines and flag any that are imminent or overdue.', outputFormat: 'Timeline with dates' },
      { name: 'Flag Issues', instruction: 'Identify any compliance gaps, risks, or potential penalties.', outputFormat: 'Risk-rated issue list' },
      { name: 'Recommendations', instruction: 'Provide specific, prioritised action items to achieve/maintain compliance.', outputFormat: 'Prioritised action plan' },
    ],
  },

  // ==================== AUDITING ====================
  'audit-planning': {
    name: 'Audit Planning',
    domain: 'auditing',
    description: 'Structured audit engagement planning',
    keywords: ['plan', 'planning', 'engagement', 'risk assessment', 'materiality', 'strategy', 'audit plan', 'isa 315'],
    steps: [
      { name: 'Understand Entity', instruction: 'Gather information about the entity, its environment, industry, and internal controls (ISA 315).', outputFormat: 'Entity profile summary' },
      { name: 'Risk Assessment', instruction: 'Identify and assess risks of material misstatement at financial statement and assertion levels.', outputFormat: 'Risk matrix' },
      { name: 'Set Materiality', instruction: 'Determine overall materiality, performance materiality, and trivial threshold with rationale.', outputFormat: 'Materiality calculation' },
      { name: 'Design Procedures', instruction: 'Design audit procedures responsive to assessed risks (nature, timing, extent).', outputFormat: 'Audit program outline' },
      { name: 'Document Plan', instruction: 'Summarise the audit strategy and plan including team, timeline, and key focus areas.', outputFormat: 'Audit planning memorandum' },
    ],
  },
  'substantive-testing': {
    name: 'Substantive Testing',
    domain: 'auditing',
    description: 'Substantive test design and execution',
    keywords: ['substantive', 'testing', 'test', 'sample', 'evidence', 'procedure', 'assertion', 'detail'],
    steps: [
      { name: 'Select Population', instruction: 'Define the population and determine appropriate sampling method and sample size.', outputFormat: 'Sampling parameters' },
      { name: 'Design Tests', instruction: 'Design specific tests of details or substantive analytical procedures for the assertions at risk.', outputFormat: 'Test procedure list' },
      { name: 'Execute', instruction: 'Describe how to perform each test and what evidence to obtain.', outputFormat: 'Execution steps' },
      { name: 'Evaluate Findings', instruction: 'Evaluate results, project misstatements, and assess impact on the audit opinion.', outputFormat: 'Findings summary' },
      { name: 'Conclude', instruction: 'Form conclusion on whether sufficient appropriate audit evidence has been obtained.', outputFormat: 'Conclusion statement' },
    ],
  },

  // ==================== ACCOUNTING ====================
  'journal-entry': {
    name: 'Journal Entry Analysis',
    domain: 'accounting',
    description: 'Transaction recording and journal analysis',
    keywords: ['journal', 'entry', 'debit', 'credit', 'record', 'transaction', 'posting', 'double entry', 'book'],
    steps: [
      { name: 'Identify Transaction', instruction: 'Describe the economic event or transaction and identify the parties involved.', outputFormat: 'Transaction description' },
      { name: 'Apply Recognition', instruction: 'Determine the appropriate accounting standard and recognition criteria (IFRS/IFRS for SMEs).', outputFormat: 'Standard reference and criteria' },
      { name: 'Debit/Credit Analysis', instruction: 'Determine which accounts are affected and whether each is debited or credited, with amounts.', outputFormat: 'T-account analysis' },
      { name: 'Record Entry', instruction: 'Present the formal journal entry with narration and source document reference.', outputFormat: 'Formatted journal entry' },
      { name: 'Verify', instruction: 'Confirm debits equal credits, the entry balances, and VAT treatment is correct.', outputFormat: 'Verification checklist' },
    ],
  },
  'financial-reporting': {
    name: 'Financial Reporting',
    domain: 'accounting',
    description: 'Financial statement preparation workflow',
    keywords: ['financial statement', 'report', 'balance sheet', 'income statement', 'annual', 'afs', 'ifrs', 'statement of financial position'],
    steps: [
      { name: 'Compile Data', instruction: 'Gather all relevant financial data, trial balance, and supporting schedules.', outputFormat: 'Data checklist' },
      { name: 'Apply Standards', instruction: 'Identify applicable IFRS/IFRS for SMEs standards and ensure correct accounting treatment.', outputFormat: 'Standards mapping' },
      { name: 'Prepare Statements', instruction: 'Draft the relevant financial statement(s) with proper classification and presentation.', outputFormat: 'Formatted statement' },
      { name: 'Reconcile', instruction: 'Cross-check figures, verify mathematical accuracy, and reconcile to supporting schedules.', outputFormat: 'Reconciliation notes' },
      { name: 'Review', instruction: 'Review for completeness, consistency, and compliance with disclosure requirements.', outputFormat: 'Review checklist' },
    ],
  },

  // ==================== FINANCE ====================
  'cost-analysis': {
    name: 'Cost Analysis',
    domain: 'finance',
    description: 'Cost classification, allocation, and variance analysis',
    keywords: ['cost', 'costing', 'overhead', 'allocation', 'absorption', 'marginal', 'abc', 'activity', 'unit cost', 'variance', 'standard cost'],
    steps: [
      { name: 'Classify Costs', instruction: 'Classify all costs as direct/indirect, fixed/variable/semi-variable, and by function (production/admin/selling).', outputFormat: 'Cost classification table' },
      { name: 'Select Method', instruction: 'Determine the appropriate costing method (absorption, marginal, ABC) and justify the selection.', outputFormat: 'Method rationale' },
      { name: 'Allocate Overheads', instruction: 'Apportion and absorb overhead costs using appropriate bases and activity drivers.', outputFormat: 'Allocation schedule' },
      { name: 'Calculate Unit Costs', instruction: 'Compute the cost per unit under the selected method, showing all workings.', outputFormat: 'Unit cost breakdown' },
      { name: 'Analyze Variances', instruction: 'Calculate and interpret any variances (price, usage, efficiency, volume) and their causes.', outputFormat: 'Variance analysis report' },
    ],
  },
  'valuation': {
    name: 'Business Valuation',
    domain: 'finance',
    description: 'Company/asset valuation workflow',
    keywords: ['valuation', 'dcf', 'value', 'worth', 'multiple', 'enterprise value', 'equity value', 'wacc', 'discount', 'fair value'],
    steps: [
      { name: 'Assess Company', instruction: 'Analyse the company/asset fundamentals: industry, financials, growth profile, and competitive position.', outputFormat: 'Company profile' },
      { name: 'Select Methodology', instruction: 'Choose appropriate valuation methodology(ies) and justify: DCF, comparable companies, precedent transactions, asset-based.', outputFormat: 'Methodology selection with rationale' },
      { name: 'Build Model', instruction: 'Construct the valuation model with explicit assumptions, projections, and discount rates.', outputFormat: 'Valuation model with workings' },
      { name: 'Sensitivity Analysis', instruction: 'Test key assumptions (growth rate, discount rate, terminal value, margins) and present range of outcomes.', outputFormat: 'Sensitivity tables' },
      { name: 'Present Findings', instruction: 'Summarise the valuation range, key drivers, and caveats/limitations.', outputFormat: 'Valuation summary' },
    ],
  },
  'deal-analysis': {
    name: 'Deal Analysis',
    domain: 'finance',
    description: 'M&A / transaction analysis workflow',
    keywords: ['deal', 'merger', 'acquisition', 'lbo', 'buyout', 'target', 'transaction', 'm&a', 'takeover', 'accretion', 'dilution'],
    steps: [
      { name: 'Screen Target', instruction: 'Evaluate the target company profile, strategic rationale, and initial attractiveness.', outputFormat: 'Target screening summary' },
      { name: 'Financial Due Diligence', instruction: 'Analyse historical financials, quality of earnings, working capital, and debt-like items.', outputFormat: 'Due diligence findings' },
      { name: 'Valuation', instruction: 'Value the target using multiple methodologies and determine an offer price range.', outputFormat: 'Valuation bridge' },
      { name: 'Structure Deal', instruction: 'Propose deal structure including consideration mix (cash/shares/earn-out), financing, and key terms.', outputFormat: 'Deal structure outline' },
      { name: 'Risk Assessment', instruction: 'Identify key risks (regulatory, integration, financial, market) and mitigation strategies.', outputFormat: 'Risk matrix with mitigations' },
    ],
  },

  // ==================== HR & PAYROLL ====================
  'payroll-processing': {
    name: 'Payroll Processing',
    domain: 'hr-payroll',
    description: 'End-to-end payroll calculation workflow',
    keywords: ['payroll', 'salary', 'wage', 'pay', 'gross', 'net', 'deduction', 'paye', 'uif', 'payslip'],
    steps: [
      { name: 'Verify Inputs', instruction: 'Confirm employee details, hours worked, allowances, and any changes for the period.', outputFormat: 'Input verification checklist' },
      { name: 'Calculate Gross', instruction: 'Calculate gross remuneration including basic salary, overtime, allowances, and benefits.', outputFormat: 'Gross pay breakdown' },
      { name: 'Apply Deductions', instruction: 'Calculate statutory deductions (PAYE, UIF, SDL) and voluntary deductions (pension, medical aid, etc.).', outputFormat: 'Deduction schedule' },
      { name: 'Net Pay', instruction: 'Calculate net pay and verify the payslip balances.', outputFormat: 'Net pay calculation' },
      { name: 'Generate Reports', instruction: 'Prepare payroll summary, payment file, and reconciliation reports.', outputFormat: 'Payroll reports summary' },
    ],
  },
  'hr-compliance-check': {
    name: 'HR Compliance Check',
    domain: 'hr-payroll',
    description: 'Employment law compliance assessment',
    keywords: ['compliance', 'bcea', 'lra', 'labour', 'employment', 'regulation', 'policy', 'legal', 'contract'],
    steps: [
      { name: 'Identify Regulations', instruction: 'List all applicable employment legislation (BCEA, LRA, EEA, OHSA, COIDA, etc.).', outputFormat: 'Legislation register' },
      { name: 'Review Policies', instruction: 'Assess existing company policies against legislative requirements.', outputFormat: 'Policy review matrix' },
      { name: 'Assess Compliance', instruction: 'Evaluate current compliance status for each regulatory area.', outputFormat: 'Compliance status dashboard' },
      { name: 'Gap Analysis', instruction: 'Identify gaps between current practices and legal requirements.', outputFormat: 'Gap analysis table' },
      { name: 'Action Plan', instruction: 'Develop prioritised remediation actions with timelines and responsible parties.', outputFormat: 'Remediation action plan' },
    ],
  },

  // ==================== QUANTITY SURVEYING ====================
  'boq-preparation': {
    name: 'BOQ Preparation',
    domain: 'quantity-surveying',
    description: 'Bill of quantities preparation workflow',
    keywords: ['boq', 'bill', 'quantities', 'measure', 'rate', 'pricing', 'tender', 'estimate', 'take-off'],
    steps: [
      { name: 'Review Drawings', instruction: 'Examine architectural and engineering drawings to identify all measurable elements.', outputFormat: 'Drawing review notes' },
      { name: 'Measure Quantities', instruction: 'Take off quantities for each element following ASAQS measurement standards.', outputFormat: 'Measurement schedule' },
      { name: 'Apply Rates', instruction: 'Apply appropriate unit rates considering market conditions, location, and specifications.', outputFormat: 'Priced items' },
      { name: 'Calculate Totals', instruction: 'Sum all items, add preliminaries, contingencies, and escalation allowances.', outputFormat: 'Summary of estimated cost' },
      { name: 'Verify', instruction: 'Cross-check quantities against drawings, verify rate reasonableness, and check arithmetic.', outputFormat: 'Verification report' },
    ],
  },
  'valuation-certificate': {
    name: 'Valuation Certificate',
    domain: 'quantity-surveying',
    description: 'Progress payment valuation workflow',
    keywords: ['valuation', 'certificate', 'payment', 'progress', 'interim', 'work done', 'retention', 'claim'],
    steps: [
      { name: 'Verify Work Done', instruction: 'Inspect and verify the work completed on site against the contract BOQ.', outputFormat: 'Work completion assessment' },
      { name: 'Measure Progress', instruction: 'Measure quantities of completed work and work in progress for each BOQ item.', outputFormat: 'Progress measurement' },
      { name: 'Apply Rates', instruction: 'Apply contract rates to measured quantities and calculate claim amounts.', outputFormat: 'Valued items' },
      { name: 'Deductions', instruction: 'Calculate retention, previous payments, penalties, and any contra charges.', outputFormat: 'Deduction schedule' },
      { name: 'Issue Certificate', instruction: 'Prepare the payment certificate with all supporting calculations and recommendations.', outputFormat: 'Payment certificate' },
    ],
  },

  // ==================== GENERAL ====================
  'research': {
    name: 'Research & Analysis',
    domain: 'general',
    description: 'General research and analysis workflow',
    keywords: ['research', 'explain', 'what is', 'how does', 'compare', 'analyse', 'analyze', 'summary', 'overview', 'difference'],
    steps: [
      { name: 'Understand Query', instruction: 'Clarify the question being asked and identify the specific information needed.', outputFormat: 'Restated question' },
      { name: 'Gather Information', instruction: 'Provide comprehensive factual information relevant to the query from professional knowledge.', outputFormat: 'Key facts and context' },
      { name: 'Analyze', instruction: 'Analyse the information, identify key themes, compare perspectives, and assess implications.', outputFormat: 'Analysis section' },
      { name: 'Synthesize', instruction: 'Synthesise findings into a coherent answer addressing the original query.', outputFormat: 'Synthesised answer' },
      { name: 'Present Findings', instruction: 'Present the final answer in a clear, structured format with practical takeaways.', outputFormat: 'Conclusion and recommendations' },
    ],
  },
};

/**
 * Select the most appropriate workflow based on domain and user message.
 * Uses keyword scoring — domain-specific workflows score 2x vs general.
 * Returns null if no keywords match (allows unstructured responses).
 */
function selectWorkflow(domain, userMessage) {
  const messageLower = userMessage.toLowerCase();

  // Filter workflows for this domain + general fallback
  const candidates = Object.entries(WORKFLOWS).filter(
    ([, wf]) => wf.domain === domain || wf.domain === 'general'
  );

  let bestMatch = null;
  let bestScore = 0;

  for (const [id, workflow] of candidates) {
    let score = 0;
    for (const keyword of workflow.keywords) {
      if (messageLower.includes(keyword)) {
        score += workflow.domain === domain ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { id, ...workflow };
    }
  }

  // Require at least 1 keyword match to activate
  return bestScore >= 1 ? bestMatch : null;
}

/**
 * Build a workflow instruction block to append to the system prompt.
 */
function buildWorkflowPrompt(workflow) {
  const stepLines = workflow.steps
    .map(
      (step, i) =>
        `### Step ${i + 1}: ${step.name}\n- **Instruction**: ${step.instruction}\n- **Output format**: ${step.outputFormat}`
    )
    .join('\n\n');

  return `

=== WORKFLOW ORCHESTRATION: ${workflow.name} ===

You MUST follow these steps IN ORDER for your response.
Format each step with a markdown heading: ## Step N: Name
Complete ALL steps before concluding. Do not skip any step.

${stepLines}

After completing all steps, add a brief **## Summary** section with key takeaways.

=== END WORKFLOW ===
`;
}

/**
 * Get all workflow definitions
 */
function getAllWorkflows() {
  return WORKFLOWS;
}

/**
 * Get workflows for a specific domain
 */
function getWorkflowsForDomain(domain) {
  return Object.entries(WORKFLOWS)
    .filter(([, wf]) => wf.domain === domain)
    .reduce((acc, [id, wf]) => ({ ...acc, [id]: wf }), {});
}

export default {
  selectWorkflow,
  buildWorkflowPrompt,
  getAllWorkflows,
  getWorkflowsForDomain,
  WORKFLOWS,
};
