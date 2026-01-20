import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, FileText, Users, Building2, Landmark, BarChart3, Plus, Trash2, Upload, Download, Printer, Mail, Eye, ChevronDown, AlertCircle, Check, X, Search, Calendar, ArrowRight, Calculator, Edit2, Save, Wallet } from 'lucide-react';

// VAT Rate Options (South African VAT rates)
const VAT_RATES = [
  { value: 'No VAT', label: 'No VAT', rate: 0 },
  { value: 'Standard Rate (15.00%)', label: 'Standard Rate (15.00%)', rate: 0.15 },
  { value: 'Standard Rate (Capital Goods) (15.00%)', label: 'Standard Rate (Capital Goods) (15.00%)', rate: 0.15 },
  { value: 'Zero Rate (0.00%)', label: 'Zero Rate (0.00%)', rate: 0 },
  { value: 'Zero Rate Exports (0.00%)', label: 'Zero Rate Exports (0.00%)', rate: 0 },
  { value: 'Exempt and Non-Supplies (0.00%)', label: 'Exempt and Non-Supplies (0.00%)', rate: 0 },
  { value: 'Export of Second Hand Goods (15.00%)', label: 'Export of Second Hand Goods (15.00%)', rate: 0.15 },
  { value: 'Change in Use (15.00%)', label: 'Change in Use (15.00%)', rate: 0.15 },
  { value: 'Goods and Services Imported (100.00%)', label: 'Goods and Services Imported (100.00%)', rate: 1.0 },
  { value: 'Capital Goods Imported (100.00%)', label: 'Capital Goods Imported (100.00%)', rate: 1.0 },
  { value: 'VAT Adjustments (100.00%)', label: 'VAT Adjustments (100.00%)', rate: 1.0 },
  { value: 'Manual VAT (Capital Goods)', label: 'Manual VAT (Capital Goods)', rate: 0 },
  { value: 'Manual VAT', label: 'Manual VAT', rate: 0 }
];

// Helper function to get VAT rate percentage from value
const getVATRate = (vatValue) => {
  const found = VAT_RATES.find(v => v.value === vatValue);
  return found ? found.rate : 0;
};

// Default Chart of Accounts
const DEFAULT_ACCOUNTS = [
  // Sales
  { id: 1, name: 'Sales', category: 'Sales', active: true, description: 'System Account: Item Sales', openingBalance: 0 },
  { id: 2, name: 'Other Sales', category: 'Sales', active: true, description: '', openingBalance: 0 },
  { id: 3, name: 'Revenue', category: 'Sales', active: true, description: '', openingBalance: 0 },
  // Cost of Sales
  { id: 4, name: 'Item Adjustments', category: 'Cost of Sales', active: true, description: 'System Account: Item Adjustments', openingBalance: 0 },
  { id: 5, name: 'Purchases', category: 'Cost of Sales', active: true, description: 'System Account: Purchases', openingBalance: 0 },
  // Other Income
  { id: 6, name: 'Discount Received', category: 'Other Income', active: true, description: 'System Account: Discount Received', openingBalance: 0 },
  { id: 7, name: 'Bad Debts Recovered', category: 'Other Income', active: true, description: '', openingBalance: 0 },
  { id: 8, name: 'Interest Received', category: 'Other Income', active: true, description: '', openingBalance: 0 },
  { id: 9, name: 'Unallocated Income', category: 'Other Income', active: true, description: '', openingBalance: 0 },
  // Expenses
  { id: 10, name: 'Customer Document Rounding', category: 'Expenses', active: true, description: 'System Account: Customer Document Rounding', openingBalance: 0 },
  { id: 11, name: 'Bad Debts', category: 'Expenses', active: true, description: 'System Account: Customer Write-Offs', openingBalance: 0 },
  { id: 12, name: 'Discount Allowed', category: 'Expenses', active: true, description: 'System Account: Discount Allowed', openingBalance: 0 },
  { id: 13, name: 'Accounting Fees', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 14, name: 'Advertising', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 15, name: 'Bank Charges', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 16, name: 'Computer Expenses', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 17, name: 'Depreciation', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 18, name: 'Electricity & Water', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 19, name: 'Entertainment', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 20, name: 'General Expenses', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 21, name: 'Insurance', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 22, name: 'Interest Paid', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 23, name: 'Motor Vehicle Expenses', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 24, name: 'Printing & Stationery', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 25, name: 'Rent Paid', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 26, name: 'Repairs & Maintenance', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 27, name: 'Salaries & Wages', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 28, name: 'Security', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 29, name: 'Staff Welfare', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 30, name: 'Telephone & Internet', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 31, name: 'Travel & Accommodation', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  { id: 32, name: 'Unallocated Expense', category: 'Expenses', active: true, description: '', openingBalance: 0 },
  // Income Tax
  { id: 33, name: 'Income Tax', category: 'Income Tax', active: true, description: '', openingBalance: 0 },
  // Non-Current Assets
  { id: 34, name: 'Fixed Assets - Equipment', category: 'Non-Current Assets', active: true, description: '', openingBalance: 0 },
  { id: 35, name: 'Fixed Assets - Furniture & Fittings', category: 'Non-Current Assets', active: true, description: '', openingBalance: 0 },
  { id: 36, name: 'Fixed Assets - Motor Vehicles', category: 'Non-Current Assets', active: true, description: '', openingBalance: 0 },
  // Current Assets
  { id: 37, name: 'Trade Receivables', category: 'Current Assets', active: true, description: 'System Account: Outstanding Customers', openingBalance: 0 },
  { id: 38, name: 'Inventory', category: 'Current Assets', active: true, description: 'System Account: Value of Items on Hand', openingBalance: 0 },
  { id: 39, name: 'FNB Gold Account', category: 'Current Assets', active: true, description: '', openingBalance: 0 },
  { id: 40, name: 'FNB Personal', category: 'Current Assets', active: true, description: '', openingBalance: 0 },
  { id: 41, name: 'Members Loan', category: 'Current Assets', active: true, description: '', openingBalance: 0 },
  { id: 42, name: 'Staff Loans', category: 'Current Assets', active: true, description: '', openingBalance: 0 },
  // Non-Current Liabilities
  { id: 43, name: 'Bank Loans', category: 'Non-Current Liabilities', active: true, description: '', openingBalance: 0 },
  // Current Liabilities
  { id: 44, name: 'Domestic Reverse Charge VAT Payable', category: 'Current Liabilities', active: true, description: 'System Account: Domestic Reverse Charge VAT Payable', openingBalance: 0 },
  { id: 45, name: 'Trade Payables', category: 'Current Liabilities', active: true, description: 'System Account: Outstanding Suppliers', openingBalance: 0 },
  { id: 46, name: 'VAT Payable', category: 'Current Liabilities', active: true, description: 'System Account: VAT Payable', openingBalance: 0 },
  { id: 47, name: 'VAT Provision', category: 'Current Liabilities', active: true, description: 'System Account: VAT Provision', openingBalance: 0 },
  { id: 48, name: 'Income Tax Payable', category: 'Current Liabilities', active: true, description: '', openingBalance: 0 },
  // Owners Equity
  { id: 49, name: 'Retained Income', category: 'Equity', active: true, description: 'System Account: Retained Income', openingBalance: 0 },
  { id: 50, name: 'Owners Contribution', category: 'Equity', active: true, description: '', openingBalance: 0 },
];

// ==================== MAIN APP ====================
const AccountingDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bankStatements, setBankStatements] = useState([]);
  const [vatTransactions, setVatTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadAllData();
    // Failsafe timeout - if still loading after 3 seconds, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
      if (accounts.length === 0) {
        setAccounts(DEFAULT_ACCOUNTS);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const loadAllData = async () => {
    try {
      // Check if storage is available
      if (typeof localStorage === "undefined") {
        console.log('Storage not available, using defaults');
        setAccounts(DEFAULT_ACCOUNTS);
        setLoading(false);
        return;
      }

      const [invRes, clientRes, suppRes, bankRes, vatRes, accRes] = await Promise.all([
        Promise.resolve({ value: localStorage.getItem('accounting-invoices') }),
        Promise.resolve({ value: localStorage.getItem('accounting-clients') }),
        Promise.resolve({ value: localStorage.getItem('accounting-suppliers') }),
        Promise.resolve({ value: localStorage.getItem('accounting-bank-statements') }),
        Promise.resolve({ value: localStorage.getItem('accounting-vat-transactions') }),
        Promise.resolve({ value: localStorage.getItem('accounting-accounts') })
      ]);
      
      if (invRes?.value) setInvoices(JSON.parse(invRes.value));
      if (clientRes?.value) setClients(JSON.parse(clientRes.value));
      if (suppRes?.value) setSuppliers(JSON.parse(suppRes.value));
      if (bankRes?.value) setBankStatements(JSON.parse(bankRes.value));
      if (vatRes?.value) setVatTransactions(JSON.parse(vatRes.value));
      
      // Load accounts or use defaults - always ensure we have accounts
      let loadedAccounts = [];
      if (accRes?.value) {
        try {
          loadedAccounts = JSON.parse(accRes.value);
        } catch (e) {
          loadedAccounts = [];
        }
      }
      
      if (!loadedAccounts || loadedAccounts.length === 0) {
        setAccounts(DEFAULT_ACCOUNTS);
        // Save defaults to storage
        window.storage.set('accounting-accounts', JSON.stringify(DEFAULT_ACCOUNTS)).catch(() => {});
      } else {
        setAccounts(loadedAccounts);
      }
    } catch (error) {
      console.log('Loading fresh data:', error);
      setAccounts(DEFAULT_ACCOUNTS);
    } finally {
      setLoading(false);
    }
  };

  const saveInvoices = async (data) => {
    setInvoices(data);
    localStorage.setItem('accounting-invoices', JSON.stringify(data));
  };

  const saveClients = async (data) => {
    setClients(data);
    localStorage.setItem('accounting-clients', JSON.stringify(data));
  };

  const saveSuppliers = async (data) => {
    setSuppliers(data);
    localStorage.setItem('accounting-suppliers', JSON.stringify(data));
  };

  const saveBankStatements = async (data) => {
    setBankStatements(data);
    localStorage.setItem('accounting-bank-statements', JSON.stringify(data));
  };

  const saveVatTransactions = async (data) => {
    setVatTransactions(data);
    localStorage.setItem('accounting-vat-transactions', JSON.stringify(data));
  };

  const saveAccounts = async (data) => {
    setAccounts(data);
    localStorage.setItem('accounting-accounts', JSON.stringify(data));
  };

  // Calculate totals
  const totalIncome = bankStatements.reduce((sum, s) => sum + (s.received || 0), 0);
  const totalExpenses = bankStatements.reduce((sum, s) => sum + (s.spent || 0), 0);
  const totalProfit = totalIncome - totalExpenses;
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
  const unallocatedCount = bankStatements.filter(s => s.selection === 'Unallocated Expen').length;

  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'customers', label: 'Customers', icon: FileText },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'companies', label: 'Companies', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'banking', label: 'Banking', icon: Landmark },
    { id: 'vatrecon', label: 'VAT Recon', icon: Calculator },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Accounting Pro</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                    activeTab === tab.id 
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView 
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            totalProfit={totalProfit}
            pendingInvoices={pendingInvoices}
            unallocatedCount={unallocatedCount}
            bankStatements={bankStatements}
            invoices={invoices}
            clients={clients}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersView 
            invoices={invoices}
            saveInvoices={saveInvoices}
            clients={clients}
            showInvoiceForm={showInvoiceForm}
            setShowInvoiceForm={setShowInvoiceForm}
            showPrintPreview={showPrintPreview}
            setShowPrintPreview={setShowPrintPreview}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
          />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersView 
            suppliers={suppliers}
            saveSuppliers={saveSuppliers}
            invoices={invoices}
            saveInvoices={saveInvoices}
            clients={clients}
            showSupplierForm={showSupplierForm}
            setShowSupplierForm={setShowSupplierForm}
            showPrintPreview={showPrintPreview}
            setShowPrintPreview={setShowPrintPreview}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            accounts={accounts}
          />
        )}
        {activeTab === 'companies' && (
          <CompaniesView 
            clients={clients}
            saveClients={saveClients}
            showClientForm={showClientForm}
            setShowClientForm={setShowClientForm}
          />
        )}
        {activeTab === 'accounts' && (
          <AccountsView 
            accounts={accounts}
            saveAccounts={saveAccounts}
            showAccountForm={showAccountForm}
            setShowAccountForm={setShowAccountForm}
          />
        )}
        {activeTab === 'banking' && (
          <BankingView 
            bankStatements={bankStatements}
            saveBankStatements={saveBankStatements}
            invoices={invoices}
            saveInvoices={saveInvoices}
            clients={clients}
            suppliers={suppliers}
            accounts={accounts}
          />
        )}
        {activeTab === 'vatrecon' && (
          <VATReconView 
            vatTransactions={vatTransactions}
            saveVatTransactions={saveVatTransactions}
            company={clients[0]}
            accounts={accounts}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsView 
            bankStatements={bankStatements}
            invoices={invoices}
            company={clients[0]}
          />
        )}
      </main>
    </div>
  );
};

// ==================== DASHBOARD VIEW ====================
const DashboardView = ({ totalIncome, totalExpenses, totalProfit, pendingInvoices, unallocatedCount, bankStatements, invoices, clients, setActiveTab }) => {
  const formatCurrency = (amount) => `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  
  // Sales data for chart
  const monthlyData = [
    { month: 'Jul', thisYear: 45000, lastYear: 38000 },
    { month: 'Aug', thisYear: 52000, lastYear: 42000 },
    { month: 'Sep', thisYear: 48000, lastYear: 45000 },
    { month: 'Oct', thisYear: 61000, lastYear: 52000 },
    { month: 'Nov', thisYear: 55000, lastYear: 48000 },
    { month: 'Dec', thisYear: 67000, lastYear: 58000 }
  ];

  // Top customers
  const topCustomers = clients.slice(0, 5).map((c, i) => ({
    name: c.name,
    sales: Math.floor(Math.random() * 50000) + 10000
  }));

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Income" value={formatCurrency(totalIncome)} color="emerald" icon="↑" />
        <MetricCard title="Total Expenses" value={formatCurrency(totalExpenses)} color="red" icon="↓" />
        <MetricCard title="Net Profit" value={formatCurrency(totalProfit)} color={totalProfit >= 0 ? 'blue' : 'red'} icon="=" />
        <MetricCard title="Pending Invoices" value={pendingInvoices.toString()} color="amber" icon="⏳" />
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do List */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            To Do List
          </h3>
          <div className="space-y-3">
            {unallocatedCount > 0 && (
              <button 
                onClick={() => setActiveTab('banking')}
                className="w-full text-left p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-800">
                    {unallocatedCount} unallocated transaction{unallocatedCount > 1 ? 's' : ''}
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </div>
              </button>
            )}
            {pendingInvoices > 0 && (
              <button 
                onClick={() => setActiveTab('invoices')}
                className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    {pendingInvoices} pending invoice{pendingInvoices > 1 ? 's' : ''}
                  </span>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
              </button>
            )}
            {unallocatedCount === 0 && pendingInvoices === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">All caught up! ✓</p>
            )}
          </div>
        </div>

        {/* Banking Widget */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-600" />
            Banking Overview
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bankStatements.slice(-10)}>
                <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <button 
            onClick={() => setActiveTab('banking')}
            className="mt-3 w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Review Transactions →
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Clients</span>
              <span className="font-semibold text-slate-800">{clients.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Invoices</span>
              <span className="font-semibold text-slate-800">{invoices.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Bank Transactions</span>
              <span className="font-semibold text-slate-800">{bankStatements.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Comparison */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Sales Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="thisYear" name="This Year" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lastYear" name="Last Year" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Top Customers</h3>
          {topCustomers.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-slate-700">{customer.name}</span>
                  <span className="text-sm font-medium text-emerald-600">
                    R {customer.sales.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No customers yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, color, icon }) => {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700'
  };
  
  return (
    <div className={`rounded-lg border p-5 ${colors[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-2xl opacity-50">{icon}</span>
      </div>
    </div>
  );
};

// ==================== CUSTOMERS VIEW (Client Invoices) ====================
const CustomersView = ({ invoices, saveInvoices, clients, showInvoiceForm, setShowInvoiceForm, showPrintPreview, setShowPrintPreview, selectedInvoice, setSelectedInvoice }) => {
  // Filter to only show client invoices (not supplier)
  const clientInvoices = invoices.filter(inv => inv.invoiceType !== 'supplier');
  
  const [newInvoice, setNewInvoice] = useState({
    customer: '',
    documentNo: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerRef: '',
    deliveryAddress: ['', '', '', '', ''],
    postalAddress: ['', '', '', '', '', ''],
    discount: 0,
    invoiceType: 'client',
    items: [{ id: 1, type: 'Item', description: '', unit: '', qty: 1, price: 0, vatType: 'Standard Rate (15.00%)', discPercent: 0 }],
    status: 'Pending'
  });

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), type: 'Item', description: '', unit: '', qty: 1, price: 0, vatType: 'Standard Rate (15.00%)', discPercent: 0 }]
    }));
  };

  const updateInvoiceItem = (id, field, value) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeInvoiceItem = (id) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const calculateItemTotals = (item) => {
    const exclusive = item.qty * item.price;
    const discount = exclusive * (item.discPercent / 100);
    const afterDiscount = exclusive - discount;
    const vatRate = getVATRate(item.vatType);
    const vat = afterDiscount * vatRate;
    const total = afterDiscount + vat;
    return { exclusive, discount, afterDiscount, vat, total };
  };

  const invoiceTotals = () => {
    let subtotal = 0, totalVat = 0, totalDiscount = 0;
    newInvoice.items.forEach(item => {
      const calc = calculateItemTotals(item);
      subtotal += calc.afterDiscount;
      totalVat += calc.vat;
      totalDiscount += calc.discount;
    });
    return { subtotal, totalVat, totalDiscount, grandTotal: subtotal + totalVat };
  };

  const handleSaveInvoice = () => {
    const totals = invoiceTotals();
    const invoice = {
      id: Date.now(),
      ...newInvoice,
      amount: totals.grandTotal,
      subtotal: totals.subtotal,
      vat: totals.totalVat
    };
    saveInvoices([...invoices, invoice]);
    setShowInvoiceForm(false);
    setNewInvoice({
      customer: '',
      documentNo: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerRef: '',
      deliveryAddress: ['', '', '', '', ''],
      postalAddress: ['', '', '', '', '', ''],
      discount: 0,
      items: [{ id: 1, type: 'Item', description: '', unit: '', qty: 1, price: 0, vatType: 'Standard Rate (15.00%)', discPercent: 0 }],
      status: 'Pending'
    });
  };

  const markAsPaid = (id) => {
    saveInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv));
  };

  const deleteInvoice = (id) => {
    saveInvoices(invoices.filter(inv => inv.id !== id));
  };

  const totals = invoiceTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Customer Invoices</h2>
          <p className="text-sm text-slate-500">Invoices for payments received from customers</p>
        </div>
        <button
          onClick={() => setShowInvoiceForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Customer Invoice
        </button>
      </div>

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Process Customer Invoice</h3>
              <div className="flex gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700">
                    Send <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow-lg hidden group-hover:block">
                    <button 
                      onClick={() => { setSelectedInvoice({...newInvoice, ...invoiceTotals()}); setShowPrintPreview(true); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Print Preview
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer & Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Customer</label>
                  <select 
                    value={newInvoice.customer}
                    onChange={(e) => setNewInvoice({...newInvoice, customer: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Customer</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Document No.</label>
                    <input type="text" value={newInvoice.documentNo} readOnly className="w-full border rounded px-3 py-2 text-sm bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={newInvoice.date}
                      onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Customer Reference</label>
                  <input 
                    type="text" 
                    value={newInvoice.customerRef}
                    onChange={(e) => setNewInvoice({...newInvoice, customerRef: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Discount %</label>
                  <input 
                    type="number" 
                    value={newInvoice.discount}
                    onChange={(e) => setNewInvoice({...newInvoice, discount: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-24">Type</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Description</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-20">Unit</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 w-16">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 w-24">Price</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-28">VAT Type</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 w-16">Disc %</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 w-24">VAT</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 w-24">Total</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newInvoice.items.map((item) => {
                      const calc = calculateItemTotals(item);
                      return (
                        <tr key={item.id} className="border-t">
                          <td className="px-2 py-2">
                            <select 
                              value={item.type}
                              onChange={(e) => updateInvoiceItem(item.id, 'type', e.target.value)}
                              className="w-full border rounded px-2 py-1 text-sm"
                            >
                              <option>Item</option>
                              <option>Service</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                              className="w-full border rounded px-2 py-1 text-sm"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateInvoiceItem(item.id, 'unit', e.target.value)}
                              className="w-full border rounded px-2 py-1 text-sm"
                              placeholder="Unit"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateInvoiceItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1 text-sm text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="number"
                              value={item.price}
                              onChange={(e) => updateInvoiceItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1 text-sm text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select 
                              value={item.vatType}
                              onChange={(e) => updateInvoiceItem(item.id, 'vatType', e.target.value)}
                              className="w-full border rounded px-2 py-1 text-sm"
                            >
                              {VAT_RATES.map(vat => <option key={vat.value} value={vat.value}>{vat.label}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input 
                              type="number"
                              value={item.discPercent}
                              onChange={(e) => updateInvoiceItem(item.id, 'discPercent', parseFloat(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1 text-sm text-right"
                            />
                          </td>
                          <td className="px-2 py-2 text-right text-slate-600">
                            R {calc.vat.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-right font-medium">
                            R {calc.total.toFixed(2)}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button onClick={addInvoiceItem} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeInvoiceItem(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span>R {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">VAT (15%):</span>
                    <span>R {totals.totalVat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-emerald-600">R {totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-100">
              {/* Status */}
              <div className="text-center mb-4">
                <span className="text-blue-600 text-sm">Status: </span>
                <span className="text-blue-600 text-sm font-medium">New Tax Invoice.</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <button 
                  onClick={handleSaveInvoice} 
                  className="px-6 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    handleSaveInvoice();
                    setNewInvoice({
                      customer: '',
                      documentNo: `INV-${Date.now()}`,
                      date: new Date().toISOString().split('T')[0],
                      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      customerRef: '',
                      deliveryAddress: ['', '', '', '', ''],
                      postalAddress: ['', '', '', '', '', ''],
                      discount: 0,
                      items: [{ id: 1, type: 'Item', description: '', unit: '', qty: 1, price: 0, vatType: 'Standard 15%', discPercent: 0 }],
                      status: 'Pending'
                    });
                  }}
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
                >
                  Save and New
                </button>
                <button 
                  onClick={() => { setSelectedInvoice({...newInvoice, ...invoiceTotals()}); setShowPrintPreview(true); }}
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
                >
                  Print Preview
                </button>
                <button 
                  onClick={() => {
                    const email = clients.find(c => c.name === newInvoice.customer)?.email || '';
                    const subject = `Invoice ${newInvoice.documentNo}`;
                    const body = `Dear ${newInvoice.customer || 'Customer'},\n\nPlease find attached invoice ${newInvoice.documentNo}.\n\nTotal Amount: R ${totals.grandTotal.toFixed(2)}\nDue Date: ${newInvoice.dueDate}\n\nThank you for your business.`;
                    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                  }}
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
                >
                  Email
                </button>
                <div className="relative group">
                  <button className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50 flex items-center gap-2">
                    Print Delivery Note
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow-lg hidden group-hover:block z-10">
                    <button 
                      onClick={() => {
                        const printContent = `
                          <html>
                          <head><title>Delivery Note</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 40px; }
                            h1 { color: #1e40af; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background: #f1f5f9; }
                          </style>
                          </head>
                          <body>
                            <h1>DELIVERY NOTE</h1>
                            <p><strong>Document No:</strong> ${newInvoice.documentNo}</p>
                            <p><strong>Date:</strong> ${newInvoice.date}</p>
                            <p><strong>Customer:</strong> ${newInvoice.customer || 'N/A'}</p>
                            <table>
                              <tr><th>Description</th><th>Qty</th><th>Unit</th></tr>
                              ${newInvoice.items.map(item => `<tr><td>${item.description || ''}</td><td>${item.qty}</td><td>${item.unit || ''}</td></tr>`).join('')}
                            </table>
                            <p style="margin-top: 40px;"><strong>Received By:</strong> _______________________</p>
                            <p><strong>Date:</strong> _______________________</p>
                            <p><strong>Signature:</strong> _______________________</p>
                          </body>
                          </html>
                        `;
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(printContent);
                        printWindow.document.close();
                        printWindow.print();
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      Print Delivery Note
                    </button>
                    <button 
                      onClick={() => {
                        const printContent = `
                          <html>
                          <head><title>Delivery Note (No Prices)</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 40px; }
                            h1 { color: #1e40af; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background: #f1f5f9; }
                          </style>
                          </head>
                          <body>
                            <h1>DELIVERY NOTE</h1>
                            <p><strong>Document No:</strong> ${newInvoice.documentNo}</p>
                            <p><strong>Date:</strong> ${newInvoice.date}</p>
                            <p><strong>Customer:</strong> ${newInvoice.customer || 'N/A'}</p>
                            <table>
                              <tr><th>Description</th><th>Qty</th></tr>
                              ${newInvoice.items.map(item => `<tr><td>${item.description || ''}</td><td>${item.qty}</td></tr>`).join('')}
                            </table>
                            <p style="margin-top: 40px;"><strong>Received By:</strong> _______________________</p>
                            <p><strong>Date:</strong> _______________________</p>
                            <p><strong>Signature:</strong> _______________________</p>
                          </body>
                          </html>
                        `;
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(printContent);
                        printWindow.document.close();
                        printWindow.print();
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      Without Prices
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setShowInvoiceForm(false)} className="px-4 py-2 border rounded text-sm hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && selectedInvoice && (
        <PrintPreview invoice={selectedInvoice} onClose={() => setShowPrintPreview(false)} company={clients[0]} />
      )}

      {/* Client Invoices List */}
      {clientInvoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientInvoices.map(invoice => (
            <div key={invoice.id} className="bg-white rounded-lg border shadow-sm p-5 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-slate-800">{invoice.documentNo}</h4>
                  <p className="text-sm text-slate-600">{invoice.customer || 'No customer'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                    invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {invoice.status}
                  </span>
                  {invoice.createdFromBank && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">From Bank</span>
                  )}
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 mb-3">
                R {(invoice.amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Date: {invoice.date} • Due: {invoice.dueDate}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedInvoice(invoice); setShowPrintPreview(true); }}
                  className="flex-1 text-sm py-2 border rounded hover:bg-slate-50"
                >
                  <Eye className="w-4 h-4 inline mr-1" /> View
                </button>
                {invoice.status !== 'Paid' && (
                  <button 
                    onClick={() => markAsPaid(invoice.id)}
                    className="flex-1 text-sm py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4 inline mr-1" /> Paid
                  </button>
                )}
                <button 
                  onClick={() => deleteInvoice(invoice.id)}
                  className="px-3 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <p className="text-slate-500">No customer invoices yet.</p>
          <p className="text-sm text-slate-400 mt-1">Create a new invoice or convert a bank receipt.</p>
        </div>
      )}
    </div>
  );
};

// Print Preview Component
const PrintPreview = ({ invoice, onClose, company }) => {
  const handlePrint = () => window.print();
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 sticky top-0">
          <h3 className="font-semibold">Print Preview</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-8" id="invoice-print">
          <div className="flex justify-between mb-8">
            <div className="flex items-start gap-4">
              {company?.logo && (
                <img src={company.logo} alt="Company Logo" className="w-20 h-20 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-emerald-700">
                  {invoice.invoiceType === 'supplier' ? 'SUPPLIER INVOICE' : 'INVOICE'}
                </h1>
                <p className="text-slate-600 mt-1">{invoice.documentNo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{company?.name || 'Your Company Name'}</p>
              {company?.tradingName && <p className="text-sm text-slate-600">Trading as: {company.tradingName}</p>}
              {company?.address && <p className="text-sm text-slate-600">{company.address}</p>}
              {company?.city && <p className="text-sm text-slate-600">{company.city}, {company.postalCode}</p>}
              {company?.phone && <p className="text-sm text-slate-600">Tel: {company.phone}</p>}
              {company?.email && <p className="text-sm text-slate-600">{company.email}</p>}
              {company?.vatNo && <p className="text-sm text-slate-600 mt-1">VAT No: {company.vatNo}</p>}
              {company?.registrationNo && <p className="text-sm text-slate-600">Reg No: {company.registrationNo}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-slate-600 text-sm mb-2">
                {invoice.invoiceType === 'supplier' ? 'SUPPLIER:' : 'BILL TO:'}
              </h4>
              <p className="font-medium">{invoice.supplier || invoice.customer || 'Customer'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm"><span className="text-slate-600">Date:</span> {invoice.date}</p>
              <p className="text-sm"><span className="text-slate-600">Due:</span> {invoice.dueDate}</p>
              {invoice.customerRef && <p className="text-sm"><span className="text-slate-600">Ref:</span> {invoice.customerRef}</p>}
            </div>
          </div>
          
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-emerald-600">
                <th className="text-left py-2 text-sm">Description</th>
                <th className="text-right py-2 text-sm">Qty</th>
                <th className="text-right py-2 text-sm">Price</th>
                <th className="text-right py-2 text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 text-sm">{item.description || 'Item'}</td>
                  <td className="py-2 text-sm text-right">{item.qty}</td>
                  <td className="py-2 text-sm text-right">R {(item.price || 0).toFixed(2)}</td>
                  <td className="py-2 text-sm text-right">R {((item.qty || 0) * (item.price || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-1 text-sm">
                <span>Subtotal:</span>
                <span>R {(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>VAT (15%):</span>
                <span>R {(invoice.vat || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-emerald-600 mt-2">
                <span>Total:</span>
                <span className="text-emerald-700">R {(invoice.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Banking Details */}
          {company?.bankName && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-semibold text-sm text-slate-600 mb-2">BANKING DETAILS</h4>
              <div className="text-sm text-slate-600">
                <p>Bank: {company.bankName}</p>
                <p>Account: {company.bankAccountNo}</p>
                {company.bankBranchCode && <p>Branch Code: {company.bankBranchCode}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SUPPLIERS VIEW (with Supplier Invoices) ====================
const SuppliersView = ({ suppliers, saveSuppliers, invoices, saveInvoices, clients, showSupplierForm, setShowSupplierForm, showPrintPreview, setShowPrintPreview, selectedInvoice, setSelectedInvoice, accounts = [] }) => {
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '' });
  const [activeTab, setActiveTab] = useState('invoices');
  const pdfInvoiceInputRef = React.useRef(null);
  const [showPdfInvoiceExtractor, setShowPdfInvoiceExtractor] = useState(false);
  const [extractedInvoices, setExtractedInvoices] = useState([]);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Use accounts prop or default accounts
  const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  
  // Filter supplier invoices
  const supplierInvoices = invoices.filter(inv => inv.invoiceType === 'supplier');

  // Purchase orders for linking (mock data - you can expand this)
  const purchaseOrders = [
    { id: 'PO-001', name: 'PO-001 - Office Supplies' },
    { id: 'PO-002', name: 'PO-002 - Equipment' },
    { id: 'PO-003', name: 'PO-003 - Services' },
  ];

  // AI-powered extraction using Claude API (works in Claude.ai artifacts)
  const extractInvoiceWithAI = async (imageData, fileName) => {
    try {
      // Determine media type
      let mediaType = "image/jpeg";
      if (imageData.includes("data:image/png")) mediaType = "image/png";
      else if (imageData.includes("data:image/gif")) mediaType = "image/gif";
      else if (imageData.includes("data:image/webp")) mediaType = "image/webp";
      
      // Get base64 data without the prefix
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data
                  }
                },
                {
                  type: "text",
                  text: `You are an invoice data extraction assistant. Carefully analyze this invoice image and extract the data.

Return ONLY a JSON object in this exact format (no markdown, no code blocks, just the JSON):
{"date":"YYYY-MM-DD","supplierName":"company name","invoiceNumber":"inv number","supplierVatNo":"vat number","description":"items description","amountExVat":"0.00","vatAmount":"0.00","amountIncVat":"0.00"}

Rules:
- For date: Convert to YYYY-MM-DD format
- For amounts: Numbers only, no currency symbols, use decimal point
- If a field is not found, use empty string "" for text or "0" for amounts
- Look for: Invoice No, Tax Invoice, VAT No, Subtotal, VAT, Total, Grand Total
- The supplier is usually at the top of the invoice`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('API response not ok:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      const text = data.content?.[0]?.text || '';
      console.log('Extracted text:', text);
      
      // Try to parse JSON from response - handle various formats
      let jsonStr = text.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
      
      // Find JSON object
      const jsonMatch = jsonStr.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed data:', parsed);
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('AI extraction error:', error);
      return null;
    }
  };

  // Handle PDF invoice upload with AI extraction
  const handlePdfInvoiceUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setPdfProcessing(true);
    setShowPdfInvoiceExtractor(true);
    
    try {
      const newExtractedInvoices = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.includes('pdf')) continue;
        
        // Read file as base64
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        
        // Try AI extraction
        const extracted = await extractInvoiceWithAI(base64Data, file.name);
        
        newExtractedInvoices.push({
          id: Date.now() + i,
          fileName: file.name,
          fileType: 'pdf',
          imagePreview: null,
          date: extracted?.date || new Date().toISOString().split('T')[0],
          supplierName: extracted?.supplierName || '',
          invoiceNumber: extracted?.invoiceNumber || '',
          supplierVatNo: extracted?.supplierVatNo || '',
          description: extracted?.description || '',
          amountExVat: extracted?.amountExVat || '',
          vatAmount: extracted?.vatAmount || '',
          amountIncVat: extracted?.amountIncVat || '',
          account: '',
          supplier: '',
          purchaseOrder: '',
          vatRate: 'Standard Rate (15.00%)',
          selected: true,
          aiExtracted: !!extracted
        });
      }
      
      setExtractedInvoices(newExtractedInvoices);
      setPdfProcessing(false);
      
      const extractedCount = newExtractedInvoices.filter(i => i.aiExtracted).length;
      setSaveMessage(`${files.length} PDF(s) processed. ${extractedCount} automatically extracted with AI.`);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      console.error('PDF processing error:', error);
      setPdfProcessing(false);
      alert('Error processing PDF files.');
    }
    
    event.target.value = '';
  };

  // Update extracted invoice row
  const updateExtractedInvoice = (id, field, value) => {
    setExtractedInvoices(extractedInvoices.map(inv => 
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  // Auto-calculate VAT
  const calculateVat = (id, fromField) => {
    setExtractedInvoices(extractedInvoices.map(inv => {
      if (inv.id !== id) return inv;
      
      const rate = getVATRate(inv.vatRate);
      
      if (fromField === 'amountExVat') {
        const exVat = parseFloat(inv.amountExVat) || 0;
        const vat = exVat * rate;
        return { ...inv, vatAmount: vat.toFixed(2), amountIncVat: (exVat + vat).toFixed(2) };
      } else if (fromField === 'amountIncVat') {
        const incVat = parseFloat(inv.amountIncVat) || 0;
        const exVat = rate > 0 ? incVat / (1 + rate) : incVat;
        const vat = incVat - exVat;
        return { ...inv, amountExVat: exVat.toFixed(2), vatAmount: vat.toFixed(2) };
      }
      return inv;
    }));
  };

  // Add new extracted invoice row
  const addExtractedInvoice = () => {
    setExtractedInvoices([...extractedInvoices, {
      id: Date.now(),
      fileName: 'Manual Entry',
      date: new Date().toISOString().split('T')[0],
      supplierName: '',
      invoiceNumber: '',
      supplierVatNo: '',
      description: '',
      amountExVat: '',
      vatAmount: '',
      amountIncVat: '',
      account: '',
      supplier: '',
      purchaseOrder: '',
      vatRate: 'Standard Rate (15.00%)',
      selected: true
    }]);
  };

  // Delete extracted invoice row
  const deleteExtractedInvoice = (id) => {
    setExtractedInvoices(extractedInvoices.filter(inv => inv.id !== id));
  };

  // Load extracted invoices to system
  const loadExtractedInvoicesToSystem = () => {
    const selected = extractedInvoices.filter(inv => inv.selected);
    if (selected.length === 0) {
      alert('No invoices selected to load');
      return;
    }
    
    const newInvoices = selected.map((inv, idx) => ({
      id: Date.now() + idx,
      invoiceType: 'supplier',
      documentNo: inv.invoiceNumber || `SINV-${Date.now() + idx}`,
      supplier: inv.supplierName || inv.supplier,
      supplierVatNo: inv.supplierVatNo,
      date: inv.date,
      dueDate: inv.date,
      customerRef: inv.purchaseOrder,
      items: [{
        id: 1,
        type: 'Item',
        description: inv.description || 'Invoice items',
        unit: '',
        qty: 1,
        price: parseFloat(inv.amountExVat) || 0,
        vatType: inv.vatRate,
        discPercent: 0
      }],
      subtotal: parseFloat(inv.amountExVat) || 0,
      vat: parseFloat(inv.vatAmount) || 0,
      amount: parseFloat(inv.amountIncVat) || 0,
      status: 'Pending',
      account: inv.account,
      linkedPO: inv.purchaseOrder
    }));
    
    saveInvoices([...invoices, ...newInvoices]);
    setShowPdfInvoiceExtractor(false);
    setExtractedInvoices([]);
    setSaveMessage(`${selected.length} supplier invoice(s) loaded successfully!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSave = () => {
    if (formData.name) {
      saveSuppliers([...suppliers, { id: Date.now(), ...formData }]);
      setFormData({ name: '', company: '', email: '', phone: '' });
      setShowSupplierForm(false);
    }
  };

  const deleteSupplier = (id) => {
    saveSuppliers(suppliers.filter(s => s.id !== id));
  };
  
  const markAsPaid = (id) => {
    saveInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv));
  };

  const deleteInvoice = (id) => {
    saveInvoices(invoices.filter(inv => inv.id !== id));
  };

  // Handle image upload for invoices with AI extraction
  const imageInvoiceInputRef = React.useRef(null);
  
  const handleImageInvoiceUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setPdfProcessing(true);
    setShowPdfInvoiceExtractor(true);
    
    try {
      const newExtractedInvoices = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        // Read image as base64 for preview
        const imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        
        // Use AI to extract invoice data
        let extracted = null;
        try {
          extracted = await extractInvoiceWithAI(imageData, file.name);
          console.log('Extraction result for', file.name, ':', extracted);
        } catch (e) {
          console.error('Extraction failed for', file.name, e);
        }
        
        // Check if we got meaningful data
        const hasExtractedData = extracted && (
          extracted.supplierName || 
          extracted.invoiceNumber || 
          extracted.amountIncVat || 
          extracted.amountExVat
        );
        
        newExtractedInvoices.push({
          id: Date.now() + i,
          fileName: file.name,
          fileType: 'image',
          imagePreview: imageData,
          date: extracted?.date || new Date().toISOString().split('T')[0],
          supplierName: extracted?.supplierName || '',
          invoiceNumber: extracted?.invoiceNumber || '',
          supplierVatNo: extracted?.supplierVatNo || '',
          description: extracted?.description || '',
          amountExVat: extracted?.amountExVat || '',
          vatAmount: extracted?.vatAmount || '',
          amountIncVat: extracted?.amountIncVat || '',
          account: '',
          supplier: '',
          purchaseOrder: '',
          vatRate: 'Standard Rate (15.00%)',
          selected: true,
          aiExtracted: hasExtractedData
        });
      }
      
      setExtractedInvoices(prev => [...prev, ...newExtractedInvoices]);
      setPdfProcessing(false);
      
      const extractedCount = newExtractedInvoices.filter(i => i.aiExtracted).length;
      if (extractedCount > 0) {
        setSaveMessage(`✓ AI extracted data from ${extractedCount} of ${files.length} invoice(s). Please verify the details.`);
      } else {
        setSaveMessage(`Processed ${files.length} image(s). AI could not extract data - please enter details manually.`);
      }
      setTimeout(() => setSaveMessage(''), 7000);
    } catch (error) {
      console.error('Image processing error:', error);
      setPdfProcessing(false);
      alert('Error processing images: ' + error.message);
    }
    
    event.target.value = '';
  };

  // State for image preview modal
  const [previewImage, setPreviewImage] = useState(null);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveMessage && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center text-sm font-medium">
          {saveMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Suppliers</h2>
          <p className="text-sm text-slate-500">Manage suppliers and supplier invoices</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={pdfInvoiceInputRef} onChange={handlePdfInvoiceUpload} accept=".pdf" multiple className="hidden" />
          <input type="file" ref={imageInvoiceInputRef} onChange={handleImageInvoiceUpload} accept="image/*" multiple className="hidden" />
          <button
            onClick={() => imageInvoiceInputRef.current?.click()}
            className="flex items-center gap-2 border border-blue-300 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Upload className="w-4 h-4" /> Upload Images
          </button>
          <button
            onClick={() => pdfInvoiceInputRef.current?.click()}
            className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
          >
            <Upload className="w-4 h-4" /> Upload PDFs
          </button>
          <button
            onClick={() => setShowSupplierForm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Invoice Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* PDF/Image Invoice Extractor Modal */}
      {showPdfInvoiceExtractor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="p-4 bg-orange-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-orange-800">Supplier Invoice Extractor (AI-Powered)</h3>
              <button onClick={() => { setShowPdfInvoiceExtractor(false); setExtractedInvoices([]); }} className="p-2 hover:bg-orange-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {pdfProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">AI is extracting invoice data...</p>
                  <p className="text-xs text-slate-400 mt-2">Analyzing document for supplier name, amounts, VAT, and more</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">
                      {extractedInvoices.some(r => r.aiExtracted) ? (
                        <span className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 font-medium">AI extracted {extractedInvoices.filter(i => i.aiExtracted).length} invoice(s).</span>
                          <span className="text-slate-500">Please verify and allocate before importing.</span>
                        </span>
                      ) : (
                        'Enter or verify the invoice details. Click on image thumbnails to preview.'
                      )}
                    </p>
                  </div>
                  
                  <div className="overflow-auto max-h-[60vh] border rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left w-8">
                            <input 
                              type="checkbox" 
                              checked={extractedInvoices.length > 0 && extractedInvoices.every(r => r.selected)}
                              onChange={(e) => setExtractedInvoices(extractedInvoices.map(r => ({ ...r, selected: e.target.checked })))}
                              className="w-4 h-4"
                            />
                          </th>
                          <th className="px-2 py-2 text-left font-bold w-16">Preview</th>
                          <th className="px-2 py-2 text-left font-bold">Date</th>
                          <th className="px-2 py-2 text-left font-bold">Supplier Name</th>
                          <th className="px-2 py-2 text-left font-bold">Invoice #</th>
                          <th className="px-2 py-2 text-left font-bold">Supplier VAT</th>
                          <th className="px-2 py-2 text-left font-bold">Description</th>
                          <th className="px-2 py-2 text-left font-bold">Ex VAT</th>
                          <th className="px-2 py-2 text-left font-bold">VAT</th>
                          <th className="px-2 py-2 text-left font-bold">Inc VAT</th>
                          <th className="px-2 py-2 text-left font-bold bg-blue-50">Account</th>
                          <th className="px-2 py-2 text-left font-bold bg-blue-50">Supplier</th>
                          <th className="px-2 py-2 text-left font-bold bg-blue-50">Link PO</th>
                          <th className="px-2 py-2 text-left font-bold bg-blue-50">VAT Rate</th>
                          <th className="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedInvoices.map(inv => (
                          <tr key={inv.id} className={`border-t hover:bg-slate-50 ${inv.aiExtracted ? 'bg-green-50/50' : ''}`}>
                            <td className="px-2 py-1">
                              <input 
                                type="checkbox" 
                                checked={inv.selected} 
                                onChange={(e) => updateExtractedInvoice(inv.id, 'selected', e.target.checked)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="px-2 py-1">
                              {inv.imagePreview ? (
                                <img 
                                  src={inv.imagePreview} 
                                  alt="Invoice" 
                                  className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-75"
                                  onClick={() => setPreviewImage(inv.imagePreview)}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center text-slate-400">
                                  <FileText className="w-6 h-6" />
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-1">
                              <input type="date" value={inv.date} onChange={(e) => updateExtractedInvoice(inv.id, 'date', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.supplierName} onChange={(e) => updateExtractedInvoice(inv.id, 'supplierName', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs" placeholder="Supplier" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.invoiceNumber} onChange={(e) => updateExtractedInvoice(inv.id, 'invoiceNumber', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs" placeholder="INV-001" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.supplierVatNo} onChange={(e) => updateExtractedInvoice(inv.id, 'supplierVatNo', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs" placeholder="VAT No" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.description} onChange={(e) => updateExtractedInvoice(inv.id, 'description', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs" placeholder="Description" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.amountExVat} 
                                onChange={(e) => updateExtractedInvoice(inv.id, 'amountExVat', e.target.value)}
                                onBlur={() => calculateVat(inv.id, 'amountExVat')}
                                className="border rounded px-1 py-1 w-full text-xs text-right" placeholder="0.00" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.vatAmount} 
                                onChange={(e) => updateExtractedInvoice(inv.id, 'vatAmount', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs text-right" placeholder="0.00" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={inv.amountIncVat} 
                                onChange={(e) => updateExtractedInvoice(inv.id, 'amountIncVat', e.target.value)}
                                onBlur={() => calculateVat(inv.id, 'amountIncVat')}
                                className="border rounded px-1 py-1 w-full text-xs text-right" placeholder="0.00" />
                            </td>
                            <td className="px-2 py-1 bg-blue-50">
                              <select value={inv.account} onChange={(e) => updateExtractedInvoice(inv.id, 'account', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs">
                                <option value="">Select Account</option>
                                {accountsList.filter(a => a.active !== false).map(acc => (
                                  <option key={acc.id} value={acc.name}>{acc.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1 bg-blue-50">
                              <select value={inv.supplier} onChange={(e) => updateExtractedInvoice(inv.id, 'supplier', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs">
                                <option value="">Select Supplier</option>
                                {suppliers.map(sup => (
                                  <option key={sup.id} value={sup.name}>{sup.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1 bg-blue-50">
                              <select value={inv.purchaseOrder} onChange={(e) => updateExtractedInvoice(inv.id, 'purchaseOrder', e.target.value)}
                                className="border rounded px-1 py-1 w-full text-xs">
                                <option value="">No PO</option>
                                {purchaseOrders.map(po => (
                                  <option key={po.id} value={po.id}>{po.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1 bg-blue-50">
                              <select value={inv.vatRate} onChange={(e) => { updateExtractedInvoice(inv.id, 'vatRate', e.target.value); setTimeout(() => calculateVat(inv.id, 'amountExVat'), 100); }}
                                className="border rounded px-1 py-1 w-full text-xs">
                                {VAT_RATES.map(vat => (
                                  <option key={vat.value} value={vat.value}>{vat.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <button onClick={() => deleteExtractedInvoice(inv.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <button onClick={addExtractedInvoice} className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-50 text-sm">
                      <Plus className="w-4 h-4" /> Add Invoice Row
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowPdfInvoiceExtractor(false); setExtractedInvoices([]); }} className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-50 text-sm">
                        Cancel
                      </button>
                      <button onClick={loadExtractedInvoicesToSystem} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm">
                        <Check className="w-4 h-4" /> Load {extractedInvoices.filter(i => i.selected).length} Invoice(s) to System
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-orange-600 text-orange-700 bg-orange-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Supplier Invoices
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'invoices' ? 'bg-orange-200 text-orange-800' : 'bg-slate-200 text-slate-600'}`}>
              {supplierInvoices.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'contacts'
              ? 'border-orange-600 text-orange-700 bg-orange-50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Supplier Contacts
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'contacts' ? 'bg-orange-200 text-orange-800' : 'bg-slate-200 text-slate-600'}`}>
              {suppliers.length}}
            </span>
          </div>
        </button>
      </div>

      {showSupplierForm && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="font-semibold mb-4">New Supplier</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">Save</button>
            <button onClick={() => setShowSupplierForm(false)} className="border px-4 py-2 rounded text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Supplier Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {supplierInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplierInvoices.map(invoice => (
                <div key={invoice.id} className="bg-white rounded-lg border shadow-sm p-5 border-l-4 border-l-orange-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{invoice.documentNo}</h4>
                      <p className="text-sm text-slate-600">{invoice.supplier || invoice.customer || 'No supplier'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.createdFromBank && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">From Bank</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-orange-600 mb-3">
                    R {(invoice.amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    Date: {invoice.date} • Due: {invoice.dueDate}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedInvoice(invoice); setShowPrintPreview(true); }}
                      className="flex-1 text-sm py-2 border rounded hover:bg-slate-50"
                    >
                      <Eye className="w-4 h-4 inline mr-1" /> View
                    </button>
                    {invoice.status !== 'Paid' && (
                      <button 
                        onClick={() => markAsPaid(invoice.id)}
                        className="flex-1 text-sm py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4 inline mr-1" /> Paid
                      </button>
                    )}
                    <button 
                      onClick={() => deleteInvoice(invoice.id)}
                      className="px-3 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <FileText className="w-12 h-12 text-orange-300 mx-auto mb-3" />
              <p className="text-slate-500">No supplier invoices yet.</p>
              <p className="text-sm text-slate-400 mt-1">Convert a bank payment to create a supplier invoice.</p>
            </div>
          )}
        </>
      )}

      {/* Supplier Contacts Tab */}
      {activeTab === 'contacts' && (
        <>
          {suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="bg-white rounded-lg border shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{supplier.name}</h4>
                      {supplier.company && <p className="text-sm text-slate-600">{supplier.company}</p>}
                      {supplier.email && <p className="text-sm text-slate-500">{supplier.email}</p>}
                      {supplier.phone && <p className="text-sm text-slate-500">{supplier.phone}</p>}
                    </div>
                    <button onClick={() => deleteSupplier(supplier.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No suppliers yet. Add your first supplier!</p>
            </div>
          )}
        </>
      )}
      
      {/* Print Preview Modal */}
      {showPrintPreview && selectedInvoice && (
        <PrintPreview invoice={selectedInvoice} onClose={() => setShowPrintPreview(false)} company={clients?.[0]} />
      )}
    </div>
  );
};

// ==================== COMPANIES VIEW ====================
const CompaniesView = ({ clients, saveClients, showClientForm, setShowClientForm }) => {
  const logoInputRef = React.useRef(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    tradingName: '',
    registrationNo: '',
    vatNo: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'South Africa',
    email: '', 
    phone: '',
    contactPerson: '',
    bankName: '',
    bankAccountNo: '',
    bankBranchCode: '',
    logo: ''
  });
  const [editingId, setEditingId] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: '' });
  };

  const handleSave = () => {
    if (formData.name) {
      if (editingId) {
        saveClients(clients.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
        setEditingId(null);
      } else {
        saveClients([...clients, { id: Date.now(), ...formData }]);
      }
      resetForm();
      setShowClientForm(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      tradingName: '',
      registrationNo: '',
      vatNo: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'South Africa',
      email: '', 
      phone: '',
      contactPerson: '',
      bankName: '',
      bankAccountNo: '',
      bankBranchCode: '',
      logo: ''
    });
    setEditingId(null);
  };

  const editCompany = (company) => {
    setFormData({
      name: company.name || '',
      tradingName: company.tradingName || '',
      registrationNo: company.registrationNo || '',
      vatNo: company.vatNo || '',
      address: company.address || '',
      city: company.city || '',
      postalCode: company.postalCode || '',
      country: company.country || 'South Africa',
      email: company.email || '',
      phone: company.phone || '',
      contactPerson: company.contactPerson || '',
      bankName: company.bankName || '',
      bankAccountNo: company.bankAccountNo || '',
      bankBranchCode: company.bankBranchCode || '',
      logo: company.logo || ''
    });
    setEditingId(company.id);
    setShowClientForm(true);
  };

  const deleteClient = (id) => {
    saveClients(clients.filter(c => c.id !== id));
  };

  const cancelForm = () => {
    resetForm();
    setShowClientForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Companies</h2>
          <p className="text-sm text-slate-500">Manage your company profiles and logos</p>
        </div>
        <button
          onClick={() => setShowClientForm(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {showClientForm && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">{editingId ? 'Edit Company' : 'New Company'}</h3>
            <button onClick={cancelForm} className="p-2 hover:bg-slate-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Logo Upload Section */}
          <div className="mb-6">
            <h4 className="font-medium text-sm text-slate-600 mb-3 border-b pb-2">Company Logo</h4>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50">
                {formData.logo ? (
                  <img src={formData.logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">No logo</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {formData.logo ? 'Change Logo' : 'Upload Logo'}
                </button>
                {formData.logo && (
                  <button
                    onClick={removeLogo}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Logo
                  </button>
                )}
                <p className="text-xs text-slate-500">Recommended: PNG or JPG, max 500x500px</p>
                <p className="text-xs text-slate-400">This logo will appear on invoices and reports</p>
              </div>
            </div>
          </div>
          
          {/* Company Details */}
          <div className="mb-6">
            <h4 className="font-medium text-sm text-slate-600 mb-3 border-b pb-2">Company Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Trading Name"
                value={formData.tradingName}
                onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Registration Number"
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="VAT Number"
                value={formData.vatNo}
                onChange={(e) => setFormData({ ...formData, vatNo: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          {/* Address */}
          <div className="mb-6">
            <h4 className="font-medium text-sm text-slate-600 mb-3 border-b pb-2">Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="border rounded px-3 py-2 text-sm col-span-2"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          {/* Contact */}
          <div className="mb-6">
            <h4 className="font-medium text-sm text-slate-600 mb-3 border-b pb-2">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          {/* Banking Details */}
          <div className="mb-6">
            <h4 className="font-medium text-sm text-slate-600 mb-3 border-b pb-2">Banking Details</h4>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={formData.bankAccountNo}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Branch Code"
                value={formData.bankBranchCode}
                onChange={(e) => setFormData({ ...formData, bankBranchCode: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700">
              {editingId ? 'Update Company' : 'Save Company'}
            </button>
            <button onClick={cancelForm} className="border px-4 py-2 rounded text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map(company => (
            <div key={company.id} className="bg-white rounded-lg border shadow-sm p-5">
              <div className="flex items-start gap-4">
                {company.logo ? (
                  <div className="w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0">
                    <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xl flex-shrink-0">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-lg">{company.name}</h4>
                  {company.tradingName && <p className="text-sm text-slate-600">Trading as: {company.tradingName}</p>}
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    {company.registrationNo && <p>Reg: {company.registrationNo}</p>}
                    {company.vatNo && <p>VAT: {company.vatNo}</p>}
                    {company.email && <p>{company.email}</p>}
                    {company.phone && <p>{company.phone}</p>}
                    {company.address && <p>{company.address}, {company.city}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => editCompany(company)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteClient(company.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No companies yet. Add your first company!</p>
          <p className="text-sm text-slate-400 mt-1">Companies are used for your business profiles and invoicing.</p>
        </div>
      )}
    </div>
  );
};

// ==================== ACCOUNTS VIEW ====================
const AccountsView = ({ accounts, saveAccounts, showAccountForm, setShowAccountForm }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0],
    description: '',
    active: true
  });
  const [editingId, setEditingId] = useState(null);

  // Account categories with descriptions (matching the screenshot)
  const accountCategories = [
    { value: '', label: '(None)', description: '' },
    { value: 'Sales', label: 'Sales', description: 'Non-item based sales.' },
    { value: 'Cost of Sales', label: 'Cost of Sales', description: 'Any costs associated with sales. Used to calculate gross profit.' },
    { value: 'Other Income', label: 'Other Income', description: 'Income received such as interest and discount received.' },
    { value: 'Expenses', label: 'Expenses', description: 'Cost incurred. Advertising, rent, stationery, and so on.' },
    { value: 'Income Tax', label: 'Income Tax', description: 'Taxes levied on the net income of the company.' },
    { value: 'Current Assets', label: 'Current Assets', description: 'Assets that can be converted to cash within a year.' },
    { value: 'Non-Current Assets', label: 'Non-Current Assets', description: 'Long-term assets not easily converted to cash.' },
    { value: 'Fixed Assets', label: 'Fixed Assets', description: 'Property, plant, and equipment.' },
    { value: 'Current Liabilities', label: 'Current Liabilities', description: 'Obligations due within one year.' },
    { value: 'Non-Current Liabilities', label: 'Non-Current Liabilities', description: 'Long-term financial obligations.' },
    { value: 'Equity', label: 'Equity', description: 'Owner\'s equity and retained earnings.' },
    { value: 'Bank', label: 'Bank', description: 'Bank and cash accounts.' }
  ];

  const handleSave = () => {
    if (formData.name) {
      if (editingId) {
        // Update existing account
        saveAccounts(accounts.map(acc => acc.id === editingId ? { ...formData, id: editingId } : acc));
        setEditingId(null);
      } else {
        // Add new account
        saveAccounts([...accounts, { id: Date.now(), ...formData }]);
      }
      setFormData({
        name: '',
        category: '',
        openingBalance: 0,
        openingBalanceDate: new Date().toISOString().split('T')[0],
        description: '',
        active: true
      });
      setShowAccountForm(false);
    }
  };

  const editAccount = (account) => {
    setFormData({
      name: account.name,
      category: account.category || '',
      openingBalance: account.openingBalance || 0,
      openingBalanceDate: account.openingBalanceDate || new Date().toISOString().split('T')[0],
      description: account.description || '',
      active: account.active !== false
    });
    setEditingId(account.id);
    setShowAccountForm(true);
  };

  const deleteAccount = (id) => {
    saveAccounts(accounts.filter(acc => acc.id !== id));
  };

  const cancelForm = () => {
    setFormData({
      name: '',
      category: '',
      openingBalance: 0,
      openingBalanceDate: new Date().toISOString().split('T')[0],
      description: '',
      active: true
    });
    setEditingId(null);
    setShowAccountForm(false);
  };

  // Group accounts by category
  const groupedAccounts = accountCategories.reduce((groups, cat) => {
    if (cat.value) {
      groups[cat.value] = accounts.filter(acc => acc.category === cat.value);
    }
    return groups;
  }, {});

  const uncategorizedAccounts = accounts.filter(acc => !acc.category);

  const formatCurrency = (amount) => `R ${(parseFloat(amount) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  // Load default accounts
  const loadDefaultAccounts = () => {
    if (window.confirm('This will replace all current accounts with the default chart of accounts. Continue?')) {
      saveAccounts(DEFAULT_ACCOUNTS);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Chart of Accounts</h2>
          <p className="text-sm text-slate-500">Manage your account categories and balances ({accounts.length} accounts)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDefaultAccounts}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Load Default Accounts
          </button>
          <button
            onClick={() => setShowAccountForm(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add New Account
          </button>
        </div>
      </div>

      {/* Add/Edit Account Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Account' : 'Add New Account'}</h3>
              <button onClick={cancelForm} className="p-2 hover:bg-slate-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-6">
                Additional details can be added later by editing the Account, not all details are available when creating an Account from here.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter account name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {accountCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    {formData.category && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        {accountCategories.find(c => c.value === formData.category)?.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Active</label>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 text-sm">R</span>
                      <input
                        type="number"
                        value={formData.openingBalance}
                        onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                        className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance as At</label>
                    <input
                      type="date"
                      value={formData.openingBalanceDate}
                      onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description for this account"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-slate-50 flex justify-center">
              <button
                onClick={handleSave}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts List by Category */}
      {accounts.length > 0 ? (
        <div className="space-y-4">
          {/* Uncategorized Accounts */}
          {uncategorizedAccounts.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-100 border-b">
                <h3 className="font-semibold text-slate-700">Uncategorized</h3>
              </div>
              <div className="divide-y">
                {uncategorizedAccounts.map(account => (
                  <div key={account.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${account.active !== false ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div>
                        <h4 className="font-medium text-slate-800">{account.name}</h4>
                        {account.description && <p className="text-sm text-slate-500">{account.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-slate-700">{formatCurrency(account.openingBalance)}</span>
                      <button onClick={() => editAccount(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteAccount(account.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Accounts */}
          {accountCategories.filter(cat => cat.value && groupedAccounts[cat.value]?.length > 0).map(cat => (
            <div key={cat.value} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-3 bg-emerald-50 border-b">
                <h3 className="font-semibold text-emerald-800">{cat.label}</h3>
                <p className="text-xs text-emerald-600">{cat.description}</p>
              </div>
              <div className="divide-y">
                {groupedAccounts[cat.value].map(account => (
                  <div key={account.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${account.active !== false ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div>
                        <h4 className="font-medium text-slate-800">{account.name}</h4>
                        {account.description && <p className="text-sm text-slate-500">{account.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-slate-700">{formatCurrency(account.openingBalance)}</span>
                      <button onClick={() => editAccount(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteAccount(account.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No accounts yet. Add your first account!</p>
          <p className="text-sm text-slate-400 mt-1">Accounts are used to categorize transactions in your chart of accounts.</p>
        </div>
      )}

      {/* Quick Summary */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-600 font-medium">Total Accounts</p>
              <p className="text-xl font-bold text-blue-800">{accounts.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-green-600 font-medium">Active</p>
              <p className="text-xl font-bold text-green-800">{accounts.filter(a => a.active !== false).length}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-600 font-medium">Inactive</p>
              <p className="text-xl font-bold text-slate-800">{accounts.filter(a => a.active === false).length}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-emerald-600 font-medium">Total Opening Balance</p>
              <p className="text-xl font-bold text-emerald-800">{formatCurrency(accounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0))}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== BANKING VIEW ====================
const BankingView = ({ bankStatements, saveBankStatements, invoices, saveInvoices, clients, suppliers, accounts = [] }) => {
  const fileInputRef = React.useRef(null);
  const pdfInputRef = React.useRef(null);
  const imageInputRef = React.useRef(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [activeStatement, setActiveStatement] = useState(null);
  const [showPdfExtractor, setShowPdfExtractor] = useState(false);
  const [extractedPdfData, setExtractedPdfData] = useState([]);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Build selection options from accounts
  const selectionOptions = [
    'Unallocated Expen',
    ...accounts.filter(a => a.active !== false).map(a => a.name)
  ];

  // AI-powered extraction for bank statements using Claude API
  const extractBankStatementWithAI = async (imageData, fileName) => {
    try {
      // Determine media type
      let mediaType = "image/jpeg";
      if (imageData.includes("data:image/png")) mediaType = "image/png";
      else if (imageData.includes("data:image/gif")) mediaType = "image/gif";
      else if (imageData.includes("data:image/webp")) mediaType = "image/webp";
      
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data
                  }
                },
                {
                  type: "text",
                  text: `You are a bank statement data extraction assistant. Extract ALL transactions from this bank statement.

Return ONLY a JSON array (no markdown, no code blocks, just the array):
[{"date":"YYYY-MM-DD","description":"transaction description","amount":"0.00","type":"spent"},{"date":"YYYY-MM-DD","description":"another transaction","amount":"0.00","type":"received"}]

Rules:
- date: Convert to YYYY-MM-DD format
- amount: Numbers only with decimal, no currency symbols
- type: "spent" for debits/withdrawals/payments, "received" for credits/deposits
- Extract EVERY transaction visible in the statement
- Look for columns like Date, Description, Debit, Credit, Amount, Balance`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('API response not ok:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('Bank API Response:', data);
      
      const text = data.content?.[0]?.text || '';
      console.log('Bank extracted text:', text);
      
      // Clean and parse JSON array
      let jsonStr = text.trim();
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
      
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed bank data:', parsed);
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('AI extraction error:', error);
      return [];
    }
  };

  // Handle PDF upload for bank statements with AI extraction
  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.includes('pdf')) {
      alert('Please select a PDF file');
      return;
    }
    
    setPdfProcessing(true);
    setShowPdfExtractor(true);
    
    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      
      // Use AI to extract transactions
      const extracted = await extractBankStatementWithAI(base64Data, file.name);
      
      if (extracted && extracted.length > 0) {
        const extractedData = extracted.map((t, idx) => ({
          id: Date.now() + idx,
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || '',
          amount: t.amount || '0',
          type: t.type || 'spent',
          selected: true,
          aiExtracted: true
        }));
        setExtractedPdfData(extractedData);
        setSaveMessage(`AI extracted ${extracted.length} transactions from PDF. Please verify.`);
      } else {
        setExtractedPdfData([
          { id: Date.now(), date: new Date().toISOString().split('T')[0], description: '', amount: '0', type: 'spent', selected: true }
        ]);
        setSaveMessage('Could not auto-extract. Please enter transactions manually.');
      }
      
      setPdfProcessing(false);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      console.error('PDF processing error:', error);
      setPdfProcessing(false);
      alert('Error processing PDF. Please try CSV import instead.');
    }
    
    event.target.value = '';
  };

  // Handle image upload for bank statements with AI extraction
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setPdfProcessing(true);
    setShowPdfExtractor(true);
    
    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      
      // Use AI to extract transactions
      const extracted = await extractBankStatementWithAI(base64Data, file.name);
      
      if (extracted && extracted.length > 0) {
        const extractedData = extracted.map((t, idx) => ({
          id: Date.now() + idx,
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || '',
          amount: t.amount || '0',
          type: t.type || 'spent',
          selected: true,
          aiExtracted: true,
          imagePreview: idx === 0 ? base64Data : null
        }));
        extractedData[0].imagePreview = base64Data;
        setExtractedPdfData(extractedData);
        setSaveMessage(`AI extracted ${extracted.length} transactions from image. Please verify.`);
      } else {
        setExtractedPdfData([
          { id: Date.now(), date: new Date().toISOString().split('T')[0], description: '', amount: '0', type: 'spent', selected: true, imagePreview: base64Data }
        ]);
        setSaveMessage('Could not auto-extract. Please enter transactions manually.');
      }
      
      setPdfProcessing(false);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      console.error('Image processing error:', error);
      setPdfProcessing(false);
      alert('Error processing image.');
    }
    
    event.target.value = '';
  };

  // Update extracted PDF row
  const updateExtractedRow = (id, field, value) => {
    setExtractedPdfData(extractedPdfData.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Add new row to extracted data
  const addExtractedRow = () => {
    setExtractedPdfData([...extractedPdfData, {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'spent',
      selected: true
    }]);
  };

  // Delete extracted row
  const deleteExtractedRow = (id) => {
    setExtractedPdfData(extractedPdfData.filter(row => row.id !== id));
  };

  // Export extracted data as CSV
  const exportExtractedAsCSV = () => {
    const selected = extractedPdfData.filter(row => row.selected);
    if (selected.length === 0) {
      alert('No rows selected to export');
      return;
    }
    
    let csv = 'Date,Description,Amount,Type\n';
    selected.forEach(row => {
      csv += `${row.date},"${row.description}",${row.amount},${row.type}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load extracted data into system
  const loadExtractedToSystem = () => {
    const selected = extractedPdfData.filter(row => row.selected);
    if (selected.length === 0) {
      alert('No rows selected to load');
      return;
    }
    
    const newStatements = selected.map((row, idx) => ({
      id: Date.now() + idx,
      date: row.date,
      payee: '',
      description: row.description,
      type: 'Account',
      selection: 'Unallocated Expen',
      reference: `PDF-${Date.now() + idx}`,
      vatRate: 'No VAT',
      spent: row.type === 'spent' ? parseFloat(row.amount) || 0 : 0,
      received: row.type === 'received' ? parseFloat(row.amount) || 0 : 0,
      reconciled: false,
      linkedInvoice: null,
      linkedType: null
    }));
    
    saveBankStatements([...bankStatements, ...newStatements]);
    setShowPdfExtractor(false);
    setExtractedPdfData([]);
    setSaveMessage(`${selected.length} transactions loaded successfully!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newStatements = lines.slice(1).map((line, idx) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, i) => row[h] = values[i] || '');
        
        const amount = parseFloat(row.amount || row.debit || row.credit || 0);
        
        return {
          id: Date.now() + idx,
          date: row.date || new Date().toISOString().split('T')[0],
          payee: row.payee || row.name || '',
          description: row.description || row.memo || row.reference || '',
          type: 'Account',
          selection: 'Unallocated Expen',
          reference: row.reference || row.ref || `REF-${Date.now() + idx}`,
          vatRate: 'No VAT',
          spent: amount < 0 ? Math.abs(amount) : 0,
          received: amount > 0 ? amount : 0,
          reconciled: false,
          linkedInvoice: null,
          linkedType: null
        };
      });
      
      saveBankStatements([...bankStatements, ...newStatements]);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addStatement = () => {
    saveBankStatements([...bankStatements, {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      payee: '',
      description: '',
      type: 'Account',
      selection: 'Unallocated Expen',
      reference: '',
      vatRate: 'No VAT',
      spent: 0,
      received: 0,
      reconciled: false,
      linkedInvoice: null,
      linkedType: null
    }]);
  };

  const updateStatement = (id, field, value) => {
    saveBankStatements(bankStatements.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteStatement = (id) => {
    saveBankStatements(bankStatements.filter(s => s.id !== id));
    setSelectedIds(selectedIds.filter(sid => sid !== id));
  };

  const exportCSV = () => {
    const headers = ['Date', 'Payee', 'Description', 'Type', 'Selection', 'Reference', 'VAT Rate', 'Spent', 'Received', 'Reconciled', 'Linked Invoice'];
    const rows = bankStatements.map(s => [s.date, s.payee, s.description, s.type, s.selection, s.reference, s.vatRate, s.spent, s.received, s.reconciled, s.linkedInvoice || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank-statements.csv';
    a.click();
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(bankStatements.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSaveChanges = () => {
    saveBankStatements([...bankStatements]);
    setSaveMessage('Changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleMarkSelectedAsReviewed = () => {
    if (selectedIds.length === 0) {
      setSaveMessage('Please select transactions first');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    const updated = bankStatements.map(s => 
      selectedIds.includes(s.id) ? { ...s, reconciled: true, reviewed: true } : s
    );
    saveBankStatements(updated);
    setSelectedIds([]);
    setSaveMessage(`${selectedIds.length} transaction(s) marked as reviewed!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleMarkAllAsReviewed = () => {
    const updated = bankStatements.map(s => ({ ...s, reconciled: true, reviewed: true }));
    saveBankStatements(updated);
    setSelectedIds([]);
    setSaveMessage('All transactions marked as reviewed!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Link invoice to statement
  const handleLinkInvoice = (invoiceId, invoiceType) => {
    if (activeStatement) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      const updatedStatements = bankStatements.map(s => 
        s.id === activeStatement.id 
          ? { ...s, linkedInvoice: invoiceId, linkedType: invoiceType, linkedInvoiceNo: invoice?.documentNo || '' }
          : s
      );
      saveBankStatements(updatedStatements);
      
      // Mark invoice as paid if linking
      if (invoice && saveInvoices) {
        const updatedInvoices = invoices.map(inv => 
          inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv
        );
        saveInvoices(updatedInvoices);
      }
      
      setShowLinkModal(false);
      setActiveStatement(null);
      setSaveMessage('Invoice linked successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Unlink invoice
  const handleUnlinkInvoice = (stmtId) => {
    const updatedStatements = bankStatements.map(s => 
      s.id === stmtId 
        ? { ...s, linkedInvoice: null, linkedType: null, linkedInvoiceNo: null }
        : s
    );
    saveBankStatements(updatedStatements);
    setSaveMessage('Invoice unlinked!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Convert to invoice
  const handleConvertToInvoice = (type) => {
    if (activeStatement && saveInvoices) {
      const amount = type === 'client' ? (activeStatement.received || 0) : (activeStatement.spent || 0);
      const newInvoice = {
        id: Date.now(),
        documentNo: type === 'client' ? `INV-${Date.now()}` : `SINV-${Date.now()}`,
        date: activeStatement.date,
        dueDate: activeStatement.date,
        customer: type === 'client' ? (activeStatement.description || 'Client') : '',
        supplier: type === 'supplier' ? (activeStatement.description || 'Supplier') : '',
        customerRef: activeStatement.reference || '',
        invoiceType: type,
        items: [{
          id: 1,
          type: 'Item',
          description: activeStatement.description || 'Payment',
          unit: '',
          qty: 1,
          price: amount,
          vatType: activeStatement.vatRate || 'Standard Rate (15.00%)',
          discPercent: 0
        }],
        amount: amount,
        status: 'Paid',
        createdFromBank: true
      };
      
      // Save new invoice
      saveInvoices([...invoices, newInvoice]);
      
      // Link the new invoice to this statement
      const updatedStatements = bankStatements.map(s => 
        s.id === activeStatement.id 
          ? { ...s, linkedInvoice: newInvoice.id, linkedType: type, linkedInvoiceNo: newInvoice.documentNo }
          : s
      );
      saveBankStatements(updatedStatements);
      
      setShowConvertModal(false);
      setActiveStatement(null);
      setSaveMessage(`${type === 'client' ? 'Client' : 'Supplier'} invoice created and linked!`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const expenseCategories = ['Unallocated Expen', 'Travelling', 'Purchases', 'Office Supplies', 'Marketing', 'Utilities', 'Salaries', 'Rent', 'Insurance', 'Maintenance', 'Professional Fees', 'Bank Charges', 'Other'];

  // Get pending/unpaid invoices for linking
  const availableInvoices = invoices.filter(inv => inv.status !== 'Paid' || !bankStatements.some(s => s.linkedInvoice === inv.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Bank Statements</h2>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleCSVImport} accept=".csv" className="hidden" />
          <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} accept=".pdf" className="hidden" />
          <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 border border-blue-300 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm">
            <Upload className="w-4 h-4" /> Upload Image
          </button>
          <button onClick={() => pdfInputRef.current?.click()} className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-slate-50 text-sm">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-slate-50 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={addStatement} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* PDF Extractor Modal */}
      {showPdfExtractor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-blue-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-blue-800">Bank Statement Extractor (AI-Powered)</h3>
              <button onClick={() => { setShowPdfExtractor(false); setExtractedPdfData([]); }} className="p-2 hover:bg-blue-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {pdfProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">AI is extracting transactions...</p>
                  <p className="text-xs text-slate-400 mt-2">Analyzing document for dates, descriptions, and amounts</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">
                      {extractedPdfData.some(r => r.aiExtracted) ? (
                        <span className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 font-medium">AI extracted {extractedPdfData.length} transactions.</span>
                          <span className="text-slate-500">Please verify before importing.</span>
                        </span>
                      ) : (
                        'Enter or verify the transactions. Select the rows you want to import.'
                      )}
                    </p>
                    {extractedPdfData.some(r => r.imagePreview) && (
                      <button 
                        onClick={() => setPreviewImage(extractedPdfData.find(r => r.imagePreview)?.imagePreview)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> View Source Image
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-auto max-h-[50vh] border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left w-10">
                            <input 
                              type="checkbox" 
                              checked={extractedPdfData.length > 0 && extractedPdfData.every(r => r.selected)}
                              onChange={(e) => setExtractedPdfData(extractedPdfData.map(r => ({ ...r, selected: e.target.checked })))}
                              className="w-4 h-4"
                            />
                          </th>
                          <th className="px-3 py-2 text-left font-bold">Date</th>
                          <th className="px-3 py-2 text-left font-bold">Description</th>
                          <th className="px-3 py-2 text-left font-bold">Amount</th>
                          <th className="px-3 py-2 text-left font-bold">Type</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedPdfData.map((row, idx) => (
                          <tr key={row.id} className={`border-t hover:bg-slate-50 ${row.aiExtracted ? 'bg-green-50/50' : ''}`}>
                            <td className="px-3 py-2">
                              <input 
                                type="checkbox" 
                                checked={row.selected} 
                                onChange={(e) => updateExtractedRow(row.id, 'selected', e.target.checked)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                type="date" 
                                value={row.date} 
                                onChange={(e) => updateExtractedRow(row.id, 'date', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                type="text" 
                                value={row.description} 
                                onChange={(e) => updateExtractedRow(row.id, 'description', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                                placeholder="Transaction description"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                type="text" 
                                value={row.amount} 
                                onChange={(e) => updateExtractedRow(row.id, 'amount', e.target.value)}
                                className="border rounded px-2 py-1 w-full text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select 
                                value={row.type} 
                                onChange={(e) => updateExtractedRow(row.id, 'type', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="spent">Spent (Debit)</option>
                                <option value="received">Received (Credit)</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => deleteExtractedRow(row.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <button onClick={addExtractedRow} className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-50 text-sm">
                      <Plus className="w-4 h-4" /> Add Row
                    </button>
                    <div className="flex gap-2">
                      <button onClick={exportExtractedAsCSV} className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-50 text-sm">
                        <Download className="w-4 h-4" /> Save as CSV
                      </button>
                      <button onClick={loadExtractedToSystem} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm">
                        <Check className="w-4 h-4" /> Load to System
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Source Document" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-center px-2 py-3 font-medium text-slate-600 w-10">
                  <input
                    type="checkbox"
                    checked={bankStatements.length > 0 && selectedIds.length === bankStatements.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left px-3 py-3 font-medium text-slate-600 w-28">Date</th>
                <th className="text-left px-3 py-3 font-medium text-slate-600">Description</th>
                <th className="text-left px-3 py-3 font-medium text-slate-600 w-32">Type</th>
                <th className="text-left px-3 py-3 font-medium text-slate-600 w-36">Category</th>
                <th className="text-left px-3 py-3 font-medium text-slate-600 w-28">VAT Rate</th>
                <th className="text-right px-3 py-3 font-medium text-slate-600 w-32">Spent</th>
                <th className="text-right px-3 py-3 font-medium text-slate-600 w-32">Received</th>
                <th className="text-left px-3 py-3 font-medium text-slate-600 w-56">Link / Convert</th>
                <th className="text-center px-3 py-3 font-medium text-slate-600 w-12">Rec.</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {bankStatements.length > 0 ? bankStatements.map(stmt => (
                <tr key={stmt.id} className={`border-t hover:bg-slate-50 ${stmt.reconciled ? 'bg-green-50' : ''} ${selectedIds.includes(stmt.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(stmt.id)}
                      onChange={() => toggleSelect(stmt.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={stmt.date}
                      onChange={(e) => updateStatement(stmt.id, 'date', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={stmt.description || ''}
                      onChange={(e) => updateStatement(stmt.id, 'description', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={stmt.type}
                      onChange={(e) => updateStatement(stmt.id, 'type', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full"
                    >
                      <option>Account</option>
                      <option>Customer</option>
                      <option>Supplier</option>
                      <option>Transfer</option>
                      <option>VAT</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={stmt.selection}
                      onChange={(e) => updateStatement(stmt.id, 'selection', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full"
                    >
                      {selectionOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={stmt.vatRate}
                      onChange={(e) => updateStatement(stmt.id, 'vatRate', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full"
                    >
                      {VAT_RATES.map(vat => <option key={vat.value} value={vat.value}>{vat.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={stmt.spent ? `R ${stmt.spent.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        updateStatement(stmt.id, 'spent', parseFloat(value) || 0);
                      }}
                      onFocus={(e) => {
                        e.target.value = stmt.spent || '';
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                        updateStatement(stmt.id, 'spent', value);
                      }}
                      className="border rounded px-3 py-1 text-sm w-full text-right min-w-[140px]"
                      placeholder="R 0.00"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={stmt.received ? `R ${stmt.received.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        updateStatement(stmt.id, 'received', parseFloat(value) || 0);
                      }}
                      onFocus={(e) => {
                        e.target.value = stmt.received || '';
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                        updateStatement(stmt.id, 'received', value);
                      }}
                      className="border rounded px-3 py-1 text-sm w-full text-right min-w-[120px]"
                      placeholder="R 0.00"
                    />
                  </td>
                  {/* Link Invoice Column */}
                  <td className="px-3 py-2">
                    {stmt.linkedInvoice ? (
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${stmt.linkedType === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {stmt.linkedInvoiceNo || 'Linked'}
                        </span>
                        <button 
                          onClick={() => handleUnlinkInvoice(stmt.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Unlink invoice"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setActiveStatement(stmt); setShowLinkModal(true); }}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200"
                          title="Link to existing invoice"
                        >
                          Link
                        </button>
                        <button
                          onClick={() => { setActiveStatement(stmt); setShowConvertModal(true); }}
                          className="px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-200"
                          title="Convert to invoice"
                        >
                          Convert
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={stmt.reconciled}
                      onChange={(e) => updateStatement(stmt.id, 'reconciled', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => deleteStatement(stmt.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-500">
                    No bank statements. Import a CSV or add entries manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 bg-slate-100 border-t">
          {/* Success Message */}
          {saveMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center text-sm font-medium">
              {saveMessage}
            </div>
          )}
          
          <div className="flex justify-center gap-3">
            <button 
              onClick={handleSaveChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button 
              onClick={handleMarkSelectedAsReviewed}
              className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
            >
              Mark Selected as Reviewed
            </button>
            <button 
              onClick={handleMarkAllAsReviewed}
              className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
            >
              Mark All as Reviewed
            </button>
          </div>
        </div>
      </div>

      {/* Link Invoice Modal */}
      {showLinkModal && activeStatement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Link to Invoice</h3>
                <p className="text-sm text-slate-600">
                  Link this payment ({activeStatement.spent > 0 ? `Spent: R ${activeStatement.spent.toLocaleString()}` : `Received: R ${activeStatement.received.toLocaleString()}`}) to an existing invoice
                </p>
              </div>
              <button onClick={() => { setShowLinkModal(false); setActiveStatement(null); }} className="p-2 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {invoices.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-slate-600 mb-3">Select an invoice to link:</h4>
                  {invoices.map(inv => (
                    <div 
                      key={inv.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleLinkInvoice(inv.id, inv.invoiceType || 'client')}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{inv.documentNo}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : inv.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {inv.status}
                          </span>
                          {inv.invoiceType && (
                            <span className={`px-2 py-0.5 rounded text-xs ${inv.invoiceType === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {inv.invoiceType === 'client' ? 'Client' : 'Supplier'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{inv.customer || inv.supplier || 'No customer'} • {inv.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">R {(inv.amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No invoices available to link.</p>
                  <p className="text-sm">Create invoices first or use "Convert" to create a new invoice from this payment.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button 
                onClick={() => { setShowLinkModal(false); setActiveStatement(null); }}
                className="px-4 py-2 border rounded text-sm hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {showConvertModal && activeStatement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Convert to Invoice</h3>
                <p className="text-sm text-slate-600">Create a new invoice from this bank transaction</p>
              </div>
              <button onClick={() => { setShowConvertModal(false); setActiveStatement(null); }} className="p-2 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-sm text-slate-600 mb-2">Transaction Details:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-slate-500">Date:</span> {activeStatement.date}</p>
                  <p><span className="text-slate-500">Description:</span> {activeStatement.description || 'N/A'}</p>
                  {activeStatement.spent > 0 && (
                    <p><span className="text-slate-500">Amount Spent:</span> <span className="font-semibold text-red-600">R {activeStatement.spent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></p>
                  )}
                  {activeStatement.received > 0 && (
                    <p><span className="text-slate-500">Amount Received:</span> <span className="font-semibold text-emerald-600">R {activeStatement.received.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></p>
                  )}
                </div>
              </div>
              
              <h4 className="font-medium text-sm text-slate-600 mb-3">Select invoice type:</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleConvertToInvoice('client')}
                  disabled={!activeStatement.received || activeStatement.received <= 0}
                  className={`p-4 border-2 rounded-lg transition-all text-center ${
                    activeStatement.received > 0 
                      ? 'border-blue-200 hover:bg-blue-50 hover:border-blue-400 cursor-pointer' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold text-blue-700">Client Invoice</p>
                  <p className="text-xs text-slate-500 mt-1">For payments received</p>
                  {activeStatement.received > 0 && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1">R {activeStatement.received.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  )}
                </button>
                <button
                  onClick={() => handleConvertToInvoice('supplier')}
                  disabled={!activeStatement.spent || activeStatement.spent <= 0}
                  className={`p-4 border-2 rounded-lg transition-all text-center ${
                    activeStatement.spent > 0 
                      ? 'border-orange-200 hover:bg-orange-50 hover:border-orange-400 cursor-pointer' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-semibold text-orange-700">Supplier Invoice</p>
                  <p className="text-xs text-slate-500 mt-1">For payments made</p>
                  {activeStatement.spent > 0 && (
                    <p className="text-xs font-semibold text-red-600 mt-1">R {activeStatement.spent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button 
                onClick={() => { setShowConvertModal(false); setActiveStatement(null); }}
                className="px-4 py-2 border rounded text-sm hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== VAT RECONCILIATION VIEW ====================
const VATReconView = ({ vatTransactions, saveVatTransactions, company, accounts }) => {
  const fileInputRef = React.useRef(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [periodStart, setPeriodStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [downloadLink, setDownloadLink] = useState(null);
  const [pdfDownloadLink, setPdfDownloadLink] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Helper to check if a rate is standard (15%)
  const isStandardRate = (rate) => {
    return rate && (rate.includes('15.00%') || rate === 'Standard 15%' || rate.includes('15%'));
  };

  // Filter transactions by type and rate
  const standardOutputTxns = vatTransactions.filter(t => t.vatType === 'output' && isStandardRate(t.vatRate));
  const zeroOutputTxns = vatTransactions.filter(t => t.vatType === 'output' && !isStandardRate(t.vatRate));
  const standardInputTxns = vatTransactions.filter(t => t.vatType === 'input' && isStandardRate(t.vatRate));
  const zeroInputTxns = vatTransactions.filter(t => t.vatType === 'input' && !isStandardRate(t.vatRate));

  // All output and input transactions
  const outputTransactions = vatTransactions.filter(t => t.vatType === 'output');
  const inputTransactions = vatTransactions.filter(t => t.vatType === 'input');

  // Calculate totals
  const calcTotals = (txns) => ({
    exclusive: txns.reduce((s, t) => s + (parseFloat(t.exclusive) || 0), 0),
    vat: txns.reduce((s, t) => s + (parseFloat(t.vat) || 0), 0),
    inclusive: txns.reduce((s, t) => s + (parseFloat(t.inclusive) || 0), 0)
  });

  const standardOutputTotals = calcTotals(standardOutputTxns);
  const zeroOutputTotals = calcTotals(zeroOutputTxns);
  const standardInputTotals = calcTotals(standardInputTxns);
  const zeroInputTotals = calcTotals(zeroInputTxns);

  const totalOutputVAT = standardOutputTotals.vat;
  const totalInputVAT = standardInputTotals.vat;
  const netVAT = totalOutputVAT - totalInputVAT;

  const formatAmount = (amt) => `R ${(parseFloat(amt) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  // Handle Excel/CSV import
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      const newTransactions = lines.slice(1).map((line, idx) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const row = {};
        headers.forEach((h, i) => row[h] = values[i] || '');
        
        const date = row.date || row.transactiondate || row.invoicedate || new Date().toISOString().split('T')[0];
        const reference = row.reference || row.ref || row.invoiceno || row.documentno || '';
        const description = row.description || row.desc || row.details || row.name || '';
        const account = row.account || row.accountname || row.category || '';
        const exclusive = parseFloat(row.exclusive || row.excl || row.nett || row.amount || 0);
        const vat = parseFloat(row.vat || row.vatamount || row.tax || 0);
        const inclusive = parseFloat(row.inclusive || row.incl || row.total || 0) || (exclusive + vat);
        const vatType = (row.vattype || row.type || '').toLowerCase().includes('input') ? 'input' : 'output';
        const vatRate = row.vatrate || row.rate || (vat > 0 ? 'Standard 15%' : 'Zero Rated');

        return {
          id: Date.now() + idx,
          date,
          reference,
          description,
          account,
          exclusive: exclusive || (inclusive - vat),
          vat,
          inclusive: inclusive || (exclusive + vat),
          vatType,
          vatRate
        };
      }).filter(t => t.description || t.reference || t.exclusive > 0 || t.vat > 0);
      
      saveVatTransactions([...vatTransactions, ...newTransactions]);
      setSaveMessage(`${newTransactions.length} transactions imported!`);
      setTimeout(() => setSaveMessage(''), 3000);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Add new transaction
  const addTransaction = (vatType, vatRate = 'Standard Rate (15.00%)') => {
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      account: '',
      exclusive: 0,
      vat: 0,
      inclusive: 0,
      vatType,
      vatRate
    };
    saveVatTransactions([...vatTransactions, newTransaction]);
  };

  // Update transaction for non-amount fields
  const updateTransaction = (id, field, value) => {
    const updated = vatTransactions.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    });
    saveVatTransactions(updated);
  };

  // Delete transaction
  const deleteTransaction = (id) => {
    saveVatTransactions(vatTransactions.filter(t => t.id !== id));
  };

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    // Helper to safely format numbers
    const fmt = (val) => (parseFloat(val) || 0).toFixed(2);
    
    let csv = 'VAT Reconciliation Report\n';
    csv += `Period: ${periodStart} to ${periodEnd}\n\n`;
    
    // Summary
    csv += 'VAT SUMMARY\n';
    csv += 'Category,Exclusive,VAT,Inclusive\n';
    csv += `Standard Rate Output,${fmt(standardOutputTotals.exclusive)},${fmt(standardOutputTotals.vat)},${fmt(standardOutputTotals.inclusive)}\n`;
    csv += `Zero Rate Output,${fmt(zeroOutputTotals.exclusive)},0.00,${fmt(zeroOutputTotals.inclusive)}\n`;
    csv += `Total Output,${fmt(standardOutputTotals.exclusive + zeroOutputTotals.exclusive)},${fmt(totalOutputVAT)},${fmt(standardOutputTotals.inclusive + zeroOutputTotals.inclusive)}\n`;
    csv += `Standard Rate Input,${fmt(standardInputTotals.exclusive)},${fmt(standardInputTotals.vat)},${fmt(standardInputTotals.inclusive)}\n`;
    csv += `Zero Rate Input,${fmt(zeroInputTotals.exclusive)},0.00,${fmt(zeroInputTotals.inclusive)}\n`;
    csv += `Total Input,${fmt(standardInputTotals.exclusive + zeroInputTotals.exclusive)},${fmt(totalInputVAT)},${fmt(standardInputTotals.inclusive + zeroInputTotals.inclusive)}\n`;
    csv += `\n${netVAT >= 0 ? 'VAT Payable' : 'VAT Refundable'},,${fmt(Math.abs(netVAT))},\n\n`;

    // Output VAT Transactions
    csv += 'OUTPUT VAT TRANSACTIONS\n';
    csv += 'Date,Reference,Account,Description,VAT Rate,Exclusive,VAT,Inclusive\n';
    outputTransactions.forEach(t => {
      csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}","${t.vatRate || ''}",${fmt(t.exclusive)},${fmt(t.vat)},${fmt(t.inclusive)}\n`;
    });
    const outputTotals = calcTotals(outputTransactions);
    csv += `Subtotal,,,,,${fmt(outputTotals.exclusive)},${fmt(outputTotals.vat)},${fmt(outputTotals.inclusive)}\n\n`;

    // Input VAT Transactions
    csv += 'INPUT VAT TRANSACTIONS\n';
    csv += 'Date,Reference,Account,Description,VAT Rate,Exclusive,VAT,Inclusive\n';
    inputTransactions.forEach(t => {
      csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}","${t.vatRate || ''}",${fmt(t.exclusive)},${fmt(t.vat)},${fmt(t.inclusive)}\n`;
    });
    const inputTotals = calcTotals(inputTransactions);
    csv += `Subtotal,,,,,${fmt(inputTotals.exclusive)},${fmt(inputTotals.vat)},${fmt(inputTotals.inclusive)}\n`;

    // Create and trigger download directly
    const fileName = `VAT_Recon_${periodStart}_to_${periodEnd}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate PDF Download (HTML file for print to PDF)
  const generatePDFDownload = () => {
    setGenerating(true);
    const fmtAmt = (amt) => `R ${(parseFloat(amt) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const generateTableRows = (txns, showVat = true) => {
      if (txns.length === 0) return '<tr><td colspan="7" style="text-align:center;padding:15px;color:#64748b;">No transactions</td></tr>';
      return txns.map(t => `
        <tr>
          <td style="padding:6px;border:1px solid #d1d5db;">${t.date}</td>
          <td style="padding:6px;border:1px solid #d1d5db;">${t.reference || ''}</td>
          <td style="padding:6px;border:1px solid #d1d5db;">${t.account || ''}</td>
          <td style="padding:6px;border:1px solid #d1d5db;">${t.description || ''}</td>
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;">${fmtAmt(t.exclusive)}</td>
          ${showVat ? `<td style="padding:6px;border:1px solid #d1d5db;text-align:right;">${fmtAmt(t.vat)}</td>` : ''}
          <td style="padding:6px;border:1px solid #d1d5db;text-align:right;">${fmtAmt(t.inclusive)}</td>
        </tr>
      `).join('');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>VAT Reconciliation Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; padding: 30px; font-size: 11px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #059669; }
          .company-info { text-align: right; }
          .company-name { font-size: 18px; font-weight: bold; color: #1f2937; }
          .company-details { font-size: 11px; color: #6b7280; }
          .logo { max-width: 120px; max-height: 80px; object-fit: contain; }
          h1 { color: #059669; font-size: 22px; margin-bottom: 5px; }
          h2 { color: #374151; font-size: 14px; margin: 20px 0 10px 0; }
          .period { color: #6b7280; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f1f5f9; padding: 8px 6px; text-align: left; border: 1px solid #d1d5db; font-weight: 600; font-size: 10px; }
          td { padding: 6px; border: 1px solid #d1d5db; font-size: 10px; }
          .text-right { text-align: right; }
          .section-blue { background: #dbeafe; color: #1e40af; }
          .section-orange { background: #ffedd5; color: #c2410c; }
          .subtotal-row { background: #f1f5f9; font-weight: bold; }
          .summary-header { background: #d1fae5; color: #065f46; }
          .total-output { background: #dbeafe; font-weight: bold; }
          .total-input { background: #ffedd5; font-weight: bold; }
          .net-payable { background: #fee2e2; font-weight: bold; color: #991b1b; }
          .net-refund { background: #d1fae5; font-weight: bold; color: #065f46; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            ${company?.logo ? `<img src="${company.logo}" class="logo" alt="Logo" />` : ''}
            <h1>VAT Reconciliation Report</h1>
            <p class="period">Period: ${periodStart} to ${periodEnd}</p>
          </div>
          <div class="company-info">
            <p class="company-name">${company?.name || 'Company Name'}</p>
            ${company?.tradingName ? `<p class="company-details">Trading as: ${company.tradingName}</p>` : ''}
            ${company?.address ? `<p class="company-details">${company.address}</p>` : ''}
            ${company?.city ? `<p class="company-details">${company.city}, ${company.postalCode || ''}</p>` : ''}
            ${company?.vatNo ? `<p class="company-details">VAT No: ${company.vatNo}</p>` : ''}
            ${company?.registrationNo ? `<p class="company-details">Reg No: ${company.registrationNo}</p>` : ''}
          </div>
        </div>
        
        <h2>VAT Summary</h2>
        <table>
          <thead>
            <tr class="summary-header">
              <th>Category</th>
              <th class="text-right">Exclusive</th>
              <th class="text-right">VAT</th>
              <th class="text-right">Inclusive</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-blue"><td colspan="4" style="font-weight:bold;">OUTPUT VAT (Sales)</td></tr>
            <tr>
              <td style="padding-left:20px;">Standard Rate (15%)</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.vat)}</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.inclusive)}</td>
            </tr>
            <tr>
              <td style="padding-left:20px;">Zero Rate (0%)</td>
              <td class="text-right">${fmtAmt(zeroOutputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(0)}</td>
              <td class="text-right">${fmtAmt(zeroOutputTotals.inclusive)}</td>
            </tr>
            <tr class="total-output">
              <td>Total Output VAT</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.exclusive + zeroOutputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(totalOutputVAT)}</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.inclusive + zeroOutputTotals.inclusive)}</td>
            </tr>
            <tr class="section-orange"><td colspan="4" style="font-weight:bold;">INPUT VAT (Purchases)</td></tr>
            <tr>
              <td style="padding-left:20px;">Standard Rate (15%)</td>
              <td class="text-right">${fmtAmt(standardInputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(standardInputTotals.vat)}</td>
              <td class="text-right">${fmtAmt(standardInputTotals.inclusive)}</td>
            </tr>
            <tr>
              <td style="padding-left:20px;">Zero Rate (0%)</td>
              <td class="text-right">${fmtAmt(zeroInputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(0)}</td>
              <td class="text-right">${fmtAmt(zeroInputTotals.inclusive)}</td>
            </tr>
            <tr class="total-input">
              <td>Total Input VAT</td>
              <td class="text-right">${fmtAmt(standardInputTotals.exclusive + zeroInputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(totalInputVAT)}</td>
              <td class="text-right">${fmtAmt(standardInputTotals.inclusive + zeroInputTotals.inclusive)}</td>
            </tr>
            <tr class="${netVAT >= 0 ? 'net-payable' : 'net-refund'}">
              <td>${netVAT >= 0 ? 'VAT PAYABLE TO SARS' : 'VAT REFUNDABLE FROM SARS'}</td>
              <td></td>
              <td class="text-right" style="font-size:14px;">${fmtAmt(Math.abs(netVAT))}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-blue" style="padding:8px;margin-top:30px;">Standard Rate (15%) - OUTPUT VAT</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${generateTableRows(standardOutputTxns, true)}
            <tr class="subtotal-row">
              <td colspan="4" style="text-align:right;">Subtotal:</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.vat)}</td>
              <td class="text-right">${fmtAmt(standardOutputTotals.inclusive)}</td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-blue" style="padding:8px;">Zero Rate (0%) - OUTPUT VAT</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${generateTableRows(zeroOutputTxns, false)}
            <tr class="subtotal-row">
              <td colspan="4" style="text-align:right;">Subtotal:</td>
              <td class="text-right">${fmtAmt(zeroOutputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(zeroOutputTotals.inclusive)}</td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-orange" style="padding:8px;">Standard Rate (15%) - INPUT VAT</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${generateTableRows(standardInputTxns, true)}
            <tr class="subtotal-row">
              <td colspan="4" style="text-align:right;">Subtotal:</td>
              <td class="text-right">${fmtAmt(standardInputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(standardInputTotals.vat)}</td>
              <td class="text-right">${fmtAmt(standardInputTotals.inclusive)}</td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-orange" style="padding:8px;">Zero Rate (0%) - INPUT VAT</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${generateTableRows(zeroInputTxns, false)}
            <tr class="subtotal-row">
              <td colspan="4" style="text-align:right;">Subtotal:</td>
              <td class="text-right">${fmtAmt(zeroInputTotals.exclusive)}</td>
              <td class="text-right">${fmtAmt(zeroInputTotals.inclusive)}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top:30px;color:#6b7280;font-size:10px;">Generated on ${new Date().toLocaleDateString()} - Open this file in browser and press Ctrl+P to save as PDF</p>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const fileName = `VAT_Recon_${periodStart}_to_${periodEnd}.html`;
    setPdfDownloadLink({ url, name: fileName });
    setGenerating(false);
  };

  // Clear all
  const clearAll = () => {
    if (vatTransactions.length > 0) {
      saveVatTransactions([]);
      setSaveMessage('All transactions cleared');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Transaction Table Component
  // Transaction Row Component with local state for inputs
  const TransactionRow = ({ t, vatType }) => {
    const [localExcl, setLocalExcl] = useState(t.exclusive ?? '');
    const [localVat, setLocalVat] = useState(t.vat ?? '');
    const [localIncl, setLocalIncl] = useState(t.inclusive ?? '');

    // Sync local state when transaction changes from outside
    React.useEffect(() => {
      setLocalExcl(t.exclusive ?? '');
      setLocalVat(t.vat ?? '');
      setLocalIncl(t.inclusive ?? '');
    }, [t.id]);

    const handleExclBlur = () => {
      const excl = parseFloat(localExcl) || 0;
      const rate = getVATRate(t.vatRate);
      const vat = excl * rate;
      const incl = excl + vat;
      setLocalVat(vat.toFixed(2));
      setLocalIncl(incl.toFixed(2));
      saveVatTransactions(vatTransactions.map(tx => 
        tx.id === t.id ? { ...tx, exclusive: excl.toFixed(2), vat: vat.toFixed(2), inclusive: incl.toFixed(2) } : tx
      ));
    };

    const handleVatBlur = () => {
      const vat = parseFloat(localVat) || 0;
      const excl = parseFloat(localExcl) || 0;
      const incl = excl + vat;
      setLocalIncl(incl.toFixed(2));
      saveVatTransactions(vatTransactions.map(tx => 
        tx.id === t.id ? { ...tx, vat: vat.toFixed(2), inclusive: incl.toFixed(2) } : tx
      ));
    };

    const handleInclBlur = () => {
      const incl = parseFloat(localIncl) || 0;
      const rate = getVATRate(t.vatRate);
      const excl = rate > 0 ? incl / (1 + rate) : incl;
      const vat = incl - excl;
      setLocalExcl(excl.toFixed(2));
      setLocalVat(vat.toFixed(2));
      saveVatTransactions(vatTransactions.map(tx => 
        tx.id === t.id ? { ...tx, exclusive: excl.toFixed(2), vat: vat.toFixed(2), inclusive: incl.toFixed(2) } : tx
      ));
    };

    const handleVatRateChange = (newRate) => {
      const excl = parseFloat(localExcl) || 0;
      const rate = getVATRate(newRate);
      const vat = excl * rate;
      const incl = excl + vat;
      setLocalVat(vat.toFixed(2));
      setLocalIncl(incl.toFixed(2));
      saveVatTransactions(vatTransactions.map(tx => 
        tx.id === t.id ? { ...tx, vatRate: newRate, vat: vat.toFixed(2), inclusive: incl.toFixed(2) } : tx
      ));
    };

    return (
      <tr className="border-t hover:bg-slate-50">
        <td className="px-2 py-1">
          <input type="date" value={t.date} onChange={(e) => updateTransaction(t.id, 'date', e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full" />
        </td>
        <td className="px-2 py-1">
          <input type="text" value={t.reference || ''} onChange={(e) => updateTransaction(t.id, 'reference', e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full" placeholder="Ref" />
        </td>
        <td className="px-2 py-1">
          <select 
            value={t.account || ''} 
            onChange={(e) => updateTransaction(t.id, 'account', e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            <option value="">Select Account</option>
            {accounts.filter(a => a.active !== false).map(acc => (
              <option key={acc.id} value={acc.name}>{acc.name}</option>
            ))}
          </select>
        </td>
        <td className="px-2 py-1">
          <input type="text" value={t.description || ''} onChange={(e) => updateTransaction(t.id, 'description', e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full" placeholder="Description" />
        </td>
        <td className="px-2 py-1">
          <select 
            value={t.vatRate || 'Standard Rate (15.00%)'} 
            onChange={(e) => handleVatRateChange(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            {VAT_RATES.map(vat => <option key={vat.value} value={vat.value}>{vat.label}</option>)}
          </select>
        </td>
        <td className="px-2 py-1">
          <input 
            type="text" 
            value={localExcl} 
            onChange={(e) => setLocalExcl(e.target.value)}
            onBlur={handleExclBlur}
            className="border rounded px-2 py-1 text-sm w-full text-right" 
            placeholder="0.00"
          />
        </td>
        <td className="px-2 py-1">
          <input 
            type="text" 
            value={localVat} 
            onChange={(e) => setLocalVat(e.target.value)}
            onBlur={handleVatBlur}
            className="border rounded px-2 py-1 text-sm w-full text-right" 
            placeholder="0.00"
          />
        </td>
        <td className="px-2 py-1">
          <input 
            type="text" 
            value={localIncl} 
            onChange={(e) => setLocalIncl(e.target.value)}
            onBlur={handleInclBlur}
            className="border rounded px-2 py-1 text-sm w-full text-right" 
            placeholder="0.00"
          />
        </td>
        <td className="px-2 py-1">
          <button onClick={() => deleteTransaction(t.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  // Transaction Table Component with VAT Rate dropdown
  const TransactionTable = ({ transactions, title, bgColor, textColor, vatType }) => (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
      <div className={`p-4 ${bgColor} border-b flex justify-between items-center`}>
        <h3 className={`font-bold ${textColor}`}>{title}</h3>
        <button
          onClick={() => addTransaction(vatType)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm text-white ${vatType === 'output' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-3 py-2 font-bold text-slate-600 w-28">Date</th>
              <th className="text-left px-3 py-2 font-bold text-slate-600 w-24">Reference</th>
              <th className="text-left px-3 py-2 font-bold text-slate-600 w-28">Account</th>
              <th className="text-left px-3 py-2 font-bold text-slate-600">Description</th>
              <th className="text-left px-3 py-2 font-bold text-slate-600 w-48">VAT Rate</th>
              <th className="text-right px-3 py-2 font-bold text-slate-600 w-28">Exclusive</th>
              <th className="text-right px-3 py-2 font-bold text-slate-600 w-24">VAT</th>
              <th className="text-right px-3 py-2 font-bold text-slate-600 w-28">Inclusive</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? transactions.map(t => (
              <TransactionRow key={t.id} t={t} vatType={vatType} />
            )) : (
              <tr><td colSpan={9} className="text-center py-4 text-slate-500">No transactions</td></tr>
            )}
          </tbody>
          {transactions.length > 0 && (
            <tfoot className={`${bgColor} font-semibold`}>
              <tr>
                <td colSpan={5} className={`px-3 py-2 text-right ${textColor}`}>Subtotal:</td>
                <td className={`px-3 py-2 text-right ${textColor}`}>{formatAmount(calcTotals(transactions).exclusive)}</td>
                <td className={`px-3 py-2 text-right ${textColor}`}>{formatAmount(calcTotals(transactions).vat)}</td>
                <td className={`px-3 py-2 text-right ${textColor}`}>{formatAmount(calcTotals(transactions).inclusive)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">VAT Reconciliation</h2>
          <p className="text-sm text-slate-500">Import, edit and manage VAT transactions</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,.txt" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-slate-50 text-sm">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={clearAll} className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Period Selection and Download Buttons */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Period:</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generatePDFDownload}
              disabled={generating}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* PDF Download Link */}
      {pdfDownloadLink && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-red-600" />
              <div>
                <span className="text-red-800 font-medium">Your PDF report is ready!</span>
                <p className="text-xs text-red-600">Open the file in your browser and press Ctrl+P to save as PDF</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={pdfDownloadLink.url}
                download={pdfDownloadLink.name}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {pdfDownloadLink.name}
              </a>
              <button
                onClick={() => setPdfDownloadLink(null)}
                className="p-2 text-red-600 hover:bg-red-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Download Link */}
      {downloadLink && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Your Excel/CSV file is ready!</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={downloadLink.url}
                download={downloadLink.name}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloadLink.name}
              </a>
              <button
                onClick={() => setDownloadLink(null)}
                className="p-2 text-green-600 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saveMessage && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center text-sm font-medium">
          {saveMessage}
        </div>
      )}

      {/* VAT Summary Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 bg-emerald-50 border-b">
          <h3 className="font-semibold text-emerald-800">VAT Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Exclusive</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">VAT</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Inclusive</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t bg-blue-50">
                <td className="px-4 py-2 font-medium text-blue-800" colSpan={4}>OUTPUT VAT (Sales)</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 pl-8">Standard Rate (15%)</td>
                <td className="px-4 py-2 text-right">{formatAmount(standardOutputTotals.exclusive)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(standardOutputTotals.vat)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(standardOutputTotals.inclusive)}</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 pl-8">Zero Rate (0%)</td>
                <td className="px-4 py-2 text-right">{formatAmount(zeroOutputTotals.exclusive)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(0)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(zeroOutputTotals.inclusive)}</td>
              </tr>
              <tr className="border-t bg-blue-100 font-semibold">
                <td className="px-4 py-2 text-blue-800">Total Output VAT</td>
                <td className="px-4 py-2 text-right text-blue-800">{formatAmount(standardOutputTotals.exclusive + zeroOutputTotals.exclusive)}</td>
                <td className="px-4 py-2 text-right text-blue-800">{formatAmount(totalOutputVAT)}</td>
                <td className="px-4 py-2 text-right text-blue-800">{formatAmount(standardOutputTotals.inclusive + zeroOutputTotals.inclusive)}</td>
              </tr>
              <tr className="border-t bg-orange-50">
                <td className="px-4 py-2 font-medium text-orange-800" colSpan={4}>INPUT VAT (Purchases)</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 pl-8">Standard Rate (15%)</td>
                <td className="px-4 py-2 text-right">{formatAmount(standardInputTotals.exclusive)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(standardInputTotals.vat)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(standardInputTotals.inclusive)}</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 pl-8">Zero Rate (0%)</td>
                <td className="px-4 py-2 text-right">{formatAmount(zeroInputTotals.exclusive)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(0)}</td>
                <td className="px-4 py-2 text-right">{formatAmount(zeroInputTotals.inclusive)}</td>
              </tr>
              <tr className="border-t bg-orange-100 font-semibold">
                <td className="px-4 py-2 text-orange-800">Total Input VAT</td>
                <td className="px-4 py-2 text-right text-orange-800">{formatAmount(standardInputTotals.exclusive + zeroInputTotals.exclusive)}</td>
                <td className="px-4 py-2 text-right text-orange-800">{formatAmount(totalInputVAT)}</td>
                <td className="px-4 py-2 text-right text-orange-800">{formatAmount(standardInputTotals.inclusive + zeroInputTotals.inclusive)}</td>
              </tr>
              <tr className={`border-t-2 border-slate-300 ${netVAT >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <td className={`px-4 py-3 font-bold ${netVAT >= 0 ? 'text-red-800' : 'text-green-800'}`}>
                  {netVAT >= 0 ? 'VAT PAYABLE TO SARS' : 'VAT REFUNDABLE FROM SARS'}
                </td>
                <td className="px-4 py-3"></td>
                <td className={`px-4 py-3 text-right font-bold text-lg ${netVAT >= 0 ? 'text-red-800' : 'text-green-800'}`}>
                  {formatAmount(Math.abs(netVAT))}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Output VAT Transactions */}
      <TransactionTable 
        transactions={outputTransactions}
        title="OUTPUT VAT (Sales)"
        bgColor="bg-blue-50"
        textColor="text-blue-800"
        vatType="output"
      />

      {/* Input VAT Transactions */}
      <TransactionTable 
        transactions={inputTransactions}
        title="INPUT VAT (Purchases)"
        bgColor="bg-orange-50"
        textColor="text-orange-800"
        vatType="input"
      />

      {/* Import Instructions */}
      <div className="bg-slate-50 rounded-lg border p-4">
        <h4 className="font-medium text-slate-700 mb-2">CSV Import Format</h4>
        <p className="text-sm text-slate-600 mb-2">
          Your CSV should have: Date, Reference, Account, Description, Exclusive, VAT, Inclusive, VAT Type (output/input), VAT Rate
        </p>
        <p className="text-xs text-slate-500">
          Supported columns: date, reference, description, account, exclusive, vat, inclusive, vattype, vatrate
        </p>
      </div>
    </div>
  );
};

// ==================== REPORTS VIEW ====================
const ReportsView = ({ bankStatements, invoices, company }) => {
  const [reportType, setReportType] = useState('trial-balance');
  const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [downloadLink, setDownloadLink] = useState(null);
  const [pdfDownloadLink, setPdfDownloadLink] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [generating, setGenerating] = useState(false);

  const filterByDateRange = (items) => {
    return items.filter(item => {
      const itemDate = item.date || item.dueDate;
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const generateTrialBalance = () => {
    const filtered = filterByDateRange(bankStatements);
    const categories = {};
    
    filtered.forEach(stmt => {
      const cat = stmt.selection || 'Unallocated';
      if (!categories[cat]) categories[cat] = { debit: 0, credit: 0 };
      categories[cat].debit += stmt.spent || 0;
      categories[cat].credit += stmt.received || 0;
    });

    return Object.entries(categories).map(([name, values]) => ({
      name,
      debit: values.debit,
      credit: values.credit,
      balance: values.debit - values.credit
    }));
  };

  const generateVATReport = () => {
    const filteredStatements = filterByDateRange(bankStatements);
    const filteredInvoices = filterByDateRange(invoices);

    const vatData = {
      standardOutput: { vat: 0, transactions: [] },
      zeroOutput: { vat: 0, transactions: [] },
      standardInput: { vat: 0, transactions: [] },
      zeroInput: { vat: 0, transactions: [] }
    };

    // Helper to check if standard rate
    const isStdRate = (rate) => rate && (rate.includes('15.00%') || rate === 'Standard 15%' || rate.includes('15%'));

    // Process invoices (Output VAT)
    filteredInvoices.forEach(inv => {
      if (inv.items) {
        inv.items.forEach(item => {
          const exclusive = (item.qty || 0) * (item.price || 0);
          const vatRate = getVATRate(item.vatType);
          const vat = exclusive * vatRate;
          
          const txn = {
            date: inv.date,
            reference: inv.documentNo,
            account: inv.customer || 'Customer',
            description: item.description,
            exclusive,
            vat,
            inclusive: exclusive + vat
          };

          if (isStdRate(item.vatType)) {
            vatData.standardOutput.vat += vat;
            vatData.standardOutput.transactions.push(txn);
          } else {
            vatData.zeroOutput.transactions.push({ ...txn, vat: 0 });
          }
        });
      }
    });

    // Process bank statements (Input VAT)
    filteredStatements.forEach(stmt => {
      if (stmt.spent > 0) {
        const isStandard = isStdRate(stmt.vatRate);
        const rate = getVATRate(stmt.vatRate);
        const exclusive = rate > 0 ? stmt.spent / (1 + rate) : stmt.spent;
        const vat = rate > 0 ? stmt.spent - exclusive : 0;
        
        const txn = {
          date: stmt.date,
          reference: stmt.reference,
          account: stmt.payee || stmt.type,
          description: stmt.description,
          exclusive,
          vat,
          inclusive: stmt.spent
        };

        if (isStandard) {
          vatData.standardInput.vat += vat;
          vatData.standardInput.transactions.push(txn);
        } else {
          vatData.zeroInput.transactions.push({ ...txn, vat: 0 });
        }
      }
    });

    return vatData;
  };

  // Export to Excel (CSV format that Excel can open)
  const exportToExcel = () => {
    let csv = '';
    const formatAmount = (amt) => amt.toFixed(2);
    
    if (reportType === 'trial-balance') {
      const data = generateTrialBalance();
      csv = 'Trial Balance Report\n';
      csv += `Period: ${startDate} to ${endDate}\n\n`;
      csv += 'Account,Debit,Credit,Balance\n';
      data.forEach(row => {
        csv += `"${row.name}",${formatAmount(row.debit)},${formatAmount(row.credit)},${formatAmount(row.balance)}\n`;
      });
      csv += `\nTotal,${formatAmount(data.reduce((s, r) => s + r.debit, 0))},${formatAmount(data.reduce((s, r) => s + r.credit, 0))},${formatAmount(data.reduce((s, r) => s + r.balance, 0))}\n`;
    } else {
      const vatData = generateVATReport();
      csv = 'VAT Report\n';
      csv += `Period: ${startDate} to ${endDate}\n\n`;
      
      // VAT Summary
      const standardOutputVAT = vatData.standardOutput.vat;
      const standardOutputInclusive = vatData.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroOutputInclusive = vatData.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const standardInputVAT = vatData.standardInput.vat;
      const standardInputInclusive = vatData.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroInputInclusive = vatData.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      
      csv += 'VAT SUMMARY\n';
      csv += ',Output VAT (VAT),Output VAT (Inclusive),Input VAT (VAT),Input VAT (Inclusive),Net VAT,Net Inclusive\n';
      csv += `Standard Rate,${formatAmount(standardOutputVAT)},${formatAmount(standardOutputInclusive)},${formatAmount(standardInputVAT)},${formatAmount(standardInputInclusive)},${formatAmount(standardOutputVAT - standardInputVAT)},${formatAmount(standardOutputInclusive - standardInputInclusive)}\n`;
      csv += `Zero Rate,0.00,${formatAmount(zeroOutputInclusive)},0.00,${formatAmount(zeroInputInclusive)},0.00,${formatAmount(zeroOutputInclusive - zeroInputInclusive)}\n`;
      csv += `Grand Total,${formatAmount(standardOutputVAT)},${formatAmount(standardOutputInclusive + zeroOutputInclusive)},${formatAmount(standardInputVAT)},${formatAmount(standardInputInclusive + zeroInputInclusive)},${formatAmount(standardOutputVAT - standardInputVAT)},${formatAmount((standardOutputInclusive + zeroOutputInclusive) - (standardInputInclusive + zeroInputInclusive))}\n`;
      csv += `\nAmount Payable,${formatAmount(standardOutputVAT - standardInputVAT)}\n\n`;
      
      // Standard Output VAT
      csv += 'STANDARD RATE - OUTPUT VAT\n';
      csv += 'Date,Reference,Account,Description,Exclusive,VAT,Inclusive\n';
      vatData.standardOutput.transactions.forEach(t => {
        csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}",${formatAmount(t.exclusive)},${formatAmount(t.vat)},${formatAmount(t.inclusive)}\n`;
      });
      
      // Zero Output VAT
      csv += '\nZERO RATE - OUTPUT VAT\n';
      csv += 'Date,Reference,Account,Description,Exclusive,VAT,Inclusive\n';
      vatData.zeroOutput.transactions.forEach(t => {
        csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}",${formatAmount(t.exclusive)},${formatAmount(t.vat)},${formatAmount(t.inclusive)}\n`;
      });
      
      // Standard Input VAT
      csv += '\nSTANDARD RATE - INPUT VAT\n';
      csv += 'Date,Reference,Account,Description,Exclusive,VAT,Inclusive\n';
      vatData.standardInput.transactions.forEach(t => {
        csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}",${formatAmount(t.exclusive)},${formatAmount(t.vat)},${formatAmount(t.inclusive)}\n`;
      });
      
      // Zero Input VAT
      csv += '\nZERO RATE - INPUT VAT\n';
      csv += 'Date,Reference,Account,Description,Exclusive,VAT,Inclusive\n';
      vatData.zeroInput.transactions.forEach(t => {
        csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}",${formatAmount(t.exclusive)},${formatAmount(t.vat)},${formatAmount(t.inclusive)}\n`;
      });
    }
    
    const fileName = `${reportType === 'trial-balance' ? 'Trial_Balance' : 'VAT_Report'}_${startDate}_to_${endDate}.csv`;
    
    // Create blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Set the download link state to show the download button
    setDownloadLink({ url, name: fileName, type: 'excel' });
  };

  // Show Print View for PDF
  const exportToPDF = () => {
    setShowPrintView(true);
  };

  // Generate PDF as downloadable file
  const generatePDFDownload = () => {
    setGenerating(true);
    const formatAmount = (amt) => `R ${amt.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportType === 'trial-balance' ? 'Trial Balance' : 'VAT Report'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; padding: 30px; font-size: 11px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #059669; }
          .company-info { text-align: right; }
          .company-name { font-size: 18px; font-weight: bold; color: #1f2937; }
          .company-details { font-size: 11px; color: #6b7280; }
          .logo { max-width: 120px; max-height: 80px; object-fit: contain; }
          h1 { color: #059669; font-size: 22px; margin-bottom: 5px; }
          h2 { color: #374151; font-size: 14px; margin: 15px 0 8px 0; }
          .period { color: #6b7280; margin-bottom: 15px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #f1f5f9; padding: 8px 6px; text-align: left; border: 1px solid #d1d5db; font-weight: 600; font-size: 10px; }
          td { padding: 6px; border: 1px solid #d1d5db; font-size: 10px; }
          .text-right { text-align: right; }
          .total-row { background: #f1f5f9; font-weight: bold; }
          .section-header { background: #dbeafe; color: #1e40af; padding: 8px; font-weight: 600; font-size: 11px; border: 1px solid #93c5fd; }
          .section-header-green { background: #dcfce7; color: #166534; padding: 8px; font-weight: 600; font-size: 11px; border: 1px solid #86efac; }
          .positive { color: #059669; }
          .negative { color: #dc2626; }
          .summary-box { background: #f8fafc; border: 2px solid #059669; padding: 12px; margin: 15px 0; border-radius: 4px; }
          .payable-label { font-size: 14px; font-weight: bold; }
          .payable-amount { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            ${company?.logo ? `<img src="${company.logo}" class="logo" alt="Logo" />` : ''}
          </div>
          <div class="company-info">
            <p class="company-name">${company?.name || 'Company Name'}</p>
            ${company?.tradingName ? `<p class="company-details">Trading as: ${company.tradingName}</p>` : ''}
            ${company?.address ? `<p class="company-details">${company.address}</p>` : ''}
            ${company?.city ? `<p class="company-details">${company.city}, ${company.postalCode || ''}</p>` : ''}
            ${company?.vatNo ? `<p class="company-details">VAT No: ${company.vatNo}</p>` : ''}
            ${company?.registrationNo ? `<p class="company-details">Reg No: ${company.registrationNo}</p>` : ''}
          </div>
        </div>
    `;
    
    if (reportType === 'trial-balance') {
      const data = generateTrialBalance();
      const totalDebit = data.reduce((s, r) => s + r.debit, 0);
      const totalCredit = data.reduce((s, r) => s + r.credit, 0);
      const totalBalance = data.reduce((s, r) => s + r.balance, 0);
      
      htmlContent += `
        <h1>TRIAL BALANCE REPORT</h1>
        <p class="period">Period: ${startDate} to ${endDate}</p>
        <p class="period">Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th style="width: 50%">Account</th>
              <th class="text-right" style="width: 16%">Debit</th>
              <th class="text-right" style="width: 17%">Credit</th>
              <th class="text-right" style="width: 17%">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${row.name}</td>
                <td class="text-right">${formatAmount(row.debit)}</td>
                <td class="text-right">${formatAmount(row.credit)}</td>
                <td class="text-right ${row.balance >= 0 ? 'positive' : 'negative'}">${formatAmount(row.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td class="text-right"><strong>${formatAmount(totalDebit)}</strong></td>
              <td class="text-right"><strong>${formatAmount(totalCredit)}</strong></td>
              <td class="text-right ${totalBalance >= 0 ? 'positive' : 'negative'}"><strong>${formatAmount(totalBalance)}</strong></td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      const vatData = generateVATReport();
      const standardOutputVAT = vatData.standardOutput.vat;
      const standardOutputInclusive = vatData.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroOutputInclusive = vatData.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const standardInputVAT = vatData.standardInput.vat;
      const standardInputInclusive = vatData.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroInputInclusive = vatData.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const netVATCalc = standardOutputVAT - standardInputVAT;
      
      htmlContent += `
        <h1>VAT REPORT</h1>
        <p class="period">Period: ${startDate} to ${endDate}</p>
        <p class="period">Generated: ${new Date().toLocaleDateString()}</p>
        
        <h2>VAT SUMMARY</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th colspan="2" style="text-align: center; background: #dbeafe; color: #1e40af;">Output VAT</th>
              <th colspan="2" style="text-align: center; background: #dcfce7; color: #166534;">Input VAT</th>
              <th colspan="2" style="text-align: center; background: #f3f4f6;">Net VAT</th>
            </tr>
            <tr>
              <th></th>
              <th class="text-right">VAT</th>
              <th class="text-right">Inclusive</th>
              <th class="text-right">VAT</th>
              <th class="text-right">Inclusive</th>
              <th class="text-right">VAT</th>
              <th class="text-right">Inclusive</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Standard Rate</strong></td>
              <td class="text-right">${formatAmount(standardOutputVAT)}</td>
              <td class="text-right">${formatAmount(standardOutputInclusive)}</td>
              <td class="text-right">${formatAmount(standardInputVAT)}</td>
              <td class="text-right">${formatAmount(standardInputInclusive)}</td>
              <td class="text-right ${(standardOutputVAT - standardInputVAT) >= 0 ? 'negative' : 'positive'}">${formatAmount(standardOutputVAT - standardInputVAT)}</td>
              <td class="text-right">${formatAmount(standardOutputInclusive - standardInputInclusive)}</td>
            </tr>
            <tr>
              <td><strong>Zero Rate</strong></td>
              <td class="text-right">${formatAmount(0)}</td>
              <td class="text-right">${formatAmount(zeroOutputInclusive)}</td>
              <td class="text-right">${formatAmount(0)}</td>
              <td class="text-right">${formatAmount(zeroInputInclusive)}</td>
              <td class="text-right">${formatAmount(0)}</td>
              <td class="text-right">${formatAmount(zeroOutputInclusive - zeroInputInclusive)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>GRAND TOTAL</strong></td>
              <td class="text-right"><strong>${formatAmount(standardOutputVAT)}</strong></td>
              <td class="text-right"><strong>${formatAmount(standardOutputInclusive + zeroOutputInclusive)}</strong></td>
              <td class="text-right"><strong>${formatAmount(standardInputVAT)}</strong></td>
              <td class="text-right"><strong>${formatAmount(standardInputInclusive + zeroInputInclusive)}</strong></td>
              <td class="text-right ${netVATCalc >= 0 ? 'negative' : 'positive'}"><strong>${formatAmount(netVATCalc)}</strong></td>
              <td class="text-right"><strong>${formatAmount((standardOutputInclusive + zeroOutputInclusive) - (standardInputInclusive + zeroInputInclusive))}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary-box">
          <span class="payable-label">Amount Payable: </span>
          <span class="payable-amount ${netVATCalc >= 0 ? 'negative' : 'positive'}">${formatAmount(netVATCalc)}</span>
        </div>
        
        <div class="section-header">STANDARD RATE - OUTPUT VAT (15%)</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${vatData.standardOutput.transactions.length > 0 ? vatData.standardOutput.transactions.map(t => `
              <tr><td>${t.date}</td><td>${t.reference}</td><td>${t.account}</td><td>${t.description}</td><td class="text-right">${formatAmount(t.exclusive)}</td><td class="text-right">${formatAmount(t.vat)}</td><td class="text-right">${formatAmount(t.inclusive)}</td></tr>
            `).join('') : '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 15px;">No transactions</td></tr>'}
            ${vatData.standardOutput.transactions.length > 0 ? `<tr class="total-row"><td colspan="4"><strong>Subtotal</strong></td><td class="text-right"><strong>${formatAmount(vatData.standardOutput.transactions.reduce((s,t) => s + t.exclusive, 0))}</strong></td><td class="text-right"><strong>${formatAmount(vatData.standardOutput.vat)}</strong></td><td class="text-right"><strong>${formatAmount(vatData.standardOutput.transactions.reduce((s,t) => s + t.inclusive, 0))}</strong></td></tr>` : ''}
          </tbody>
        </table>
        
        <div class="section-header">ZERO RATE - OUTPUT VAT</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${vatData.zeroOutput.transactions.length > 0 ? vatData.zeroOutput.transactions.map(t => `
              <tr><td>${t.date}</td><td>${t.reference}</td><td>${t.account}</td><td>${t.description}</td><td class="text-right">${formatAmount(t.exclusive)}</td><td class="text-right">${formatAmount(t.vat)}</td><td class="text-right">${formatAmount(t.inclusive)}</td></tr>
            `).join('') : '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 15px;">No transactions</td></tr>'}
          </tbody>
        </table>
        
        <div class="section-header-green">STANDARD RATE - INPUT VAT (15%)</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${vatData.standardInput.transactions.length > 0 ? vatData.standardInput.transactions.map(t => `
              <tr><td>${t.date}</td><td>${t.reference}</td><td>${t.account}</td><td>${t.description}</td><td class="text-right">${formatAmount(t.exclusive)}</td><td class="text-right">${formatAmount(t.vat)}</td><td class="text-right">${formatAmount(t.inclusive)}</td></tr>
            `).join('') : '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 15px;">No transactions</td></tr>'}
            ${vatData.standardInput.transactions.length > 0 ? `<tr class="total-row"><td colspan="4"><strong>Subtotal</strong></td><td class="text-right"><strong>${formatAmount(vatData.standardInput.transactions.reduce((s,t) => s + t.exclusive, 0))}</strong></td><td class="text-right"><strong>${formatAmount(vatData.standardInput.vat)}</strong></td><td class="text-right"><strong>${formatAmount(vatData.standardInput.transactions.reduce((s,t) => s + t.inclusive, 0))}</strong></td></tr>` : ''}
          </tbody>
        </table>
        
        <div class="section-header-green">ZERO RATE - INPUT VAT</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            ${vatData.zeroInput.transactions.length > 0 ? vatData.zeroInput.transactions.map(t => `
              <tr><td>${t.date}</td><td>${t.reference}</td><td>${t.account}</td><td>${t.description}</td><td class="text-right">${formatAmount(t.exclusive)}</td><td class="text-right">${formatAmount(t.vat)}</td><td class="text-right">${formatAmount(t.inclusive)}</td></tr>
            `).join('') : '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 15px;">No transactions</td></tr>'}
          </tbody>
        </table>
      `;
    }
    
    htmlContent += `</body></html>`;
    
    // Create downloadable HTML file that can be opened and printed as PDF
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const fileName = `${reportType === 'trial-balance' ? 'Trial_Balance' : 'VAT_Report'}_${startDate}_to_${endDate}.html`;
    
    setPdfDownloadLink({ url, name: fileName });
    setGenerating(false);
  };

  const trialBalance = generateTrialBalance();
  const vatReport = generateVATReport();
  const totalOutputVAT = vatReport.standardOutput.vat + vatReport.zeroOutput.vat;
  const totalInputVAT = vatReport.standardInput.vat + vatReport.zeroInput.vat;
  const netVAT = totalOutputVAT - totalInputVAT;

  // Print View Component
  const PrintView = () => {
    const formatAmount = (amt) => `R ${amt.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
            <h3 className="font-semibold">Print / Save as PDF</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
              <button 
                onClick={() => setShowPrintView(false)} 
                className="p-2 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-8 print:p-4" id="print-content">
            {reportType === 'trial-balance' ? (
              <>
                <h1 className="text-2xl font-bold text-emerald-700 mb-1">TRIAL BALANCE</h1>
                <p className="text-slate-600 mb-6">Period: {startDate} to {endDate}</p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border px-4 py-2 text-left">Account</th>
                      <th className="border px-4 py-2 text-right">Debit</th>
                      <th className="border px-4 py-2 text-right">Credit</th>
                      <th className="border px-4 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border px-4 py-2">{row.name}</td>
                        <td className="border px-4 py-2 text-right">{formatAmount(row.debit)}</td>
                        <td className="border px-4 py-2 text-right">{formatAmount(row.credit)}</td>
                        <td className={`border px-4 py-2 text-right font-medium ${row.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatAmount(row.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td className="border px-4 py-2">Total</td>
                      <td className="border px-4 py-2 text-right">{formatAmount(trialBalance.reduce((s, r) => s + r.debit, 0))}</td>
                      <td className="border px-4 py-2 text-right">{formatAmount(trialBalance.reduce((s, r) => s + r.credit, 0))}</td>
                      <td className="border px-4 py-2 text-right">{formatAmount(trialBalance.reduce((s, r) => s + r.balance, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-emerald-700 mb-1">VAT REPORT</h1>
                <p className="text-slate-600 mb-6">Period: {startDate} to {endDate}</p>
                
                {/* VAT Summary */}
                {(() => {
                  const standardOutputVAT = vatReport.standardOutput.vat;
                  const standardOutputInclusive = vatReport.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const zeroOutputInclusive = vatReport.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const standardInputVAT = vatReport.standardInput.vat;
                  const standardInputInclusive = vatReport.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const zeroInputInclusive = vatReport.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const netVATCalc = standardOutputVAT - standardInputVAT;
                  
                  return (
                    <>
                      <h2 className="font-semibold text-lg mb-2">VAT Summary</h2>
                      <table className="w-full border-collapse mb-6 text-sm">
                        <thead>
                          <tr>
                            <th className="border px-3 py-2"></th>
                            <th colSpan={2} className="border px-3 py-2 bg-blue-100 text-blue-800">Output VAT</th>
                            <th colSpan={2} className="border px-3 py-2 bg-green-100 text-green-800">Input VAT</th>
                            <th colSpan={2} className="border px-3 py-2 bg-slate-100">Net VAT</th>
                          </tr>
                          <tr className="text-xs">
                            <th className="border px-3 py-1"></th>
                            <th className="border px-3 py-1 text-right">VAT</th>
                            <th className="border px-3 py-1 text-right">Inclusive</th>
                            <th className="border px-3 py-1 text-right">VAT</th>
                            <th className="border px-3 py-1 text-right">Inclusive</th>
                            <th className="border px-3 py-1 text-right">VAT</th>
                            <th className="border px-3 py-1 text-right">Inclusive</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border px-3 py-2 font-medium">Standard Rate</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardOutputVAT)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardOutputInclusive)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardInputVAT)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardInputInclusive)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardOutputVAT - standardInputVAT)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardOutputInclusive - standardInputInclusive)}</td>
                          </tr>
                          <tr>
                            <td className="border px-3 py-2 font-medium">Zero Rate</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(0)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(zeroOutputInclusive)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(0)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(zeroInputInclusive)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(0)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(zeroOutputInclusive - zeroInputInclusive)}</td>
                          </tr>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border px-3 py-2">Grand Total</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardOutputVAT)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardOutputInclusive + zeroOutputInclusive)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardInputVAT)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(standardInputInclusive + zeroInputInclusive)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(netVATCalc)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount((standardOutputInclusive + zeroOutputInclusive) - (standardInputInclusive + zeroInputInclusive))}</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div className="bg-slate-100 p-4 rounded mb-6">
                        <span className="font-semibold">Amount Payable: </span>
                        <span className={`text-xl font-bold ${netVATCalc >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatAmount(netVATCalc)}
                        </span>
                      </div>
                    </>
                  );
                })()}
                
                {/* Transaction Sections */}
                <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="bg-blue-100 text-blue-800 px-3 py-2 font-semibold">Standard Rate - Output VAT (15%)</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border px-2 py-1 text-left">Date</th>
                          <th className="border px-2 py-1 text-left">Reference</th>
                          <th className="border px-2 py-1 text-left">Account</th>
                          <th className="border px-2 py-1 text-left">Description</th>
                          <th className="border px-2 py-1 text-right">Exclusive</th>
                          <th className="border px-2 py-1 text-right">VAT</th>
                          <th className="border px-2 py-1 text-right">Inclusive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vatReport.standardOutput.transactions.length > 0 ? vatReport.standardOutput.transactions.map((t, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{t.date}</td>
                            <td className="border px-2 py-1">{t.reference}</td>
                            <td className="border px-2 py-1">{t.account}</td>
                            <td className="border px-2 py-1">{t.description}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.exclusive)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.vat)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.inclusive)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="border px-2 py-4 text-center text-slate-500">No transactions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="bg-blue-100 text-blue-800 px-3 py-2 font-semibold">Zero Rate - Output VAT</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border px-2 py-1 text-left">Date</th>
                          <th className="border px-2 py-1 text-left">Reference</th>
                          <th className="border px-2 py-1 text-left">Account</th>
                          <th className="border px-2 py-1 text-left">Description</th>
                          <th className="border px-2 py-1 text-right">Exclusive</th>
                          <th className="border px-2 py-1 text-right">VAT</th>
                          <th className="border px-2 py-1 text-right">Inclusive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vatReport.zeroOutput.transactions.length > 0 ? vatReport.zeroOutput.transactions.map((t, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{t.date}</td>
                            <td className="border px-2 py-1">{t.reference}</td>
                            <td className="border px-2 py-1">{t.account}</td>
                            <td className="border px-2 py-1">{t.description}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.exclusive)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.vat)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.inclusive)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="border px-2 py-4 text-center text-slate-500">No transactions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="bg-green-100 text-green-800 px-3 py-2 font-semibold">Standard Rate - Input VAT (15%)</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border px-2 py-1 text-left">Date</th>
                          <th className="border px-2 py-1 text-left">Reference</th>
                          <th className="border px-2 py-1 text-left">Account</th>
                          <th className="border px-2 py-1 text-left">Description</th>
                          <th className="border px-2 py-1 text-right">Exclusive</th>
                          <th className="border px-2 py-1 text-right">VAT</th>
                          <th className="border px-2 py-1 text-right">Inclusive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vatReport.standardInput.transactions.length > 0 ? vatReport.standardInput.transactions.map((t, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{t.date}</td>
                            <td className="border px-2 py-1">{t.reference}</td>
                            <td className="border px-2 py-1">{t.account}</td>
                            <td className="border px-2 py-1">{t.description}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.exclusive)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.vat)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.inclusive)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="border px-2 py-4 text-center text-slate-500">No transactions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="bg-green-100 text-green-800 px-3 py-2 font-semibold">Zero Rate - Input VAT</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border px-2 py-1 text-left">Date</th>
                          <th className="border px-2 py-1 text-left">Reference</th>
                          <th className="border px-2 py-1 text-left">Account</th>
                          <th className="border px-2 py-1 text-left">Description</th>
                          <th className="border px-2 py-1 text-right">Exclusive</th>
                          <th className="border px-2 py-1 text-right">VAT</th>
                          <th className="border px-2 py-1 text-right">Inclusive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vatReport.zeroInput.transactions.length > 0 ? vatReport.zeroInput.transactions.map((t, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{t.date}</td>
                            <td className="border px-2 py-1">{t.reference}</td>
                            <td className="border px-2 py-1">{t.account}</td>
                            <td className="border px-2 py-1">{t.description}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.exclusive)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.vat)}</td>
                            <td className="border px-2 py-1 text-right">{formatAmount(t.inclusive)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="border px-2 py-4 text-center text-slate-500">No transactions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const VATSection = ({ title, color, transactions, subtotal }) => (
    <div className="mb-6">
      <h4 className={`font-semibold px-3 py-2 ${color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} rounded-t`}>
        {title}
      </h4>
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-3 py-2">Date</th>
            <th className="text-left px-3 py-2">Reference</th>
            <th className="text-left px-3 py-2">Account</th>
            <th className="text-left px-3 py-2">Description</th>
            <th className="text-right px-3 py-2">Exclusive</th>
            <th className="text-right px-3 py-2">VAT</th>
            <th className="text-right px-3 py-2">Inclusive</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? transactions.map((txn, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-3 py-2">{txn.date}</td>
              <td className="px-3 py-2">{txn.reference}</td>
              <td className="px-3 py-2">{txn.account}</td>
              <td className="px-3 py-2">{txn.description}</td>
              <td className="px-3 py-2 text-right">R {txn.exclusive.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">R {txn.vat.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">R {txn.inclusive.toFixed(2)}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7} className="px-3 py-4 text-center text-slate-500">No transactions</td>
            </tr>
          )}
          <tr className="bg-slate-100 font-semibold">
            <td colSpan={4} className="px-3 py-2">Subtotal</td>
            <td className="px-3 py-2 text-right">R {transactions.reduce((s, t) => s + t.exclusive, 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">R {subtotal.toFixed(2)}</td>
            <td className="px-3 py-2 text-right">R {transactions.reduce((s, t) => s + t.inclusive, 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Reports</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="trial-balance">Trial Balance</option>
              <option value="vat">VAT Report</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        {/* Download Buttons */}
        <div className="flex gap-2 items-center">
          <button
            onClick={generatePDFDownload}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:bg-red-400"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Print Preview
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>
      
      {/* PDF Download Link Display */}
      {pdfDownloadLink && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-red-600" />
            <div>
              <span className="text-red-800 font-medium block">Your PDF report is ready!</span>
              <span className="text-red-600 text-sm">Download and open in browser, then use Print → Save as PDF</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfDownloadLink.url}
              download={pdfDownloadLink.name}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
            >
              Download Report
            </a>
            <button
              onClick={() => setPdfDownloadLink(null)}
              className="p-2 text-red-600 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Excel Download Link Display */}
      {downloadLink && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Your Excel/CSV file is ready!</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={downloadLink.url}
                download={downloadLink.name}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 inline-flex items-center gap-2"
                onClick={() => {
                  setTimeout(() => setDownloadLink(null), 1000);
                }}
              >
                <Download className="w-4 h-4" />
                Click to Download: {downloadLink.name}
              </a>
              <button
                onClick={() => setDownloadLink(null)}
                className="p-2 text-green-600 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Print View Modal */}
      {showPrintView && <PrintView />}

      {/* Trial Balance Report */}
      {reportType === 'trial-balance' && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold">Trial Balance</h3>
            <p className="text-sm text-slate-600">{startDate} to {endDate}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3">Account</th>
                <th className="text-right px-4 py-3">Debit</th>
                <th className="text-right px-4 py-3">Credit</th>
                <th className="text-right px-4 py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 text-right">R {row.debit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">R {row.credit.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${row.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R {row.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">R {trialBalance.reduce((s, r) => s + r.debit, 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">R {trialBalance.reduce((s, r) => s + r.credit, 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">R {trialBalance.reduce((s, r) => s + r.balance, 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* VAT Report */}
      {reportType === 'vat' && (
        <div className="space-y-6">
          {/* VAT Summary Table */}
          {(() => {
            // Calculate totals for summary
            const standardOutputVAT = vatReport.standardOutput.vat;
            const standardOutputInclusive = vatReport.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const zeroOutputVAT = 0;
            const zeroOutputInclusive = vatReport.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
            
            const standardInputVAT = vatReport.standardInput.vat;
            const standardInputInclusive = vatReport.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const zeroInputVAT = 0;
            const zeroInputInclusive = vatReport.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
            
            const standardNetVAT = standardOutputVAT - standardInputVAT;
            const standardNetInclusive = standardOutputInclusive - standardInputInclusive;
            const zeroNetVAT = 0;
            const zeroNetInclusive = zeroOutputInclusive - zeroInputInclusive;
            
            const grandTotalOutputVAT = standardOutputVAT + zeroOutputVAT;
            const grandTotalOutputInclusive = standardOutputInclusive + zeroOutputInclusive;
            const grandTotalInputVAT = standardInputVAT + zeroInputVAT;
            const grandTotalInputInclusive = standardInputInclusive + zeroInputInclusive;
            const grandTotalNetVAT = grandTotalOutputVAT - grandTotalInputVAT;
            const grandTotalNetInclusive = grandTotalOutputInclusive - grandTotalInputInclusive;

            const formatAmount = (amount) => {
              const formatted = Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return amount < 0 ? `R -${formatted}` : `R ${formatted}`;
            };

            return (
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-slate-700 to-slate-600">
                  <h3 className="font-semibold text-white">VAT Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="text-left px-4 py-3 font-medium text-slate-600 border-r"></th>
                        <th colSpan={2} className="text-center px-4 py-2 font-semibold text-blue-700 border-r bg-blue-50">
                          ----- Output VAT -----
                        </th>
                        <th colSpan={2} className="text-center px-4 py-2 font-semibold text-green-700 border-r bg-green-50">
                          ----- Input VAT -----
                        </th>
                        <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 bg-slate-50">
                          ----- Net VAT -----
                        </th>
                      </tr>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-4 py-2 font-medium text-slate-600 border-r"></th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600 bg-blue-50/50">VAT</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600 border-r bg-blue-50/50">Inclusive</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600 bg-green-50/50">VAT</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600 border-r bg-green-50/50">Inclusive</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">VAT</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">Inclusive</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700 border-r">Standard Rate</td>
                        <td className="px-4 py-3 text-right text-blue-700 bg-blue-50/30">{formatAmount(standardOutputVAT)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 border-r bg-blue-50/30">{formatAmount(standardOutputInclusive)}</td>
                        <td className="px-4 py-3 text-right text-green-700 bg-green-50/30">{formatAmount(standardInputVAT)}</td>
                        <td className="px-4 py-3 text-right text-green-700 border-r bg-green-50/30">{formatAmount(standardInputInclusive)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${standardNetVAT < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatAmount(standardNetVAT)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${standardNetInclusive < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatAmount(standardNetInclusive)}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700 border-r">Zero Rate</td>
                        <td className="px-4 py-3 text-right text-blue-700 bg-blue-50/30">{formatAmount(zeroOutputVAT)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 border-r bg-blue-50/30">{formatAmount(zeroOutputInclusive)}</td>
                        <td className="px-4 py-3 text-right text-green-700 bg-green-50/30">{formatAmount(zeroInputVAT)}</td>
                        <td className="px-4 py-3 text-right text-green-700 border-r bg-green-50/30">{formatAmount(zeroInputInclusive)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${zeroNetVAT < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatAmount(zeroNetVAT)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${zeroNetInclusive < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatAmount(zeroNetInclusive)}
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-4 py-3 text-slate-800 border-r">Grand Total</td>
                        <td className="px-4 py-3 text-right text-blue-800 bg-blue-100/50">{formatAmount(grandTotalOutputVAT)}</td>
                        <td className="px-4 py-3 text-right text-blue-800 border-r bg-blue-100/50">{formatAmount(grandTotalOutputInclusive)}</td>
                        <td className="px-4 py-3 text-right text-green-800 bg-green-100/50">{formatAmount(grandTotalInputVAT)}</td>
                        <td className="px-4 py-3 text-right text-green-800 border-r bg-green-100/50">{formatAmount(grandTotalInputInclusive)}</td>
                        <td className={`px-4 py-3 text-right ${grandTotalNetVAT < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {formatAmount(grandTotalNetVAT)}
                        </td>
                        <td className={`px-4 py-3 text-right ${grandTotalNetInclusive < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {formatAmount(grandTotalNetInclusive)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Amount Payable Section */}
                <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700">Amount Payable</span>
                    <span className={`text-2xl font-bold ${grandTotalNetVAT < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatAmount(grandTotalNetVAT)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Period:</span>
                    <span className="text-sm font-medium text-slate-800">{startDate} to {endDate}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VAT Sections */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <VATSection 
              title="Standard Rate - Output VAT (15%)" 
              color="blue"
              transactions={vatReport.standardOutput.transactions}
              subtotal={vatReport.standardOutput.vat}
            />
            <VATSection 
              title="Zero Rate - Output VAT" 
              color="blue"
              transactions={vatReport.zeroOutput.transactions}
              subtotal={0}
            />
            <VATSection 
              title="Standard Rate - Input VAT (15%)" 
              color="green"
              transactions={vatReport.standardInput.transactions}
              subtotal={vatReport.standardInput.vat}
            />
            <VATSection 
              title="Zero Rate - Input VAT" 
              color="green"
              transactions={vatReport.zeroInput.transactions}
              subtotal={0}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingDashboard;

