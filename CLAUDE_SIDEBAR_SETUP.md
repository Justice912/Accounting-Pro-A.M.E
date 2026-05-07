# Claude Assistant Sidebar — Setup Guide

This sidebar is the in-app AI assistant for Accounting Pro. It lets the user
chat with Claude and ask Claude to execute actions inside the running app
(navigate, open clients, summarise data, draft invoices).

The Anthropic API key is **never** in browser code. It lives in a Vercel
environment variable and is only read by the serverless route at
`api/claude.js`.

---

## 1. Get an Anthropic API key

1. Go to <https://console.anthropic.com/>.
2. Sign in (or create an account).
3. Open **Settings → API Keys** and click **Create Key**.
4. Copy the key (starts with `sk-ant-...`). You will not be able to see it
   again, so paste it somewhere safe right now.

---

## 2. Add the key to Vercel

1. Open your project in the Vercel dashboard.
2. Go to **Settings → Environment Variables**.
3. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** the key from step 1 (starts with `sk-ant-...`)
   - **Environments:** check **Production**, **Preview**, and **Development**.
4. Click **Save**.
5. Redeploy the project (Vercel → Deployments → ⋯ → **Redeploy**) so the new
   env var is picked up.

> Important: do **not** prefix this variable with `VITE_`. Anything starting
> with `VITE_` is bundled into the browser. The sidebar's proxy reads
> `process.env.ANTHROPIC_API_KEY` server-side only.

---

## 3. Test it locally

```bash
# 1. Install the Vercel CLI once.
npm i -g vercel

# 2. Link the project (first run only).
vercel link

# 3. Pull the env vars you just set in Vercel into a local .env file.
vercel env pull .env.development.local

# 4. Run the dev server. This serves both Vite and the /api/* routes.
vercel dev
```

Open <http://localhost:3000>, click the green **Claude** button at the
bottom-right, and try:

- *"Show me my client list"* → Claude calls `navigate_to` and switches to
  the Companies tab.
- *"Summarise this month's bank transactions"* → Claude calls
  `list_bank_transactions` and writes a summary.
- *"Create an invoice for [client name] for R5,000 web development"* →
  Claude calls `search_clients`, then `create_invoice`, and the new-invoice
  form opens pre-filled.

Sanity check the security: open DevTools → Network → click any `/api/claude`
request. The request body never contains your API key. The response is a
streaming `text/event-stream`. The bundled JS in `dist/` does not contain
the key either (Vite never sees it).

---

## 4. Adding a new tool later

Tools live in `src/components/ClaudeSidebar/toolRegistry.js`. To add one,
append an object to the `TOOLS` array:

```js
{
  name: 'my_new_tool',                       // snake_case, unique
  description: 'What this does, in one line.',
  input_schema: { type: 'object', properties: { ... }, required: [...] },
  execute: (input) => { /* return JSON for Claude */ },
}
```

That's it. The sidebar automatically passes the new tool to Claude on the
next request. If your tool needs to call into the app (set a tab, open a
form, read state), use `requireBridge()` from `appBridge.js` — it gives you
the same setters and state the dashboard exposes.

---

## 5. Tools shipped in this build

| Name | What it does |
| --- | --- |
| `get_current_context` | Returns the active tab, active company, record counts and current URL. Claude is told to call this first when the user says "this client" or "current view". |
| `navigate_to` | Switches the main app tab. Allowed pages: `dashboard`, `customers`, `suppliers`, `companies`, `accounts`, `banking`, `vatcapture`, `vatrecon`, `forecast`, `payroll`, `reports`, `audit`. |
| `search_clients` | Finds clients/companies by name or email. Returns up to 10 matches with id and name. |
| `open_client` | Sets the active company and opens the Companies tab. |
| `create_invoice` | Opens the new-invoice form pre-filled with the supplied line items. The user still has to confirm and save. The draft is stored at `window.__claudeInvoiceDraft`. |
| `open_invoice_form` | Opens an empty new-invoice form on the Customers tab. |
| `open_new_company_form` | Opens the new-company form on the Companies tab. |
| `open_new_supplier_form` | Opens the new-supplier form on the Suppliers tab. |
| `list_invoices` | Returns invoices for the active company, optionally filtered by status / date range. |
| `list_bank_transactions` | Returns bank transactions for the active company, optionally only unallocated or within a date range. |
| `get_dashboard_totals` | Returns income, expenses, profit, pending-invoice count and unallocated-transaction count for the active company. |
| `summarise_data` | Pulls a structured snapshot of `invoices`, `bank`, `vat`, `payroll`, or `clients` for Claude to summarise. |

---

## 6. Files added by this feature

```
api/claude.js                                   ← Server proxy (Edge runtime, streaming, rate-limited)
src/components/ClaudeSidebar/
  Sidebar.jsx                                   ← Main panel (open/close, chat state, persistence)
  MessageList.jsx                               ← Scrollable message list with empty-state hints
  MessageInput.jsx                              ← Auto-grow textarea + Send/Stop
  Message.jsx                                   ← One bubble (markdown for Claude)
  ToggleButton.jsx                              ← Floating bottom-right launch button
  ClaudeAppBridge.jsx                           ← Publishes app state/setters for tools to consume
  appBridge.js                                  ← Module-scoped registry the bridge writes to
  claudeClient.js                               ← /api/claude streaming + tool-use loop (max 5 iter)
  toolRegistry.js                               ← Tool definitions + execute() implementations
  systemPrompt.js                               ← System prompt for the assistant
  index.js                                      ← Re-exports
CLAUDE_SIDEBAR_SETUP.md                         ← This file
```

The only existing file modified is `src/App_remote.jsx`: one new `import`
near the top, and `<ClaudeAppBridge />` + `<ClaudeSidebar />` mounted at
the end of the dashboard's return.

---

## 7. Notes / limits

- Chat history is kept in `sessionStorage` under `claude-sidebar-history-v1`.
  It survives page reloads in the same tab, and is cleared by the **Clear
  chat** link in the header or by closing the tab.
- Tool-use loop is capped at 5 iterations per user message.
- Server-side rate limit: 30 requests per minute per IP (soft cap; Edge
  instances are short-lived).
- Model is fixed to `claude-sonnet-4-6` server-side. The client cannot
  override the model or supply its own API key.
