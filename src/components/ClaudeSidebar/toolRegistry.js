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
import {
  ASSET_CATEGORIES,
  TAX_SECTIONS,
  netBookValue,
  accumulatedDepreciation,
  taxBase,
  deferredTax,
  temporaryDifference,
  disposalGainLoss,
  taxRecoupment,
  movementSchedule,
  registerSnapshot,
  depreciationInPeriod,
  COMPANY_TAX_RATE,
} from '../../utils/assetCalculations.js';

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
  'assets',
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
      'Return bank transactions for the active company, optionally filtered by date range or unallocated status. Each row includes its `id` — pass that id verbatim to allocate_bank_transaction or bulk_allocate_bank_transactions.',
    input_schema: {
      type: 'object',
      properties: {
        unallocated_only: { type: 'boolean' },
        from_date: { type: 'string', description: 'ISO date YYYY-MM-DD inclusive.' },
        to_date: { type: 'string', description: 'ISO date YYYY-MM-DD inclusive.' },
        limit: { type: 'number', description: 'Cap on rows returned. Defaults to 50 (bumped from 25 so a typical month fits in one call).' },
      },
    },
    execute: ({ unallocated_only, from_date, to_date, limit } = {}) => {
      const { state } = requireBridge();
      let rows = activeCompanyBank(state);
      if (unallocated_only) {
        rows = rows.filter(
          (s) =>
            !s.selection ||
            s.selection === 'Unallocated Expen' ||
            s.selection === 'Unallocated Income',
        );
      }
      if (from_date) rows = rows.filter((s) => (s.date || '') >= from_date);
      if (to_date) rows = rows.filter((s) => (s.date || '') <= to_date);
      const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
      return {
        count: rows.length,
        transactions: rows.slice(0, cap).map((s) => ({
          id: s.id,
          date: s.date,
          payee: s.payee,
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

  // ===================== Agentic banking tools =====================
  // Claude can read transactions, look at the chart of accounts, and then
  // actually write allocations back into the app.

  {
    name: 'list_accounts',
    description:
      'Return the chart of accounts. Use this BEFORE allocating bank transactions so you know which exact account names exist (the selection field on a transaction must match an account name verbatim). Optionally filter by category, e.g. "Expenses", "Sales", "Other Income".',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category filter, e.g. "Expenses", "Sales", "Other Income", "Current Assets".',
        },
      },
    },
    execute: ({ category } = {}) => {
      const { state } = requireBridge();
      let rows = (state.accounts || []).filter((a) => a.active !== false);
      if (category) {
        const c = String(category).toLowerCase();
        rows = rows.filter((a) => String(a.category || '').toLowerCase() === c);
      }
      return {
        count: rows.length,
        accounts: rows.map((a) => ({ name: a.name, category: a.category })),
      };
    },
  },

  {
    name: 'allocate_bank_transaction',
    description:
      'Allocate one bank transaction to an account (and optionally a VAT rate). The account_name must match an entry returned by list_accounts. The change is persisted immediately and visible in the Banking tab. Use this for one-off corrections; for batch allocation prefer bulk_allocate_bank_transactions.',
    input_schema: {
      type: 'object',
      properties: {
        transaction_id: { type: ['string', 'number'], description: 'id of the bank transaction.' },
        account_name: { type: 'string', description: 'Exact account name from list_accounts (e.g. "Motor Vehicle Expenses").' },
        vat_rate: {
          type: 'string',
          description: 'Optional VAT rate label, e.g. "Standard Rate (15.00%)", "Zero Rate (0.00%)", "Exempt and Non-Supplies (0.00%)", "No VAT".',
        },
      },
      required: ['transaction_id', 'account_name'],
    },
    execute: ({ transaction_id, account_name, vat_rate }) => {
      const { state, actions } = requireBridge();
      const stmt = (state.bankStatements || []).find((s) => String(s.id) === String(transaction_id));
      if (!stmt) return { ok: false, error: `No bank transaction with id ${transaction_id}` };

      const account = (state.accounts || []).find((a) => a.name === account_name);
      if (!account) {
        return {
          ok: false,
          error: `Unknown account "${account_name}". Call list_accounts to see valid names.`,
        };
      }

      const updated = (state.bankStatements || []).map((s) =>
        String(s.id) === String(transaction_id)
          ? {
              ...s,
              selection: account.name,
              vatRate: vat_rate || s.vatRate || 'No VAT',
              aiAllocated: true,
              allocationTier: 'ai-suggested',
              allocationConfidence: 70,
            }
          : s,
      );
      actions.saveBankStatements(updated);
      return {
        ok: true,
        allocated: {
          id: stmt.id,
          description: stmt.description,
          account: account.name,
          vat_rate: vat_rate || stmt.vatRate || 'No VAT',
        },
      };
    },
  },

  {
    name: 'bulk_allocate_bank_transactions',
    description:
      'Allocate many bank transactions in one call. Pass an `allocations` array, each with { transaction_id, account_name, vat_rate? }. Account names must match the chart of accounts (list_accounts). Returns a per-row report of successes and failures. This is the preferred tool for the agentic flow: list_bank_transactions(unallocated_only=true) -> list_accounts -> bulk_allocate_bank_transactions.',
    input_schema: {
      type: 'object',
      properties: {
        allocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transaction_id: { type: ['string', 'number'] },
              account_name: { type: 'string' },
              vat_rate: { type: 'string' },
            },
            required: ['transaction_id', 'account_name'],
          },
        },
      },
      required: ['allocations'],
    },
    execute: ({ allocations }) => {
      const { state, actions } = requireBridge();
      const accountsByName = new Map((state.accounts || []).map((a) => [a.name, a]));
      const stmtsById = new Map((state.bankStatements || []).map((s) => [String(s.id), s]));

      const successes = [];
      const failures = [];
      const patch = new Map();

      for (const a of allocations || []) {
        const stmt = stmtsById.get(String(a.transaction_id));
        if (!stmt) {
          failures.push({ transaction_id: a.transaction_id, error: 'Transaction not found' });
          continue;
        }
        const acc = accountsByName.get(a.account_name);
        if (!acc) {
          failures.push({ transaction_id: a.transaction_id, error: `Unknown account: ${a.account_name}` });
          continue;
        }
        patch.set(String(stmt.id), {
          selection: acc.name,
          vatRate: a.vat_rate || stmt.vatRate || 'No VAT',
          aiAllocated: true,
          allocationTier: 'ai-suggested',
          allocationConfidence: 70,
        });
        successes.push({
          transaction_id: stmt.id,
          description: stmt.description,
          account: acc.name,
          vat_rate: a.vat_rate || stmt.vatRate || 'No VAT',
        });
      }

      if (patch.size > 0) {
        const updated = (state.bankStatements || []).map((s) => {
          const p = patch.get(String(s.id));
          return p ? { ...s, ...p } : s;
        });
        actions.saveBankStatements(updated);
      }

      return {
        ok: failures.length === 0,
        allocated: successes.length,
        failed: failures.length,
        successes,
        failures,
      };
    },
  },

  {
    name: 'unallocate_bank_transaction',
    description:
      'Reset a bank transaction back to Unallocated. Useful for undoing an incorrect allocation.',
    input_schema: {
      type: 'object',
      properties: {
        transaction_id: { type: ['string', 'number'] },
      },
      required: ['transaction_id'],
    },
    execute: ({ transaction_id }) => {
      const { state, actions } = requireBridge();
      const stmt = (state.bankStatements || []).find((s) => String(s.id) === String(transaction_id));
      if (!stmt) return { ok: false, error: `No bank transaction with id ${transaction_id}` };
      const isIncome = (Number(stmt.received) || 0) > 0;
      const target = isIncome ? 'Unallocated Income' : 'Unallocated Expen';
      const updated = (state.bankStatements || []).map((s) =>
        String(s.id) === String(transaction_id)
          ? { ...s, selection: target, aiAllocated: false, allocationTier: null, allocationConfidence: 0, matchedRule: null }
          : s,
      );
      actions.saveBankStatements(updated);
      return { ok: true, transaction_id: stmt.id, selection: target };
    },
  },

  {
    name: 'set_active_company',
    description:
      'Find the best-matching company by name and set it as the active company. Returns the chosen company. Use this when the user says "switch to client X" or "work on client Y".',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'A name or partial name to fuzzy-match against the client list.' },
      },
      required: ['query'],
    },
    execute: ({ query }) => {
      const { state, actions } = requireBridge();
      const q = String(query || '').trim().toLowerCase();
      if (!q) return { ok: false, error: 'query is required' };
      const matches = (state.clients || []).filter((c) =>
        String(c.name || '').toLowerCase().includes(q),
      );
      if (matches.length === 0) {
        return { ok: false, error: `No client matches "${query}".` };
      }
      if (matches.length > 1) {
        return {
          ok: false,
          error: 'Multiple matches; please confirm which one.',
          matches: matches.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
        };
      }
      const target = matches[0];
      actions.setActiveCompanyId(target.id);
      return { ok: true, active_company: { id: target.id, name: target.name } };
    },
  },

  {
    name: 'mark_invoice_paid',
    description:
      'Set an invoice\'s status to Paid and persist via the existing saveInvoices store. Returns the updated invoice. The user does not need to confirm — this is a direct write.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: ['string', 'number'] },
      },
      required: ['invoice_id'],
    },
    execute: ({ invoice_id }) => {
      const { state, actions } = requireBridge();
      const target = (state.invoices || []).find((i) => String(i.id) === String(invoice_id));
      if (!target) return { ok: false, error: `No invoice with id ${invoice_id}` };
      const updated = (state.invoices || []).map((i) =>
        String(i.id) === String(invoice_id) ? { ...i, status: 'Paid' } : i,
      );
      actions.saveInvoices(updated);
      return {
        ok: true,
        invoice: {
          id: target.id,
          number: target.number || target.invoiceNumber,
          customer: target.customer || target.customerName,
          total: target.total,
          status: 'Paid',
        },
      };
    },
  },

  // ===================== Asset register tools =====================
  // Read + write tools for the fixed-asset register. Claude can list/get,
  // add a new asset, dispose an asset, and run any of the canned reports.

  {
    name: 'list_assets',
    description:
      'Return the asset register for the active company. Optional filters by status (active/disposed/written-off), category, and acquisition date range. Each row includes id (pass verbatim to other asset tools), code, name, category, cost, current NBV and current tax base.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'disposed', 'written-off'] },
        category: { type: 'string' },
        acquired_from: { type: 'string', description: 'YYYY-MM-DD inclusive.' },
        acquired_to: { type: 'string', description: 'YYYY-MM-DD inclusive.' },
        limit: { type: 'number' },
      },
    },
    execute: ({ status, category, acquired_from, acquired_to, limit } = {}) => {
      const { state } = requireBridge();
      const companyId = state.activeCompanyId;
      let rows = (state.assets || []).filter((a) => !companyId || a.companyId === companyId);
      if (status) rows = rows.filter((a) => a.status === status);
      if (category) rows = rows.filter((a) => a.category === category);
      if (acquired_from) rows = rows.filter((a) => (a.acquisitionDate || '') >= acquired_from);
      if (acquired_to) rows = rows.filter((a) => (a.acquisitionDate || '') <= acquired_to);
      const today = new Date().toISOString().slice(0, 10);
      const cap = Math.min(Math.max(Number(limit) || 100, 1), 500);
      return {
        count: rows.length,
        assets: rows.slice(0, cap).map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          category: a.category,
          status: a.status,
          acquisition_date: a.acquisitionDate,
          cost_excl_vat: Number(a.costExclVat) || 0,
          nbv_today: netBookValue(a, today),
          tax_base_today: taxBase(a, today),
          tax_section: a.taxSection,
        })),
      };
    },
  },

  {
    name: 'get_asset',
    description:
      'Return the full record for one asset including depreciation method, tax section, GL accounts, and disposal info if applicable.',
    input_schema: {
      type: 'object',
      properties: { asset_id: { type: ['string', 'number'] } },
      required: ['asset_id'],
    },
    execute: ({ asset_id }) => {
      const { state } = requireBridge();
      const a = (state.assets || []).find((x) => String(x.id) === String(asset_id));
      if (!a) return { ok: false, error: `No asset with id ${asset_id}` };
      const today = new Date().toISOString().slice(0, 10);
      return {
        ok: true,
        asset: {
          ...a,
          computed: {
            nbv_today: netBookValue(a, today),
            accumulated_depreciation: accumulatedDepreciation(a, today),
            tax_base_today: taxBase(a, today),
            temporary_difference: temporaryDifference(a, today),
            deferred_tax: deferredTax(a, today),
          },
        },
      };
    },
  },

  {
    name: 'add_asset',
    description:
      'Create a new fixed asset on the active company\'s register. The minimum fields are name, acquisition_date and cost_excl_vat — the rest fall back to sensible defaults (5-year straight-line, s11(e) general wear & tear, no residual). The asset is persisted immediately.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string', description: 'Optional asset code, e.g. "MV-001". Auto-generated if omitted.' },
        category: { type: 'string', enum: ASSET_CATEGORIES },
        description: { type: 'string' },
        location: { type: 'string' },
        serial_number: { type: 'string' },
        acquisition_date: { type: 'string', description: 'YYYY-MM-DD' },
        cost_excl_vat: { type: 'number' },
        vat_amount: { type: 'number' },
        supplier_name: { type: 'string' },
        invoice_ref: { type: 'string' },
        depreciation_method: { type: 'string', enum: ['straight-line', 'reducing-balance'] },
        useful_life_months: { type: 'number' },
        residual_value: { type: 'number' },
        tax_section: { type: 'string', enum: Object.keys(TAX_SECTIONS) },
        notes: { type: 'string' },
      },
      required: ['name', 'acquisition_date', 'cost_excl_vat'],
    },
    execute: (input) => {
      const { state, actions } = requireBridge();
      const companyId = state.activeCompanyId;
      if (!companyId) return { ok: false, error: 'No active company. Use set_active_company first.' };
      const cost = Number(input.cost_excl_vat) || 0;
      const vat = Number(input.vat_amount) || 0;
      const newAsset = {
        id: `AST${Date.now()}${Math.floor(Math.random() * 1000)}`,
        companyId,
        code: input.code || '',
        name: input.name,
        description: input.description || '',
        category: input.category || ASSET_CATEGORIES[0],
        location: input.location || '',
        serialNumber: input.serial_number || '',
        acquisitionDate: input.acquisition_date,
        costExclVat: cost,
        vatAmount: vat,
        costInclVat: cost + vat,
        supplierName: input.supplier_name || '',
        invoiceRef: input.invoice_ref || '',
        depreciationMethod: input.depreciation_method || 'straight-line',
        usefulLifeMonths: Number(input.useful_life_months) || 60,
        residualValue: Number(input.residual_value) || 0,
        depreciationStartDate: '',
        taxSection: input.tax_section || 's11e_general_5yr',
        glAssetAccount: '',
        glAccumDepAccount: '',
        glDepExpenseAccount: 'Depreciation',
        status: 'active',
        disposalDate: null,
        disposalProceeds: null,
        disposalNotes: '',
        notes: input.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      actions.saveAssets([...(state.assets || []), newAsset]);
      actions.setActiveTab('assets');
      return {
        ok: true,
        asset: {
          id: newAsset.id,
          code: newAsset.code,
          name: newAsset.name,
          cost: newAsset.costExclVat,
          tax_section: newAsset.taxSection,
        },
      };
    },
  },

  {
    name: 'dispose_asset',
    description:
      'Mark an asset as disposed. Records the disposal date, proceeds, and computes the IFRS gain/loss plus SARS tax recoupment, capital gain and scrapping allowance. The asset stays on the register flagged as disposed.',
    input_schema: {
      type: 'object',
      properties: {
        asset_id: { type: ['string', 'number'] },
        disposal_date: { type: 'string', description: 'YYYY-MM-DD' },
        proceeds: { type: 'number', description: 'Disposal proceeds excluding VAT.' },
        notes: { type: 'string' },
      },
      required: ['asset_id', 'disposal_date'],
    },
    execute: ({ asset_id, disposal_date, proceeds, notes }) => {
      const { state, actions } = requireBridge();
      const target = (state.assets || []).find((a) => String(a.id) === String(asset_id));
      if (!target) return { ok: false, error: `No asset with id ${asset_id}` };
      const updated = {
        ...target,
        status: 'disposed',
        disposalDate: disposal_date,
        disposalProceeds: Number(proceeds) || 0,
        disposalNotes: notes || '',
        updatedAt: new Date().toISOString(),
      };
      actions.saveAssets((state.assets || []).map((a) => (a.id === target.id ? updated : a)));
      const tax = taxRecoupment(updated);
      return {
        ok: true,
        disposal: {
          asset_id: updated.id,
          name: updated.name,
          disposal_date: updated.disposalDate,
          proceeds: updated.disposalProceeds,
          nbv_at_disposal: netBookValue(updated, updated.disposalDate),
          ifrs_gain_loss: disposalGainLoss(updated),
          tax_recoupment: tax.recoupment,
          capital_gain: tax.capitalGain,
          scrapping_allowance: tax.scrappingAllowance,
        },
      };
    },
  },

  {
    name: 'unset_disposal',
    description:
      'Re-instate a disposed asset (clears the disposal fields and sets status back to active). Useful for correcting a wrong disposal entry.',
    input_schema: {
      type: 'object',
      properties: { asset_id: { type: ['string', 'number'] } },
      required: ['asset_id'],
    },
    execute: ({ asset_id }) => {
      const { state, actions } = requireBridge();
      const target = (state.assets || []).find((a) => String(a.id) === String(asset_id));
      if (!target) return { ok: false, error: `No asset with id ${asset_id}` };
      const updated = {
        ...target,
        status: 'active',
        disposalDate: null,
        disposalProceeds: null,
        disposalNotes: '',
        updatedAt: new Date().toISOString(),
      };
      actions.saveAssets((state.assets || []).map((a) => (a.id === target.id ? updated : a)));
      return { ok: true, asset_id: target.id };
    },
  },

  {
    name: 'run_asset_report',
    description:
      'Compute one of the canned asset register reports for the active company. Reports: "snapshot" (current totals), "movement" (opening/additions/depreciation/disposals/closing for a period), "depreciation_period" (depreciation per asset between two dates), "disposals_period" (gain/loss + recoupment for disposals in period), "deferred_tax" (deferred tax per asset as at to_date), "category_rollup" (totals per category).',
    input_schema: {
      type: 'object',
      properties: {
        report: {
          type: 'string',
          enum: [
            'snapshot',
            'movement',
            'depreciation_period',
            'disposals_period',
            'deferred_tax',
            'category_rollup',
          ],
        },
        from_date: { type: 'string', description: 'YYYY-MM-DD inclusive (period start).' },
        to_date: { type: 'string', description: 'YYYY-MM-DD inclusive (period end / asof).' },
      },
      required: ['report'],
    },
    execute: ({ report, from_date, to_date }) => {
      const { state } = requireBridge();
      const companyId = state.activeCompanyId;
      const all = (state.assets || []).filter((a) => !companyId || a.companyId === companyId);
      const today = new Date().toISOString().slice(0, 10);
      const to = to_date || today;
      const from = from_date || `${new Date(to).getFullYear()}-01-01`;
      switch (report) {
        case 'snapshot':
          return registerSnapshot(all, to);
        case 'movement': {
          const ms = movementSchedule(all, from, to);
          return { period: { from, to }, movement: ms };
        }
        case 'depreciation_period':
          return {
            period: { from, to },
            rows: all
              .map((a) => ({
                id: a.id,
                code: a.code,
                name: a.name,
                category: a.category,
                period_depreciation: depreciationInPeriod(a, from, to),
                cumulative_to_end: accumulatedDepreciation(a, to),
                nbv_at_end: netBookValue(a, to),
              }))
              .filter((r) => r.period_depreciation > 0),
          };
        case 'disposals_period':
          return {
            period: { from, to },
            rows: all
              .filter(
                (a) =>
                  a.status === 'disposed' &&
                  a.disposalDate &&
                  a.disposalDate >= from &&
                  a.disposalDate <= to,
              )
              .map((a) => {
                const t = taxRecoupment(a);
                return {
                  id: a.id,
                  name: a.name,
                  disposal_date: a.disposalDate,
                  cost: Number(a.costExclVat) || 0,
                  nbv_at_disposal: netBookValue(a, a.disposalDate),
                  proceeds: Number(a.disposalProceeds) || 0,
                  ifrs_gain_loss: disposalGainLoss(a),
                  tax_recoupment: t.recoupment,
                  capital_gain: t.capitalGain,
                  scrapping_allowance: t.scrappingAllowance,
                };
              }),
          };
        case 'deferred_tax':
          return {
            asof: to,
            tax_rate: COMPANY_TAX_RATE,
            rows: all.map((a) => ({
              id: a.id,
              name: a.name,
              nbv: netBookValue(a, to),
              tax_base: taxBase(a, to),
              temporary_difference: temporaryDifference(a, to),
              deferred_tax: deferredTax(a, to),
            })),
          };
        case 'category_rollup': {
          const map = new Map();
          for (const a of all) {
            const k = a.category || 'Other';
            const acc = map.get(k) || { category: k, count: 0, cost: 0, nbv: 0, tax_base: 0 };
            acc.count += 1;
            acc.cost += Number(a.costExclVat) || 0;
            acc.nbv += netBookValue(a, to);
            acc.tax_base += taxBase(a, to);
            map.set(k, acc);
          }
          return { asof: to, rollup: Array.from(map.values()) };
        }
        default:
          return { error: `Unknown report: ${report}` };
      }
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
