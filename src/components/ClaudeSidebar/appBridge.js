// Bridges the AccountingDashboard component (in App_remote.jsx) and the
// Claude sidebar tool registry. The sidebar lives at the bottom of the App
// tree but the app's setters (setActiveTab, setShowInvoiceForm, ...) live
// inside AccountingDashboard. To keep the App diff minimal, the dashboard
// publishes its current state and setters here on every render via the
// <ClaudeAppBridge /> component, and tools read from the same registry.
//
// This is intentionally a tiny module-scoped object rather than React
// context. The tool-execute functions in toolRegistry.js are not React
// components and cannot read a context.

const bridge = {
  state: null,    // { activeTab, activeCompanyId, activeCompany, clients, customers, suppliers, invoices, bankStatements, vatTransactions, accounts, employees, payslips }
  actions: null,  // { setActiveTab, setActiveCompanyId, setShowInvoiceForm, setShowClientForm, setShowSupplierForm, setSelectedInvoice, saveInvoices, saveCustomers, saveClients, saveSuppliers }
};

export function setBridge(next) {
  bridge.state = next.state || null;
  bridge.actions = next.actions || null;
}

export function getBridge() {
  return bridge;
}

export function requireBridge() {
  if (!bridge.state || !bridge.actions) {
    throw new Error('Claude sidebar app bridge is not ready yet.');
  }
  return bridge;
}
