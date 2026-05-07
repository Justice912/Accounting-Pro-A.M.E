// Tool registry for the Claude sidebar.
//
// Each entry has the shape Anthropic's tool-use API expects (name,
// description, input_schema) plus an `execute(input)` function that performs
// the action inside the running app via the appBridge.
//
// To add a new tool, append an object to TOOLS below. The five required
// fields are: name, description, input_schema, execute. That's it — the
// chat loop in claudeClient.js will pick it up automatically.

import { requireBridge } from './appBridge.js';

const KNOWN_TABS = [
  'dashboard',
  'customers',
  'suppliers',
  'companies',
  'accounts',
  'banking',
  'vatcapture',
  'vatrecon',
  'forecast',
  'payroll',
  'reports',
  'audit',
];

function activeCompanyInvoices(state) {
  if (!state.activeCompanyId) return state.invoices || [];
  return (state.invoices || []).filter((i) => i.companyId === state.activeCompanyId);
}

function activeCompanyBank(state) {
  if (!state.activeCompanyId) return state.bankStatements || [];
  return (state.bankStatements || []).filter((s) => s.companyId === state.activeCompanyId);
}

function fmtZAR(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(num);
}

export const TOOLS = [
  {
    name: 'navigate_to',
    description:
      'Switch the main app view to a specific page/tab. Use this whenever the user asks to "show", "open", or "go to" a section of the app.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: KNOWN_TABS,
          description: 'The tab to switch to.',
        },
      },
      required: ['page'],
    },
    execute: ({ page }) => {
      const { actions } = requireBridge();
      if (!KNOWN_TABS.includes(page)) {
        return { ok: false, error: `Unknown page: ${page}. Allowed: ${KNOWN_TABS.join(', ')}` };
      }
      actions.setActiveTab(page);
      return { ok: true, navigated_to: page };
    },
  },

  {
    name: 'get_current_context',
    description:
      'Return the current page, active client/company, and counts of records visible. Call this FIRST whenever the user references "this client", "this invoice", or "the current view".',
    input_schema: { type: 'object', properties: {} },
    execute: () => {
      const { state } = requireBridge();
      const company = state.activeCompany;
      return {
        active_tab: state.activeTab,
        active_company: company
          ? { id: company.id, name: company.name, email: company.email || null }
          : null,
        counts: {
          clients: (state.clients || []).length,
          customers: (state.customers || []).length,
          suppliers: (state.suppliers || []).length,
          invoices_for_active_company: activeCompanyInvoices(state).length,
          bank_transactions_for_active_company: activeCompanyBank(state).length,
          employees: (state.employees || []).length,
        },
        url: typeof window !== 'undefined' ? window.location.href : null,
      };
    },
  },

  {
    name: 'search_clients',
    description:
      'Find companies/clients by name or email. Returns up to 10 matches with their id and name.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search query.' },
      },
      required: ['query'],
    },
    execute: ({ query }) => {
      const { state } = requireBridge();
      const q = String(query || '').trim().toLowerCase();
      if (!q) return { matches: [] };
      const matches = (state.clients || [])
        .filter((c) => {
          const name = String(c.name || '').toLowerCase();
          const email = String(c.email || '').toLowerCase();
          return name.includes(q) || email.includes(q);
        })
        .slice(0, 10)
        .map((c) => ({ id: c.id, name: c.name, email: c.email || null }));
      return { matches };
    },
  },

  {
    name: 'open_client',
    description:
      'Set the active company/client and switch to the Companies tab so the user can see its detail view.',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: ['string', 'number'], description: 'The id of the client/company to open.' },
      },
      required: ['client_id'],
    },
    execute: ({ client_id }) => {
      const { state, actions } = requireBridge();
      const target = (state.clients || []).find((c) => String(c.id) === String(client_id));
      if (!target) return { ok: false, error: `No client with id ${client_id}` };
      actions.setActiveCompanyId(target.id);
      actions.setActiveTab('companies');
      return { ok: true, opened: { id: target.id, name: target.name } };
    },
  },

  {
    name: 'create_invoice',
    description:
      'Open the new-invoice form pre-filled for a given client. Provide line_items as an array of { description, quantity, unit_price, vat_rate? }. The form will open on the Customers tab so the user can confirm and save it.',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: ['string', 'number'], description: 'Company/client id the invoice is for.' },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
              vat_rate: {
                type: 'string',
                description: 'One of the existing VAT rate labels, e.g. "Standard Rate (15.00%)" or "Zero Rate (0.00%)". Defaults to "Standard Rate (15.00%)".',
              },
            },
            required: ['description', 'quantity', 'unit_price'],
          },
        },
        notes: { type: 'string' },
      },
      required: ['client_id', 'line_items'],
    },
    execute: ({ client_id, line_items, notes }) => {
      const { state, actions } = requireBridge();
      const target = (state.clients || []).find((c) => String(c.id) === String(client_id));
      if (!target) return { ok: false, error: `No client with id ${client_id}` };

      // Set the active company so the invoice form is scoped correctly.
      actions.setActiveCompanyId(target.id);
      actions.setActiveTab('customers');

      // Stash a draft on window for the existing InvoiceForm to optionally
      // pick up. We don't modify the existing form code; the draft is purely
      // informational and shows up in get_current_context.
      const draft = {
        clientId: target.id,
        clientName: target.name,
        lineItems: (line_items || []).map((li) => ({
          description: String(li.description || ''),
          quantity: Number(li.quantity) || 1,
          unitPrice: Number(li.unit_price) || 0,
          vatRate: li.vat_rate || 'Standard Rate (15.00%)',
        })),
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        window.__claudeInvoiceDraft = draft;
      }
      actions.setShowInvoiceForm(true);

      return {
        ok: true,
        message: 'Invoice form opened. Draft is stored at window.__claudeInvoiceDraft and the user must confirm and save.',
        draft,
      };
    },
  },

  {
    name: 'list_invoices',
    description:
      'Return invoices for the active company, optionally filtered. Use this to answer "show me unpaid invoices", "how many invoices this month", etc.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status, e.g. "Pending", "Paid".' },
        from_date: { type: 'string', description: 'ISO date YYYY-MM-DD inclusive.' },
        to_date: { type: 'string', description: 'ISO date YYYY-MM-DD inclusive.' },
        limit: { type: 'number', description: 'Cap on rows returned. Defaults to 25.' },
      },
    },
    execute: ({ status, from_date, to_date, limit } = {}) => {
      const { state } = requireBridge();
      let rows = activeCompanyInvoices(state);
      if (status) rows = rows.filter((i) => String(i.status || '').toLowerCase() === String(status).toLowerCase());
      if (from_date) rows = rows.filter((i) => (i.date || '') >= from_date);
      if (to_date) rows = rows.filter((i) => (i.date || '') <= to_date);
      const cap = Math.min(Math.max(Number(limit) || 25, 1), 100);
      const total = rows.reduce((s, i) => s + (Number(i.total) || 0), 0);
      return {
        count: rows.length,
        total_value: fmtZAR(total),
        invoices: rows.slice(0, cap).map((i) => ({
          id: i.id,
          number: i.number || i.invoiceNumber,
          date: i.date,
          customer: i.customer || i.customerName,
          status: i.status,
          total: i.total,
        })),
      };
    },
  },

  {
    name: 'list_bank_transactions',
    description:
      'Return bank transactions for the active company, optionally filtered by date range or unallocated status.',
    input_schema: {
      type: 'object',
      properties: {
        unallocated_only: { type: 'boolean' },
        from_date: { type: 'string', description: 'ISO date YYYY-MM-DD inclusive.' },
        to_date: { type: 'string', description: 'ISO date YYYY-MM-DD inclusive.' },
        limit: { type: 'number', description: 'Cap on rows returned. Defaults to 25.' },
      },
    },
    execute: ({ unallocated_only, from_date, to_date, limit } = {}) => {
      const { state } = requireBridge();
      let rows = activeCompanyBank(state);
      if (unallocated_only) rows = rows.filter((s) => s.selection === 'Unallocated Expen' || !s.selection);
      if (from_date) rows = rows.filter((s) => (s.date || '') >= from_date);
      if (to_date) rows = rows.filter((s) => (s.date || '') <= to_date);
      const cap = Math.min(Math.max(Number(limit) || 25, 1), 100);
      return {
        count: rows.length,
        transactions: rows.slice(0, cap).map((s) => ({
          date: s.date,
          description: s.description,
          received: s.received,
          spent: s.spent,
          allocated_to: s.selection,
        })),
      };
    },
  },

  {
    name: 'get_dashboard_totals',
    description:
      'Return the financial totals shown on the dashboard for the active company: income, expenses, profit, pending invoice count, unallocated transaction count.',
    input_schema: { type: 'object', properties: {} },
    execute: () => {
      const { state } = requireBridge();
      const stmts = activeCompanyBank(state);
      const invs = activeCompanyInvoices(state);
      const totalIncome = stmts.reduce((s, x) => s + (Number(x.received) || 0), 0);
      const totalExpenses = stmts.reduce((s, x) => s + (Number(x.spent) || 0), 0);
      return {
        active_company: state.activeCompany?.name || null,
        total_income: fmtZAR(totalIncome),
        total_expenses: fmtZAR(totalExpenses),
        total_profit: fmtZAR(totalIncome - totalExpenses),
        pending_invoices: invs.filter((i) => i.status === 'Pending').length,
        unallocated_transactions: stmts.filter((s) => s.selection === 'Unallocated Expen').length,
      };
    },
  },

  {
    name: 'summarise_data',
    description:
      'Pull a structured snapshot of one part of the app for the active company so Claude can summarise it. scope must be one of: "invoices", "bank", "vat", "payroll", "clients".',
    input_schema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['invoices', 'bank', 'vat', 'payroll', 'clients'],
        },
      },
      required: ['scope'],
    },
    execute: ({ scope }) => {
      const { state } = requireBridge();
      switch (scope) {
        case 'invoices': {
          const rows = activeCompanyInvoices(state);
          return {
            scope,
            count: rows.length,
            sample: rows.slice(0, 20),
          };
        }
        case 'bank': {
          const rows = activeCompanyBank(state);
          return {
            scope,
            count: rows.length,
            sample: rows.slice(0, 20),
          };
        }
        case 'vat': {
          const rows = (state.vatTransactions || []).filter(
            (v) => !state.activeCompanyId || v.companyId === state.activeCompanyId,
          );
          return { scope, count: rows.length, sample: rows.slice(0, 20) };
        }
        case 'payroll': {
          return {
            scope,
            employees: (state.employees || []).length,
            payslips: (state.payslips || []).length,
            sample_employees: (state.employees || []).slice(0, 10),
          };
        }
        case 'clients': {
          return {
            scope,
            count: (state.clients || []).length,
            sample: (state.clients || []).slice(0, 20).map((c) => ({
              id: c.id,
              name: c.name,
              email: c.email || null,
            })),
          };
        }
        default:
          return { error: `Unknown scope: ${scope}` };
      }
    },
  },

  {
    name: 'open_invoice_form',
    description:
      'Open the empty new-invoice form on the Customers tab. Use when the user just says "create an invoice" without details.',
    input_schema: { type: 'object', properties: {} },
    execute: () => {
      const { actions } = requireBridge();
      actions.setActiveTab('customers');
      actions.setShowInvoiceForm(true);
      return { ok: true };
    },
  },

  {
    name: 'open_new_company_form',
    description:
      'Open the new-company / add-client form on the Companies tab.',
    input_schema: { type: 'object', properties: {} },
    execute: () => {
      const { actions } = requireBridge();
      actions.setActiveTab('companies');
      actions.setShowClientForm(true);
      return { ok: true };
    },
  },

  {
    name: 'open_new_supplier_form',
    description:
      'Open the new-supplier form on the Suppliers tab.',
    input_schema: { type: 'object', properties: {} },
    execute: () => {
      const { actions } = requireBridge();
      actions.setActiveTab('suppliers');
      actions.setShowSupplierForm(true);
      return { ok: true };
    },
  },
];

// Anthropic-shaped tool definitions (no execute function).
export function getAnthropicTools() {
  return TOOLS.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
}

export function findTool(name) {
  return TOOLS.find((t) => t.name === name);
}
