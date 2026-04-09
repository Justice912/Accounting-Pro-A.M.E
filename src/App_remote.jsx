import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, FileText, Users, Building2, Landmark, BarChart3, Plus, Trash2, Upload, Download, Printer, Mail, Eye, ChevronDown, AlertCircle, Check, X, Search, Calendar, ArrowRight, Calculator, Edit2, Save, Wallet, Shield, Filter, SortAsc, TrendingUp, DollarSign, Clock, Settings, Receipt } from 'lucide-react';
import AuditModule from './AuditModule';
import VATCapture from './pages/VATCapture';

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


// Default Banking Allocation Rules - seeded for every company
const DEFAULT_BANKING_RULES = [
  // === MOTOR VEHICLE EXPENSES ===
  { pattern: 'engen', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'sasol', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'shell', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'bp ', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'bp airport', accountName: 'Motor Vehicle Expenses', vatRate: 'Zero Rate (0.00%)', patternType: 'description' },
  { pattern: 'total knysna', accountName: 'Motor Vehicle Expenses', vatRate: 'Zero Rate (0.00%)', patternType: 'description' },
  { pattern: 'total fort beaufort', accountName: 'Motor Vehicle Expenses', vatRate: 'Zero Rate (0.00%)', patternType: 'description' },
  { pattern: 'astron energy', accountName: 'Motor Vehicle Expenses', vatRate: 'Zero Rate (0.00%)', patternType: 'description' },
  { pattern: 'fuel purchase', accountName: 'Motor Vehicle Expenses', vatRate: 'Zero Rate (0.00%)', patternType: 'description' },
  { pattern: 'tyre spot', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'cartrack', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'eastern cape motors', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'acsa', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'str parking', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'avis rent a car', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'gason', accountName: 'Motor Vehicle Expenses', vatRate: 'Zero Rate (0.00%)', patternType: 'description' },
  { pattern: 'off-us fuel', accountName: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === TRAVEL & ACCOMMODATION ===
  { pattern: 'dl bolt', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'bolt', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'payee' },
  { pattern: 'wesley guesthouse', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'lagoon beach', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'bkg*hotel', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'flysafair', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'accomodation', accountName: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === TELEPHONE & INTERNET ===
  { pattern: 'prepaid airtime', accountName: 'Telephone & Internet', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'cell cash withdrawal', accountName: 'Telephone & Internet', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === ENTERTAINMENT ===
  { pattern: 'steers', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'kfc', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'nandos', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'debonairs', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'mcd ', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'spur', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'liquorshop', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'colcacchio', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'grand west casino', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'table mountain', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'webtickets', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'hungry lion', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'social eatery', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'entry ninja', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'two oceans', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'cape point', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'cape ice skating', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'sportsmans warehous', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'jules on jarvis', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'uncle pauls', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'the windmill', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: '2 brothers pizz', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'karibu restaurant', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'tops ', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'karri main', accountName: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },

  // === COMPUTER EXPENSES ===
  { pattern: 'incredible connecti', accountName: 'Computer Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'adobe', accountName: 'Computer Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'hosting', accountName: 'Computer Expenses', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === PRINTING & STATIONERY ===
  { pattern: 'copyworld', accountName: 'Printing & Stationery', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'pollock', accountName: 'Printing & Stationery', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'fusion', accountName: 'Printing & Stationery', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'african book', accountName: 'Printing & Stationery', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === BANK CHARGES ===
  { pattern: 'bank charge', accountName: 'Bank Charges', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'monthly account fee', accountName: 'Bank Charges', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'service fees', accountName: 'Bank Charges', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === ELECTRICITY & WATER ===
  { pattern: 'electricity prepaid', accountName: 'Electricity & Water', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'prepaid electricity', accountName: 'Electricity & Water', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === GENERAL EXPENSES (Grocery/Retail) ===
  { pattern: 'checkers', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'woolworths', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'clicks', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'superspar', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'spar ', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'shoprite', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'pnp ', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'pick n pay', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'dischem', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'pharmacy', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'pep ', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'ackermans', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'econofoods', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },
  { pattern: 'gullsway supermarke', accountName: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)', patternType: 'description' },

  // === SECURITY ===
  { pattern: 'hartwig', accountName: 'Security', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === BANK LOANS ===
  { pattern: 'sasfin', accountName: 'Bank Loans', vatRate: 'No VAT', patternType: 'description' },

  // === RENT PAID ===
  { pattern: 'rent ', accountName: 'Rent Paid', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === ACCOUNTING FEES ===
  { pattern: 'ame accounting', accountName: 'Accounting Fees', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'vat admin service', accountName: 'Accounting Fees', vatRate: 'No VAT', patternType: 'description' },

  // === REPAIRS & MAINTENANCE ===
  { pattern: 'laptop fixing', accountName: 'Repairs & Maintenance', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },

  // === SALARIES & WAGES ===
  { pattern: 'salary', accountName: 'Salaries & Wages', vatRate: 'No VAT', patternType: 'description' },
  { pattern: 'wages', accountName: 'Salaries & Wages', vatRate: 'No VAT', patternType: 'description' },
  { pattern: 'helper wages', accountName: 'Salaries & Wages', vatRate: 'No VAT', patternType: 'description' },
  { pattern: 'rm nedabf', accountName: 'Salaries & Wages', vatRate: 'No VAT', patternType: 'description' },

  // === PURCHASES ===
  { pattern: 'electrical material', accountName: 'Purchases', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'makro', accountName: 'Purchases', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'build it', accountName: 'Purchases', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'vincent hardware', accountName: 'Purchases', vatRate: 'No VAT', patternType: 'description' },

  // === VAT PAYABLE ===
  { pattern: 'vat -', accountName: 'VAT Payable', vatRate: 'No VAT', patternType: 'description' },

  // === REVENUE (Income patterns) ===
  { pattern: 'magtape credit', accountName: 'Revenue', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'adt cash deposit', accountName: 'Revenue', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
  { pattern: 'investment deposit', accountName: 'Sales', vatRate: 'Standard Rate (15.00%)', patternType: 'description' },
];

// Helper to generate default banking rules for a specific company
const generateDefaultRulesForCompany = (companyId) => {
  return DEFAULT_BANKING_RULES.map((rule, index) => ({
    id: `default_${companyId}_${index}_${Math.random().toString(36).substr(2, 9)}`,
    pattern: rule.pattern,
    patternType: rule.patternType,
    accountName: rule.accountName,
    vatRate: rule.vatRate,
    confidenceScore: 5,
    timesMatched: 0,
    lastUsed: '',
    companyId: companyId,
    source: 'default'
  }));
};

const getCompanyInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'CO';
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
};

// ==================== MAIN APP ====================
const AccountingDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [customers, setCustomers] = useState([]);
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
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);

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

      const [invRes, clientRes, customerRes, suppRes, bankRes, vatRes, accRes, empRes, payRes] = await Promise.all([
        Promise.resolve({ value: localStorage.getItem('accounting-invoices') }),
        Promise.resolve({ value: localStorage.getItem('accounting-clients') }),
        Promise.resolve({ value: localStorage.getItem('accounting-customers') }),
        Promise.resolve({ value: localStorage.getItem('accounting-suppliers') }),
        Promise.resolve({ value: localStorage.getItem('accounting-bank-statements') }),
        Promise.resolve({ value: localStorage.getItem('accounting-vat-transactions') }),
        Promise.resolve({ value: localStorage.getItem('accounting-accounts') }),
        Promise.resolve({ value: localStorage.getItem('accounting-employees') }),
        Promise.resolve({ value: localStorage.getItem('accounting-payslips') }),
      ]);

      if (invRes?.value) setInvoices(JSON.parse(invRes.value));
      if (clientRes?.value) setClients(JSON.parse(clientRes.value));
      if (customerRes?.value) setCustomers(JSON.parse(customerRes.value));
      if (suppRes?.value) setSuppliers(JSON.parse(suppRes.value));
      if (bankRes?.value) setBankStatements(JSON.parse(bankRes.value));
      if (vatRes?.value) setVatTransactions(JSON.parse(vatRes.value));
      if (empRes?.value) setEmployees(JSON.parse(empRes.value));
      if (payRes?.value) setPayslips(JSON.parse(payRes.value));

      // Load API key
      const savedApiKey = localStorage.getItem('anthropic-api-key');
      if (savedApiKey) setApiKey(savedApiKey);
      
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
        localStorage.setItem('accounting-accounts', JSON.stringify(DEFAULT_ACCOUNTS));
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

  const saveCustomers = async (data) => {
    setCustomers(data);
    localStorage.setItem('accounting-customers', JSON.stringify(data));
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

  const saveEmployees = (data) => {
    setEmployees(data);
    localStorage.setItem('accounting-employees', JSON.stringify(data));
  };

  const savePayslips = (data) => {
    setPayslips(data);
    localStorage.setItem('accounting-payslips', JSON.stringify(data));
  };

  // Calculate totals - filtered by active company
  const activeCompanyStatements = activeCompanyId ? bankStatements.filter(s => s.companyId === activeCompanyId) : bankStatements;
  const activeCompanyInvoices = activeCompanyId ? invoices.filter(inv => inv.companyId === activeCompanyId) : invoices;
  const totalIncome = activeCompanyStatements.reduce((sum, s) => sum + (s.received || 0), 0);
  const totalExpenses = activeCompanyStatements.reduce((sum, s) => sum + (s.spent || 0), 0);
  const totalProfit = totalIncome - totalExpenses;
  const pendingInvoices = activeCompanyInvoices.filter(inv => inv.status === 'Pending').length;
  const unallocatedCount = activeCompanyStatements.filter(s => s.selection === 'Unallocated Expen').length;


  useEffect(() => {
    if (!clients.length) {
      setActiveCompanyId(null);
      setShowClientForm(true);
      return;
    }

    const currentCompanyExists = clients.some(c => c.id === activeCompanyId);
    if (!activeCompanyId || !currentCompanyExists) {
      setActiveCompanyId(clients[0].id);
    }

    if (clients.length === 1) {
      const only = clients[0];
      const defaultLike = !only.name || only.name.toLowerCase().includes('default');
      if (defaultLike) {
        setShowClientForm(true);
      }
    }
  }, [clients, activeCompanyId]);

  const activeCompany = clients.find(c => c.id === activeCompanyId) || clients[0] || null;

  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'customers', label: 'Customers', icon: FileText },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'companies', label: 'Companies', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'banking', label: 'Banking', icon: Landmark },
    { id: 'vatcapture', label: 'VAT Capture', icon: Receipt },
    { id: 'vatrecon', label: 'VAT Recon', icon: Calculator },
    { id: 'forecast', label: 'Cash Flow', icon: TrendingUp },
    { id: 'payroll', label: 'Payroll', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'audit', label: 'Audit Module', icon: Shield }
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight">Accounting Pro</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowClientSelector(prev => !prev)}
                className="flex items-center gap-3 bg-white/15 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 min-w-64"
              >
                {activeCompany?.logo ? (
                  <img src={activeCompany.logo} alt={activeCompany?.name} className="w-9 h-9 rounded-md object-cover border border-white/30" />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold">
                    {getCompanyInitials(activeCompany?.name)}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <p className="text-xs text-emerald-100">Client Selector</p>
                  <p className="font-medium text-sm truncate max-w-36">{activeCompany?.name || 'Select company'}</p>
                </div>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
              {showClientSelector && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-lg shadow-xl border z-50">
                  <div className="max-h-72 overflow-y-auto p-1">
                    {clients.map(company => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setActiveCompanyId(company.id);
                          setShowClientSelector(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 ${company.id === activeCompany?.id ? 'bg-emerald-50' : ''}`}
                      >
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-9 h-9 rounded-md object-cover border" />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                            {getCompanyInitials(company.name)}
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium text-sm">{company.name || 'Unnamed Company'}</p>
                          <p className="text-xs text-slate-500">{company.email || 'No email set'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowClientSelector(false); setActiveTab('companies'); }}
                    className="w-full text-left px-3 py-2.5 border-t text-sm text-emerald-700 hover:bg-emerald-50"
                  >
                    Manage Companies
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setActiveTab('companies')} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm hover:bg-white/20">Manage</button>
            <button onClick={() => { setShowClientForm(true); setActiveTab('companies'); }} className="px-3 py-2 rounded-lg bg-white text-emerald-700 text-sm font-semibold hover:bg-emerald-50">Add</button>
            <div className="relative">
              <button
                onClick={() => setShowApiKeyInput(prev => !prev)}
                className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1.5 ${apiKey ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100' : 'bg-red-500/20 border-red-300/40 text-red-100'}`}
                title={apiKey ? 'API Key configured' : 'API Key not set - AI features will not work'}
              >
                <Settings className="w-4 h-4" />
                AI {apiKey ? 'On' : 'Off'}
              </button>
              {showApiKeyInput && (
                <div className="absolute right-0 mt-2 w-96 bg-white text-slate-800 rounded-lg shadow-xl border z-50 p-4">
                  <h3 className="font-semibold text-sm mb-1">Claude API Key</h3>
                  <p className="text-xs text-slate-500 mb-3">Required for AI-powered features (bank statement extraction, transaction allocation). Get your key from <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-emerald-600 underline">console.anthropic.com</a></p>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full border rounded px-3 py-2 text-sm mb-2 font-mono"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setApiKey('');
                        localStorage.removeItem('anthropic-api-key');
                        setShowApiKeyInput(false);
                      }}
                      className="px-3 py-1.5 text-xs border rounded hover:bg-slate-50 text-red-600"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('anthropic-api-key', apiKey);
                        setShowApiKeyInput(false);
                      }}
                      className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
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
      {activeTab === 'audit' && <AuditModule />}
      <main className={`max-w-7xl mx-auto px-4 py-6 ${activeTab === 'audit' ? 'hidden' : ''}`}>
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
            customers={customers}
            saveCustomers={saveCustomers}
            showInvoiceForm={showInvoiceForm}
            setShowInvoiceForm={setShowInvoiceForm}
            showPrintPreview={showPrintPreview}
            setShowPrintPreview={setShowPrintPreview}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            company={activeCompany}
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
            company={activeCompany}
            apiKey={apiKey}
          />
        )}
        {activeTab === 'companies' && (
          <CompaniesView 
            clients={clients}
            saveClients={saveClients}
            showClientForm={showClientForm}
            setShowClientForm={setShowClientForm}
            setActiveCompanyId={setActiveCompanyId}
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
            company={activeCompany}
            apiKey={apiKey}
          />
        )}
        {activeTab === 'vatrecon' && (
          <VATReconView 
            vatTransactions={vatTransactions}
            saveVatTransactions={saveVatTransactions}
            company={activeCompany}
            accounts={accounts}
          />
        )}
        {activeTab === 'vatcapture' && (
          <VATCapture />
        )}
        {activeTab === 'forecast' && (
          <CashFlowForecastView
            invoices={invoices}
            bankStatements={bankStatements}
            company={activeCompany}
          />
        )}
        {activeTab === 'payroll' && (
          <PayrollView
            employees={employees}
            saveEmployees={saveEmployees}
            payslips={payslips}
            savePayslips={savePayslips}
            company={activeCompany}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsView
            bankStatements={bankStatements}
            invoices={invoices}
            company={activeCompany}
            accounts={accounts}
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

// ==================== CUSTOMER STATEMENTS SUB-VIEW ====================
const CustomerStatements = ({ invoices, customers, company }) => {
  const clientInvoices = invoices.filter(inv => inv.invoiceType !== 'supplier' && inv.companyId === company?.id);
  const initToday = new Date();
  const firstOfMonth = new Date(initToday.getFullYear(), initToday.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = initToday.toISOString().split('T')[0];

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);

  // Unique customers from invoices + clients list
  const customerNames = Array.from(new Set([
    ...customers.map(c => c.name),
    ...clientInvoices.map(inv => inv.customer).filter(Boolean)
  ])).sort();

  // Build statement transactions for selected customer in date range
  const buildStatement = () => {
    if (!selectedCustomer) return { transactions: [], aging: null, openingBalance: 0, closingBalance: 0 };

    const today = new Date(); // Fresh date each time statement is built
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    // All invoices for this customer (for aging — not date filtered)
    const allCustomerInvoices = clientInvoices.filter(inv => inv.customer === selectedCustomer);

    // Invoices before the period start (opening balance = unpaid amounts)
    const beforePeriod = allCustomerInvoices.filter(inv => new Date(inv.date) < from);
    const openingBalance = beforePeriod.reduce((sum, inv) => {
      if (inv.status === 'Paid') return sum;
      return sum + (inv.amount || 0);
    }, 0);

    // Transactions within the date range
    const periodInvoices = allCustomerInvoices.filter(inv => {
      const d = new Date(inv.date);
      return d >= from && d <= to;
    });

    // Sort by date, then by status (unpaid before paid) for correct running balance
    const sorted = [...periodInvoices].sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      // Within same date, show invoices (debits) before payments (credits)
      if (a.status === 'Paid' && b.status !== 'Paid') return 1;
      if (a.status !== 'Paid' && b.status === 'Paid') return -1;
      return 0;
    });

    // Build transactions: each invoice is a debit (amount owed).
    // Paid invoices also generate a credit (payment received).
    // This correctly reflects the double-entry nature of the statement.
    let runningBalance = openingBalance;
    const transactions = [];
    sorted.forEach(inv => {
      const amt = inv.amount || 0;
      // Every invoice is a debit (charge to customer)
      runningBalance += amt;
      transactions.push({
        date: inv.date,
        description: `Invoice ${inv.documentNo}${inv.customerRef ? ` (Ref: ${inv.customerRef})` : ''}`,
        invoiceNo: inv.documentNo,
        status: inv.status,
        debit: amt,
        credit: 0,
        balance: runningBalance,
        dueDate: inv.dueDate,
      });
      // If paid, also show the payment as a separate credit line
      if (inv.status === 'Paid') {
        runningBalance -= amt;
        transactions.push({
          date: inv.date,
          description: `Payment - Invoice ${inv.documentNo}`,
          invoiceNo: inv.documentNo,
          status: 'Paid',
          debit: 0,
          credit: amt,
          balance: runningBalance,
          dueDate: inv.dueDate,
        });
      }
    });

    // Aging buckets — based on ALL unpaid invoices vs today
    // Standard accounting: Current, 1-30, 31-60, 61-90, 90+
    const unpaid = allCustomerInvoices.filter(inv => inv.status !== 'Paid');
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, days90plus: 0 };
    unpaid.forEach(inv => {
      const due = new Date(inv.dueDate || inv.date);
      const diffMs = today - due;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const amt = inv.amount || 0;
      if (diffDays <= 0) aging.current += amt;
      else if (diffDays <= 30) aging.days30 += amt;
      else if (diffDays <= 60) aging.days60 += amt;
      else if (diffDays <= 90) aging.days90 += amt;
      else aging.days90plus += amt;
    });

    const closingBalance = runningBalance;
    return { transactions, aging, openingBalance, closingBalance };
  };

  const { transactions, aging, openingBalance, closingBalance } = buildStatement();

  const fmt = (n) => `R ${(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrintStatement = () => {
    if (!selectedCustomer) return;
    const clientInfo = customers.find(c => c.name === selectedCustomer);

    const agingHtml = aging ? `
      <div class="aging">
        <h3>Aging Analysis</h3>
        <table>
          <thead><tr><th>Current</th><th>1-30 Days</th><th>31-60 Days</th><th>61-90 Days</th><th>90+ Days</th><th>Total Outstanding</th></tr></thead>
          <tbody>
            <tr>
              <td>R ${aging.current.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
              <td>R ${aging.days30.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
              <td>R ${aging.days60.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
              <td>R ${aging.days90.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
              <td>R ${aging.days90plus.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
              <td><strong>R ${(aging.current + aging.days30 + aging.days60 + aging.days90 + aging.days90plus).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : '';

    const printContent = `
      <html>
      <head><title>Statement - ${selectedCustomer}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; font-size: 13px; color: #1e293b; }
        h1 { color: #064e3b; margin-bottom: 4px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #064e3b; padding-bottom: 16px; }
        .company-name { font-size: 20px; font-weight: bold; }
        .meta { font-size: 12px; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #ecfdf5; text-align: left; padding: 8px; border: 1px solid #d1fae5; font-size: 12px; }
        td { padding: 7px 8px; border: 1px solid #e2e8f0; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .summary { margin-top: 20px; display: flex; justify-content: flex-end; }
        .summary-box { border: 2px solid #064e3b; padding: 12px 20px; min-width: 260px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .summary-total { border-top: 2px solid #064e3b; margin-top: 8px; padding-top: 8px; font-size: 15px; font-weight: bold; }
        .aging { margin-top: 30px; }
        .aging h3 { color: #064e3b; }
        .status-paid { color: #047857; }
        .status-overdue { color: #dc2626; }
        .status-pending { color: #d97706; }
        @media print { body { padding: 20px; } }
      </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${company?.name || 'Your Company'}</div>
            ${company?.vatNo ? `<div class="meta">VAT No: ${company.vatNo}</div>` : ''}
            ${company?.address ? `<div class="meta">${company.address}</div>` : ''}
            ${company?.phone ? `<div class="meta">Tel: ${company.phone}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <h1>CUSTOMER STATEMENT</h1>
            <div class="meta">Period: ${dateFrom} to ${dateTo}</div>
            <div class="meta">Printed: ${new Date().toLocaleDateString('en-ZA')}</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <strong>Customer:</strong> ${selectedCustomer}<br/>
          ${clientInfo?.email ? `<span class="meta">Email: ${clientInfo.email}</span>` : ''}
          ${clientInfo?.phone ? ` &nbsp; Phone: ${clientInfo.phone}` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Status</th>
              <th class="text-right">Debit (Invoiced)</th>
              <th class="text-right">Credit (Paid)</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${dateFrom}</td>
              <td>Opening Balance</td>
              <td></td>
              <td class="text-right"></td>
              <td class="text-right"></td>
              <td class="text-right bold">R ${openingBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
            </tr>
            ${transactions.map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.description}</td>
                <td class="${t.status === 'Paid' ? 'status-paid' : t.status === 'Overdue' ? 'status-overdue' : 'status-pending'}">${t.status}</td>
                <td class="text-right">${t.debit > 0 ? 'R ' + t.debit.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : ''}</td>
                <td class="text-right">${t.credit > 0 ? 'R ' + t.credit.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : ''}</td>
                <td class="text-right bold">R ${t.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row"><span>Opening Balance:</span><span>R ${openingBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div class="summary-row"><span>Total Invoiced:</span><span>R ${transactions.reduce((s, t) => s + t.debit, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div class="summary-row"><span>Total Payments:</span><span>R ${transactions.reduce((s, t) => s + t.credit, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div class="summary-row summary-total"><span>Closing Balance:</span><span>R ${closingBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>

        ${agingHtml}
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const totalOutstanding = aging ? (aging.current + aging.days30 + aging.days60 + aging.days90 + aging.days90plus) : 0;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer</label>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">-- Select Customer --</option>
              {customerNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePrintStatement}
              disabled={!selectedCustomer}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> Print Statement
            </button>
          </div>
        </div>
      </div>

      {!selectedCustomer ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <Users className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select a customer to view their statement</p>
          <p className="text-sm text-slate-400 mt-1">Choose a customer from the dropdown above</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Opening Balance</p>
              <p className="text-lg font-bold text-slate-800">{fmt(openingBalance)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Period Invoiced</p>
              <p className="text-lg font-bold text-blue-600">{fmt(transactions.reduce((s, t) => s + t.debit, 0))}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Period Payments</p>
              <p className="text-lg font-bold text-emerald-600">{fmt(transactions.reduce((s, t) => s + t.credit, 0))}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
              <p className="text-xs text-emerald-700 font-medium mb-1">Closing Balance</p>
              <p className="text-lg font-bold text-emerald-800">{fmt(closingBalance)}</p>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b">
              <h3 className="font-semibold text-slate-700 text-sm">
                Transaction History — {selectedCustomer}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{dateFrom} to {dateTo}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50 border-b">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Debit (Invoiced)</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Credit (Paid)</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="border-b bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{dateFrom}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-600 text-xs">Opening Balance</td>
                    <td className="px-4 py-2.5"></td>
                    <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">—</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{fmt(openingBalance)}</td>
                  </tr>

                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-slate-600 text-xs whitespace-nowrap">{t.date}</td>
                        <td className="px-4 py-2.5 text-slate-800">{t.description}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                            t.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-700 font-medium">
                          {t.debit > 0 ? fmt(t.debit) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">
                          {t.credit > 0 ? fmt(t.credit) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(t.balance)}</td>
                      </tr>
                    ))
                  )}

                  {/* Closing balance row */}
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                    <td className="px-4 py-3 text-emerald-800 font-bold text-xs" colSpan={2}>Closing Balance</td>
                    <td></td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">
                      {fmt(transactions.reduce((s, t) => s + t.debit, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {fmt(transactions.reduce((s, t) => s + t.credit, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-800 text-base">{fmt(closingBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Aging Analysis */}
          {aging && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-700 text-sm">Aging Analysis — Outstanding Invoices</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-center">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Current</p>
                  <p className="text-base font-bold text-emerald-800">{fmt(aging.current)}</p>
                  <p className="text-xs text-emerald-500">Not yet due</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                  <p className="text-xs font-medium text-amber-600 mb-1">1-30 Days</p>
                  <p className="text-base font-bold text-amber-800">{fmt(aging.days30)}</p>
                  <p className="text-xs text-amber-500">Overdue 1-30d</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                  <p className="text-xs font-medium text-orange-600 mb-1">31-60 Days</p>
                  <p className="text-base font-bold text-orange-800">{fmt(aging.days60)}</p>
                  <p className="text-xs text-orange-500">Overdue 31-60d</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
                  <p className="text-xs font-medium text-red-600 mb-1">61-90 Days</p>
                  <p className="text-base font-bold text-red-800">{fmt(aging.days90)}</p>
                  <p className="text-xs text-red-500">Overdue 61-90d</p>
                </div>
                <div className="bg-red-100 rounded-lg p-3 border border-red-300 text-center">
                  <p className="text-xs font-medium text-red-700 mb-1">90+ Days</p>
                  <p className="text-base font-bold text-red-900">{fmt(aging.days90plus)}</p>
                  <p className="text-xs text-red-600">Severely overdue</p>
                </div>
                <div className="bg-slate-100 rounded-lg p-3 border border-slate-300 text-center">
                  <p className="text-xs font-medium text-slate-600 mb-1">Total Outstanding</p>
                  <p className="text-base font-bold text-slate-800">{fmt(totalOutstanding)}</p>
                  <p className="text-xs text-slate-500">All unpaid</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ==================== CUSTOMERS VIEW (Client Invoices) ====================
const CustomersView = ({ invoices, saveInvoices, customers, saveCustomers, showInvoiceForm, setShowInvoiceForm, showPrintPreview, setShowPrintPreview, selectedInvoice, setSelectedInvoice, company }) => {
  // Filter to only show customer invoices for selected company
  const companyCustomers = customers.filter(c => c.companyId === company?.id);
  const clientInvoices = invoices.filter(inv => inv.invoiceType !== 'supplier' && inv.companyId === company?.id);

  // Sub-tab: 'invoices' | 'statements' | 'directory'
  const [activeSubTab, setActiveSubTab] = useState('invoices');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    companyName: '',
    vatNo: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const [newInvoice, setNewInvoice] = useState({
    customer: '',
    documentNo: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerRef: '',
    customerDetails: null,
    deliveryAddress: ['', '', '', '', ''],
    postalAddress: ['', '', '', '', '', ''],
    discountType: 'amount',
    discountValue: 0,
    paymentTerms: 'Due on receipt',
    notes: '',
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
    let subtotalBeforeInvoiceDiscount = 0;
    let totalVatBeforeInvoiceDiscount = 0;
    let itemDiscountTotal = 0;

    newInvoice.items.forEach(item => {
      const calc = calculateItemTotals(item);
      subtotalBeforeInvoiceDiscount += calc.afterDiscount;
      totalVatBeforeInvoiceDiscount += calc.vat;
      itemDiscountTotal += calc.discount;
    });

    const rawInvoiceDiscount = newInvoice.discountType === 'percent'
      ? subtotalBeforeInvoiceDiscount * ((newInvoice.discountValue || 0) / 100)
      : (newInvoice.discountValue || 0);

    const invoiceDiscount = Math.min(Math.max(rawInvoiceDiscount, 0), subtotalBeforeInvoiceDiscount);
    const discountRatio = subtotalBeforeInvoiceDiscount > 0 ? invoiceDiscount / subtotalBeforeInvoiceDiscount : 0;
    const subtotal = subtotalBeforeInvoiceDiscount - invoiceDiscount;
    const totalVat = totalVatBeforeInvoiceDiscount * (1 - discountRatio);

    return {
      subtotal,
      subtotalBeforeInvoiceDiscount,
      totalVat,
      totalDiscount: itemDiscountTotal,
      invoiceDiscount,
      grandTotal: subtotal + totalVat
    };
  };

  const handleSaveInvoice = () => {
    if (!newInvoice.customer) return;

    const totals = invoiceTotals();
    const invoice = {
      id: Date.now(),
      ...newInvoice,
      companyId: company?.id,
      amount: totals.grandTotal,
      subtotal: totals.subtotal,
      vat: totals.totalVat,
      discount: totals.totalDiscount,
      invoiceDiscount: totals.invoiceDiscount
    };
    saveInvoices([...invoices, invoice]);
    setShowInvoiceForm(false);
    setNewInvoice({
      customer: '',
      documentNo: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerRef: '',
      customerDetails: null,
      deliveryAddress: ['', '', '', '', ''],
      postalAddress: ['', '', '', '', '', ''],
      discountType: 'amount',
      discountValue: 0,
      paymentTerms: 'Due on receipt',
      notes: '',
      items: [{ id: 1, type: 'Item', description: '', unit: '', qty: 1, price: 0, vatType: 'Standard Rate (15.00%)', discPercent: 0 }],
      status: 'Pending'
    });
  };

  const handleSaveCustomer = () => {
    if (!newCustomer.name.trim() || !company?.id) return;

    const customer = {
      id: Date.now(),
      companyId: company.id,
      name: newCustomer.name.trim(),
      companyName: newCustomer.companyName.trim(),
      vatNo: newCustomer.vatNo.trim(),
      contactPerson: newCustomer.contactPerson.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone.trim(),
      address: newCustomer.address.trim(),
      city: newCustomer.city.trim(),
      postalCode: newCustomer.postalCode.trim()
    };

    saveCustomers([...customers, customer]);
    setNewCustomer({
      name: '',
      companyName: '',
      vatNo: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: ''
    });
  };

  const handleCustomerSelect = (customerName) => {
    const selected = companyCustomers.find(c => c.name === customerName);
    setNewInvoice(prev => ({
      ...prev,
      customer: customerName,
      customerDetails: selected ? {
        companyName: selected.companyName,
        vatNo: selected.vatNo,
        contactPerson: selected.contactPerson,
        email: selected.email,
        phone: selected.phone,
        address: selected.address,
        city: selected.city,
        postalCode: selected.postalCode
      } : null
    }));
  };

  const markAsPaid = (id) => {
    saveInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv));
  };

  const deleteInvoice = (id) => {
    saveInvoices(invoices.filter(inv => inv.id !== id));
  };

  const totals = invoiceTotals();

  // ---- Stats for the summary bar ----
  const totalInvoiced = clientInvoices.reduce((s, inv) => s + (inv.amount || 0), 0);
  const totalPaid = clientInvoices.filter(inv => inv.status === 'Paid').reduce((s, inv) => s + (inv.amount || 0), 0);
  const totalOutstanding = clientInvoices.filter(inv => inv.status !== 'Paid').reduce((s, inv) => s + (inv.amount || 0), 0);
  const overdueCount = clientInvoices.filter(inv => inv.status === 'Overdue').length;

  // ---- Filtering + Sorting ----
  const filteredInvoices = clientInvoices
    .filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (inv.customer || '').toLowerCase().includes(q) ||
        (inv.documentNo || '').toLowerCase().includes(q) ||
        (inv.status || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.date) - new Date(b.date);
        case 'date-desc': return new Date(b.date) - new Date(a.date);
        case 'amount-asc': return (a.amount || 0) - (b.amount || 0);
        case 'amount-desc': return (b.amount || 0) - (a.amount || 0);
        case 'customer': return (a.customer || '').localeCompare(b.customer || '');
        case 'status': return (a.status || '').localeCompare(b.status || '');
        default: return new Date(b.date) - new Date(a.date);
      }
    });

  const fmtAmt = (n) => `R ${(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statusBadge = (status) => {
    const styles = {
      'Paid': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      'Overdue': 'bg-red-100 text-red-700 border border-red-200',
      'Pending': 'bg-amber-100 text-amber-700 border border-amber-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Customers</h2>
          <p className="text-sm text-slate-500">Customer invoices and account statements</p>
        </div>
        {activeSubTab === 'invoices' && (
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        )}
      </div>

      {/* Sub-tab Toggle */}
      <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeSubTab === 'invoices'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Invoices
        </button>
        <button
          onClick={() => setActiveSubTab('statements')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeSubTab === 'statements'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Statements
        </button>
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeSubTab === 'directory'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Directory
        </button>
      </div>

      {activeSubTab === 'statements' ? (
        <CustomerStatements invoices={invoices} customers={companyCustomers} company={company} />
      ) : activeSubTab === 'directory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">Add Customer for {company?.name || 'Selected Company'}</h3>
            <input type="text" placeholder="Customer Name *" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
            <input type="text" placeholder="Company / Trading Name" value={newCustomer.companyName} onChange={e => setNewCustomer({...newCustomer, companyName: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="VAT Number" value={newCustomer.vatNo} onChange={e => setNewCustomer({...newCustomer, vatNo: e.target.value})} className="border rounded px-3 py-2 text-sm" />
              <input type="text" placeholder="Contact Person" value={newCustomer.contactPerson} onChange={e => setNewCustomer({...newCustomer, contactPerson: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="email" placeholder="Email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="border rounded px-3 py-2 text-sm" />
              <input type="text" placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            </div>
            <input type="text" placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="City" value={newCustomer.city} onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} className="border rounded px-3 py-2 text-sm" />
              <input type="text" placeholder="Postal Code" value={newCustomer.postalCode} onChange={e => setNewCustomer({...newCustomer, postalCode: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            </div>
            <button onClick={handleSaveCustomer} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700">Save Customer</button>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Customer List ({companyCustomers.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {companyCustomers.map(c => (
                <div key={c.id} className="border rounded-lg p-3">
                  <p className="font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.companyName || 'No company name'} {c.vatNo ? `• VAT: ${c.vatNo}` : ''}</p>
                  <p className="text-xs text-slate-500">{c.contactPerson || 'No contact person'} {c.phone ? `• ${c.phone}` : ''}</p>
                  <p className="text-xs text-slate-500">{c.address || ''} {c.city || ''} {c.postalCode || ''}</p>
                </div>
              ))}
              {!companyCustomers.length && <p className="text-sm text-slate-500">No customers captured for this company yet.</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Invoices</p>
                <p className="text-lg font-bold text-slate-800">{clientInvoices.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Invoiced</p>
                <p className="text-base font-bold text-slate-800">{fmtAmt(totalInvoiced)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Paid</p>
                <p className="text-base font-bold text-emerald-600">{fmtAmt(totalPaid)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Overdue</p>
                <p className="text-base font-bold text-red-600">
                  {overdueCount} invoice{overdueCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-400">{fmtAmt(totalOutstanding)} outstanding</p>
              </div>
            </div>
          </div>

          {/* Search, Filter & Sort Bar */}
          <div className="bg-white rounded-lg border p-3 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-48 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, invoice #, status..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="amount-desc">Amount (High-Low)</option>
                <option value="amount-asc">Amount (Low-High)</option>
                <option value="customer">Customer Name</option>
                <option value="status">Status</option>
              </select>
            </div>
            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {filteredInvoices.length} of {clientInvoices.length}
            </span>
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
                      onClick={() => { const t = invoiceTotals(); setSelectedInvoice({...newInvoice, subtotal: t.subtotal, vat: t.totalVat, amount: t.grandTotal, discount: t.totalDiscount, invoiceDiscount: t.invoiceDiscount}); setShowPrintPreview(true); }}
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
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Customer</option>
                    {companyCustomers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Create customers in the Directory tab for this selected company.</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Discount</label>
                  <div className="flex gap-2">
                    <select
                      value={newInvoice.discountType}
                      onChange={(e) => setNewInvoice({...newInvoice, discountType: e.target.value})}
                      className="w-28 border rounded px-2 py-2 text-sm"
                    >
                      <option value="amount">Amount</option>
                      <option value="percent">Percent</option>
                    </select>
                    <input 
                      type="number" 
                      value={newInvoice.discountValue}
                      onChange={(e) => setNewInvoice({...newInvoice, discountValue: parseFloat(e.target.value) || 0})}
                      className="flex-1 border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Payment Terms</label>
                  <select
                    value={newInvoice.paymentTerms}
                    onChange={(e) => setNewInvoice({...newInvoice, paymentTerms: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option>Due on receipt</option>
                    <option>Net 7</option>
                    <option>Net 14</option>
                    <option>Net 30</option>
                    <option>Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm min-h-20"
                  placeholder="Additional notes to include on the invoice"
                />
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
                  {totals.invoiceDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Invoice Discount:</span>
                      <span className="text-red-600">- R {totals.invoiceDiscount.toFixed(2)}</span>
                    </div>
                  )}
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
                      customerDetails: null,
                      deliveryAddress: ['', '', '', '', ''],
                      postalAddress: ['', '', '', '', '', ''],
                      discountType: 'amount',
                      discountValue: 0,
                      paymentTerms: 'Due on receipt',
                      notes: '',
                      items: [{ id: 1, type: 'Item', description: '', unit: '', qty: 1, price: 0, vatType: 'Standard Rate (15.00%)', discPercent: 0 }],
                      status: 'Pending'
                    });
                  }}
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
                >
                  Save and New
                </button>
                <button 
                  onClick={() => { const t = invoiceTotals(); setSelectedInvoice({...newInvoice, subtotal: t.subtotal, vat: t.totalVat, amount: t.grandTotal, discount: t.totalDiscount, invoiceDiscount: t.invoiceDiscount}); setShowPrintPreview(true); }}
                  className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded font-medium text-sm hover:bg-blue-50"
                >
                  Print Preview
                </button>
                <button 
                  onClick={() => {
                    const email = clients.find(c => c.name === newInvoice.customer)?.email || '';
                    const subject = `Invoice ${newInvoice.documentNo}`;
                    const body = `Dear ${newInvoice.customer || 'Customer'},\n\nPlease find attached invoice ${newInvoice.documentNo}.\n\nTotal Amount: R ${totals.grandTotal.toFixed(2)}\n${totals.invoiceDiscount > 0 ? `Discount: R ${totals.invoiceDiscount.toFixed(2)}\n` : ''}Due Date: ${newInvoice.dueDate}\n${newInvoice.paymentTerms ? `Payment Terms: ${newInvoice.paymentTerms}\n` : ''}${newInvoice.notes ? `Notes: ${newInvoice.notes}\n` : ''}\nThank you for your business.`;
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
        <PrintPreview invoice={selectedInvoice} onClose={() => setShowPrintPreview(false)} company={company} />
      )}

          {/* Client Invoices List */}
          {filteredInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvoices.map(invoice => {
                const isOverdue = invoice.status === 'Overdue';
                const isPaid = invoice.status === 'Paid';
                const borderColor = isPaid ? 'border-l-emerald-500' : isOverdue ? 'border-l-red-500' : 'border-l-amber-400';
                return (
                  <div key={invoice.id} className={`bg-white rounded-lg border shadow-sm p-5 border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{invoice.documentNo}</h4>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{invoice.customer || 'No customer'}</p>
                        {(invoice.customerRef || invoice.externalInvoiceNo || invoice.customerVatNo) && (
                          <p className="text-xs text-slate-500 mt-1">Bill To: {[invoice.customerRef, invoice.externalInvoiceNo, invoice.customerVatNo].filter(Boolean).join(' • ')}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        {invoice.createdFromBank && (
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500">From Bank</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 mb-3">
                      <p className="text-2xl font-bold text-slate-900">
                        {fmtAmt(invoice.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 border-t pt-2">
                      <span>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {invoice.date}
                      </span>
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        Due: {invoice.dueDate}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedInvoice(invoice); setShowPrintPreview(true); }}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border rounded-md hover:bg-slate-50 transition-colors text-slate-600"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {!isPaid && (
                        <button
                          onClick={() => markAsPaid(invoice.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="px-2.5 py-1.5 text-red-500 border border-red-100 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border">
              {clientInvoices.length === 0 ? (
                <>
                  <FileText className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No customer invoices yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Create a new invoice to get started.</p>
                  <button
                    onClick={() => setShowInvoiceForm(true)}
                    className="mt-4 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium mx-auto"
                  >
                    <Plus className="w-4 h-4" /> New Invoice
                  </button>
                </>
              ) : (
                <>
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No invoices match your filters.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                    className="mt-3 text-sm text-emerald-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Print Preview Component
const PrintPreview = ({ invoice, onClose, company }) => {
  const handlePrint = () => window.print();
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
        
        <div id="invoice-print" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px' }}>
          {/* Dark Navy Header Banner */}
          <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: '#1d3557' }}>
            {/* Left: Logo box - bright medium blue, text only */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 16px', textAlign: 'center', backgroundColor: '#2e82c4', minWidth: '160px', maxWidth: '190px' }}>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: '0 0 5px 0' }}>{company?.name || 'AME Business'}</p>
                <p style={{ fontSize: '10px', color: '#dbeafe', margin: 0 }}>{company?.tradingName || 'Accountants and Tax Practitioners'}</p>
              </div>
            </div>
            {/* Center: Company info */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '14px 24px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: '0 0 2px 0' }}>{company?.name || 'AME Business'}</p>
                <p style={{ fontSize: '11px', color: '#bfdbfe', margin: 0, fontStyle: 'italic' }}>{company?.tradingName || 'Accountants and Tax Practitioners'}</p>
              </div>
            </div>
            {/* Right: INVOICE title + details box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', padding: '14px 16px' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0', letterSpacing: '2px' }}>INVOICE</p>
              <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 12px', minWidth: '220px' }}>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '2px 10px 2px 0', color: '#64748b', fontWeight: '600' }}>NUMBER</td>
                      <td style={{ padding: '2px 0', textAlign: 'right', color: '#1e293b', fontWeight: 'bold' }}>{invoice.documentNo}</td>
                    </tr>
                    {invoice.customerRef && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '2px 10px 2px 0', color: '#64748b', fontWeight: '600' }}>REFERENCE</td>
                        <td style={{ padding: '2px 0', textAlign: 'right', color: '#1e293b', fontWeight: 'bold' }}>{invoice.customerRef}</td>
                      </tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '2px 10px 2px 0', color: '#64748b', fontWeight: '600' }}>DATE</td>
                      <td style={{ padding: '2px 0', textAlign: 'right', color: '#1e293b', fontWeight: 'bold' }}>{(() => { const d = invoice.date; if (!d) return ''; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; })()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '2px 10px 2px 0', color: '#64748b', fontWeight: '600' }}>DUE DATE</td>
                      <td style={{ padding: '2px 0', textAlign: 'right', color: '#1e293b', fontWeight: 'bold' }}>{(() => { const d = invoice.dueDate; if (!d) return ''; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; })()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 10px 2px 0', color: '#64748b', fontWeight: '600' }}>PAGE</td>
                      <td style={{ padding: '2px 0', textAlign: 'right', color: '#1e293b' }}>1 of 1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 24px 20px 24px' }}>

          {/* FROM / TO Section */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '1px', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>FROM</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 2px 0' }}>{company?.name || 'A.M.E BUSINESS ACCOUNTANTS'}</p>
              {company?.vatNo && <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>VAT NO: {company.vatNo}</p>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '9px', fontWeight: '600', color: '#94a3b8', marginBottom: '1px' }}>POSTAL ADDRESS</p>
                  {company?.postalCode && <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{company.postalCode}</p>}
                  {company?.city && <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{company.city}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '9px', fontWeight: '600', color: '#94a3b8', marginBottom: '1px' }}>PHYSICAL ADDRESS</p>
                  {company?.address && <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{company.address}</p>}
                  {company?.city && <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{company.city}</p>}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '1px', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>TO</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 2px 0' }}>{invoice.supplier || invoice.customer || 'Customer'}</p>
              {invoice.customerDetails?.vatNo && <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>CUSTOMER VAT NO: {invoice.customerDetails.vatNo}</p>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '9px', fontWeight: '600', color: '#94a3b8', marginBottom: '1px' }}>POSTAL ADDRESS</p>
                  {invoice.postalAddress?.filter(Boolean).map((line, i) => <p key={i} style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{line}</p>)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '9px', fontWeight: '600', color: '#94a3b8', marginBottom: '1px' }}>PHYSICAL ADDRESS</p>
                  {invoice.customerDetails?.address && <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{invoice.customerDetails.address}</p>}
                  {invoice.customerDetails?.city && <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{invoice.customerDetails.city}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#d4e6f5', borderBottom: '2px solid #2e82c4' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#1d3557' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#1d3557', width: '50px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#1d3557', width: '90px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#1d3557', width: '90px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 10px', fontSize: '11px' }}>{item.description || 'Item'}</td>
                    <td style={{ padding: '5px 10px', fontSize: '11px', textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ padding: '5px 10px', fontSize: '11px', textAlign: 'right' }}>R {(item.price || 0).toFixed(2)}</td>
                    <td style={{ padding: '5px 10px', fontSize: '11px', textAlign: 'right' }}>R {((item.qty || 0) * (item.price || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(invoice.paymentTerms || invoice.notes) && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              {invoice.paymentTerms && (
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 10px', backgroundColor: '#f8fafc' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', margin: '0 0 2px 0' }}>Payment Terms</p>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{invoice.paymentTerms}</p>
                </div>
              )}
              {invoice.notes && (
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 10px', backgroundColor: '#f8fafc' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', margin: '0 0 2px 0' }}>Notes</p>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <div style={{ width: '280px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px' }}><span style={{ color: '#64748b' }}>Subtotal:</span><span>R {(invoice.subtotal || 0).toFixed(2)}</span></div>
              {(invoice.invoiceDiscount || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px' }}><span style={{ color: '#64748b' }}>Invoice Discount:</span><span style={{ color: '#dc2626' }}>- R {(invoice.invoiceDiscount || 0).toFixed(2)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px' }}><span style={{ color: '#64748b' }}>VAT:</span><span>R {(invoice.vat || 0).toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 2px 0', fontSize: '13px', fontWeight: 'bold', borderTop: '2px solid #059669', marginTop: '4px' }}><span>Grand Total:</span><span style={{ color: '#059669' }}>R {(invoice.amount || 0).toFixed(2)}</span></div>
            </div>
          </div>

          {/* Banking Details + Thank You */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '260px' }}>
              <div style={{ display: 'flex', backgroundColor: '#eef4fb', border: '1px solid #c5d9ef', borderRadius: '5px', padding: '8px 12px' }}>
                <div style={{ width: '3px', borderRadius: '3px', marginRight: '10px', flexShrink: 0, backgroundColor: '#2e82c4' }}></div>
                <div>
                  <p style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', color: '#1d3557', margin: '0 0 5px 0' }}>Banking Details</p>
                  <table style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                    <tbody>
                      <tr><td style={{ color: '#64748b', paddingRight: '10px', paddingBottom: '1px' }}>Account Name:</td><td style={{ fontWeight: '600', color: '#1e293b' }}>AME Business Accountants</td></tr>
                      <tr><td style={{ color: '#64748b', paddingRight: '10px', paddingBottom: '1px' }}>Bank:</td><td style={{ fontWeight: '600', color: '#1e293b' }}>FNB</td></tr>
                      <tr><td style={{ color: '#64748b', paddingRight: '10px', paddingBottom: '1px' }}>Account No:</td><td style={{ fontWeight: '600', color: '#1e293b' }}>6300 418 3446</td></tr>
                      <tr><td style={{ color: '#64748b', paddingRight: '10px' }}>Branch Code:</td><td style={{ fontWeight: '600', color: '#1e293b' }}>250655</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
              <p style={{ margin: '0 0 2px 0' }}>Thank you for your business.</p>
              <p style={{ margin: 0 }}>Payment due by {(() => { const d = invoice.dueDate; if (!d) return ''; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; })()}.</p>
            </div>
          </div>

          </div>{/* end padding div */}
        </div>
      </div>
    </div>
  );
};

// ==================== SUPPLIERS VIEW (with Supplier Invoices) ====================
const SuppliersView = ({ suppliers, saveSuppliers, invoices, saveInvoices, clients, showSupplierForm, setShowSupplierForm, showPrintPreview, setShowPrintPreview, selectedInvoice, setSelectedInvoice, accounts = [], company, apiKey }) => {
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '' });
  const [activeTab, setActiveTab] = useState('invoices');
  const pdfInvoiceInputRef = React.useRef(null);
  const [showPdfInvoiceExtractor, setShowPdfInvoiceExtractor] = useState(false);
  const [extractedInvoices, setExtractedInvoices] = useState([]);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Use accounts prop or default accounts
  const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
  
  // Filter supplier invoices by type and company
  const supplierInvoices = invoices.filter(inv => inv.invoiceType === 'supplier' && (!company?.id || inv.companyId === company.id));

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
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
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
      linkedPO: inv.purchaseOrder,
      companyId: company?.id
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
              {suppliers.length}
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
        <PrintPreview invoice={selectedInvoice} onClose={() => setShowPrintPreview(false)} company={company} />
      )}
    </div>
  );
};

// ==================== COMPANIES VIEW ====================
const CompaniesView = ({ clients, saveClients, showClientForm, setShowClientForm, setActiveCompanyId }) => {
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
        const newId = Date.now();
        saveClients([...clients, { id: newId, ...formData }]);
        setActiveCompanyId(newId);
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
    const remaining = clients.filter(c => c.id !== id);
    saveClients(remaining);
    if (remaining.length) {
      setActiveCompanyId(remaining[0].id);
    } else {
      setShowClientForm(true);
    }
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
const BankingView = ({ bankStatements, saveBankStatements, invoices, saveInvoices, clients, suppliers, accounts = [], company, apiKey }) => {
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
  const [activeBankSubTab, setActiveBankSubTab] = useState('new');
  const [expandedIds, setExpandedIds] = useState([]);
  const [aiAllocating, setAiAllocating] = useState(false);
  const [aiAllocatingIds, setAiAllocatingIds] = useState([]);
  const [allocationRules, setAllocationRules] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [trainingInProgress, setTrainingInProgress] = useState(false);

  // Build selection options from accounts
  const selectionOptions = [
    'Unallocated Expen',
    ...accounts.filter(a => a.active !== false).map(a => a.name)
  ];

  const companyStatements = company?.id ? bankStatements.filter(s => s.companyId === company.id) : bankStatements;
  const attachedTransactions = companyStatements;
  const newTransactions = companyStatements.filter(stmt => !stmt.reviewed);
  const reviewedTransactions = companyStatements.filter(stmt => stmt.reviewed);
  const displayedTransactions = activeBankSubTab === 'attached'
    ? attachedTransactions
    : activeBankSubTab === 'reviewed'
      ? reviewedTransactions
      : newTransactions;

  useEffect(() => {
    const visibleIds = new Set(displayedTransactions.map(stmt => stmt.id));
    setSelectedIds(prev => prev.filter(id => visibleIds.has(id)));
  }, [activeBankSubTab, bankStatements]);

  // Load allocation rules from localStorage and seed defaults for current company if needed
  useEffect(() => {
    let currentRules = [];
    try {
      const saved = localStorage.getItem('allocation-rules');
      if (saved) currentRules = JSON.parse(saved);
    } catch (e) { console.error('Error loading allocation rules:', e); }

    // Seed default rules for current company if it has no rules yet
    if (company?.id) {
      const companyRules = currentRules.filter(r => r.companyId === company.id);
      if (companyRules.length === 0) {
        const defaultRules = generateDefaultRulesForCompany(company.id);
        currentRules = [...currentRules, ...defaultRules];
        localStorage.setItem('allocation-rules', JSON.stringify(currentRules));
      }
    }

    setAllocationRules(currentRules);
  }, [company?.id]);

  const saveAllocationRules = (rules) => {
    setAllocationRules(rules);
    localStorage.setItem('allocation-rules', JSON.stringify(rules));
  };

  // Extract patterns from all previously allocated bank transactions to build rule memory
  const extractPatternsFromHistory = () => {
    setTrainingInProgress(true);
    const companyId = company?.id;
    const allocated = companyStatements.filter(s =>
      s.selection && s.selection !== 'Unallocated Expen' && s.selection !== 'Unallocated Income'
    );

    if (allocated.length === 0) {
      setTrainingInProgress(false);
      setSaveMessage('No allocated transactions found to learn from. Allocate some transactions first.');
      setTimeout(() => setSaveMessage(''), 5000);
      return;
    }

    const patternMap = {};

    allocated.forEach(stmt => {
      const desc = (stmt.description || '').toLowerCase().trim();
      const payee = (stmt.payee || '').toLowerCase().trim();
      if (!desc && !payee) return;

      const patterns = [];
      if (desc) patterns.push({ text: desc, type: 'description' });
      if (payee && payee !== desc) patterns.push({ text: payee, type: 'payee' });

      patterns.forEach(p => {
        const key = `${p.text}|||${stmt.selection}|||${stmt.vatRate || 'No VAT'}`;
        if (!patternMap[key]) {
          patternMap[key] = {
            pattern: p.text,
            patternType: p.type,
            accountName: stmt.selection,
            vatRate: stmt.vatRate || 'No VAT',
            count: 0,
            lastDate: stmt.date || ''
          };
        }
        patternMap[key].count++;
        if ((stmt.date || '') > patternMap[key].lastDate) {
          patternMap[key].lastDate = stmt.date;
        }
      });
    });

    const newRules = Object.values(patternMap).map(p => ({
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern: p.pattern,
      patternType: p.patternType,
      accountName: p.accountName,
      vatRate: p.vatRate,
      confidenceScore: p.count,
      timesMatched: p.count,
      lastUsed: p.lastDate,
      companyId: companyId,
      source: 'historical'
    }));

    // Keep manually created and default rules, replace all historical ones
    const manualRules = allocationRules.filter(r => r.source === 'manual' && r.companyId === companyId);
    const defaultRules = allocationRules.filter(r => r.source === 'default' && r.companyId === companyId);
    const otherCompanyRules = allocationRules.filter(r => r.companyId !== companyId);
    const merged = [...otherCompanyRules, ...defaultRules, ...manualRules, ...newRules];

    saveAllocationRules(merged);
    setTrainingInProgress(false);
    setSaveMessage(`Training complete! Learned ${newRules.length} patterns from ${allocated.length} allocated transactions.`);
    setTimeout(() => setSaveMessage(''), 6000);
  };

  // Build historical examples string for the AI prompt
  const getHistoricalExamples = (rules) => {
    const companyRules = rules
      .filter(r => r.companyId === company?.id)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 25);

    if (companyRules.length === 0) return 'No historical patterns available yet.';

    return companyRules.map((r, i) =>
      `${i + 1}. "${r.pattern}" -> Account: "${r.accountName}", VAT: "${r.vatRate}" (matched ${r.timesMatched} times)`
    ).join('\n');
  };

  // Local regex-based allocation helper (reusable version of localAllocateTransactions logic)
  const getLocalAllocation = (stmt) => {
    const desc = (stmt.description || '').toLowerCase();
    const payee = (stmt.payee || '').toLowerCase();
    const combined = `${desc} ${payee}`;

    if (combined.match(/salary|wages|payroll|paye|uif|sdl/i)) return { account: 'Salaries & Wages', vatRate: 'No VAT' };
    if (combined.match(/entertainment|dining|restaurant|bar|drinks|catering/i)) return { account: 'Entertainment', vatRate: 'Exempt and Non-Supplies (0.00%)' };
    if (combined.match(/insurance|sanlam|old mutual|discovery.*life|hollard/i)) return { account: 'Insurance', vatRate: 'Exempt and Non-Supplies (0.00%)' };
    if (combined.match(/bank.*charge|service.*fee|monthly.*fee|transaction.*fee|overdraft/i)) return { account: 'Bank Charges', vatRate: 'Exempt and Non-Supplies (0.00%)' };
    if (combined.match(/interest.*paid|loan.*interest|finance.*charge/i)) return { account: 'Interest Paid', vatRate: 'Exempt and Non-Supplies (0.00%)' };
    if (combined.match(/interest.*received/i)) return { account: 'Interest Received', vatRate: 'Exempt and Non-Supplies (0.00%)' };
    if (combined.match(/donation|charity|ngo|npo/i)) return { account: 'General Expenses', vatRate: 'Exempt and Non-Supplies (0.00%)' };
    if (combined.match(/rent|lease.*premises|office.*space/i)) return { account: 'Rent Paid', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/telkom|vodacom|mtn|cell\s*c|fibre|internet|wifi|airtime/i)) return { account: 'Telephone & Internet', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/fuel|petrol|diesel|shell|sasol|engen|caltex|bp\s/i)) return { account: 'Motor Vehicle Expenses', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/repair|maintenance|plumber|electrician|fix/i)) return { account: 'Repairs & Maintenance', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/stationery|paper|ink|toner|cartridge|office.*suppl/i)) return { account: 'Printing & Stationery', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/computer|software|laptop|microsoft|google|cloud|hosting/i)) return { account: 'Computer Expenses', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/advert|marketing|facebook|google.*ads|promo/i)) return { account: 'Advertising', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/electric|water|municipal|eskom|city.*power/i)) return { account: 'Electricity & Water', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/accounting|audit|tax.*consult|bookkeep/i)) return { account: 'Accounting Fees', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/security|guard|alarm|adt|chubb/i)) return { account: 'Security', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/travel|flight|hotel|accommodation|uber|taxi/i)) return { account: 'Travel & Accommodation', vatRate: 'Standard Rate (15.00%)' };
    if (combined.match(/depreciation/i)) return { account: 'Depreciation', vatRate: 'No VAT' };
    if (stmt.received > 0) return { account: 'Sales', vatRate: 'Standard Rate (15.00%)' };
    return null;
  };

  // Three-tier smart allocation: Exact Match -> AI with Context -> Manual Review
  const smartAllocateTransactions = async (stmtIds) => {
    const stmtsToAllocate = bankStatements.filter(s => stmtIds.includes(s.id));
    if (stmtsToAllocate.length === 0) return;

    setAiAllocating(true);
    setAiAllocatingIds(stmtIds);

    const rules = allocationRules.filter(r => r.companyId === company?.id);
    const results = [];
    const aiNeeded = [];

    // === TIER 1: Exact/close pattern match from learned rules (confidence >= 3) ===
    stmtsToAllocate.forEach(stmt => {
      const desc = (stmt.description || '').toLowerCase().trim();
      const payee = (stmt.payee || '').toLowerCase().trim();

      let bestMatch = null;
      let bestScore = 0;

      rules.forEach(rule => {
        const rp = rule.pattern.toLowerCase();
        let score = 0;

        // Exact match on description or payee
        if (desc && desc === rp) score = 100;
        else if (payee && payee === rp) score = 95;
        // Description contains the rule pattern (or vice versa)
        else if (desc && desc.includes(rp) && rp.length >= 4) score = 85;
        else if (desc && rp.includes(desc) && desc.length >= 5) score = 75;
        // Payee contains the rule pattern (or vice versa)
        else if (payee && payee.includes(rp) && rp.length >= 4) score = 70;
        else if (payee && rp.includes(payee) && payee.length >= 4) score = 65;

        // Boost score based on how many times this pattern was confirmed
        const boost = Math.min(rule.confidenceScore * 2, 20);
        score += boost;

        if (score > bestScore && score >= 65) {
          bestScore = score;
          bestMatch = rule;
        }
      });

      if (bestMatch && bestMatch.confidenceScore >= 3 && bestScore >= 75) {
        // High confidence auto-allocation
        const validAccount = selectionOptions.includes(bestMatch.accountName) ? bestMatch.accountName : null;
        const validVat = VAT_RATES.find(v => v.value === bestMatch.vatRate)?.value;
        if (validAccount) {
          results.push({
            id: stmt.id,
            selection: validAccount,
            vatRate: validVat || bestMatch.vatRate,
            allocationTier: 'auto',
            allocationConfidence: Math.min(bestScore, 99),
            matchedRule: bestMatch.pattern
          });
          // Update the rule's usage stats
          const ruleIdx = allocationRules.findIndex(r => r.id === bestMatch.id);
          if (ruleIdx >= 0) {
            allocationRules[ruleIdx].timesMatched = (allocationRules[ruleIdx].timesMatched || 0) + 1;
            allocationRules[ruleIdx].lastUsed = new Date().toISOString().split('T')[0];
          }
          return;
        }
      }
      // Not auto-matched, send to AI
      aiNeeded.push({ stmt, suggestedRule: bestMatch });
    });

    // === TIER 2 & 3: AI allocation with historical context ===
    if (aiNeeded.length > 0 && apiKey) {
      try {
        const historicalExamples = getHistoricalExamples(rules);
        const accountNames = selectionOptions.join(', ');
        const vatRateNames = VAT_RATES.map(v => v.value).join(', ');
        const txnDescriptions = aiNeeded.map((item, i) => {
          const s = item.stmt;
          let line = `${i + 1}. Date: ${s.date} | Description: "${s.description || 'N/A'}" | Payee: "${s.payee || 'N/A'}" | Spent: ${s.spent || 0} | Received: ${s.received || 0}`;
          if (item.suggestedRule) {
            line += ` | Hint - similar to previous pattern: "${item.suggestedRule.pattern}" which was allocated to ${item.suggestedRule.accountName}`;
          }
          return line;
        }).join('\n');

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{
              role: "user",
              content: `You are a South African accounting assistant. Allocate bank transactions to the correct account and VAT rate.

CRITICAL: I have specific ways of allocating transactions in my practice. You MUST learn from my historical patterns below and follow them as closely as possible. Only fall back to general accounting rules when no historical pattern is similar.

My historical allocation patterns (FOLLOW THESE AS PRIORITY):
${historicalExamples}

Available accounts: ${accountNames}

Available VAT rates: ${vatRateNames}

SA VAT Rules (use only when no historical pattern matches):
- Entertainment, staff welfare, donations, insurance premiums, bank charges, interest = Exempt and Non-Supplies (0.00%)
- Salaries, wages, PAYE, UIF = No VAT
- Most business purchases (stationery, repairs, phone, rent, advertising, fuel, professional fees) = Standard Rate (15.00%)
- Capital goods (equipment, vehicles, furniture) = Standard Rate (Capital Goods) (15.00%)
- Exported goods/services = Zero Rate Exports (0.00%)
- Basic food items, petrol levy portion = Zero Rate (0.00%)

Transactions to allocate:
${txnDescriptions}

Return ONLY a JSON array (no markdown, no code blocks):
[{"index":1,"account":"account name","vatRate":"vat rate value","payee":"suggested payee name","confidence":85}]

Rules:
- Use EXACT account and vatRate names from the lists above
- Match based on my historical patterns FIRST before using general rules
- confidence: 0-100 (90+ if closely matching my historical patterns, 70-89 if reasonably similar, below 70 if guessing)
- If a transaction has a "Hint" about a similar previous pattern, strongly prefer that allocation`
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text || '';
          let jsonStr = text.trim().replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
          const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);

          if (jsonMatch) {
            const allocations = JSON.parse(jsonMatch[0]);
            aiNeeded.forEach((item, idx) => {
              const alloc = allocations.find(a => a.index === idx + 1);
              if (alloc) {
                const matchedAccount = selectionOptions.find(opt => opt === alloc.account);
                const matchedVat = VAT_RATES.find(v => v.value === alloc.vatRate)?.value;

                if (matchedAccount) {
                  const conf = alloc.confidence || 50;
                  results.push({
                    id: item.stmt.id,
                    selection: matchedAccount,
                    vatRate: matchedVat || item.stmt.vatRate,
                    payee: alloc.payee || item.stmt.payee,
                    allocationTier: conf >= 70 ? 'ai-suggested' : 'needs-review',
                    allocationConfidence: conf
                  });
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Smart allocation AI error:', error);
        setSaveMessage(`AI step failed: ${error.message}. Using local rules for remaining transactions.`);
      }
    }

    // Fallback: local regex rules for anything still unmatched
    const matchedIds = new Set(results.map(r => r.id));
    stmtsToAllocate.filter(s => !matchedIds.has(s.id)).forEach(stmt => {
      const local = getLocalAllocation(stmt);
      if (local) {
        const validAccount = selectionOptions.includes(local.account) ? local.account : null;
        const validVat = VAT_RATES.find(v => v.value === local.vatRate)?.value;
        if (validAccount) {
          results.push({
            id: stmt.id,
            selection: validAccount,
            vatRate: validVat || local.vatRate,
            allocationTier: 'needs-review',
            allocationConfidence: 30
          });
        }
      }
    });

    // Apply all results to bank statements
    if (results.length > 0) {
      const updatedStatements = bankStatements.map(s => {
        const result = results.find(r => r.id === s.id);
        if (!result) return s;
        return {
          ...s,
          selection: result.selection,
          vatRate: result.vatRate,
          payee: result.payee || s.payee,
          aiAllocated: true,
          allocationTier: result.allocationTier,
          allocationConfidence: result.allocationConfidence,
          matchedRule: result.matchedRule || null
        };
      });
      saveBankStatements(updatedStatements);
      // Save updated rule usage stats
      saveAllocationRules([...allocationRules]);
    }

    const autoCount = results.filter(r => r.allocationTier === 'auto').length;
    const aiCount = results.filter(r => r.allocationTier === 'ai-suggested').length;
    const reviewCount = results.filter(r => r.allocationTier === 'needs-review').length;
    const totalCount = stmtsToAllocate.length;
    const unmatched = totalCount - results.length;

    let msg = `Smart allocation: ${autoCount} auto-matched, ${aiCount} AI-suggested, ${reviewCount} need review`;
    if (unmatched > 0) msg += `, ${unmatched} unmatched`;
    setSaveMessage(msg);

    setAiAllocating(false);
    setAiAllocatingIds([]);
    setTimeout(() => setSaveMessage(''), 7000);
  };

  // Learning feedback: update allocation rules when user manually changes a transaction's category
  const updateRuleFromAllocation = (stmt, newAccount, newVatRate) => {
    if (!newAccount || newAccount === 'Unallocated Expen' || newAccount === 'Unallocated Income') return;

    const desc = (stmt.description || '').toLowerCase().trim();
    const payee = (stmt.payee || '').toLowerCase().trim();
    const pattern = desc || payee;
    if (!pattern) return;

    const companyId = company?.id;
    let rules = [...allocationRules];

    // If user overrides an auto-allocation, reduce confidence of the wrong rule
    if (stmt.allocationTier === 'auto' && stmt.matchedRule) {
      rules = rules.map(r => {
        if (r.pattern === stmt.matchedRule && r.companyId === companyId && r.accountName !== newAccount) {
          return { ...r, confidenceScore: Math.max(0, r.confidenceScore - 1) };
        }
        return r;
      });
    }

    // Find existing rule for this exact pattern + account combo
    const existingIdx = rules.findIndex(r =>
      r.pattern === pattern && r.accountName === newAccount && r.companyId === companyId
    );

    if (existingIdx >= 0) {
      // Strengthen existing rule
      rules[existingIdx] = {
        ...rules[existingIdx],
        confidenceScore: rules[existingIdx].confidenceScore + 1,
        timesMatched: rules[existingIdx].timesMatched + 1,
        vatRate: newVatRate || rules[existingIdx].vatRate,
        lastUsed: new Date().toISOString().split('T')[0]
      };
    } else {
      // Create new rule from this manual allocation
      rules.push({
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pattern,
        patternType: desc ? 'description' : 'payee',
        accountName: newAccount,
        vatRate: newVatRate || 'No VAT',
        confidenceScore: 1,
        timesMatched: 1,
        lastUsed: new Date().toISOString().split('T')[0],
        companyId,
        source: stmt.aiAllocated ? 'ai-confirmed' : 'manual'
      });
    }

    saveAllocationRules(rules);
  };

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
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
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
      linkedType: null,
      companyId: company?.id
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
          reviewed: false,
          reconciled: false,
          linkedInvoice: null,
          linkedType: null,
          companyId: company?.id
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
      reviewed: false,
      reconciled: false,
      linkedInvoice: null,
      linkedType: null,
      companyId: company?.id
    }]);
  };

  const updateStatement = (id, field, value) => {
    const stmt = bankStatements.find(s => s.id === id);
    // Learning feedback: when user manually changes the account allocation, update rules
    if (stmt && field === 'selection' && value !== stmt.selection) {
      updateRuleFromAllocation(stmt, value, stmt.vatRate);
    }
    // Learning feedback: when user changes VAT rate on an already-allocated transaction
    if (stmt && field === 'vatRate' && value !== stmt.vatRate && stmt.selection && stmt.selection !== 'Unallocated Expen') {
      updateRuleFromAllocation(stmt, stmt.selection, value);
    }
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
      setSelectedIds(displayedTransactions.map(s => s.id));
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

  // Reinforce allocation rules when user confirms (reviews) AI-allocated transactions
  const reinforceConfirmedAllocations = (stmts) => {
    stmts.forEach(stmt => {
      if (stmt.aiAllocated && stmt.selection && stmt.selection !== 'Unallocated Expen' && stmt.selection !== 'Unallocated Income') {
        updateRuleFromAllocation(stmt, stmt.selection, stmt.vatRate);
      }
    });
  };

  const handleSaveChanges = () => {
    // Reinforce rules for reconciled transactions being confirmed as reviewed
    const reconciledStmts = bankStatements.filter(s => s.reconciled && !s.reviewed);
    reinforceConfirmedAllocations(reconciledStmts);
    const updated = bankStatements.map(stmt => stmt.reconciled ? { ...stmt, reviewed: true } : stmt);
    saveBankStatements(updated);
    setSaveMessage('Changes saved successfully. Reconciled transactions moved to Reviewed Transactions.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleMarkSelectedAsReviewed = () => {
    if (selectedIds.length === 0) {
      setSaveMessage('Please select transactions first');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    // Reinforce rules for selected AI-allocated transactions being confirmed
    const selectedStmts = bankStatements.filter(s => selectedIds.includes(s.id) && !s.reviewed);
    reinforceConfirmedAllocations(selectedStmts);
    const updated = bankStatements.map(s =>
      selectedIds.includes(s.id) ? { ...s, reconciled: true, reviewed: true } : s
    );
    saveBankStatements(updated);
    setSelectedIds([]);
    setSaveMessage(`${selectedIds.length} transaction(s) marked as reviewed!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleMarkAllAsReviewed = () => {
    const visibleIds = new Set(displayedTransactions.map(s => s.id));
    // Reinforce rules for all visible AI-allocated transactions being confirmed
    const visibleStmts = bankStatements.filter(s => visibleIds.has(s.id) && !s.reviewed);
    reinforceConfirmedAllocations(visibleStmts);
    const updated = bankStatements.map(s => visibleIds.has(s.id) ? { ...s, reconciled: true, reviewed: true } : s);
    saveBankStatements(updated);
    setSelectedIds([]);
    setSaveMessage(`${displayedTransactions.length} transaction(s) marked as reviewed!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleRecallTransaction = (id) => {
    const updated = bankStatements.map(s => s.id === id ? { ...s, reviewed: false, reconciled: false } : s);
    saveBankStatements(updated);
    setSaveMessage('Transaction recalled to New Transactions for re-allocation.');
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

  const toggleExpand = (id) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);
  };

  // SA VAT categorization rules for AI allocation
  const SA_VAT_RULES = {
    'Entertainment': 'Exempt and Non-Supplies (0.00%)',
    'Staff Welfare': 'Exempt and Non-Supplies (0.00%)',
    'Donations': 'Exempt and Non-Supplies (0.00%)',
    'Insurance': 'Exempt and Non-Supplies (0.00%)',
    'Bank Charges': 'Exempt and Non-Supplies (0.00%)',
    'Interest Paid': 'Exempt and Non-Supplies (0.00%)',
    'Interest Received': 'Exempt and Non-Supplies (0.00%)',
    'Salaries & Wages': 'No VAT',
    'Rent Paid': 'Standard Rate (15.00%)',
    'Telephone & Internet': 'Standard Rate (15.00%)',
    'Motor Vehicle Expenses': 'Standard Rate (15.00%)',
    'Repairs & Maintenance': 'Standard Rate (15.00%)',
    'Printing & Stationery': 'Standard Rate (15.00%)',
    'Computer Expenses': 'Standard Rate (15.00%)',
    'Advertising': 'Standard Rate (15.00%)',
    'Electricity & Water': 'Standard Rate (15.00%)',
    'Accounting Fees': 'Standard Rate (15.00%)',
    'Security': 'Standard Rate (15.00%)',
    'General Expenses': 'Standard Rate (15.00%)',
    'Travel & Accommodation': 'Standard Rate (15.00%)',
    'Purchases': 'Standard Rate (15.00%)',
    'Sales': 'Standard Rate (15.00%)',
    'Fixed Assets - Equipment': 'Standard Rate (Capital Goods) (15.00%)',
    'Fixed Assets - Furniture & Fittings': 'Standard Rate (Capital Goods) (15.00%)',
    'Fixed Assets - Motor Vehicles': 'Standard Rate (Capital Goods) (15.00%)',
  };

  // AI-powered transaction allocation
  const aiAllocateTransactions = async (stmtIds) => {
    const stmtsToAllocate = bankStatements.filter(s => stmtIds.includes(s.id));
    if (stmtsToAllocate.length === 0) return;

    setAiAllocating(true);
    setAiAllocatingIds(stmtIds);

    try {
      const accountNames = selectionOptions.join(', ');
      const vatRateNames = VAT_RATES.map(v => v.value).join(', ');
      const txnDescriptions = stmtsToAllocate.map((s, i) => `${i + 1}. Date: ${s.date} | Description: "${s.description || 'N/A'}" | Payee: "${s.payee || 'N/A'}" | Spent: ${s.spent || 0} | Received: ${s.received || 0}`).join('\n');

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: `You are a South African accounting assistant. Allocate bank transactions to the correct account category and VAT rate.

Available accounts: ${accountNames}

Available VAT rates: ${vatRateNames}

SA VAT Rules:
- Entertainment, staff welfare, donations, insurance premiums, bank charges, interest = Exempt and Non-Supplies (0.00%)
- Salaries, wages, PAYE, UIF = No VAT
- Most business purchases (stationery, repairs, phone, rent, advertising, fuel, professional fees) = Standard Rate (15.00%)
- Capital goods (equipment, vehicles, furniture) = Standard Rate (Capital Goods) (15.00%)
- Exported goods/services = Zero Rate Exports (0.00%)
- Basic food items, petrol levy portion = Zero Rate (0.00%)

Transactions to allocate:
${txnDescriptions}

Return ONLY a JSON array (no markdown, no code blocks):
[{"index":1,"account":"account name","vatRate":"vat rate value","payee":"suggested payee name"}]

Use EXACT account and vatRate names from the lists above. Match the most appropriate account based on the description.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      let jsonStr = text.trim().replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const allocations = JSON.parse(jsonMatch[0]);
        const updatedStatements = bankStatements.map(s => {
          const stmtIdx = stmtsToAllocate.findIndex(st => st.id === s.id);
          if (stmtIdx === -1) return s;
          const alloc = allocations.find(a => a.index === stmtIdx + 1);
          if (!alloc) return s;

          const matchedAccount = selectionOptions.find(opt => opt === alloc.account) || s.selection;
          const matchedVat = VAT_RATES.find(v => v.value === alloc.vatRate)?.value || s.vatRate;

          return {
            ...s,
            selection: matchedAccount,
            vatRate: matchedVat,
            payee: alloc.payee || s.payee,
            aiAllocated: true
          };
        });

        saveBankStatements(updatedStatements);
        setSaveMessage(`AI allocated ${allocations.length} transaction(s) successfully!`);
      } else {
        setSaveMessage('AI could not parse allocation results. Please try again.');
      }
    } catch (error) {
      console.error('AI allocation error:', error);
      setSaveMessage(`AI allocation failed: ${error.message}. You can also use the local rules-based allocation.`);
    }

    setAiAllocating(false);
    setAiAllocatingIds([]);
    setTimeout(() => setSaveMessage(''), 5000);
  };

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
        <div className="border-b flex flex-wrap">
          {[
            { id: 'attached', label: 'Attached', count: attachedTransactions.length },
            { id: 'new', label: 'New Transactions', count: newTransactions.length },
            { id: 'reviewed', label: 'Reviewed Transactions', count: reviewedTransactions.length },
            { id: 'rules', label: 'Allocation Rules', count: allocationRules.filter(r => r.companyId === company?.id).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveBankSubTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${activeBankSubTab === tab.id ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {tab.label} <span className="text-xs text-slate-500">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RULES TAB ── */}
      {activeBankSubTab === 'rules' && (
        <BankRulesTab
          allocationRules={allocationRules}
          saveAllocationRules={saveAllocationRules}
          company={company}
          selectionOptions={selectionOptions}
          extractPatternsFromHistory={extractPatternsFromHistory}
          trainingInProgress={trainingInProgress}
          setSaveMessage={setSaveMessage}
        />
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-center px-2 py-3 font-medium text-slate-600 w-10">
                  <input
                    type="checkbox"
                    checked={displayedTransactions.length > 0 && selectedIds.length === displayedTransactions.length}
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
              {displayedTransactions.length > 0 ? displayedTransactions.map(stmt => (
                <React.Fragment key={stmt.id}>
                <tr className={`border-t hover:bg-slate-50 ${stmt.reconciled ? 'bg-green-50' : ''} ${selectedIds.includes(stmt.id) ? 'bg-blue-50' : ''} ${stmt.allocationTier === 'auto' ? 'ring-1 ring-inset ring-emerald-300' : stmt.allocationTier === 'ai-suggested' ? 'ring-1 ring-inset ring-blue-200' : stmt.allocationTier === 'needs-review' ? 'ring-1 ring-inset ring-amber-200' : stmt.aiAllocated ? 'ring-1 ring-inset ring-emerald-200' : ''}`}>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleExpand(stmt.id)}
                        className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded flex-shrink-0"
                        title="Show details"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedIds.includes(stmt.id) ? 'rotate-180' : ''}`} />
                      </button>
                      <input
                        type="text"
                        value={stmt.description || ''}
                        onChange={(e) => updateStatement(stmt.id, 'description', e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                        placeholder="Description"
                      />
                    </div>
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
                    <div className="flex items-center gap-1">
                      {activeBankSubTab === 'reviewed' && (
                        <button
                          onClick={() => handleRecallTransaction(stmt.id)}
                          className="px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                          title="Move back to New Transactions"
                        >
                          Recall
                        </button>
                      )}
                      <button
                        onClick={() => smartAllocateTransactions([stmt.id])}
                        disabled={aiAllocatingIds.includes(stmt.id)}
                        className="p-1 text-purple-500 hover:bg-purple-50 rounded disabled:opacity-50"
                        title="Smart Allocate (learns from your history)"
                      >
                        {aiAllocatingIds.includes(stmt.id) ? (
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Calculator className="w-4 h-4" />
                        )}
                      </button>
                      <button onClick={() => deleteStatement(stmt.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded transaction detail row */}
                {expandedIds.includes(stmt.id) && (
                  <tr className="bg-slate-50 border-t border-dashed">
                    <td colSpan={11} className="px-4 py-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="font-medium text-slate-500 block">Full Description</span>
                          <span className="text-slate-800">{stmt.description || '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">Payee</span>
                          <span className="text-slate-800">{stmt.payee || '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">Reference</span>
                          <span className="text-slate-800">{stmt.reference || '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">Category</span>
                          <span className="text-slate-800">{stmt.selection || '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">VAT Rate</span>
                          <span className="text-slate-800">{stmt.vatRate || '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">Spent</span>
                          <span className="text-red-600 font-medium">{stmt.spent ? `R ${stmt.spent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">Received</span>
                          <span className="text-emerald-600 font-medium">{stmt.received ? `R ${stmt.received.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block">Status</span>
                          <div className="flex gap-1 mt-0.5">
                            {stmt.reconciled && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">Reconciled</span>}
                            {stmt.reviewed && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">Reviewed</span>}
                            {stmt.linkedInvoice && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">Linked: {stmt.linkedInvoiceNo}</span>}
                            {stmt.allocationTier === 'auto' && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px]">Auto-matched ({stmt.allocationConfidence}%)</span>}
                            {stmt.allocationTier === 'ai-suggested' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">AI-suggested ({stmt.allocationConfidence}%)</span>}
                            {stmt.allocationTier === 'needs-review' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">Needs review</span>}
                            {stmt.aiAllocated && !stmt.allocationTier && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px]">AI Allocated</span>}
                            {!stmt.reconciled && !stmt.reviewed && !stmt.linkedInvoice && <span className="text-slate-400">Unprocessed</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-500">
                    {activeBankSubTab === 'reviewed'
                      ? 'No reviewed transactions yet.'
                      : activeBankSubTab === 'new'
                        ? 'No new transactions. Upload a statement or recall a reviewed transaction.'
                        : 'No attached transactions. Import a CSV/PDF/image or add entries manually.'}
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
          
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={handleSaveChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
            >
              Save Changes
            </button>
            {activeBankSubTab !== 'reviewed' && (
              <>
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
              </>
            )}
            {/* Smart AI Allocation Buttons */}
            <button
              onClick={() => {
                const ids = selectedIds.length > 0 ? selectedIds : displayedTransactions.map(s => s.id);
                smartAllocateTransactions(ids);
              }}
              disabled={aiAllocating}
              className="px-6 py-2 bg-purple-600 text-white rounded font-medium text-sm hover:bg-purple-700 disabled:bg-purple-400 flex items-center gap-2"
            >
              {aiAllocating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Smart Allocating...</>
              ) : (
                <><Calculator className="w-4 h-4" /> Smart Allocate {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : 'All'}</>
              )}
            </button>
            <button
              onClick={() => extractPatternsFromHistory()}
              disabled={trainingInProgress}
              className="px-6 py-2 bg-white text-purple-600 border border-purple-600 rounded font-medium text-sm hover:bg-purple-50 flex items-center gap-2 disabled:opacity-50"
            >
              {trainingInProgress ? (
                <><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Training...</>
              ) : (
                <><TrendingUp className="w-4 h-4" /> Train from History</>
              )}
            </button>
            <button
              onClick={() => setShowRulesModal(true)}
              className="px-6 py-2 bg-white text-slate-600 border border-slate-300 rounded font-medium text-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Manage Rules ({allocationRules.filter(r => r.companyId === company?.id).length})
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

      {/* Allocation Rules Management Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-purple-50 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-purple-800">Allocation Rules Management</h3>
                <p className="text-sm text-purple-600 mt-1">
                  {allocationRules.filter(r => r.companyId === company?.id).length} learned patterns for {company?.name || 'this company'}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={extractPatternsFromHistory}
                  disabled={trainingInProgress}
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {trainingInProgress ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Training...</>
                  ) : (
                    <><TrendingUp className="w-4 h-4" /> Train from History</>
                  )}
                </button>
                <button onClick={() => setShowRulesModal(false)} className="p-2 hover:bg-purple-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto max-h-[75vh]">
              {/* Statistics cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {allocationRules.filter(r => r.companyId === company?.id && r.confidenceScore >= 3).length}
                  </p>
                  <p className="text-xs text-emerald-600">High Confidence (Auto-allocate)</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {allocationRules.filter(r => r.companyId === company?.id && r.confidenceScore >= 1 && r.confidenceScore < 3).length}
                  </p>
                  <p className="text-xs text-blue-600">Learning (AI-assisted)</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {allocationRules.filter(r => r.companyId === company?.id).reduce((s, r) => s + r.timesMatched, 0)}
                  </p>
                  <p className="text-xs text-purple-600">Total Times Applied</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {allocationRules.filter(r => r.companyId === company?.id && r.source === 'default').length}
                  </p>
                  <p className="text-xs text-emerald-500">Default Rules</p>
                </div>
              </div>

              {/* How it works explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
                <p className="font-medium mb-1">How Smart Allocation Works:</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li><span className="font-medium text-emerald-700">Auto-match</span> — Rules with confidence 3+ automatically allocate matching transactions</li>
                  <li><span className="font-medium text-blue-700">AI-suggested</span> — Lower-confidence rules guide the AI to suggest allocations based on your patterns</li>
                  <li><span className="font-medium text-amber-700">Needs review</span> — No pattern found; AI guesses or falls back to general accounting rules</li>
                  <li>Every time you manually allocate a transaction, the system learns and strengthens the matching rule</li>
                </ul>
              </div>

              {/* Rules table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Pattern</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Account</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">VAT Rate</th>
                      <th className="text-center px-3 py-2 font-medium text-slate-600 w-20">Confidence</th>
                      <th className="text-center px-3 py-2 font-medium text-slate-600 w-16">Used</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-24">Last Used</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-20">Source</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationRules
                      .filter(r => r.companyId === company?.id)
                      .sort((a, b) => b.confidenceScore - a.confidenceScore)
                      .map(rule => (
                        <tr key={rule.id} className="border-t hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-xs max-w-[200px] truncate" title={rule.pattern}>
                            {rule.pattern}
                          </td>
                          <td className="px-3 py-2 text-xs">{rule.accountName}</td>
                          <td className="px-3 py-2 text-xs max-w-[140px] truncate" title={rule.vatRate}>
                            {rule.vatRate}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              rule.confidenceScore >= 3 ? 'bg-emerald-100 text-emerald-700' :
                              rule.confidenceScore >= 1 ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {rule.confidenceScore}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-xs">{rule.timesMatched}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{rule.lastUsed || '—'}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              rule.source === 'manual' ? 'bg-amber-100 text-amber-700' :
                              rule.source === 'default' ? 'bg-emerald-100 text-emerald-700' :
                              rule.source === 'ai-confirmed' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {rule.source || 'historical'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => saveAllocationRules(allocationRules.filter(r => r.id !== rule.id))}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {allocationRules.filter(r => r.companyId === company?.id).length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                          No allocation rules yet. Click &quot;Train from History&quot; to learn from your past transactions, or allocate transactions manually to start building rules automatically.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add manual rule form */}
              <div className="mt-4 p-3 border rounded-lg bg-slate-50">
                <h4 className="font-medium text-sm text-slate-700 mb-2">Add Manual Rule</h4>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs text-slate-500 block">Pattern (text to match in description/payee)</label>
                    <input
                      type="text"
                      id="newRulePattern"
                      placeholder="e.g. vodacom, monthly fee, pick n pay"
                      className="border rounded px-2 py-1.5 text-sm w-full mt-1"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs text-slate-500 block">Account</label>
                    <select id="newRuleAccount" className="border rounded px-2 py-1.5 text-sm w-full mt-1">
                      {selectionOptions.filter(o => o !== 'Unallocated Expen').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs text-slate-500 block">VAT Rate</label>
                    <select id="newRuleVat" className="border rounded px-2 py-1.5 text-sm w-full mt-1">
                      {VAT_RATES.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const patternEl = document.getElementById('newRulePattern');
                      const accountEl = document.getElementById('newRuleAccount');
                      const vatEl = document.getElementById('newRuleVat');
                      const pattern = patternEl?.value?.toLowerCase().trim();
                      const accountName = accountEl?.value;
                      const vatRate = vatEl?.value;
                      if (!pattern) { alert('Please enter a pattern to match'); return; }
                      const newRule = {
                        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        pattern,
                        patternType: 'manual',
                        accountName,
                        vatRate: vatRate || 'No VAT',
                        confidenceScore: 5,
                        timesMatched: 0,
                        lastUsed: new Date().toISOString().split('T')[0],
                        companyId: company?.id,
                        source: 'manual'
                      };
                      saveAllocationRules([...allocationRules, newRule]);
                      if (patternEl) patternEl.value = '';
                      setSaveMessage('Manual rule added successfully!');
                      setTimeout(() => setSaveMessage(''), 3000);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 whitespace-nowrap flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Rule
                  </button>
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-3 flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Confidence 3+ = auto-allocate. Lower confidence = guides AI suggestions. Manual rules start at confidence 5.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Delete ALL learned rules for this company? This cannot be undone.')) {
                      const otherRules = allocationRules.filter(r => r.companyId !== company?.id);
                      saveAllocationRules(otherRules);
                      setSaveMessage('All rules cleared for this company.');
                      setTimeout(() => setSaveMessage(''), 3000);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline"
                >
                  Clear All Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== BANK RULES TAB ====================
const BankRulesTab = ({ allocationRules, saveAllocationRules, company, selectionOptions, extractPatternsFromHistory, trainingInProgress, setSaveMessage }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [testDesc, setTestDesc] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [newRule, setNewRule] = useState({ pattern: '', accountName: '', vatRate: 'No VAT', matchType: 'contains', direction: 'both' });

  const companyRules = allocationRules
    .filter(r => r.companyId === company?.id)
    .filter(r => !filterText || r.pattern.toLowerCase().includes(filterText.toLowerCase()) || r.accountName.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  const testRule = () => {
    if (!testDesc.trim()) return;
    const desc = testDesc.toLowerCase();
    const match = allocationRules
      .filter(r => r.companyId === company?.id)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .find(r => {
        const p = r.pattern.toLowerCase();
        if (r.matchType === 'startswith') return desc.startsWith(p);
        if (r.matchType === 'endswith') return desc.endsWith(p);
        if (r.matchType === 'exact') return desc === p;
        return desc.includes(p);
      });
    setTestResult(match || null);
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditForm({ pattern: rule.pattern, accountName: rule.accountName, vatRate: rule.vatRate, matchType: rule.matchType || 'contains', direction: rule.direction || 'both' });
  };

  const saveEdit = () => {
    const updated = allocationRules.map(r => r.id === editingId ? { ...r, ...editForm } : r);
    saveAllocationRules(updated);
    setEditingId(null);
    setSaveMessage('Rule updated.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const addRule = () => {
    if (!newRule.pattern.trim()) return;
    const rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern: newRule.pattern.toLowerCase().trim(),
      matchType: newRule.matchType,
      direction: newRule.direction,
      accountName: newRule.accountName || selectionOptions.filter(o => o !== 'Unallocated Expen')[0],
      vatRate: newRule.vatRate,
      confidenceScore: 5,
      timesMatched: 0,
      lastUsed: new Date().toISOString().split('T')[0],
      companyId: company?.id,
      source: 'manual',
    };
    saveAllocationRules([...allocationRules, rule]);
    setNewRule({ pattern: '', accountName: '', vatRate: 'No VAT', matchType: 'contains', direction: 'both' });
    setSaveMessage('Rule added.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-5 p-1">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Auto-allocate (≥3)', value: allocationRules.filter(r => r.companyId === company?.id && r.confidenceScore >= 3).length, color: 'emerald' },
          { label: 'Learning (1–2)', value: allocationRules.filter(r => r.companyId === company?.id && r.confidenceScore < 3 && r.confidenceScore >= 1).length, color: 'blue' },
          { label: 'Total Times Applied', value: allocationRules.filter(r => r.companyId === company?.id).reduce((s, r) => s + r.timesMatched, 0), color: 'purple' },
          { label: 'Manual Rules', value: allocationRules.filter(r => r.companyId === company?.id && r.source === 'manual').length, color: 'amber' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-3 text-center border border-${s.color}-100`}>
            <p className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</p>
            <p className={`text-xs text-${s.color}-600 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">How Smart Allocation Works</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li><span className="font-medium text-emerald-700">Confidence ≥ 3</span> — auto-allocates matching transactions without AI</li>
          <li><span className="font-medium text-blue-700">Confidence 1–2</span> — guides AI suggestions; user confirms</li>
          <li>Every manual allocation strengthens the rule automatically</li>
        </ul>
      </div>

      {/* Test Rule */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><Search className="w-4 h-4" /> Test a Rule</h3>
        <p className="text-xs text-slate-500 mb-2">Paste a bank transaction description to see which rule would match it.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testDesc}
            onChange={e => setTestDesc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && testRule()}
            placeholder="e.g. VODACOM*MONTHLY SUBSCRIPTION"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button onClick={testRule} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Test</button>
        </div>
        {testResult !== undefined && testDesc && (
          <div className={`mt-2 p-2 rounded text-sm ${testResult ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {testResult
              ? <>✓ <strong>Match:</strong> "{testResult.pattern}" → <strong>{testResult.accountName}</strong> | VAT: {testResult.vatRate} | Confidence: {testResult.confidenceScore}</>
              : '✗ No rule matched. Transaction would go to AI allocation or manual review.'}
          </div>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-700">Allocation Rules</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{companyRules.length} rules</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Filter by pattern or account…"
              className="border rounded px-3 py-1.5 text-sm w-52"
            />
            <button
              onClick={extractPatternsFromHistory}
              disabled={trainingInProgress}
              className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {trainingInProgress ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Training…</> : <><TrendingUp className="w-3.5 h-3.5" />Train from History</>}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Pattern</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-20">Match</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Account</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">VAT Rate</th>
                <th className="text-center px-3 py-2 font-medium text-slate-600 w-20">Confidence</th>
                <th className="text-center px-3 py-2 font-medium text-slate-600 w-14">Used</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 w-16">Source</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {companyRules.map(rule => (
                <tr key={rule.id} className="border-t hover:bg-slate-50">
                  {editingId === rule.id ? (
                    <>
                      <td className="px-2 py-1.5">
                        <input value={editForm.pattern} onChange={e => setEditForm(f => ({ ...f, pattern: e.target.value }))} className="border rounded px-2 py-1 text-xs w-full" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={editForm.matchType} onChange={e => setEditForm(f => ({ ...f, matchType: e.target.value }))} className="border rounded px-1 py-1 text-xs w-full">
                          <option value="contains">Contains</option>
                          <option value="startswith">Starts with</option>
                          <option value="endswith">Ends with</option>
                          <option value="exact">Exact</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={editForm.accountName} onChange={e => setEditForm(f => ({ ...f, accountName: e.target.value }))} className="border rounded px-1 py-1 text-xs w-full">
                          {selectionOptions.filter(o => o !== 'Unallocated Expen').map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={editForm.vatRate} onChange={e => setEditForm(f => ({ ...f, vatRate: e.target.value }))} className="border rounded px-1 py-1 text-xs w-full">
                          {VAT_RATES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                        </select>
                      </td>
                      <td colSpan={3} />
                      <td className="px-2 py-1.5 flex gap-1">
                        <button onClick={saveEdit} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 bg-slate-200 rounded hover:bg-slate-300"><X className="w-3.5 h-3.5" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-mono text-xs max-w-[180px] truncate" title={rule.pattern}>{rule.pattern}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{rule.matchType || 'contains'}</td>
                      <td className="px-3 py-2 text-xs">{rule.accountName}</td>
                      <td className="px-3 py-2 text-xs max-w-[130px] truncate" title={rule.vatRate}>{rule.vatRate}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rule.confidenceScore >= 3 ? 'bg-emerald-100 text-emerald-700' : rule.confidenceScore >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rule.confidenceScore}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">{rule.timesMatched}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${rule.source === 'manual' ? 'bg-amber-100 text-amber-700' : rule.source === 'default' ? 'bg-emerald-100 text-emerald-700' : rule.source === 'ai-confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {rule.source || 'learned'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(rule)} className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => saveAllocationRules(allocationRules.filter(r => r.id !== rule.id))} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {companyRules.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-400 text-sm">No rules found. Add a manual rule below or click "Train from History".</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Rule Form */}
        <div className="p-4 border-t bg-slate-50">
          <h4 className="font-medium text-sm text-slate-700 mb-3">Add New Rule</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Pattern</label>
              <input type="text" value={newRule.pattern} onChange={e => setNewRule(r => ({ ...r, pattern: e.target.value }))} placeholder="e.g. vodacom" className="border rounded px-2 py-1.5 text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Match Type</label>
              <select value={newRule.matchType} onChange={e => setNewRule(r => ({ ...r, matchType: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-full">
                <option value="contains">Contains</option>
                <option value="startswith">Starts with</option>
                <option value="endswith">Ends with</option>
                <option value="exact">Exact</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Account</label>
              <select value={newRule.accountName} onChange={e => setNewRule(r => ({ ...r, accountName: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-full">
                {selectionOptions.filter(o => o !== 'Unallocated Expen').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">VAT Rate</label>
              <select value={newRule.vatRate} onChange={e => setNewRule(r => ({ ...r, vatRate: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-full">
                {VAT_RATES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <button onClick={addRule} className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="px-4 py-2 border-t flex justify-between items-center">
          <p className="text-xs text-slate-400">Confidence ≥ 3 = auto-allocate. Manual rules start at 5.</p>
          <button
            onClick={() => { if (window.confirm('Delete ALL rules for this company? This cannot be undone.')) { saveAllocationRules(allocationRules.filter(r => r.companyId !== company?.id)); } }}
            className="text-xs text-red-500 hover:text-red-700 hover:underline"
          >Clear All Rules</button>
        </div>
      </div>
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

  // Filter transactions by company first, then by type and rate
  const companyVatTransactions = company?.id ? vatTransactions.filter(t => t.companyId === company.id) : vatTransactions;
  const standardOutputTxns = companyVatTransactions.filter(t => t.vatType === 'output' && isStandardRate(t.vatRate));
  const zeroOutputTxns = companyVatTransactions.filter(t => t.vatType === 'output' && !isStandardRate(t.vatRate));
  const standardInputTxns = companyVatTransactions.filter(t => t.vatType === 'input' && isStandardRate(t.vatRate));
  const zeroInputTxns = companyVatTransactions.filter(t => t.vatType === 'input' && !isStandardRate(t.vatRate));

  // All output and input transactions
  const outputTransactions = companyVatTransactions.filter(t => t.vatType === 'output');
  const inputTransactions = companyVatTransactions.filter(t => t.vatType === 'input');

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

        // Helper to find a row value by checking if any header contains one of the given keywords
        const findField = (...keywords) => {
          for (const keyword of keywords) {
            if (row[keyword] !== undefined && row[keyword] !== '') return row[keyword];
            const matchKey = headers.find(h => h.includes(keyword));
            if (matchKey && row[matchKey] !== undefined && row[matchKey] !== '') return row[matchKey];
          }
          return '';
        };

        // Helper to parse numbers that may have comma thousands separators (e.g. "4,908.72")
        const parseNum = (val) => {
          if (!val) return 0;
          return parseFloat(String(val).replace(/,/g, '')) || 0;
        };

        // Parse date - handle DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD formats
        const rawDate = findField('date', 'transactiondate', 'invoicedate');
        let date;
        if (rawDate) {
          const slashParts = rawDate.split('/');
          const dashParts = rawDate.split('-');
          if (slashParts.length === 3) {
            const [d, m, y] = slashParts.map(p => p.trim());
            date = `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else if (dashParts.length === 3 && dashParts[0].length === 4) {
            date = rawDate;
          } else {
            date = rawDate;
          }
        } else {
          date = new Date().toISOString().split('T')[0];
        }

        const reference = findField('reference', 'ref', 'invoiceno', 'documentno');
        const description = findField('description', 'desc', 'details', 'name');
        const account = findField('account', 'accountname', 'category');
        const exclusive = parseNum(findField('excl', 'exclusive', 'nett', 'amount'));
        const vat = parseNum(findField('vatamount', 'vat', 'tax'));
        const inclusive = parseNum(findField('incl', 'inclusive', 'total')) || (exclusive + vat);
        const vatRate = findField('vatrate', 'rate') || (vat > 0 ? 'Standard 15%' : 'Zero Rated');

        let vatType = 'output';
        const explicitType = (findField('vattype', 'type') || '').toLowerCase();
        if (explicitType.includes('input') || explicitType.includes('purchase')) {
          vatType = 'input';
        } else if (explicitType.includes('output') || explicitType.includes('sale')) {
          vatType = 'output';
        }

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
          vatRate,
          companyId: company?.id
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
      vatRate,
      companyId: company?.id
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

  // Clear all transactions for the current company
  const clearAll = () => {
    if (companyVatTransactions.length > 0) {
      const remaining = company?.id ? vatTransactions.filter(t => t.companyId !== company.id) : [];
      saveVatTransactions(remaining);
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
const ReportsView = ({ bankStatements, invoices, company, accounts = [] }) => {
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

  // VAT category classifier for proper SA categorization
  const getVATCategory = (rate) => {
    if (!rate || rate === 'No VAT') return 'none';
    if (rate.includes('Exempt')) return 'exempt';
    if (rate.includes('15.00%') || rate.includes('15%') || rate === 'Standard 15%') return 'standard';
    if (rate.includes('Zero Rate') || rate.includes('Zero Rated') || rate === 'Zero Rated') return 'zero';
    if (rate.includes('100.00%') || rate.includes('Imported') || rate.includes('Adjustment')) return 'capital';
    return 'none';
  };

  // Helper: build account balances from both bank statements AND invoices
  const getAccountBalancesWithInvoices = () => {
    const companyStatements = company?.id ? bankStatements.filter(s => s.companyId === company.id) : bankStatements;
    const companyInvoices = company?.id ? invoices.filter(inv => inv.companyId === company.id) : invoices;
    const filteredStmts = filterByDateRange(companyStatements);
    const filteredInvs = filterByDateRange(companyInvoices);
    const accountBalances = {};

    // Bank statements -> account balances (existing logic)
    filteredStmts.forEach(stmt => {
      const cat = stmt.selection || 'Unallocated';
      if (!accountBalances[cat]) accountBalances[cat] = { debit: 0, credit: 0 };
      accountBalances[cat].debit += stmt.spent || 0;
      accountBalances[cat].credit += stmt.received || 0;
    });

    // Customer invoices -> Sales revenue (credit side)
    const customerInvs = filteredInvs.filter(inv => inv.invoiceType !== 'supplier');
    customerInvs.forEach(inv => {
      const salesKey = 'Sales';
      if (!accountBalances[salesKey]) accountBalances[salesKey] = { debit: 0, credit: 0 };
      const invoiceTotal = inv.amount || (inv.items || []).reduce((sum, item) => {
        const excl = (item.qty || 0) * (item.price || 0);
        const vat = excl * getVATRate(item.vatType);
        return sum + excl + vat;
      }, 0);
      accountBalances[salesKey].credit += invoiceTotal;

      // Add to Trade Receivables (debit) if not paid
      if (inv.status !== 'Paid') {
        const trKey = 'Trade Receivables';
        if (!accountBalances[trKey]) accountBalances[trKey] = { debit: 0, credit: 0 };
        accountBalances[trKey].debit += invoiceTotal;
      }
    });

    // Supplier invoices -> Purchases / Cost of Sales (debit side)
    const supplierInvs = filteredInvs.filter(inv => inv.invoiceType === 'supplier');
    supplierInvs.forEach(inv => {
      const purchKey = inv.account || 'Purchases';
      if (!accountBalances[purchKey]) accountBalances[purchKey] = { debit: 0, credit: 0 };
      const invoiceTotal = inv.amount || (inv.items || []).reduce((sum, item) => {
        const excl = (item.qty || 0) * (item.price || 0);
        const vat = excl * getVATRate(item.vatType);
        return sum + excl + vat;
      }, 0);
      accountBalances[purchKey].debit += invoiceTotal;

      // Add to Trade Payables (credit) if not paid
      if (inv.status !== 'Paid') {
        const tpKey = 'Trade Payables';
        if (!accountBalances[tpKey]) accountBalances[tpKey] = { debit: 0, credit: 0 };
        accountBalances[tpKey].credit += invoiceTotal;
      }
    });

    return accountBalances;
  };

  // Sage One account category classification
  const SAGE_CATEGORY_ORDER = [
    { group: 'Balance Sheet', type: 'heading' },
    { group: 'Non-Current Assets', type: 'section', code: '1000', nature: 'debit' },
    { group: 'Current Assets', type: 'section', code: '2000', nature: 'debit' },
    { group: 'Equity', type: 'section', code: '3000', nature: 'credit' },
    { group: 'Non-Current Liabilities', type: 'section', code: '4000', nature: 'credit' },
    { group: 'Current Liabilities', type: 'section', code: '5000', nature: 'credit' },
    { group: 'Income Statement', type: 'heading' },
    { group: 'Sales', type: 'section', code: '6000', nature: 'credit' },
    { group: 'Cost of Sales', type: 'section', code: '7000', nature: 'debit' },
    { group: 'Other Income', type: 'section', code: '7500', nature: 'credit' },
    { group: 'Expenses', type: 'section', code: '8000', nature: 'debit' },
    { group: 'Income Tax', type: 'section', code: '9000', nature: 'debit' },
  ];

  const generateTrialBalance = () => {
    // Use combined bank statements + invoice data
    const accountBalances = getAccountBalancesWithInvoices();

    // Map accounts to Sage One categories with account codes
    const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
    const accountMap = {};
    accountsList.forEach(acc => { accountMap[acc.name] = acc; });

    // Build structured trial balance
    const result = [];
    let totalDebit = 0;
    let totalCredit = 0;

    SAGE_CATEGORY_ORDER.forEach(section => {
      if (section.type === 'heading') {
        result.push({ isHeading: true, name: section.group });
        return;
      }

      // Find all accounts in this category
      const catAccounts = accountsList.filter(a => a.category === section.group && a.active);
      const sectionRows = [];
      let sectionDebit = 0;
      let sectionCredit = 0;

      catAccounts.forEach((acc, idx) => {
        const accCode = `${section.code.slice(0, -2)}${String(idx + 1).padStart(2, '0')}`;
        const bal = accountBalances[acc.name] || { debit: 0, credit: 0 };
        const opening = acc.openingBalance || 0;
        let debit = bal.debit;
        let credit = bal.credit;
        // Add opening balances based on account nature
        if (section.nature === 'debit') debit += opening;
        else credit += opening;

        if (debit > 0 || credit > 0 || opening !== 0) {
          sectionRows.push({
            code: accCode,
            name: acc.name,
            debit,
            credit,
            balance: debit - credit
          });
          sectionDebit += debit;
          sectionCredit += credit;
        }
      });

      // Also catch unallocated items that match this category name
      if (accountBalances[section.group]) {
        const bal = accountBalances[section.group];
        if (bal.debit > 0 || bal.credit > 0) {
          sectionRows.push({ code: `${section.code.slice(0, -2)}99`, name: `${section.group} (Unallocated)`, debit: bal.debit, credit: bal.credit, balance: bal.debit - bal.credit });
          sectionDebit += bal.debit;
          sectionCredit += bal.credit;
        }
      }

      if (sectionRows.length > 0) {
        result.push({ isSectionHeader: true, name: section.group, code: section.code });
        sectionRows.forEach(row => result.push(row));
        result.push({ isSectionTotal: true, name: `Total ${section.group}`, debit: sectionDebit, credit: sectionCredit, balance: sectionDebit - sectionCredit });
        totalDebit += sectionDebit;
        totalCredit += sectionCredit;
      }
    });

    // Catch any remaining unallocated
    const mappedNames = new Set(accountsList.map(a => a.name));
    const sageGroups = new Set(SAGE_CATEGORY_ORDER.filter(s => s.type === 'section').map(s => s.group));
    Object.entries(accountBalances).forEach(([name, bal]) => {
      if (!mappedNames.has(name) && !sageGroups.has(name) && (bal.debit > 0 || bal.credit > 0)) {
        if (!result.some(r => r.isHeading && r.name === 'Unallocated')) {
          result.push({ isSectionHeader: true, name: 'Unallocated', code: '9900' });
        }
        result.push({ code: '9999', name, debit: bal.debit, credit: bal.credit, balance: bal.debit - bal.credit });
        totalDebit += bal.debit;
        totalCredit += bal.credit;
      }
    });

    result.push({ isGrandTotal: true, name: 'Grand Total', debit: totalDebit, credit: totalCredit, balance: totalDebit - totalCredit });
    return result;
  };

  const generateVATReport = () => {
    const companyStatements = company?.id ? bankStatements.filter(s => s.companyId === company.id) : bankStatements;
    const companyInvoices = company?.id ? invoices.filter(inv => inv.companyId === company.id) : invoices;
    const filteredStatements = filterByDateRange(companyStatements);
    const filteredInvoices = filterByDateRange(companyInvoices);

    const vatData = {
      standardOutput: { vat: 0, transactions: [] },
      zeroOutput: { vat: 0, transactions: [] },
      exemptOutput: { vat: 0, transactions: [] },
      capitalOutput: { vat: 0, transactions: [] },
      standardInput: { vat: 0, transactions: [] },
      zeroInput: { vat: 0, transactions: [] },
      exemptInput: { vat: 0, transactions: [] },
      capitalInput: { vat: 0, transactions: [] }
    };

    // Process CUSTOMER invoices only as Output VAT (revenue)
    const customerInvoices = filteredInvoices.filter(inv => inv.invoiceType !== 'supplier');
    customerInvoices.forEach(inv => {
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

          const category = getVATCategory(item.vatType);
          if (category === 'standard') {
            vatData.standardOutput.vat += vat;
            vatData.standardOutput.transactions.push(txn);
          } else if (category === 'exempt') {
            vatData.exemptOutput.transactions.push({ ...txn, vat: 0 });
          } else if (category === 'capital') {
            vatData.capitalOutput.vat += vat;
            vatData.capitalOutput.transactions.push(txn);
          } else if (category === 'zero') {
            vatData.zeroOutput.transactions.push({ ...txn, vat: 0 });
          }
          // 'none' (No VAT) transactions are excluded from VAT report
        });
      }
    });

    // Process SUPPLIER invoices as Input VAT
    const supplierInvoices = filteredInvoices.filter(inv => inv.invoiceType === 'supplier');
    supplierInvoices.forEach(inv => {
      if (inv.items) {
        inv.items.forEach(item => {
          const exclusive = (item.qty || 0) * (item.price || 0);
          const vatRate = getVATRate(item.vatType);
          const vat = exclusive * vatRate;

          const txn = {
            date: inv.date,
            reference: inv.documentNo,
            account: inv.supplier || 'Supplier',
            description: item.description,
            exclusive,
            vat,
            inclusive: exclusive + vat
          };

          const category = getVATCategory(item.vatType);
          if (category === 'standard') {
            vatData.standardInput.vat += vat;
            vatData.standardInput.transactions.push(txn);
          } else if (category === 'exempt') {
            vatData.exemptInput.transactions.push({ ...txn, vat: 0 });
          } else if (category === 'capital') {
            vatData.capitalInput.vat += vat;
            vatData.capitalInput.transactions.push(txn);
          } else if (category === 'zero') {
            vatData.zeroInput.transactions.push({ ...txn, vat: 0 });
          }
        });
      }
    });

    // Process bank statements (Input VAT) - spending
    filteredStatements.forEach(stmt => {
      if (stmt.spent > 0) {
        const rate = getVATRate(stmt.vatRate);
        const exclusive = rate > 0 ? stmt.spent / (1 + rate) : stmt.spent;
        const vat = rate > 0 ? stmt.spent - exclusive : 0;

        const txn = {
          date: stmt.date,
          reference: stmt.reference,
          account: stmt.payee || stmt.selection || stmt.type,
          description: stmt.description,
          exclusive,
          vat,
          inclusive: stmt.spent
        };

        const category = getVATCategory(stmt.vatRate);
        if (category === 'standard') {
          vatData.standardInput.vat += vat;
          vatData.standardInput.transactions.push(txn);
        } else if (category === 'exempt') {
          vatData.exemptInput.transactions.push({ ...txn, vat: 0 });
        } else if (category === 'capital') {
          vatData.capitalInput.vat += vat;
          vatData.capitalInput.transactions.push(txn);
        } else if (category === 'zero') {
          vatData.zeroInput.transactions.push({ ...txn, vat: 0 });
        }
      }
    });

    // Process bank statements - received amounts as Output VAT (if not already covered by invoices)
    filteredStatements.forEach(stmt => {
      if (stmt.received > 0 && !stmt.linkedInvoice) {
        const rate = getVATRate(stmt.vatRate);
        const exclusive = rate > 0 ? stmt.received / (1 + rate) : stmt.received;
        const vat = rate > 0 ? stmt.received - exclusive : 0;

        const txn = {
          date: stmt.date,
          reference: stmt.reference,
          account: stmt.payee || stmt.selection || stmt.type,
          description: stmt.description,
          exclusive,
          vat,
          inclusive: stmt.received
        };

        const category = getVATCategory(stmt.vatRate);
        if (category === 'standard') {
          vatData.standardOutput.vat += vat;
          vatData.standardOutput.transactions.push(txn);
        } else if (category === 'exempt') {
          vatData.exemptOutput.transactions.push({ ...txn, vat: 0 });
        } else if (category === 'capital') {
          vatData.capitalOutput.vat += vat;
          vatData.capitalOutput.transactions.push(txn);
        } else if (category === 'zero') {
          vatData.zeroOutput.transactions.push({ ...txn, vat: 0 });
        }
      }
    });

    return vatData;
  };

  // Export to Excel (CSV format that Excel can open)
  const exportToExcel = () => {
    let csv = '';
    const formatAmount = (amt) => amt.toFixed(2);
    
    if (reportType === 'trial-balance' || reportType === 'income-statement' || reportType === 'balance-sheet') {
      const data = generateTrialBalance();
      const reportTitle = reportType === 'trial-balance' ? 'Trial Balance' : reportType === 'income-statement' ? 'Income Statement' : 'Balance Sheet';
      csv = `${reportTitle} Report\n`;
      csv += `${company?.name || 'Company'}\n`;
      csv += `Period: ${startDate} to ${endDate}\n\n`;
      csv += 'Code,Account,Debit,Credit,Balance\n';
      data.forEach(row => {
        if (row.isHeading) { csv += `\n"${row.name}"\n`; return; }
        if (row.isSectionHeader) { csv += `"${row.code}","${row.name}"\n`; return; }
        if (row.isSectionTotal) { csv += `,"${row.name}",${formatAmount(row.debit)},${formatAmount(row.credit)},${formatAmount(row.balance)}\n\n`; return; }
        if (row.isGrandTotal) { csv += `\n,"${row.name}",${formatAmount(row.debit)},${formatAmount(row.credit)},${formatAmount(row.balance)}\n`; return; }
        csv += `"${row.code}","${row.name}",${formatAmount(row.debit)},${formatAmount(row.credit)},${formatAmount(row.balance)}\n`;
      });
    } else {
      const vatData = generateVATReport();
      csv = 'VAT Report\n';
      csv += `Period: ${startDate} to ${endDate}\n\n`;

      // VAT Summary
      const stdOutVAT = vatData.standardOutput.vat;
      const stdOutIncl = vatData.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroOutIncl = vatData.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const exemptOutIncl = vatData.exemptOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const capOutVAT = vatData.capitalOutput.vat;
      const capOutIncl = vatData.capitalOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const stdInVAT = vatData.standardInput.vat;
      const stdInIncl = vatData.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroInIncl = vatData.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const exemptInIncl = vatData.exemptInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const capInVAT = vatData.capitalInput.vat;
      const capInIncl = vatData.capitalInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const totalOutVAT = stdOutVAT + capOutVAT;
      const totalInVAT = stdInVAT + capInVAT;
      const totalOutIncl = stdOutIncl + zeroOutIncl + exemptOutIncl + capOutIncl;
      const totalInIncl = stdInIncl + zeroInIncl + exemptInIncl + capInIncl;

      csv += 'VAT SUMMARY\n';
      csv += ',Output VAT (VAT),Output VAT (Inclusive),Input VAT (VAT),Input VAT (Inclusive),Net VAT,Net Inclusive\n';
      csv += `Standard Rate (15%),${formatAmount(stdOutVAT)},${formatAmount(stdOutIncl)},${formatAmount(stdInVAT)},${formatAmount(stdInIncl)},${formatAmount(stdOutVAT - stdInVAT)},${formatAmount(stdOutIncl - stdInIncl)}\n`;
      csv += `Zero Rate,0.00,${formatAmount(zeroOutIncl)},0.00,${formatAmount(zeroInIncl)},0.00,${formatAmount(zeroOutIncl - zeroInIncl)}\n`;
      csv += `Exempt & Non-Supplies,0.00,${formatAmount(exemptOutIncl)},0.00,${formatAmount(exemptInIncl)},0.00,${formatAmount(exemptOutIncl - exemptInIncl)}\n`;
      if (capOutIncl > 0 || capInIncl > 0) csv += `Capital & Imports,${formatAmount(capOutVAT)},${formatAmount(capOutIncl)},${formatAmount(capInVAT)},${formatAmount(capInIncl)},${formatAmount(capOutVAT - capInVAT)},${formatAmount(capOutIncl - capInIncl)}\n`;
      csv += `Grand Total,${formatAmount(totalOutVAT)},${formatAmount(totalOutIncl)},${formatAmount(totalInVAT)},${formatAmount(totalInIncl)},${formatAmount(totalOutVAT - totalInVAT)},${formatAmount(totalOutIncl - totalInIncl)}\n`;
      csv += `\nAmount Payable,${formatAmount(totalOutVAT - totalInVAT)}\n\n`;

      const csvSection = (title, txns) => {
        csv += `${title}\n`;
        csv += 'Date,Reference,Account,Description,Exclusive,VAT,Inclusive\n';
        txns.forEach(t => { csv += `${t.date},"${t.reference || ''}","${t.account || ''}","${t.description || ''}",${formatAmount(t.exclusive)},${formatAmount(t.vat)},${formatAmount(t.inclusive)}\n`; });
      };

      csvSection('STANDARD RATE (15%) - OUTPUT VAT', vatData.standardOutput.transactions);
      csv += '\n';
      csvSection('ZERO RATE - OUTPUT VAT', vatData.zeroOutput.transactions);
      csv += '\n';
      csvSection('EXEMPT & NON-SUPPLIES - OUTPUT', vatData.exemptOutput.transactions);
      if (vatData.capitalOutput.transactions.length > 0) { csv += '\n'; csvSection('CAPITAL & IMPORTS - OUTPUT', vatData.capitalOutput.transactions); }
      csv += '\n';
      csvSection('STANDARD RATE (15%) - INPUT VAT', vatData.standardInput.transactions);
      csv += '\n';
      csvSection('ZERO RATE - INPUT VAT', vatData.zeroInput.transactions);
      csv += '\n';
      csvSection('EXEMPT & NON-SUPPLIES - INPUT', vatData.exemptInput.transactions);
      if (vatData.capitalInput.transactions.length > 0) { csv += '\n'; csvSection('CAPITAL & IMPORTS - INPUT', vatData.capitalInput.transactions); }
    }
    
    const reportNames = { 'trial-balance': 'Trial_Balance', 'income-statement': 'Income_Statement', 'balance-sheet': 'Balance_Sheet', 'vat': 'VAT_Report' };
    const fileName = `${reportNames[reportType] || 'Report'}_${startDate}_to_${endDate}.csv`;
    
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
      const totalDebit = data.reduce((s, r) => s + (r.debit || 0), 0);
      const totalCredit = data.reduce((s, r) => s + (r.credit || 0), 0);
      const totalBalance = data.reduce((s, r) => s + (r.balance || 0), 0);

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
            ${data.map(row => {
              if (row.isHeading) return `<tr><td colspan="4" class="section-header" style="background:#e2e8f0;color:#1e293b;font-size:13px;font-weight:bold;padding:10px 6px;">${row.name}</td></tr>`;
              if (row.isSectionHeader) return `<tr><td colspan="4" class="section-header" style="background:#dbeafe;color:#1e40af;">${row.code} — ${row.name}</td></tr>`;
              if (row.isSectionTotal) return `<tr class="total-row"><td colspan="1"><strong>${row.name}</strong></td><td class="text-right"><strong>${formatAmount(row.debit)}</strong></td><td class="text-right"><strong>${formatAmount(row.credit)}</strong></td><td class="text-right"><strong>${formatAmount(row.balance)}</strong></td></tr>`;
              if (row.isGrandTotal) return `<tr style="background:#059669;color:#fff;font-weight:bold;"><td>${row.name}</td><td class="text-right">${formatAmount(row.debit)}</td><td class="text-right">${formatAmount(row.credit)}</td><td class="text-right">${formatAmount(row.balance)}</td></tr>`;
              return `<tr><td style="padding-left:20px">${row.code || ''} ${row.name}</td><td class="text-right">${formatAmount(row.debit || 0)}</td><td class="text-right">${formatAmount(row.credit || 0)}</td><td class="text-right ${(row.balance || 0) >= 0 ? 'positive' : 'negative'}">${formatAmount(row.balance || 0)}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'income-statement') {
      const incomeCategories = ['Sales', 'Cost of Sales', 'Other Income', 'Expenses', 'Income Tax'];
      const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
      const accountBalances = getAccountBalancesWithInvoices();
      let totalRevenue = 0, totalCOS = 0, totalOtherIncome = 0, totalExp = 0, totalTax = 0;
      const categoryData = incomeCategories.map(cat => {
        const catAccounts = accountsList.filter(a => a.category === cat && a.active);
        const rows = catAccounts.map(acc => {
          const bal = accountBalances[acc.name] || { debit: 0, credit: 0 };
          const amount = (cat === 'Sales' || cat === 'Other Income') ? (bal.credit - bal.debit) : (bal.debit - bal.credit);
          return { name: acc.name, amount };
        }).filter(r => r.amount !== 0);
        const total = rows.reduce((s, r) => s + r.amount, 0);
        if (cat === 'Sales') totalRevenue = total;
        if (cat === 'Cost of Sales') totalCOS = total;
        if (cat === 'Other Income') totalOtherIncome = total;
        if (cat === 'Expenses') totalExp = total;
        if (cat === 'Income Tax') totalTax = total;
        return { category: cat, rows, total };
      });
      const grossProfit = totalRevenue - totalCOS;
      const operatingProfit = grossProfit + totalOtherIncome - totalExp;
      const netProfit = operatingProfit - totalTax;

      htmlContent += `
        <h1>INCOME STATEMENT</h1>
        <p class="period">For the period ${startDate} to ${endDate}</p>
        <p class="period">Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead><tr><th style="width:70%">Description</th><th class="text-right" style="width:30%">Amount (R)</th></tr></thead>
          <tbody>
            ${categoryData.map(({ category, rows, total }) => `
              <tr><td colspan="2" class="section-header" style="background:#dbeafe;color:#1e40af;">${category}</td></tr>
              ${rows.map(r => `<tr><td style="padding-left:20px">${r.name}</td><td class="text-right ${r.amount < 0 ? 'negative' : ''}">${formatAmount(r.amount)}</td></tr>`).join('')}
              ${rows.length === 0 ? '<tr><td colspan="2" style="padding-left:20px;color:#6b7280;">No transactions</td></tr>' : ''}
              <tr class="total-row"><td><strong>Total ${category}</strong></td><td class="text-right"><strong>${formatAmount(total)}</strong></td></tr>
              ${category === 'Cost of Sales' ? `<tr style="background:#dcfce7;"><td><strong>Gross Profit</strong></td><td class="text-right"><strong class="positive">${formatAmount(grossProfit)}</strong></td></tr>` : ''}
            `).join('')}
            <tr style="background:#dbeafe;"><td><strong>Operating Profit</strong></td><td class="text-right"><strong>${formatAmount(operatingProfit)}</strong></td></tr>
            <tr style="background:#059669;color:#fff;font-size:13px;"><td><strong>Net Profit / (Loss)</strong></td><td class="text-right"><strong>${formatAmount(netProfit)}</strong></td></tr>
          </tbody>
        </table>
      `;
    } else if (reportType === 'balance-sheet') {
      const bsCategories = ['Non-Current Assets', 'Current Assets', 'Equity', 'Non-Current Liabilities', 'Current Liabilities'];
      const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
      const accountBalances = getAccountBalancesWithInvoices();
      const assetNatures = new Set(['Non-Current Assets', 'Current Assets']);
      const categoryData = bsCategories.map(cat => {
        const catAccounts = accountsList.filter(a => a.category === cat && a.active);
        const rows = catAccounts.map(acc => {
          const bal = accountBalances[acc.name] || { debit: 0, credit: 0 };
          const opening = acc.openingBalance || 0;
          const amount = assetNatures.has(cat) ? (bal.debit - bal.credit + opening) : (bal.credit - bal.debit + opening);
          return { name: acc.name, amount };
        }).filter(r => r.amount !== 0);
        const total = rows.reduce((s, r) => s + r.amount, 0);
        return { category: cat, rows, total };
      });
      const totalAssets = categoryData.filter(c => assetNatures.has(c.category)).reduce((s, c) => s + c.total, 0);
      const totalEquityLiabilities = categoryData.filter(c => !assetNatures.has(c.category)).reduce((s, c) => s + c.total, 0);

      htmlContent += `
        <h1>STATEMENT OF FINANCIAL POSITION</h1>
        <p class="period">As at ${endDate}</p>
        <p class="period">Generated: ${new Date().toLocaleDateString()}</p>
        <h2 style="border-bottom:2px solid #374151;">ASSETS</h2>
        <table>
          <thead><tr><th style="width:70%">Description</th><th class="text-right" style="width:30%">Amount (R)</th></tr></thead>
          <tbody>
            ${categoryData.filter(c => assetNatures.has(c.category)).map(({ category, rows, total }) => `
              <tr><td colspan="2" class="section-header" style="background:#dbeafe;color:#1e40af;">${category}</td></tr>
              ${rows.map(r => `<tr><td style="padding-left:20px">${r.name}</td><td class="text-right">${formatAmount(r.amount)}</td></tr>`).join('')}
              ${rows.length === 0 ? '<tr><td colspan="2" style="padding-left:20px;color:#6b7280;">—</td></tr>' : ''}
              <tr class="total-row"><td><strong>Total ${category}</strong></td><td class="text-right"><strong>${formatAmount(total)}</strong></td></tr>
            `).join('')}
            <tr style="background:#4f46e5;color:#fff;font-weight:bold;"><td>Total Assets</td><td class="text-right">${formatAmount(totalAssets)}</td></tr>
          </tbody>
        </table>
        <h2 style="border-bottom:2px solid #374151;margin-top:20px;">EQUITY & LIABILITIES</h2>
        <table>
          <thead><tr><th style="width:70%">Description</th><th class="text-right" style="width:30%">Amount (R)</th></tr></thead>
          <tbody>
            ${categoryData.filter(c => !assetNatures.has(c.category)).map(({ category, rows, total }) => `
              <tr><td colspan="2" class="section-header" style="background:#dbeafe;color:#1e40af;">${category}</td></tr>
              ${rows.map(r => `<tr><td style="padding-left:20px">${r.name}</td><td class="text-right">${formatAmount(r.amount)}</td></tr>`).join('')}
              ${rows.length === 0 ? '<tr><td colspan="2" style="padding-left:20px;color:#6b7280;">—</td></tr>' : ''}
              <tr class="total-row"><td><strong>Total ${category}</strong></td><td class="text-right"><strong>${formatAmount(total)}</strong></td></tr>
            `).join('')}
            <tr style="background:#4f46e5;color:#fff;font-weight:bold;"><td>Total Equity & Liabilities</td><td class="text-right">${formatAmount(totalEquityLiabilities)}</td></tr>
          </tbody>
        </table>
        ${Math.abs(totalAssets - totalEquityLiabilities) > 0.01 ? `<div style="margin-top:15px;padding:10px;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;color:#92400e;">Balance sheet does not balance. Difference: ${formatAmount(totalAssets - totalEquityLiabilities)}</div>` : ''}
      `;
    } else {
      const vatData = generateVATReport();
      const stdOutVAT = vatData.standardOutput.vat;
      const stdOutIncl = vatData.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroOutIncl = vatData.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const exemptOutIncl = vatData.exemptOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const capOutVAT = vatData.capitalOutput.vat;
      const capOutIncl = vatData.capitalOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const stdInVAT = vatData.standardInput.vat;
      const stdInIncl = vatData.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const zeroInIncl = vatData.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const exemptInIncl = vatData.exemptInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const capInVAT = vatData.capitalInput.vat;
      const capInIncl = vatData.capitalInput.transactions.reduce((s, t) => s + t.inclusive, 0);
      const totalOutVAT = stdOutVAT + capOutVAT;
      const totalInVAT = stdInVAT + capInVAT;
      const totalOutIncl = stdOutIncl + zeroOutIncl + exemptOutIncl + capOutIncl;
      const totalInIncl = stdInIncl + zeroInIncl + exemptInIncl + capInIncl;
      const netVATCalc = totalOutVAT - totalInVAT;

      const pdfTxnTable = (txns, vat) => `
        <table><thead><tr><th>Date</th><th>Reference</th><th>Account</th><th>Description</th><th class="text-right">Exclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr></thead>
        <tbody>${txns.length > 0 ? txns.map(t => `<tr><td>${t.date}</td><td>${t.reference}</td><td>${t.account}</td><td>${t.description}</td><td class="text-right">${formatAmount(t.exclusive)}</td><td class="text-right">${formatAmount(t.vat)}</td><td class="text-right">${formatAmount(t.inclusive)}</td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:15px;">No transactions</td></tr>'}
        ${txns.length > 0 ? `<tr class="total-row"><td colspan="4"><strong>Subtotal</strong></td><td class="text-right"><strong>${formatAmount(txns.reduce((s,t) => s + t.exclusive, 0))}</strong></td><td class="text-right"><strong>${formatAmount(vat)}</strong></td><td class="text-right"><strong>${formatAmount(txns.reduce((s,t) => s + t.inclusive, 0))}</strong></td></tr>` : ''}</tbody></table>`;

      htmlContent += `
        <h1>VAT REPORT</h1>
        <p class="period">Period: ${startDate} to ${endDate}</p>
        <p class="period">Generated: ${new Date().toLocaleDateString()}</p>

        <h2>VAT SUMMARY</h2>
        <table>
          <thead>
            <tr><th></th><th colspan="2" style="text-align:center;background:#dbeafe;color:#1e40af;">Output VAT</th><th colspan="2" style="text-align:center;background:#dcfce7;color:#166534;">Input VAT</th><th colspan="2" style="text-align:center;background:#f3f4f6;">Net VAT</th></tr>
            <tr><th></th><th class="text-right">VAT</th><th class="text-right">Inclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th><th class="text-right">VAT</th><th class="text-right">Inclusive</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Standard Rate (15%)</strong></td><td class="text-right">${formatAmount(stdOutVAT)}</td><td class="text-right">${formatAmount(stdOutIncl)}</td><td class="text-right">${formatAmount(stdInVAT)}</td><td class="text-right">${formatAmount(stdInIncl)}</td><td class="text-right">${formatAmount(stdOutVAT - stdInVAT)}</td><td class="text-right">${formatAmount(stdOutIncl - stdInIncl)}</td></tr>
            <tr><td><strong>Zero Rate</strong></td><td class="text-right">${formatAmount(0)}</td><td class="text-right">${formatAmount(zeroOutIncl)}</td><td class="text-right">${formatAmount(0)}</td><td class="text-right">${formatAmount(zeroInIncl)}</td><td class="text-right">${formatAmount(0)}</td><td class="text-right">${formatAmount(zeroOutIncl - zeroInIncl)}</td></tr>
            <tr style="background:#fef3c7;"><td><strong>Exempt & Non-Supplies</strong></td><td class="text-right">${formatAmount(0)}</td><td class="text-right">${formatAmount(exemptOutIncl)}</td><td class="text-right">${formatAmount(0)}</td><td class="text-right">${formatAmount(exemptInIncl)}</td><td class="text-right">${formatAmount(0)}</td><td class="text-right">${formatAmount(exemptOutIncl - exemptInIncl)}</td></tr>
            ${(capOutIncl > 0 || capInIncl > 0) ? `<tr style="background:#fae8ff;"><td><strong>Capital & Imports</strong></td><td class="text-right">${formatAmount(capOutVAT)}</td><td class="text-right">${formatAmount(capOutIncl)}</td><td class="text-right">${formatAmount(capInVAT)}</td><td class="text-right">${formatAmount(capInIncl)}</td><td class="text-right">${formatAmount(capOutVAT - capInVAT)}</td><td class="text-right">${formatAmount(capOutIncl - capInIncl)}</td></tr>` : ''}
            <tr class="total-row"><td><strong>GRAND TOTAL</strong></td><td class="text-right"><strong>${formatAmount(totalOutVAT)}</strong></td><td class="text-right"><strong>${formatAmount(totalOutIncl)}</strong></td><td class="text-right"><strong>${formatAmount(totalInVAT)}</strong></td><td class="text-right"><strong>${formatAmount(totalInIncl)}</strong></td><td class="text-right ${netVATCalc >= 0 ? 'negative' : 'positive'}"><strong>${formatAmount(netVATCalc)}</strong></td><td class="text-right"><strong>${formatAmount(totalOutIncl - totalInIncl)}</strong></td></tr>
          </tbody>
        </table>
        <div class="summary-box"><span class="payable-label">Amount Payable: </span><span class="payable-amount ${netVATCalc >= 0 ? 'negative' : 'positive'}">${formatAmount(netVATCalc)}</span></div>

        <div class="section-header">STANDARD RATE (15%) - OUTPUT VAT</div>
        ${pdfTxnTable(vatData.standardOutput.transactions, vatData.standardOutput.vat)}
        <div class="section-header">ZERO RATE - OUTPUT VAT</div>
        ${pdfTxnTable(vatData.zeroOutput.transactions, 0)}
        <div class="section-header" style="background:#fef3c7;color:#92400e;">EXEMPT & NON-SUPPLIES - OUTPUT</div>
        ${pdfTxnTable(vatData.exemptOutput.transactions, 0)}
        ${vatData.capitalOutput.transactions.length > 0 ? `<div class="section-header" style="background:#fae8ff;color:#6b21a8;">CAPITAL & IMPORTS - OUTPUT</div>${pdfTxnTable(vatData.capitalOutput.transactions, vatData.capitalOutput.vat)}` : ''}

        <div class="section-header-green">STANDARD RATE (15%) - INPUT VAT</div>
        ${pdfTxnTable(vatData.standardInput.transactions, vatData.standardInput.vat)}
        <div class="section-header-green">ZERO RATE - INPUT VAT</div>
        ${pdfTxnTable(vatData.zeroInput.transactions, 0)}
        <div class="section-header-green" style="background:#fef3c7;color:#92400e;">EXEMPT & NON-SUPPLIES - INPUT</div>
        ${pdfTxnTable(vatData.exemptInput.transactions, 0)}
        ${vatData.capitalInput.transactions.length > 0 ? `<div class="section-header-green" style="background:#fae8ff;color:#6b21a8;">CAPITAL & IMPORTS - INPUT</div>${pdfTxnTable(vatData.capitalInput.transactions, vatData.capitalInput.vat)}` : ''}
      `;
    }
    
    htmlContent += `</body></html>`;

    // Open in new window for browser print-to-PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    setGenerating(false);
  };

  const trialBalance = generateTrialBalance();
  const vatReport = generateVATReport();
  const totalOutputVAT = vatReport.standardOutput.vat + vatReport.capitalOutput.vat;
  const totalInputVAT = vatReport.standardInput.vat + vatReport.capitalInput.vat;
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
            {reportType === 'trial-balance' && (
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
                    {trialBalance.map((row, idx) => {
                      if (row.isHeading) return <tr key={idx}><td colSpan={4} className="border px-4 py-2 bg-slate-200 font-bold text-slate-800">{row.name}</td></tr>;
                      if (row.isSectionHeader) return <tr key={idx}><td colSpan={4} className="border px-4 py-2 bg-blue-50 font-semibold text-blue-800">{row.code} — {row.name}</td></tr>;
                      if (row.isSectionTotal) return <tr key={idx} className="bg-slate-50 font-semibold"><td className="border px-4 py-2">{row.name}</td><td className="border px-4 py-2 text-right">{formatAmount(row.debit)}</td><td className="border px-4 py-2 text-right">{formatAmount(row.credit)}</td><td className="border px-4 py-2 text-right">{formatAmount(row.balance)}</td></tr>;
                      if (row.isGrandTotal) return <tr key={idx} className="bg-emerald-600 text-white font-bold"><td className="border px-4 py-2">{row.name}</td><td className="border px-4 py-2 text-right">{formatAmount(row.debit)}</td><td className="border px-4 py-2 text-right">{formatAmount(row.credit)}</td><td className="border px-4 py-2 text-right">{formatAmount(row.balance)}</td></tr>;
                      return (
                        <tr key={idx}>
                          <td className="border px-4 py-2 pl-8">{row.code} {row.name}</td>
                          <td className="border px-4 py-2 text-right">{formatAmount(row.debit || 0)}</td>
                          <td className="border px-4 py-2 text-right">{formatAmount(row.credit || 0)}</td>
                          <td className={`border px-4 py-2 text-right font-medium ${(row.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatAmount(row.balance || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
            {reportType === 'income-statement' && (() => {
              const incomeCategories = ['Sales', 'Cost of Sales', 'Other Income', 'Expenses', 'Income Tax'];
              const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
              const ab = getAccountBalancesWithInvoices();
              let tRev = 0, tCOS = 0, tOI = 0, tEx = 0, tTax = 0;
              const catData = incomeCategories.map(cat => {
                const rows = accountsList.filter(a => a.category === cat && a.active).map(acc => { const bal = ab[acc.name] || { debit: 0, credit: 0 }; return { name: acc.name, amount: (cat === 'Sales' || cat === 'Other Income') ? (bal.credit - bal.debit) : (bal.debit - bal.credit) }; }).filter(r => r.amount !== 0);
                const total = rows.reduce((s, r) => s + r.amount, 0);
                if (cat === 'Sales') tRev = total; if (cat === 'Cost of Sales') tCOS = total; if (cat === 'Other Income') tOI = total; if (cat === 'Expenses') tEx = total; if (cat === 'Income Tax') tTax = total;
                return { category: cat, rows, total };
              });
              const gp = tRev - tCOS, op = gp + tOI - tEx, np = op - tTax;
              return (
                <>
                  <h1 className="text-2xl font-bold text-blue-700 mb-1">INCOME STATEMENT</h1>
                  <p className="text-slate-600 mb-6">For the period {startDate} to {endDate}</p>
                  {catData.map(({ category, rows, total }) => (
                    <div key={category} className="mb-3">
                      <div className="bg-blue-50 px-4 py-2 font-semibold text-blue-800 border border-blue-200">{category}</div>
                      {rows.map((r, i) => <div key={i} className="flex justify-between px-6 py-1 text-sm border-x border-slate-200"><span>{r.name}</span><span className={r.amount < 0 ? 'text-red-600' : ''}>{formatAmount(r.amount)}</span></div>)}
                      {rows.length === 0 && <div className="px-6 py-1 text-sm text-slate-400 border-x border-slate-200">No transactions</div>}
                      <div className="flex justify-between px-4 py-2 font-semibold border border-slate-200 bg-slate-50"><span>Total {category}</span><span>{formatAmount(total)}</span></div>
                      {category === 'Cost of Sales' && <div className="flex justify-between px-4 py-2 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 mt-1"><span>Gross Profit</span><span>{formatAmount(gp)}</span></div>}
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2 font-bold text-blue-700 bg-blue-50 border border-blue-200 mt-2"><span>Operating Profit</span><span>{formatAmount(op)}</span></div>
                  <div className="flex justify-between px-4 py-3 font-bold text-lg text-white bg-emerald-600 rounded mt-2"><span>Net Profit / (Loss)</span><span>{formatAmount(np)}</span></div>
                </>
              );
            })()}
            {reportType === 'balance-sheet' && (() => {
              const bsCats = ['Non-Current Assets', 'Current Assets', 'Equity', 'Non-Current Liabilities', 'Current Liabilities'];
              const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
              const ab = getAccountBalancesWithInvoices();
              const assetSet = new Set(['Non-Current Assets', 'Current Assets']);
              const catData = bsCats.map(cat => {
                const rows = accountsList.filter(a => a.category === cat && a.active).map(acc => { const bal = ab[acc.name] || { debit: 0, credit: 0 }; const op = acc.openingBalance || 0; return { name: acc.name, amount: assetSet.has(cat) ? (bal.debit - bal.credit + op) : (bal.credit - bal.debit + op) }; }).filter(r => r.amount !== 0);
                return { category: cat, rows, total: rows.reduce((s, r) => s + r.amount, 0) };
              });
              const totA = catData.filter(c => assetSet.has(c.category)).reduce((s, c) => s + c.total, 0);
              const totEL = catData.filter(c => !assetSet.has(c.category)).reduce((s, c) => s + c.total, 0);
              const renderSection = (title, cats, totLabel, tot) => (
                <>
                  <div className="font-bold text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-3 mt-4">{title}</div>
                  {cats.map(({ category, rows, total }) => (
                    <div key={category} className="mb-3">
                      <div className="bg-blue-50 px-4 py-2 font-semibold text-blue-800 border border-blue-200">{category}</div>
                      {rows.map((r, i) => <div key={i} className="flex justify-between px-6 py-1 text-sm border-x border-slate-200"><span>{r.name}</span><span>{formatAmount(r.amount)}</span></div>)}
                      {rows.length === 0 && <div className="px-6 py-1 text-sm text-slate-400 border-x border-slate-200">—</div>}
                      <div className="flex justify-between px-4 py-2 font-semibold border border-slate-200 bg-slate-50"><span>Total {category}</span><span>{formatAmount(total)}</span></div>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2 font-bold text-white bg-indigo-600 rounded"><span>{totLabel}</span><span>{formatAmount(tot)}</span></div>
                </>
              );
              return (
                <>
                  <h1 className="text-2xl font-bold text-indigo-700 mb-1">STATEMENT OF FINANCIAL POSITION</h1>
                  <p className="text-slate-600 mb-4">As at {endDate}</p>
                  {renderSection('ASSETS', catData.filter(c => assetSet.has(c.category)), 'Total Assets', totA)}
                  {renderSection('EQUITY & LIABILITIES', catData.filter(c => !assetSet.has(c.category)), 'Total Equity & Liabilities', totEL)}
                  {Math.abs(totA - totEL) > 0.01 && <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded text-amber-800 text-sm">Balance sheet does not balance. Difference: R {formatAmount(totA - totEL)}</div>}
                </>
              );
            })()}
            {reportType === 'vat' && (
              <>
                <h1 className="text-2xl font-bold text-emerald-700 mb-1">VAT REPORT</h1>
                <p className="text-slate-600 mb-6">Period: {startDate} to {endDate}</p>

                {/* VAT Summary */}
                {(() => {
                  const sOV = vatReport.standardOutput.vat, sOI = vatReport.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const zOI = vatReport.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const eOI = vatReport.exemptOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const cOV = vatReport.capitalOutput.vat, cOI = vatReport.capitalOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const sIV = vatReport.standardInput.vat, sII = vatReport.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const zII = vatReport.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const eII = vatReport.exemptInput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const cIV = vatReport.capitalInput.vat, cII = vatReport.capitalInput.transactions.reduce((s, t) => s + t.inclusive, 0);
                  const tOV = sOV + cOV, tIV = sIV + cIV, tOI = sOI + zOI + eOI + cOI, tII = sII + zII + eII + cII;
                  const nv = tOV - tIV;

                  const SummaryRow = ({ label, oVat, oIncl, iVat, iIncl, bg }) => (
                    <tr className={bg || ''}>
                      <td className="border px-3 py-2 font-medium">{label}</td>
                      <td className="border px-3 py-2 text-right">{formatAmount(oVat)}</td>
                      <td className="border px-3 py-2 text-right">{formatAmount(oIncl)}</td>
                      <td className="border px-3 py-2 text-right">{formatAmount(iVat)}</td>
                      <td className="border px-3 py-2 text-right">{formatAmount(iIncl)}</td>
                      <td className="border px-3 py-2 text-right">{formatAmount(oVat - iVat)}</td>
                      <td className="border px-3 py-2 text-right">{formatAmount(oIncl - iIncl)}</td>
                    </tr>
                  );

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
                          <SummaryRow label="Standard Rate (15%)" oVat={sOV} oIncl={sOI} iVat={sIV} iIncl={sII} />
                          <SummaryRow label="Zero Rate" oVat={0} oIncl={zOI} iVat={0} iIncl={zII} />
                          <SummaryRow label="Exempt & Non-Supplies" oVat={0} oIncl={eOI} iVat={0} iIncl={eII} bg="bg-amber-50" />
                          {(cOI > 0 || cII > 0) && <SummaryRow label="Capital & Imports" oVat={cOV} oIncl={cOI} iVat={cIV} iIncl={cII} bg="bg-purple-50" />}
                          <tr className="bg-slate-100 font-bold">
                            <td className="border px-3 py-2">Grand Total</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(tOV)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(tOI)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(tIV)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(tII)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(nv)}</td>
                            <td className="border px-3 py-2 text-right">{formatAmount(tOI - tII)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="bg-slate-100 p-4 rounded mb-6">
                        <span className="font-semibold">Amount Payable: </span>
                        <span className={`text-xl font-bold ${nv >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatAmount(nv)}</span>
                      </div>
                    </>
                  );
                })()}

                {/* Transaction Sections */}
                <div className="space-y-6 text-sm">
                  <VATSection title="Standard Rate (15%) - Output VAT" color="blue" transactions={vatReport.standardOutput.transactions} subtotal={vatReport.standardOutput.vat} />
                  <VATSection title="Zero Rate - Output VAT" color="blue" transactions={vatReport.zeroOutput.transactions} subtotal={0} />
                  <VATSection title="Exempt & Non-Supplies - Output" color="amber" transactions={vatReport.exemptOutput.transactions} subtotal={0} />
                  {vatReport.capitalOutput.transactions.length > 0 && <VATSection title="Capital & Imports - Output" color="purple" transactions={vatReport.capitalOutput.transactions} subtotal={vatReport.capitalOutput.vat} />}
                  <VATSection title="Standard Rate (15%) - Input VAT" color="green" transactions={vatReport.standardInput.transactions} subtotal={vatReport.standardInput.vat} />
                  <VATSection title="Zero Rate - Input VAT" color="green" transactions={vatReport.zeroInput.transactions} subtotal={0} />
                  <VATSection title="Exempt & Non-Supplies - Input" color="amber" transactions={vatReport.exemptInput.transactions} subtotal={0} />
                  {vatReport.capitalInput.transactions.length > 0 && <VATSection title="Capital & Imports - Input" color="purple" transactions={vatReport.capitalInput.transactions} subtotal={vatReport.capitalInput.vat} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const VATSection = ({ title, color, transactions, subtotal }) => {
    const colorMap = { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', amber: 'bg-amber-100 text-amber-800', purple: 'bg-purple-100 text-purple-800' };
    return (
    <div className="mb-6">
      <h4 className={`font-semibold px-3 py-2 ${colorMap[color] || colorMap.blue} rounded-t`}>
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
  };

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
              <option value="income-statement">Income Statement</option>
              <option value="balance-sheet">Balance Sheet</option>
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

      {/* Trial Balance Report — Sage One Style */}
      {reportType === 'trial-balance' && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-emerald-700 to-emerald-600">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg">Trial Balance</h3>
                <p className="text-emerald-100 text-sm">{company?.name || 'Company'} • {startDate} to {endDate}</p>
              </div>
              <div className="text-right text-emerald-100 text-xs">
                <div>Generated: {new Date().toLocaleDateString('en-ZA')}</div>
                {company?.registrationNo && <div>Reg: {company.registrationNo}</div>}
              </div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs w-20">Code</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs">Account</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs w-36">Debit (R)</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs w-36">Credit (R)</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs w-36">Balance (R)</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((row, idx) => {
                if (row.isHeading) return (
                  <tr key={idx} className="bg-slate-700">
                    <td colSpan={5} className="px-4 py-3 text-white font-bold text-sm tracking-wide">{row.name}</td>
                  </tr>
                );
                if (row.isSectionHeader) return (
                  <tr key={idx} className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-4 py-2 text-slate-400 font-mono text-xs">{row.code}</td>
                    <td colSpan={4} className="px-4 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider">{row.name}</td>
                  </tr>
                );
                if (row.isSectionTotal) return (
                  <tr key={idx} className="bg-slate-50 border-t border-slate-300">
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 font-semibold text-slate-600 text-xs">{row.name}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-700 border-t border-slate-300">{row.debit > 0 ? row.debit.toLocaleString('en-ZA', {minimumFractionDigits: 2}) : '—'}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-700 border-t border-slate-300">{row.credit > 0 ? row.credit.toLocaleString('en-ZA', {minimumFractionDigits: 2}) : '—'}</td>
                    <td className={`px-4 py-2 text-right font-semibold border-t border-slate-300 ${row.balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{row.balance.toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td>
                  </tr>
                );
                if (row.isGrandTotal) return (
                  <tr key={idx} className="bg-emerald-50 border-t-2 border-emerald-600 font-bold">
                    <td className="px-4 py-4"></td>
                    <td className="px-4 py-4 text-emerald-800 text-sm">{row.name}</td>
                    <td className="px-4 py-4 text-right text-emerald-800 border-t-2 border-b-2 border-emerald-600">{row.debit.toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-4 text-right text-emerald-800 border-t-2 border-b-2 border-emerald-600">{row.credit.toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td>
                    <td className={`px-4 py-4 text-right border-t-2 border-b-2 border-emerald-600 ${row.balance >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>{row.balance.toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td>
                  </tr>
                );
                return (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-400 font-mono text-xs">{row.code}</td>
                    <td className="px-4 py-2 text-slate-700">{row.name}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{row.debit > 0 ? row.debit.toLocaleString('en-ZA', {minimumFractionDigits: 2}) : '—'}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{row.credit > 0 ? row.credit.toLocaleString('en-ZA', {minimumFractionDigits: 2}) : '—'}</td>
                    <td className={`px-4 py-2 text-right font-medium ${row.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{row.balance.toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Income Statement — Sage One Style */}
      {reportType === 'income-statement' && (() => {
        const incomeCategories = ['Sales', 'Cost of Sales', 'Other Income', 'Expenses', 'Income Tax'];
        const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
        const filtered = filterByDateRange(bankStatements);
        const accountBalances = {};
        filtered.forEach(stmt => {
          const cat = stmt.selection || 'Unallocated';
          if (!accountBalances[cat]) accountBalances[cat] = { debit: 0, credit: 0 };
          accountBalances[cat].debit += stmt.spent || 0;
          accountBalances[cat].credit += stmt.received || 0;
        });

        let totalRevenue = 0;
        let totalCOS = 0;
        let totalOtherIncome = 0;
        let totalExpenses = 0;
        let totalTax = 0;

        const categoryData = incomeCategories.map(cat => {
          const catAccounts = accountsList.filter(a => a.category === cat && a.active);
          const rows = catAccounts.map(acc => {
            const bal = accountBalances[acc.name] || { debit: 0, credit: 0 };
            const amount = (cat === 'Sales' || cat === 'Other Income') ? (bal.credit - bal.debit) : (bal.debit - bal.credit);
            return { name: acc.name, amount };
          }).filter(r => r.amount !== 0);
          const total = rows.reduce((s, r) => s + r.amount, 0);
          if (cat === 'Sales') totalRevenue = total;
          if (cat === 'Cost of Sales') totalCOS = total;
          if (cat === 'Other Income') totalOtherIncome = total;
          if (cat === 'Expenses') totalExpenses = total;
          if (cat === 'Income Tax') totalTax = total;
          return { category: cat, rows, total };
        });

        const grossProfit = totalRevenue - totalCOS;
        const operatingProfit = grossProfit + totalOtherIncome - totalExpenses;
        const netProfit = operatingProfit - totalTax;
        const fmt = (v) => v.toLocaleString('en-ZA', { minimumFractionDigits: 2 });

        return (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-700 to-blue-600">
              <h3 className="font-bold text-white text-lg">Income Statement</h3>
              <p className="text-blue-100 text-sm">{company?.name || 'Company'} • For the period {startDate} to {endDate}</p>
            </div>
            <div className="p-6">
              {categoryData.map(({ category, rows, total }) => (
                <div key={category} className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">{category}</div>
                  {rows.map((r, i) => (
                    <div key={i} className="flex justify-between py-1 px-2 text-sm text-slate-700 hover:bg-slate-50">
                      <span className="pl-4">{r.name}</span>
                      <span className={r.amount >= 0 ? 'text-slate-700' : 'text-red-600'}>{fmt(r.amount)}</span>
                    </div>
                  ))}
                  {rows.length === 0 && <div className="text-sm text-slate-400 pl-4 py-1">No transactions</div>}
                  <div className="flex justify-between py-2 px-2 text-sm font-semibold text-slate-800 border-t border-slate-200 mt-1">
                    <span>Total {category}</span>
                    <span>{fmt(total)}</span>
                  </div>
                  {category === 'Cost of Sales' && (
                    <div className="flex justify-between py-3 px-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded mt-2 mb-2">
                      <span>Gross Profit</span><span>{fmt(grossProfit)}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between py-3 px-2 font-bold text-blue-700 bg-blue-50 rounded mt-2 border border-blue-200">
                <span>Operating Profit</span><span>{fmt(operatingProfit)}</span>
              </div>
              <div className="flex justify-between py-4 px-2 font-bold text-lg text-emerald-800 bg-emerald-50 rounded mt-3 border-2 border-emerald-600">
                <span>Net Profit / (Loss)</span><span className={netProfit >= 0 ? '' : 'text-red-600'}>{fmt(netProfit)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Balance Sheet — Sage One Style */}
      {reportType === 'balance-sheet' && (() => {
        const bsCategories = ['Non-Current Assets', 'Current Assets', 'Equity', 'Non-Current Liabilities', 'Current Liabilities'];
        const accountsList = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;
        const filtered = filterByDateRange(bankStatements);
        const accountBalances = {};
        filtered.forEach(stmt => {
          const cat = stmt.selection || 'Unallocated';
          if (!accountBalances[cat]) accountBalances[cat] = { debit: 0, credit: 0 };
          accountBalances[cat].debit += stmt.spent || 0;
          accountBalances[cat].credit += stmt.received || 0;
        });

        const assetNatures = new Set(['Non-Current Assets', 'Current Assets']);

        const categoryData = bsCategories.map(cat => {
          const catAccounts = accountsList.filter(a => a.category === cat && a.active);
          const rows = catAccounts.map(acc => {
            const bal = accountBalances[acc.name] || { debit: 0, credit: 0 };
            const opening = acc.openingBalance || 0;
            const amount = assetNatures.has(cat)
              ? (bal.debit - bal.credit + opening)
              : (bal.credit - bal.debit + opening);
            return { name: acc.name, amount };
          }).filter(r => r.amount !== 0);
          const total = rows.reduce((s, r) => s + r.amount, 0);
          return { category: cat, rows, total };
        });

        const totalAssets = categoryData.filter(c => assetNatures.has(c.category)).reduce((s, c) => s + c.total, 0);
        const totalEquityLiabilities = categoryData.filter(c => !assetNatures.has(c.category)).reduce((s, c) => s + c.total, 0);
        const fmt = (v) => v.toLocaleString('en-ZA', { minimumFractionDigits: 2 });

        return (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-indigo-700 to-indigo-600">
              <h3 className="font-bold text-white text-lg">Statement of Financial Position</h3>
              <p className="text-indigo-100 text-sm">{company?.name || 'Company'} • As at {endDate}</p>
            </div>
            <div className="p-6">
              <div className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-300 pb-2 mb-4">ASSETS</div>
              {categoryData.filter(c => assetNatures.has(c.category)).map(({ category, rows, total }) => (
                <div key={category} className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 mb-2">{category}</div>
                  {rows.map((r, i) => (
                    <div key={i} className="flex justify-between py-1 px-2 text-sm text-slate-700 hover:bg-slate-50">
                      <span className="pl-4">{r.name}</span>
                      <span>{fmt(r.amount)}</span>
                    </div>
                  ))}
                  {rows.length === 0 && <div className="text-sm text-slate-400 pl-4 py-1">—</div>}
                  <div className="flex justify-between py-2 px-2 text-sm font-semibold text-slate-800 border-t border-slate-200 mt-1">
                    <span>Total {category}</span><span>{fmt(total)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between py-3 px-2 font-bold text-indigo-700 bg-indigo-50 rounded border border-indigo-200 mb-6">
                <span>Total Assets</span><span>{fmt(totalAssets)}</span>
              </div>

              <div className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b-2 border-slate-300 pb-2 mb-4">EQUITY & LIABILITIES</div>
              {categoryData.filter(c => !assetNatures.has(c.category)).map(({ category, rows, total }) => (
                <div key={category} className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 mb-2">{category}</div>
                  {rows.map((r, i) => (
                    <div key={i} className="flex justify-between py-1 px-2 text-sm text-slate-700 hover:bg-slate-50">
                      <span className="pl-4">{r.name}</span>
                      <span>{fmt(r.amount)}</span>
                    </div>
                  ))}
                  {rows.length === 0 && <div className="text-sm text-slate-400 pl-4 py-1">—</div>}
                  <div className="flex justify-between py-2 px-2 text-sm font-semibold text-slate-800 border-t border-slate-200 mt-1">
                    <span>Total {category}</span><span>{fmt(total)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between py-3 px-2 font-bold text-indigo-700 bg-indigo-50 rounded border border-indigo-200">
                <span>Total Equity & Liabilities</span><span>{fmt(totalEquityLiabilities)}</span>
              </div>

              {Math.abs(totalAssets - totalEquityLiabilities) > 0.01 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded text-amber-800 text-sm">
                  Balance sheet does not balance. Difference: R {fmt(totalAssets - totalEquityLiabilities)}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* VAT Report */}
      {reportType === 'vat' && (
        <div className="space-y-6">
          {/* VAT Summary Table */}
          {(() => {
            const sOV = vatReport.standardOutput.vat, sOI = vatReport.standardOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const zOI = vatReport.zeroOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const eOI = vatReport.exemptOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const cOV = vatReport.capitalOutput.vat, cOI = vatReport.capitalOutput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const sIV = vatReport.standardInput.vat, sII = vatReport.standardInput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const zII = vatReport.zeroInput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const eII = vatReport.exemptInput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const cIV = vatReport.capitalInput.vat, cII = vatReport.capitalInput.transactions.reduce((s, t) => s + t.inclusive, 0);
            const tOV = sOV + cOV, tIV = sIV + cIV;
            const tOI = sOI + zOI + eOI + cOI, tII = sII + zII + eII + cII;
            const nv = tOV - tIV, ni = tOI - tII;

            const formatAmount = (amount) => {
              const formatted = Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return amount < 0 ? `R -${formatted}` : `R ${formatted}`;
            };

            const SummaryRow = ({ label, oV, oI, iV, iI, bg }) => (
              <tr className={`border-b hover:bg-slate-50 ${bg || ''}`}>
                <td className="px-4 py-3 font-medium text-slate-700 border-r">{label}</td>
                <td className="px-4 py-3 text-right text-blue-700 bg-blue-50/30">{formatAmount(oV)}</td>
                <td className="px-4 py-3 text-right text-blue-700 border-r bg-blue-50/30">{formatAmount(oI)}</td>
                <td className="px-4 py-3 text-right text-green-700 bg-green-50/30">{formatAmount(iV)}</td>
                <td className="px-4 py-3 text-right text-green-700 border-r bg-green-50/30">{formatAmount(iI)}</td>
                <td className={`px-4 py-3 text-right font-medium ${(oV - iV) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatAmount(oV - iV)}</td>
                <td className={`px-4 py-3 text-right font-medium ${(oI - iI) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatAmount(oI - iI)}</td>
              </tr>
            );

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
                        <th colSpan={2} className="text-center px-4 py-2 font-semibold text-blue-700 border-r bg-blue-50">Output VAT</th>
                        <th colSpan={2} className="text-center px-4 py-2 font-semibold text-green-700 border-r bg-green-50">Input VAT</th>
                        <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 bg-slate-50">Net VAT</th>
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
                      <SummaryRow label="Standard Rate (15%)" oV={sOV} oI={sOI} iV={sIV} iI={sII} />
                      <SummaryRow label="Zero Rate" oV={0} oI={zOI} iV={0} iI={zII} />
                      <SummaryRow label="Exempt & Non-Supplies" oV={0} oI={eOI} iV={0} iI={eII} bg="bg-amber-50/50" />
                      {(cOI > 0 || cII > 0) && <SummaryRow label="Capital & Imports" oV={cOV} oI={cOI} iV={cIV} iI={cII} bg="bg-purple-50/50" />}
                      <tr className="bg-slate-100 font-bold">
                        <td className="px-4 py-3 text-slate-800 border-r">Grand Total</td>
                        <td className="px-4 py-3 text-right text-blue-800 bg-blue-100/50">{formatAmount(tOV)}</td>
                        <td className="px-4 py-3 text-right text-blue-800 border-r bg-blue-100/50">{formatAmount(tOI)}</td>
                        <td className="px-4 py-3 text-right text-green-800 bg-green-100/50">{formatAmount(tIV)}</td>
                        <td className="px-4 py-3 text-right text-green-800 border-r bg-green-100/50">{formatAmount(tII)}</td>
                        <td className={`px-4 py-3 text-right ${nv < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatAmount(nv)}</td>
                        <td className={`px-4 py-3 text-right ${ni < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatAmount(ni)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700">Amount Payable</span>
                    <span className={`text-2xl font-bold ${nv >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatAmount(nv)}</span>
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
            <VATSection title="Standard Rate (15%) - Output VAT" color="blue" transactions={vatReport.standardOutput.transactions} subtotal={vatReport.standardOutput.vat} />
            <VATSection title="Zero Rate - Output VAT" color="blue" transactions={vatReport.zeroOutput.transactions} subtotal={0} />
            <VATSection title="Exempt & Non-Supplies - Output" color="amber" transactions={vatReport.exemptOutput.transactions} subtotal={0} />
            {vatReport.capitalOutput.transactions.length > 0 && <VATSection title="Capital & Imports - Output" color="purple" transactions={vatReport.capitalOutput.transactions} subtotal={vatReport.capitalOutput.vat} />}
            <VATSection title="Standard Rate (15%) - Input VAT" color="green" transactions={vatReport.standardInput.transactions} subtotal={vatReport.standardInput.vat} />
            <VATSection title="Zero Rate - Input VAT" color="green" transactions={vatReport.zeroInput.transactions} subtotal={0} />
            <VATSection title="Exempt & Non-Supplies - Input" color="amber" transactions={vatReport.exemptInput.transactions} subtotal={0} />
            {vatReport.capitalInput.transactions.length > 0 && <VATSection title="Capital & Imports - Input" color="purple" transactions={vatReport.capitalInput.transactions} subtotal={vatReport.capitalInput.vat} />}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CASH FLOW FORECAST VIEW ====================
const CashFlowForecastView = ({ invoices, bankStatements, company }) => {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const fmtR = (n) => `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Company-scoped bank statements
  const stmts = company?.id ? bankStatements.filter(s => s.companyId === company.id) : bankStatements;
  const companyInvoices = company?.id ? invoices.filter(i => i.companyId === company.id) : invoices;

  // Current bank balance = last known balance or sum of received - spent
  const currentBalance = stmts.length > 0
    ? stmts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0]?.balance
      || stmts.reduce((s, t) => s + (t.received || 0) - (t.spent || 0), 0)
    : 0;

  // Manual expected outflows state
  const [outflows, setOutflows] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('cf-outflows') || '[]'); } catch { return []; }
  });
  const [newOutflow, setNewOutflow] = React.useState({ description: '', amount: '', date: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)) });
  const [scenario, setScenario] = React.useState('optimistic');

  const saveOutflows = (data) => {
    setOutflows(data);
    localStorage.setItem('cf-outflows', JSON.stringify(data));
  };

  // Build 13-week buckets
  const weeks = Array.from({ length: 13 }, (_, i) => {
    const start = new Date(today);
    start.setDate(today.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end, label: `W${i + 1} ${start.getDate()}/${start.getMonth() + 1}` };
  });

  // Pending/unpaid invoices as projected inflows keyed by due date
  const pendingInvoices = companyInvoices.filter(inv =>
    inv.status === 'Pending' || inv.status === 'Overdue' || inv.status === 'Sent'
  );

  const weeklyData = weeks.map((week, i) => {
    // Inflows: invoices due this week
    const invoiceInflows = pendingInvoices.filter(inv => {
      const due = new Date(inv.dueDate || inv.date);
      return due >= week.start && due <= week.end;
    }).reduce((s, inv) => s + (inv.total || inv.amount || 0), 0);

    // Apply scenario factor
    const scenarioFactor = scenario === 'optimistic' ? 1 : scenario === 'conservative' ? 0.5 : 0.75;
    const inflow = invoiceInflows * scenarioFactor;

    // Outflows: manual entries due this week
    const outflow = outflows.filter(o => {
      const d = new Date(o.date);
      return d >= week.start && d <= week.end;
    }).reduce((s, o) => s + parseFloat(o.amount || 0), 0);

    return { week: week.label, inflow, outflow, invoiceCount: pendingInvoices.filter(inv => { const due = new Date(inv.dueDate || inv.date); return due >= week.start && due <= week.end; }).length };
  });

  // Running balance
  let runningBalance = currentBalance;
  const forecastData = weeklyData.map(w => {
    const open = runningBalance;
    runningBalance = runningBalance + w.inflow - w.outflow;
    return { ...w, openBal: open, closeBal: runningBalance };
  });

  const totalPendingInvoicesValue = pendingInvoices.reduce((s, inv) => s + (inv.total || inv.amount || 0), 0);
  const totalOutflows13w = outflows.reduce((s, o) => s + parseFloat(o.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">13-Week Cash Flow Forecast</h2>
        <p className="text-emerald-100 text-sm">{company?.name || 'All Companies'} — as at {today.toLocaleDateString('en-ZA')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Current Bank Balance', value: fmtR(currentBalance), color: currentBalance >= 0 ? 'emerald' : 'red', sub: 'from bank statements' },
          { label: 'Outstanding Invoices', value: fmtR(totalPendingInvoicesValue), color: 'blue', sub: `${pendingInvoices.length} pending` },
          { label: 'Planned Outflows (13w)', value: fmtR(totalOutflows13w), color: 'amber', sub: `${outflows.length} entries` },
          { label: 'Forecast Closing Balance', value: fmtR(forecastData[12]?.closeBal || 0), color: (forecastData[12]?.closeBal || 0) >= 0 ? 'emerald' : 'red', sub: 'week 13' },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-xl border shadow-sm p-4 border-l-4 border-l-${k.color}-500`}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={`text-xl font-bold text-${k.color}-700`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Scenario selector */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-slate-700">Invoice Collection Scenario:</span>
        {[
          { id: 'optimistic', label: 'Optimistic (100%)' },
          { id: 'moderate', label: 'Moderate (75%)' },
          { id: 'conservative', label: 'Conservative (50%)' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${scenario === s.id ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-600 hover:border-emerald-400'}`}
          >{s.label}</button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="font-semibold text-slate-700 mb-4">Weekly Cash Flow & Running Balance</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={forecastData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmtR(v)} />
            <Legend />
            <Line type="monotone" dataKey="closeBal" name="Running Balance" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
            <Bar dataKey="inflow" name="Inflows" fill="#34d399" opacity={0.7} />
            <Bar dataKey="outflow" name="Outflows" fill="#f87171" opacity={0.7} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Combined Bar + Line chart */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="font-semibold text-slate-700 mb-4">Inflows vs Outflows by Week</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={forecastData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmtR(v)} />
            <Legend />
            <Bar dataKey="inflow" name="Expected Inflows" fill="#10b981" radius={[3,3,0,0]} />
            <Bar dataKey="outflow" name="Planned Outflows" fill="#ef4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-700">Weekly Forecast Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Week</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Opening Balance</th>
                <th className="text-right px-4 py-2 font-medium text-emerald-600">Expected Inflows</th>
                <th className="text-right px-4 py-2 font-medium text-red-500">Planned Outflows</th>
                <th className="text-right px-4 py-2 font-medium text-slate-700">Closing Balance</th>
                <th className="text-center px-4 py-2 font-medium text-slate-500">Invoices Due</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((row, i) => (
                <tr key={i} className={`border-t ${row.closeBal < 0 ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2 font-medium text-slate-700">{row.week}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{fmtR(row.openBal)}</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-medium">{row.inflow > 0 ? `+${fmtR(row.inflow)}` : '—'}</td>
                  <td className="px-4 py-2 text-right text-red-500">{row.outflow > 0 ? `-${fmtR(row.outflow)}` : '—'}</td>
                  <td className={`px-4 py-2 text-right font-bold ${row.closeBal < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmtR(row.closeBal)}</td>
                  <td className="px-4 py-2 text-center">
                    {row.invoiceCount > 0 ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{row.invoiceCount}</span> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Outflows */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-700">Planned Outflows</h3>
          <p className="text-xs text-slate-500 mt-0.5">Add upcoming bills, payroll dates, loan repayments, or any expected payments.</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Description</label>
              <input type="text" value={newOutflow.description} onChange={e => setNewOutflow(o => ({ ...o, description: e.target.value }))} placeholder="e.g. Rent, Payroll, Loan" className="border rounded px-2 py-1.5 text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Amount (R)</label>
              <input type="number" value={newOutflow.amount} onChange={e => setNewOutflow(o => ({ ...o, amount: e.target.value }))} placeholder="0.00" className="border rounded px-2 py-1.5 text-sm w-full" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Expected Date</label>
                <input type="date" value={newOutflow.date} onChange={e => setNewOutflow(o => ({ ...o, date: e.target.value }))} className="border rounded px-2 py-1.5 text-sm w-full" />
              </div>
              <button
                onClick={() => {
                  if (!newOutflow.description || !newOutflow.amount) return;
                  saveOutflows([...outflows, { id: Date.now(), ...newOutflow }]);
                  setNewOutflow({ description: '', amount: '', date: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)) });
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 whitespace-nowrap flex items-center gap-1"
              ><Plus className="w-4 h-4" />Add</button>
            </div>
          </div>
          {outflows.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Description</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Amount</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Date</th>
                <th className="w-10"></th>
              </tr></thead>
              <tbody>
                {outflows.sort((a, b) => new Date(a.date) - new Date(b.date)).map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="px-3 py-2">{o.description}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-medium">{fmtR(o.amount)}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(o.date).toLocaleDateString('en-ZA')}</td>
                    <td className="px-3 py-2"><button onClick={() => saveOutflows(outflows.filter(x => x.id !== o.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-slate-400 text-center py-4">No planned outflows added yet.</p>}
        </div>
      </div>

      {/* Pending invoices breakdown */}
      {pendingInvoices.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold text-slate-700">Outstanding Invoices (Projected Inflows)</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Invoice #</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Customer</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Due Date</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Amount</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
              </tr></thead>
              <tbody>
                {pendingInvoices.sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date)).map(inv => (
                  <tr key={inv.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">{inv.invoiceNumber || inv.id}</td>
                    <td className="px-4 py-2">{inv.customerName || inv.client || '—'}</td>
                    <td className="px-4 py-2 text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-ZA') : '—'}</td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-700">{fmtR(inv.total || inv.amount)}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${inv.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


const PayrollView = ({ employees, saveEmployees, payslips, savePayslips, company }) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fmtR = (n) => `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const now = new Date();

  const [activePayrollTab, setActivePayrollTab] = useState('employees');
  const [openEmployeeSections, setOpenEmployeeSections] = useState({
    core: true,
    overtime: false,
    commission: false,
    allowances: false,
    retirement: false,
    medical: false,
    insurance: false,
    deductions: false,
    car: false,
    leave: false,
    banking: false
  });

  const defaultEmployee = {
    employeeNumber: '',
    firstName: '',
    lastName: '',
    idNumber: '',
    taxNumber: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    salaryType: 'monthly',
    basicSalary: 0,
    dateOfBirth: '',
    isActive: true,
    overtimeEligible: true,
    commissionEligible: false,
    travelAllowance: 0,
    cellPhoneAllowance: 0,
    housingAllowance: 0,
    shiftDifferential: 0,
    actingAllowance: 0,
    standbyAllowance: 0,
    toolUniformAllowance: 0,
    retirementFundType: 'None',
    retirementEmployeePercent: 7.5,
    retirementEmployerPercent: 7.5,
    medicalAidScheme: '',
    medicalAidPlan: '',
    medicalAidEmployee: 0,
    medicalAidEmployer: 0,
    medicalAidDependants: 1,
    gapCover: 0,
    groupLifeCover: 0,
    disabilityCover: 0,
    funeralCover: 0,
    educationPolicy: 0,
    unionFees: 0,
    garnisheeOrder: 0,
    loanRepayment: 0,
    hasCompanyCar: false,
    carDeterminedValue: 0,
    carMaintenancePlan: false,
    annualLeaveEntitlement: 15,
    annualLeaveBalance: 0,
    sickLeaveCycleStart: '',
    sickLeaveTaken: 0,
    familyResponsibilityTaken: 0,
    bankName: '',
    bankAccountLast4: '',
    bankBranchCode: ''
  };

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(defaultEmployee);

  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [payrollResults, setPayrollResults] = useState([]);
  const [payrollApproved, setPayrollApproved] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [leaveWarnings, setLeaveWarnings] = useState([]);

  const [emp201Month, setEmp201Month] = useState(now.getMonth() + 1);
  const [emp201Year, setEmp201Year] = useState(now.getFullYear());
  const [irp5Year, setIrp5Year] = useState(now.getFullYear());

  const [provEstimatedIncome, setProvEstimatedIncome] = useState(0);
  const [provPriorYearIncome, setProvPriorYearIncome] = useState(0);
  const [provAge, setProvAge] = useState(30);
  const [provEmployeesTaxPaid, setProvEmployeesTaxPaid] = useState(0);
  const [provYear, setProvYear] = useState(now.getFullYear());
  const [provResult, setProvResult] = useState(null);

  const [payrollInputs, setPayrollInputs] = useState({});

  const companyEmployees = (employees || []).filter(e => e.companyId === company?.id);
  const activeEmployees = companyEmployees.filter(e => e.isActive !== false);

  const taxYearForPeriod = (year, month) => (month >= 3 ? year : year - 1);

  const calculateAgeAtTaxYearEnd = (dateOfBirth, taxYearStartYear) => {
    if (!dateOfBirth) return 30;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return 30;
    const ref = new Date(taxYearStartYear + 1, 1, 28);
    let age = ref.getFullYear() - dob.getFullYear();
    const beforeBirthday = ref.getMonth() < dob.getMonth() || (ref.getMonth() === dob.getMonth() && ref.getDate() < dob.getDate());
    if (beforeBirthday) age -= 1;
    return Math.max(age, 0);
  };

  const calculateAnnualTaxBeforeRebates = (annualTaxableIncome) => {
    const income = Number(annualTaxableIncome || 0);
    if (income <= 0) return 0;
    if (income <= 237100) return income * 0.18;
    if (income <= 370500) return 42678 + (income - 237100) * 0.26;
    if (income <= 512800) return 77362 + (income - 370500) * 0.31;
    if (income <= 673000) return 121475 + (income - 512800) * 0.36;
    if (income <= 857900) return 179147 + (income - 673000) * 0.39;
    if (income <= 1817000) return 251258 + (income - 857900) * 0.41;
    return 644489 + (income - 1817000) * 0.45;
  };

  const getRebateBreakdown = (age) => {
    const primary = 17235;
    const secondary = age >= 65 ? 9444 : 0;
    const tertiary = age >= 75 ? 3145 : 0;
    return { primary, secondary, tertiary, total: primary + secondary + tertiary };
  };

  const getTaxThreshold = (age) => {
    if (age >= 75) return 165689;
    if (age >= 65) return 148217;
    return 95750;
  };

  const getMedicalCreditsAnnual = (dependants) => {
    const d = Number(dependants || 0);
    if (d <= 0) return 0;
    if (d === 1) return 364 * 12;
    return (364 * 2 * 12) + ((d - 2) * 246 * 12);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({ ...defaultEmployee, ...employee });
    setShowEmployeeForm(true);
  };

  const handleSaveEmployee = () => {
    if (editingEmployee) {
      const updated = (employees || []).map(e => (e.id === editingEmployee.id ? { ...e, ...employeeForm } : e));
      saveEmployees(updated);
    } else {
      const newEmployee = { ...defaultEmployee, ...employeeForm, id: Date.now(), companyId: company?.id };
      saveEmployees([...(employees || []), newEmployee]);
    }
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    setEmployeeForm(defaultEmployee);
  };

  const toggleEmployeeStatus = (employee) => {
    const updated = (employees || []).map(e => (e.id === employee.id ? { ...e, isActive: !(e.isActive !== false) } : e));
    saveEmployees(updated);
  };

  const updatePayrollInput = (employeeId, field, value) => {
    setPayrollInputs(prev => ({
      ...prev,
      [employeeId]: { ...(prev[employeeId] || {}), [field]: value }
    }));
  };

  const getPeriodBounds = (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end };
  };

  const computeEmployeePayroll = (employee) => {
    const ov = payrollInputs[employee.id] || {};
    const basicSalary = Number(employee.basicSalary || 0);
    const hourlyRate = basicSalary / 173.33;

    const ordinaryOTHours = Math.max(0, Number(ov.ordinaryOTHours || 0));
    const sundayOTHours = Math.max(0, Number(ov.sundayOTHours || 0));
    const commission = Math.max(0, Number(ov.commission || 0));
    const bonus = Math.max(0, Number(ov.bonus || 0));
    const actingAllowanceApplied = ov.actingAllowanceOverride !== '' && ov.actingAllowanceOverride !== undefined
      ? Number(ov.actingAllowanceOverride || 0)
      : Number(employee.actingAllowance || 0);

    const additionalEarnings = Math.max(0, Number(ov.additionalEarnings || 0));
    const additionalDeductions = Math.max(0, Number(ov.additionalDeductions || 0));
    const annualLeaveTaken = Math.max(0, Number(ov.annualLeaveTaken || 0));
    const sickLeaveTaken = Math.max(0, Number(ov.sickLeaveTaken || 0));
    const familyRespLeaveTaken = Math.max(0, Number(ov.familyRespLeaveTaken || 0));

    const travelAllowance = Number(employee.travelAllowance || 0);
    const cellPhoneAllowance = Number(employee.cellPhoneAllowance || 0);
    const housingAllowance = Number(employee.housingAllowance || 0);
    const shiftDifferential = Number(employee.shiftDifferential || 0);
    const standbyAllowance = Number(employee.standbyAllowance || 0);
    const toolUniformAllowance = Number(employee.toolUniformAllowance || 0);

    const carFringeBenefit = employee.hasCompanyCar
      ? Number(employee.carDeterminedValue || 0) * (employee.carMaintenancePlan ? 0.0325 : 0.035) / 12
      : 0;

    const ordinaryOT = employee.overtimeEligible !== false ? ordinaryOTHours * hourlyRate * 1.5 : 0;
    const sundayOT = employee.overtimeEligible !== false ? sundayOTHours * hourlyRate * 2.0 : 0;

    const grossEarnings = basicSalary + ordinaryOT + sundayOT + commission + bonus + travelAllowance + cellPhoneAllowance + housingAllowance + shiftDifferential + actingAllowanceApplied + standbyAllowance + toolUniformAllowance + carFringeBenefit + additionalEarnings;
    const cashEarnings = grossEarnings - carFringeBenefit;

    const retirementEmployeeAmount = employee.retirementFundType && employee.retirementFundType !== 'None'
      ? basicSalary * (Number(employee.retirementEmployeePercent || 0) / 100)
      : 0;
    const retirementEmployerAmount = employee.retirementFundType && employee.retirementFundType !== 'None'
      ? basicSalary * (Number(employee.retirementEmployerPercent || 0) / 100)
      : 0;

    const annualRetirementCap = Math.min(grossEarnings * 12 * 0.275, 350000);
    const deductibleRetirementAnnual = Math.min((retirementEmployeeAmount + retirementEmployerAmount) * 12, annualRetirementCap);

    const taxYearStart = taxYearForPeriod(payrollYear, payrollMonth);
    const age = calculateAgeAtTaxYearEnd(employee.dateOfBirth, taxYearStart);
    const annualGross = grossEarnings * 12;
    const annualTaxable = Math.max(0, annualGross - deductibleRetirementAnnual);
    const threshold = getTaxThreshold(age);
    const annualTaxBeforeRebates = annualTaxable <= threshold ? 0 : calculateAnnualTaxBeforeRebates(annualTaxable);
    const rebates = getRebateBreakdown(age);
    const medicalCreditsAnnual = getMedicalCreditsAnnual(employee.medicalAidDependants);
    const annualPAYE = Math.max(0, annualTaxBeforeRebates - rebates.total - medicalCreditsAnnual);
    const monthlyPAYE = annualPAYE / 12;

    const uifBase = basicSalary + travelAllowance + cellPhoneAllowance + housingAllowance + shiftDifferential + actingAllowanceApplied + standbyAllowance + toolUniformAllowance;
    const uifEmployee = Math.min(Math.max(0, uifBase * 0.01), 177.12);
    const uifEmployer = uifEmployee;
    const sdl = Math.max(0, uifBase * 0.01);

    const medicalAidEmployee = Number(employee.medicalAidEmployee || 0);
    const medicalAidEmployer = Number(employee.medicalAidEmployer || 0);
    const gapCover = Number(employee.gapCover || 0);
    const groupLifeCover = Number(employee.groupLifeCover || 0);
    const disabilityCover = Number(employee.disabilityCover || 0);
    const funeralCover = Number(employee.funeralCover || 0);
    const educationPolicy = Number(employee.educationPolicy || 0);
    const unionFees = Number(employee.unionFees || 0);
    const garnisheeOrder = Number(employee.garnisheeOrder || 0);
    const loanRepayment = Number(employee.loanRepayment || 0);

    const totalVoluntaryDeductions = retirementEmployeeAmount + medicalAidEmployee + gapCover + groupLifeCover + disabilityCover + funeralCover + educationPolicy + unionFees + garnisheeOrder + loanRepayment + additionalDeductions;
    const totalDeductions = monthlyPAYE + uifEmployee + totalVoluntaryDeductions;

    const totalEmployerCosts = uifEmployer + sdl + retirementEmployerAmount + medicalAidEmployer + groupLifeCover;
    const netPay = cashEarnings - monthlyPAYE - uifEmployee - totalVoluntaryDeductions;
    const costToCompany = netPay + monthlyPAYE + uifEmployee + totalVoluntaryDeductions + totalEmployerCosts;

    const annualLeaveOpening = Number(employee.annualLeaveBalance || 0);
    const annualLeaveAccrued = Number(employee.annualLeaveEntitlement || 15) / 12;
    const annualLeaveBalance = annualLeaveOpening + annualLeaveAccrued - annualLeaveTaken;

    const sickLeaveUsedTotal = Number(employee.sickLeaveTaken || 0) + sickLeaveTaken;
    const sickLeaveBalance = 30 - sickLeaveUsedTotal;

    const familyUsedTotal = Number(employee.familyResponsibilityTaken || 0) + familyRespLeaveTaken;
    const familyRespBalance = 3 - familyUsedTotal;

    const taxYearRows = (payslips || []).filter(ps => {
      if (ps.companyId !== company?.id || ps.employeeId !== employee.id || !ps.period || ps.approved !== true) return false;
      const [y, m] = ps.period.split('-').map(Number);
      const t = taxYearForPeriod(y, m);
      return t === taxYearStart;
    });

    const ytd = taxYearRows.reduce((acc, row) => ({
      gross: acc.gross + Number(row.grossEarnings || row.grossSalary || 0),
      paye: acc.paye + Number(row.paye || 0),
      uif: acc.uif + Number(row.uifEmployee || 0),
      retirement: acc.retirement + Number(row.retirementEmployee || 0),
      medical: acc.medical + Number(row.medicalAidEmployee || 0),
      net: acc.net + Number(row.netPay || 0)
    }), { gross: grossEarnings, paye: monthlyPAYE, uif: uifEmployee, retirement: retirementEmployeeAmount, medical: medicalAidEmployee, net: netPay });

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      employeeNumber: employee.employeeNumber || '',
      idNumber: employee.idNumber || '',
      taxNumber: employee.taxNumber || '',
      department: employee.department || '',
      jobTitle: employee.jobTitle || '',
      bankName: employee.bankName || '',
      bankAccountLast4: employee.bankAccountLast4 || '',
      bankBranchCode: employee.bankBranchCode || '',
      hourlyRate,
      basicSalary,
      ordinaryOTHours,
      sundayOTHours,
      ordinaryOT,
      sundayOT,
      commission,
      bonus,
      travelAllowance,
      cellPhoneAllowance,
      housingAllowance,
      shiftDifferential,
      actingAllowance: actingAllowanceApplied,
      standbyAllowance,
      toolUniformAllowance,
      carFringeBenefit,
      additionalEarnings,
      additionalEarningsDesc: ov.additionalEarningsDesc || '',
      additionalDeductions,
      additionalDeductionsDesc: ov.additionalDeductionsDesc || '',
      grossEarnings,
      cashEarnings,
      paye: monthlyPAYE,
      annualGross,
      annualTaxable,
      annualTaxBeforeRebates,
      medicalCreditsAnnual,
      annualPAYE,
      rebates,
      uifEmployee,
      uifEmployer,
      sdl,
      retirementEmployee: retirementEmployeeAmount,
      retirementEmployer: retirementEmployerAmount,
      deductibleRetirementAnnual,
      medicalAidEmployee,
      medicalAidEmployer,
      medicalAidDependants: Number(employee.medicalAidDependants || 0),
      gapCover,
      groupLifeCover,
      disabilityCover,
      funeralCover,
      educationPolicy,
      unionFees,
      garnisheeOrder,
      loanRepayment,
      totalVoluntaryDeductions,
      totalDeductions,
      totalEmployerCosts,
      netPay,
      costToCompany,
      annualLeaveTaken,
      sickLeaveTaken,
      familyRespLeaveTaken,
      annualLeaveOpening,
      annualLeaveAccrued,
      annualLeaveBalance,
      sickLeaveBalance,
      familyRespBalance,
      ytd,
      paymentDate: new Date(payrollYear, payrollMonth, 0).toISOString(),
      period: `${payrollYear}-${String(payrollMonth).padStart(2, '0')}`,
      taxYearStart
    };
  };

  const calculateAllPayroll = () => {
    const errors = [];
    const warnings = [];

    const hasHighOT = activeEmployees.some(emp => Number((payrollInputs[emp.id] || {}).ordinaryOTHours || 0) * 4.33 > 10);
    if (hasHighOT) {
      const proceed = window.confirm('Overtime exceeds BCEA limit of 10 hours/week. Proceed?');
      if (!proceed) return;
    }

    const results = activeEmployees.map(computeEmployeePayroll).filter((row) => {
      if (row.netPay < 0) {
        errors.push(`Deductions exceed earnings for ${row.employeeName}`);
        return false;
      }
      if (row.annualLeaveBalance < 0) warnings.push(`Annual leave below zero: ${row.employeeName}`);
      if (row.sickLeaveBalance < 0) warnings.push(`Sick leave below zero: ${row.employeeName}`);
      if (row.familyRespBalance < 0) warnings.push(`Family responsibility leave below zero: ${row.employeeName}`);
      return true;
    });

    setValidationErrors(errors);
    setLeaveWarnings(warnings);
    setPayrollResults(results);
    setPayrollApproved(false);
  };

  const approveAndSavePayroll = () => {
    if (!payrollResults.length) return;

    const newPayslips = payrollResults.map((r, idx) => ({
      id: Date.now() + idx,
      companyId: company?.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      period: r.period,
      basicSalary: r.basicSalary,
      ordinaryOT: r.ordinaryOT,
      sundayOT: r.sundayOT,
      commission: r.commission,
      bonus: r.bonus,
      travelAllowance: r.travelAllowance,
      cellPhoneAllowance: r.cellPhoneAllowance,
      housingAllowance: r.housingAllowance,
      shiftDifferential: r.shiftDifferential,
      actingAllowance: r.actingAllowance,
      standbyAllowance: r.standbyAllowance,
      toolUniformAllowance: r.toolUniformAllowance,
      carFringeBenefit: r.carFringeBenefit,
      additionalEarnings: r.additionalEarnings,
      grossEarnings: r.grossEarnings,
      cashEarnings: r.cashEarnings,
      paye: r.paye,
      uifEmployee: r.uifEmployee,
      uifEmployer: r.uifEmployer,
      sdl: r.sdl,
      retirementEmployee: r.retirementEmployee,
      retirementEmployer: r.retirementEmployer,
      medicalAidEmployee: r.medicalAidEmployee,
      medicalAidEmployer: r.medicalAidEmployer,
      gapCover: r.gapCover,
      groupLifeCover: r.groupLifeCover,
      disabilityCover: r.disabilityCover,
      funeralCover: r.funeralCover,
      educationPolicy: r.educationPolicy,
      unionFees: r.unionFees,
      garnisheeOrder: r.garnisheeOrder,
      loanRepayment: r.loanRepayment,
      additionalDeductions: r.additionalDeductions,
      totalDeductions: r.totalDeductions,
      totalEmployerCosts: r.totalEmployerCosts,
      netPay: r.netPay,
      costToCompany: r.costToCompany,
      annualLeaveTaken: r.annualLeaveTaken,
      sickLeaveTaken: r.sickLeaveTaken,
      familyRespLeaveTaken: r.familyRespLeaveTaken,
      approved: true,
      approvedDate: new Date().toISOString()
    }));

    savePayslips([...(payslips || []), ...newPayslips]);

    const updatedEmployees = (employees || []).map(emp => {
      const result = payrollResults.find(r => r.employeeId === emp.id);
      if (!result) return emp;
      return {
        ...emp,
        annualLeaveBalance: result.annualLeaveBalance,
        sickLeaveTaken: Number(emp.sickLeaveTaken || 0) + result.sickLeaveTaken,
        familyResponsibilityTaken: Number(emp.familyResponsibilityTaken || 0) + result.familyRespLeaveTaken
      };
    });
    saveEmployees(updatedEmployees);

    setPayrollApproved(true);
  };

  const printPayslip = (result) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const { start, end } = getPeriodBounds(payrollYear, payrollMonth);
    const payslipNo = `PS-${payrollYear}-${String(payrollMonth).padStart(2, '0')}-${String(result.employeeId).slice(-3)}`;

    const earningsItems = [
      ['Basic Salary', result.basicSalary],
      ['Overtime (Ord 1.5×)', result.ordinaryOT],
      ['Overtime (Sun/PH 2×)', result.sundayOT],
      ['Commission', result.commission],
      ['Bonus / 13th Cheque', result.bonus],
      ['Travel Allowance', result.travelAllowance],
      ['Cell Phone Allowance', result.cellPhoneAllowance],
      ['Housing Allowance', result.housingAllowance],
      ['Shift Differential', result.shiftDifferential],
      ['Acting Allowance', result.actingAllowance],
      ['Standby Allowance', result.standbyAllowance],
      ['Tool/Uniform Allowance', result.toolUniformAllowance],
      ['Fringe Benefit (Car)', result.carFringeBenefit],
      ['Additional Earnings', result.additionalEarnings]
    ].filter(([, amount]) => Number(amount || 0) > 0);

    const deductionItems = [
      ['PAYE', result.paye],
      ['UIF (Employee)', result.uifEmployee],
      ['Provident/Pension Fund', result.retirementEmployee],
      ['Medical Aid', result.medicalAidEmployee],
      ['Gap Cover', result.gapCover],
      ['Group Life Cover', result.groupLifeCover],
      ['Disability Cover', result.disabilityCover],
      ['Funeral Cover', result.funeralCover],
      ['Education Policy', result.educationPolicy],
      ['Union Fees', result.unionFees],
      ['Garnishee Order', result.garnisheeOrder],
      ['Loan Repayment', result.loanRepayment],
      ['Additional Deductions', result.additionalDeductions]
    ].filter(([, amount]) => Number(amount || 0) > 0);

    const employerItems = [
      ['UIF (Employer)', result.uifEmployer],
      ['SDL', result.sdl],
      ['Provident/Pension (Co.)', result.retirementEmployer],
      ['Medical Aid (Co.)', result.medicalAidEmployer],
      ['Group Life (Co.)', result.groupLifeCover]
    ].filter(([, amount]) => Number(amount || 0) > 0);

    const makeRows = (arr) => arr.map(([label, amount]) => `<tr><td>${label}</td><td style="text-align:right">${fmtR(amount)}</td></tr>`).join('');

    w.document.write(`<html><head><title>Payslip</title><style>
      body { font-family: Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 16px; color: #1f2937; }
      .header { background:#1a365d; color:white; padding:16px; display:flex; justify-content:space-between; align-items:flex-start; }
      .info { background:#edf2f7; padding:10px; margin:10px 0; display:flex; gap:12px; flex-wrap:wrap; }
      table { width:100%; border-collapse:collapse; margin:10px 0; }
      th, td { border:1px solid #cbd5e0; padding:7px; font-size:12px; }
      .box { border:1px solid #cbd5e0; padding:8px; }
      .cols { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
      .h-green { background:#38a169; color:white; }
      .h-red { background:#e53e3e; color:white; }
      .h-purple { background:#805ad5; color:white; }
      .net { background:#1a365d; color:white; font-size:24px; font-weight:bold; padding:12px; text-align:center; margin-top:10px; }
      .sig { display:flex; justify-content:space-between; margin-top:18px; }
      @media print { .no-print { display:none; } }
    </style></head><body>
      <div class="header">
        <div>
          <div style="font-size:26px;font-weight:700">${company?.name || 'Company'}</div>
          <div>Reg: ${company?.registrationNumber || 'N/A'}</div>
          <div>${company?.address || ''}</div>
          <div>Tel: ${company?.telephone || company?.phone || 'N/A'}</div>
        </div>
        <div style="font-size:28px;font-weight:700">PAYSLIP</div>
      </div>

      <div class="info">
        <div><b>Payslip No:</b> ${payslipNo}</div>
        <div><b>Payment Date:</b> ${new Date(result.paymentDate).toLocaleDateString('en-ZA')}</div>
        <div><b>Pay Period:</b> ${start.toLocaleDateString('en-ZA')} — ${end.toLocaleDateString('en-ZA')}</div>
        <div><b>Tax Year:</b> ${result.taxYearStart}/${result.taxYearStart + 1}</div>
      </div>

      <table>
        <tr><th colspan="2">Employee Details</th><th colspan="2">Employee Details</th></tr>
        <tr><td><b>Employee Name</b></td><td>${result.employeeName}</td><td><b>Employee Number</b></td><td>${result.employeeNumber || ''}</td></tr>
        <tr><td><b>ID Number</b></td><td>${result.idNumber || ''}</td><td><b>Tax Reference</b></td><td>${result.taxNumber || ''}</td></tr>
        <tr><td><b>Job Title</b></td><td>${result.jobTitle || ''}</td><td><b>Department</b></td><td>${result.department || ''}</td></tr>
        <tr><td><b>Date of Employment</b></td><td>${''}</td><td><b>Payment Method</b></td><td>EFT</td></tr>
        <tr><td><b>Bank</b></td><td>${result.bankName || ''} ••••${result.bankAccountLast4 || ''}</td><td><b>Branch Code</b></td><td>${result.bankBranchCode || ''}</td></tr>
      </table>

      <div class="cols">
        <table><thead><tr><th colspan="2" class="h-green">EARNINGS</th></tr></thead><tbody>${makeRows(earningsItems)}<tr><th>TOTAL EARNINGS</th><th style="text-align:right">${fmtR(result.grossEarnings)}</th></tr></tbody></table>
        <table><thead><tr><th colspan="2" class="h-red">DEDUCTIONS</th></tr></thead><tbody>${makeRows(deductionItems)}<tr><th>TOTAL DEDUCTIONS</th><th style="text-align:right">${fmtR(result.totalDeductions)}</th></tr></tbody></table>
        <table><thead><tr><th colspan="2" class="h-purple">EMPLOYER COSTS</th></tr></thead><tbody>${makeRows(employerItems)}<tr><th>TOTAL EMPLOYER COSTS</th><th style="text-align:right">${fmtR(result.totalEmployerCosts)}</th></tr></tbody></table>
      </div>

      <div class="net">NET PAY: ${fmtR(result.netPay)}</div>

      <table>
        <tr><th>Leave Type</th><th>Opening</th><th>Accrued</th><th>Taken</th><th>Balance</th></tr>
        <tr><td>Annual Leave</td><td>${result.annualLeaveOpening.toFixed(2)}</td><td>${result.annualLeaveAccrued.toFixed(2)}</td><td>${result.annualLeaveTaken.toFixed(2)}</td><td>${result.annualLeaveBalance.toFixed(2)}</td></tr>
        <tr><td>Sick Leave (3yr cycle)</td><td>30</td><td>—</td><td>${result.sickLeaveTaken}</td><td>${result.sickLeaveBalance}</td></tr>
        <tr><td>Family Responsibility</td><td>3</td><td>—</td><td>${result.familyRespLeaveTaken}</td><td>${result.familyRespBalance}</td></tr>
      </table>

      <table>
        <tr><th>YTD Gross</th><th>YTD PAYE</th><th>YTD UIF</th><th>YTD Retirement</th><th>YTD Medical</th><th>YTD Net Pay</th></tr>
        <tr><td>${fmtR(result.ytd.gross)}</td><td>${fmtR(result.ytd.paye)}</td><td>${fmtR(result.ytd.uif)}</td><td>${fmtR(result.ytd.retirement)}</td><td>${fmtR(result.ytd.medical)}</td><td>${fmtR(result.ytd.net)}</td></tr>
      </table>

      <table>
        <tr><th colspan="2">PAYE Calculation Breakdown</th></tr>
        <tr><td>Annual equivalent gross</td><td style="text-align:right">${fmtR(result.annualGross)}</td></tr>
        <tr><td>Less: Retirement deduction</td><td style="text-align:right">${fmtR(result.deductibleRetirementAnnual)} (27.5% cap / R350,000 max)</td></tr>
        <tr><td>Annual taxable income</td><td style="text-align:right">${fmtR(result.annualTaxable)}</td></tr>
        <tr><td>Tax per brackets</td><td style="text-align:right">${fmtR(result.annualTaxBeforeRebates)}</td></tr>
        <tr><td>Less: Primary rebate</td><td style="text-align:right">${fmtR(result.rebates.primary)}</td></tr>
        <tr><td>Less: Secondary rebate</td><td style="text-align:right">${fmtR(result.rebates.secondary)}</td></tr>
        <tr><td>Less: Tertiary rebate</td><td style="text-align:right">${fmtR(result.rebates.tertiary)}</td></tr>
        <tr><td>Less: Medical tax credits</td><td style="text-align:right">${fmtR(result.medicalCreditsAnnual)} (${result.medicalAidDependants} dependants)</td></tr>
        <tr><td>Annual PAYE</td><td style="text-align:right">${fmtR(result.annualPAYE)}</td></tr>
        <tr><td>Monthly PAYE</td><td style="text-align:right">${fmtR(result.paye)}</td></tr>
      </table>

      <div class="sig">
        <div>Employee Signature __________________ Date ______</div>
        <div>Authorised Signature __________________ Date ______</div>
      </div>
      <p style="margin-top:12px;font-size:11px">Computer-generated payslip. Generated ${new Date().toLocaleString('en-ZA')}. Confidential — for named employee only.</p>

      <button class="no-print" onclick="window.print()">Print</button>
    </body></html>`);
    w.document.close();
  };

  const printAllPayslips = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const blocks = payrollResults.map((r, idx) => `<div style="page-break-after:${idx === payrollResults.length - 1 ? 'auto' : 'always'}">
<h2>${r.employeeName}</h2><p>Period: ${r.period}</p><p>Gross: ${fmtR(r.grossEarnings)} | PAYE: ${fmtR(r.paye)} | Net: ${fmtR(r.netPay)}</p></div>`).join('');
    w.document.write(`<html><head><title>All Payslips</title></head><body>${blocks}<button onclick="window.print()">Print All</button></body></html>`);
    w.document.close();
  };

  const selectedEmp201Period = `${emp201Year}-${String(emp201Month).padStart(2, '0')}`;
  const emp201Rows = (payslips || []).filter(p => p.companyId === company?.id && p.period === selectedEmp201Period);
  const emp201Totals = emp201Rows.reduce((acc, p) => ({
    gross: acc.gross + Number(p.grossEarnings || p.grossSalary || 0),
    paye: acc.paye + Number(p.paye || 0),
    uifEmployee: acc.uifEmployee + Number(p.uifEmployee || 0),
    uifEmployer: acc.uifEmployer + Number(p.uifEmployer || 0),
    sdl: acc.sdl + Number(p.sdl || 0),
    retirement: acc.retirement + Number(p.retirementEmployee || 0) + Number(p.retirementEmployer || 0)
  }), { gross: 0, paye: 0, uifEmployee: 0, uifEmployer: 0, sdl: 0, retirement: 0 });

  const irp5Rows = ((payslips || []).filter(p => {
    if (p.companyId !== company?.id || !p.period) return false;
    const [y, m] = p.period.split('-').map(Number);
    return (y === irp5Year && m >= 3) || (y === irp5Year + 1 && m <= 2);
  })).reduce((acc, p) => {
    if (!acc[p.employeeId]) acc[p.employeeId] = { employeeId: p.employeeId, employeeName: p.employeeName, gross: 0, paye: 0, uif: 0, sdl: 0 };
    acc[p.employeeId].gross += Number(p.grossEarnings || p.grossSalary || 0);
    acc[p.employeeId].paye += Number(p.paye || 0);
    acc[p.employeeId].uif += Number(p.uifEmployee || 0);
    acc[p.employeeId].sdl += Number(p.sdl || 0);
    return acc;
  }, {});

  const calculateProvisional = () => {
    const age = Number(provAge || 0);
    const income = Number(provEstimatedIncome || 0);
    const threshold = getTaxThreshold(age);
    const annualTaxBeforeRebates = income <= threshold ? 0 : calculateAnnualTaxBeforeRebates(income);
    const rebates = getRebateBreakdown(age);
    const netAnnualTax = Math.max(0, annualTaxBeforeRebates - rebates.total);
    const firstPayment = Math.max(0, (netAnnualTax * 0.5) - Number(provEmployeesTaxPaid || 0));
    const secondPayment = Math.max(0, netAnnualTax - Number(provEmployeesTaxPaid || 0) - firstPayment);
    const warning80 = income < Number(provPriorYearIncome || 0) * 0.8;
    setProvResult({ annualTaxBeforeRebates, rebates, netAnnualTax, firstPayment, secondPayment, warning80, employeesTaxPaid: Number(provEmployeesTaxPaid || 0) });
  };

  const payrollTotals = payrollResults.reduce((acc, r) => ({
    basic: acc.basic + r.basicSalary,
    ot: acc.ot + r.ordinaryOT + r.sundayOT,
    allowances: acc.allowances + r.travelAllowance + r.cellPhoneAllowance + r.housingAllowance + r.shiftDifferential + r.actingAllowance + r.standbyAllowance + r.toolUniformAllowance,
    gross: acc.gross + r.grossEarnings,
    paye: acc.paye + r.paye,
    uifEe: acc.uifEe + r.uifEmployee,
    retirementEe: acc.retirementEe + r.retirementEmployee,
    medicalEe: acc.medicalEe + r.medicalAidEmployee,
    otherDed: acc.otherDed + r.gapCover + r.groupLifeCover + r.disabilityCover + r.funeralCover + r.educationPolicy + r.unionFees + r.garnisheeOrder + r.loanRepayment + r.additionalDeductions,
    net: acc.net + r.netPay,
    uifEr: acc.uifEr + r.uifEmployer,
    sdl: acc.sdl + r.sdl,
    retirementEr: acc.retirementEr + r.retirementEmployer,
    medicalEr: acc.medicalEr + r.medicalAidEmployer,
    ctc: acc.ctc + r.costToCompany
  }), { basic: 0, ot: 0, allowances: 0, gross: 0, paye: 0, uifEe: 0, retirementEe: 0, medicalEe: 0, otherDed: 0, net: 0, uifEr: 0, sdl: 0, retirementEr: 0, medicalEr: 0, ctc: 0 });

  const section = (key, title, children) => (
    <div className="border rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpenEmployeeSections(prev => ({ ...prev, [key]: !prev[key] }))} className="w-full text-left px-3 py-2 bg-slate-100 font-medium text-slate-700">{title}</button>
      {openEmployeeSections[key] && <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>}
    </div>
  );

  const numInput = (label, key) => (
    <label className="text-sm text-slate-600">{label}
      <input type="number" className="mt-1 w-full border rounded-lg px-3 py-2" value={employeeForm[key] ?? 0} onChange={(e) => setEmployeeForm(prev => ({ ...prev, [key]: Number(e.target.value || 0) }))} />
    </label>
  );

  const textInput = (label, key, type='text') => (
    <label className="text-sm text-slate-600">{label}
      <input type={type} className="mt-1 w-full border rounded-lg px-3 py-2" value={employeeForm[key] ?? ''} onChange={(e) => setEmployeeForm(prev => ({ ...prev, [key]: e.target.value }))} />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-2">
        {[['employees', 'Employees'], ['run', 'Run Payroll'], ['emp201', 'EMP201'], ['irp5', 'IRP5'], ['provisional', 'Provisional Tax']].map(([k, l]) => (
          <button key={k} onClick={() => setActivePayrollTab(k)} className={`px-4 py-2 rounded-lg text-sm font-medium ${activePayrollTab === k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{l}</button>
        ))}
      </div>

      {activePayrollTab === 'employees' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-700">Employees</h3>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white" onClick={() => { setEditingEmployee(null); setEmployeeForm(defaultEmployee); setShowEmployeeForm(true); }}>Add Employee</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="text-left px-3 py-2">Employee #</th><th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Tax Number</th><th className="text-left px-3 py-2">Job</th><th className="text-right px-3 py-2">Basic</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Actions</th>
              </tr></thead>
              <tbody>
                {companyEmployees.map((emp, idx) => (
                  <tr key={emp.id} className={`border-t ${idx % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                    <td className="px-3 py-2">{emp.employeeNumber || '—'}</td>
                    <td className="px-3 py-2">{`${emp.firstName || ''} ${emp.lastName || ''}`.trim()}</td>
                    <td className="px-3 py-2">{emp.taxNumber || '—'}</td>
                    <td className="px-3 py-2">{emp.jobTitle || '—'}</td>
                    <td className="px-3 py-2 text-right">{fmtR(emp.basicSalary)}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-1 rounded-full text-xs ${emp.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>{emp.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-3 py-2 space-x-2">
                      <button onClick={() => handleEditEmployee(emp)} className="px-3 py-1 rounded-lg text-xs bg-amber-100 text-amber-700">Edit</button>
                      <button onClick={() => toggleEmployeeStatus(emp)} className="px-3 py-1 rounded-lg text-xs bg-slate-200 text-slate-700">{emp.isActive !== false ? 'Set Inactive' : 'Set Active'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showEmployeeForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-6xl w-full max-h-[92vh] overflow-y-auto space-y-3">
                <h4 className="text-lg font-semibold">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h4>

                {section('core', 'Core Details', <>
                  {textInput('Employee Number', 'employeeNumber')}
                  {textInput('First Name', 'firstName')}
                  {textInput('Last Name', 'lastName')}
                  {textInput('ID Number', 'idNumber')}
                  {textInput('Tax Number', 'taxNumber')}
                  {textInput('Email', 'email', 'email')}
                  {textInput('Phone', 'phone')}
                  {textInput('Job Title', 'jobTitle')}
                  {textInput('Department', 'department')}
                  <label className="text-sm text-slate-600">Salary Type<select className="mt-1 w-full border rounded-lg px-3 py-2" value={employeeForm.salaryType} onChange={(e) => setEmployeeForm(prev => ({ ...prev, salaryType: e.target.value }))}><option value="monthly">monthly</option><option value="weekly">weekly</option><option value="hourly">hourly</option></select></label>
                  {numInput('Basic Salary', 'basicSalary')}
                  <label className="text-sm text-slate-600">Hourly Rate (auto)<input readOnly className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-100" value={fmtR(Number(employeeForm.basicSalary || 0) / 173.33)} /></label>
                  {textInput('Date of Birth', 'dateOfBirth', 'date')}
                  <label className="text-sm text-slate-600 flex items-center gap-2 mt-6"><input type="checkbox" checked={employeeForm.isActive !== false} onChange={(e) => setEmployeeForm(prev => ({ ...prev, isActive: e.target.checked }))} /> Is Active</label>
                </>)}

                {section('overtime', 'Overtime Settings', <label className="text-sm text-slate-600 flex items-center gap-2 mt-2"><input type="checkbox" checked={employeeForm.overtimeEligible !== false} onChange={(e) => setEmployeeForm(prev => ({ ...prev, overtimeEligible: e.target.checked }))} /> Overtime Eligible</label>)}
                {section('commission', 'Commission & Bonus', <label className="text-sm text-slate-600 flex items-center gap-2 mt-2"><input type="checkbox" checked={employeeForm.commissionEligible === true} onChange={(e) => setEmployeeForm(prev => ({ ...prev, commissionEligible: e.target.checked }))} /> Commission Eligible</label>)}
                {section('allowances', 'Allowances', <>
                  {numInput('Travel Allowance', 'travelAllowance')}
                  {numInput('Cell Phone Allowance', 'cellPhoneAllowance')}
                  {numInput('Housing Allowance', 'housingAllowance')}
                  {numInput('Shift Differential', 'shiftDifferential')}
                  {numInput('Acting Allowance', 'actingAllowance')}
                  {numInput('Standby Allowance', 'standbyAllowance')}
                  {numInput('Tool/Uniform Allowance', 'toolUniformAllowance')}
                </>)}
                {section('retirement', 'Retirement Fund', <>
                  <label className="text-sm text-slate-600">Type<select className="mt-1 w-full border rounded-lg px-3 py-2" value={employeeForm.retirementFundType} onChange={(e) => setEmployeeForm(prev => ({ ...prev, retirementFundType: e.target.value }))}><option>None</option><option>Provident Fund</option><option>Pension Fund</option></select></label>
                  {numInput('Employee %', 'retirementEmployeePercent')}
                  {numInput('Employer %', 'retirementEmployerPercent')}
                </>)}
                {section('medical', 'Medical Aid', <>
                  {textInput('Scheme', 'medicalAidScheme')}
                  {textInput('Plan', 'medicalAidPlan')}
                  {numInput('Employee Contribution', 'medicalAidEmployee')}
                  {numInput('Employer Contribution', 'medicalAidEmployer')}
                  {numInput('Dependants', 'medicalAidDependants')}
                  {numInput('Gap Cover', 'gapCover')}
                </>)}
                {section('insurance', 'Insurance & Benefits', <>
                  {numInput('Group Life Cover', 'groupLifeCover')}
                  {numInput('Disability Cover', 'disabilityCover')}
                  {numInput('Funeral Cover', 'funeralCover')}
                  {numInput('Education Policy', 'educationPolicy')}
                </>)}
                {section('deductions', 'Other Deductions', <>
                  {numInput('Union Fees', 'unionFees')}
                  {numInput('Garnishee Order', 'garnisheeOrder')}
                  {numInput('Loan Repayment', 'loanRepayment')}
                </>)}
                {section('car', 'Company Car Fringe Benefit', <>
                  <label className="text-sm text-slate-600 flex items-center gap-2 mt-2"><input type="checkbox" checked={employeeForm.hasCompanyCar === true} onChange={(e) => setEmployeeForm(prev => ({ ...prev, hasCompanyCar: e.target.checked }))} /> Has Company Car</label>
                  {numInput('Car Determined Value', 'carDeterminedValue')}
                  <label className="text-sm text-slate-600 flex items-center gap-2 mt-2"><input type="checkbox" checked={employeeForm.carMaintenancePlan === true} onChange={(e) => setEmployeeForm(prev => ({ ...prev, carMaintenancePlan: e.target.checked }))} /> Maintenance plan included</label>
                  <label className="text-sm text-slate-600">Car Fringe Benefit (auto)<input readOnly className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-100" value={fmtR((Number(employeeForm.carDeterminedValue || 0) * (employeeForm.carMaintenancePlan ? 0.0325 : 0.035)) / 12)} /></label>
                </>)}
                {section('leave', 'Leave Setup', <>
                  {numInput('Annual Leave Entitlement', 'annualLeaveEntitlement')}
                  {numInput('Annual Leave Opening Balance', 'annualLeaveBalance')}
                  {textInput('Sick Leave Cycle Start', 'sickLeaveCycleStart', 'date')}
                  {numInput('Sick Leave Taken (cycle)', 'sickLeaveTaken')}
                  {numInput('Family Responsibility Taken', 'familyResponsibilityTaken')}
                </>)}
                {section('banking', 'Banking', <>
                  {textInput('Bank Name', 'bankName')}
                  {textInput('Bank Account Last 4', 'bankAccountLast4')}
                  {textInput('Bank Branch Code', 'bankBranchCode')}
                </>)}

                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700" onClick={() => { setShowEmployeeForm(false); setEditingEmployee(null); }}>Cancel</button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white" onClick={handleSaveEmployee}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activePayrollTab === 'run' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-sm text-slate-600">Month<select className="mt-1 border rounded-lg px-3 py-2" value={payrollMonth} onChange={(e) => setPayrollMonth(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <label className="text-sm text-slate-600">Year<input className="mt-1 border rounded-lg px-3 py-2" type="number" value={payrollYear} onChange={(e) => setPayrollYear(Number(e.target.value || now.getFullYear()))} /></label>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white" onClick={calculateAllPayroll}>Calculate All</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white" onClick={approveAndSavePayroll}>Approve & Save</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white" onClick={printAllPayslips}>Print All Payslips</button>
          </div>

          {validationErrors.length > 0 && <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">{validationErrors.map((e, i) => <div key={i}>{e}</div>)}</div>}
          {leaveWarnings.length > 0 && <div className="p-3 rounded-lg bg-amber-100 text-amber-800 text-sm">{leaveWarnings.map((w, i) => <div key={i}>{w}</div>)}</div>}

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm min-w-[2200px]">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="px-2 py-2 text-left">Employee</th>
                <th className="px-2 py-2 text-left">Ordinary OT Hours</th>
                <th className="px-2 py-2 text-left">Sunday/PH OT Hours</th>
                <th className="px-2 py-2 text-left">Commission</th>
                <th className="px-2 py-2 text-left">Bonus / 13th</th>
                <th className="px-2 py-2 text-left">Acting Allowance Override</th>
                <th className="px-2 py-2 text-left">Additional Earnings</th>
                <th className="px-2 py-2 text-left">Additional Earnings Desc</th>
                <th className="px-2 py-2 text-left">Additional Deductions</th>
                <th className="px-2 py-2 text-left">Additional Deductions Desc</th>
                <th className="px-2 py-2 text-left">Annual Leave Taken</th>
                <th className="px-2 py-2 text-left">Sick Leave Taken</th>
                <th className="px-2 py-2 text-left">Family Resp. Leave</th>
              </tr></thead>
              <tbody>
                {activeEmployees.map((emp, idx) => {
                  const row = payrollInputs[emp.id] || {};
                  return (
                    <tr key={emp.id} className={`border-t ${idx % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                      <td className="px-2 py-2">{emp.firstName} {emp.lastName}</td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.ordinaryOTHours ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'ordinaryOTHours', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.sundayOTHours ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'sundayOTHours', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.commission ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'commission', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.bonus ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'bonus', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.actingAllowanceOverride ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'actingAllowanceOverride', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.additionalEarnings ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'additionalEarnings', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-40" value={row.additionalEarningsDesc || ''} onChange={(e) => updatePayrollInput(emp.id, 'additionalEarningsDesc', e.target.value)} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.additionalDeductions ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'additionalDeductions', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-40" value={row.additionalDeductionsDesc || ''} onChange={(e) => updatePayrollInput(emp.id, 'additionalDeductionsDesc', e.target.value)} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.annualLeaveTaken ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'annualLeaveTaken', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.sickLeaveTaken ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'sickLeaveTaken', Number(e.target.value || 0))} /></td>
                      <td className="px-2 py-2"><input type="number" min="0" className="border rounded px-2 py-1 w-28" value={row.familyRespLeaveTaken ?? 0} onChange={(e) => updatePayrollInput(emp.id, 'familyRespLeaveTaken', Number(e.target.value || 0))} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1800px]">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-right">Basic</th><th className="px-3 py-2 text-right">OT</th><th className="px-3 py-2 text-right">Allowances</th><th className="px-3 py-2 text-right">Gross</th><th className="px-3 py-2 text-right">PAYE</th><th className="px-3 py-2 text-right">UIF(Ee)</th><th className="px-3 py-2 text-right">Retirement</th><th className="px-3 py-2 text-right">Medical</th><th className="px-3 py-2 text-right">Other Ded.</th><th className="px-3 py-2 text-right">Net Pay</th><th className="px-3 py-2 text-right">UIF(Er)</th><th className="px-3 py-2 text-right">SDL</th><th className="px-3 py-2 text-right">Ret.(Er)</th><th className="px-3 py-2 text-right">Med.(Er)</th><th className="px-3 py-2 text-right">CTC</th><th className="px-3 py-2">Action</th></tr></thead>
              <tbody>
                {payrollResults.map((r, idx) => (
                  <tr key={r.employeeId} className={`border-t ${idx % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                    <td className="px-3 py-2">{r.employeeName}</td><td className="px-3 py-2 text-right">{fmtR(r.basicSalary)}</td><td className="px-3 py-2 text-right">{fmtR(r.ordinaryOT + r.sundayOT)}</td><td className="px-3 py-2 text-right">{fmtR(r.travelAllowance + r.cellPhoneAllowance + r.housingAllowance + r.shiftDifferential + r.actingAllowance + r.standbyAllowance + r.toolUniformAllowance)}</td><td className="px-3 py-2 text-right">{fmtR(r.grossEarnings)}</td><td className="px-3 py-2 text-right">{fmtR(r.paye)}</td><td className="px-3 py-2 text-right">{fmtR(r.uifEmployee)}</td><td className="px-3 py-2 text-right">{fmtR(r.retirementEmployee)}</td><td className="px-3 py-2 text-right">{fmtR(r.medicalAidEmployee)}</td><td className="px-3 py-2 text-right">{fmtR(r.gapCover + r.groupLifeCover + r.disabilityCover + r.funeralCover + r.educationPolicy + r.unionFees + r.garnisheeOrder + r.loanRepayment + r.additionalDeductions)}</td><td className="px-3 py-2 text-right font-semibold">{fmtR(r.netPay)}</td><td className="px-3 py-2 text-right">{fmtR(r.uifEmployer)}</td><td className="px-3 py-2 text-right">{fmtR(r.sdl)}</td><td className="px-3 py-2 text-right">{fmtR(r.retirementEmployer)}</td><td className="px-3 py-2 text-right">{fmtR(r.medicalAidEmployer)}</td><td className="px-3 py-2 text-right">{fmtR(r.costToCompany)}</td>
                    <td className="px-3 py-2"><button className="px-3 py-1 rounded-lg text-xs bg-indigo-100 text-indigo-700" onClick={() => printPayslip(r)}>Print Payslip</button></td>
                  </tr>
                ))}
                {payrollResults.length > 0 && <tr className="border-t bg-slate-100 font-semibold"><td className="px-3 py-2">Totals</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.basic)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.ot)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.allowances)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.gross)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.paye)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.uifEe)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.retirementEe)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.medicalEe)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.otherDed)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.net)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.uifEr)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.sdl)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.retirementEr)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.medicalEr)}</td><td className="px-3 py-2 text-right">{fmtR(payrollTotals.ctc)}</td><td /></tr>}
              </tbody>
            </table>
          </div>

          <div className="border rounded-xl p-4 bg-slate-50 text-sm space-y-1">
            <p><b>Total PAYE Liability:</b> {fmtR(payrollTotals.paye)}</p>
            <p><b>Total UIF Liability:</b> {fmtR(payrollTotals.uifEe + payrollTotals.uifEr)}</p>
            <p><b>Total SDL Liability:</b> {fmtR(payrollTotals.sdl)}</p>
            <p><b>Total Retirement Contributions:</b> {fmtR(payrollTotals.retirementEe + payrollTotals.retirementEr)}</p>
            <p><b>Total Payroll Cost:</b> {fmtR(payrollTotals.ctc)}</p>
            {payrollApproved && <p className="text-emerald-700 font-medium">Payroll approved and saved.</p>}
          </div>
        </div>
      )}

      {activePayrollTab === 'emp201' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-sm text-slate-600">Month<select className="mt-1 border rounded-lg px-3 py-2" value={emp201Month} onChange={(e) => setEmp201Month(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <label className="text-sm text-slate-600">Year<input className="mt-1 border rounded-lg px-3 py-2" type="number" value={emp201Year} onChange={(e) => setEmp201Year(Number(e.target.value || now.getFullYear()))} /></label>
          </div>
          <p className="text-amber-700 text-sm font-medium">Due by 7th of the following month.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-right">Gross</th><th className="px-3 py-2 text-right">PAYE</th><th className="px-3 py-2 text-right">UIF Ee</th><th className="px-3 py-2 text-right">UIF Er</th><th className="px-3 py-2 text-right">SDL</th><th className="px-3 py-2 text-right">Retirement</th></tr></thead><tbody>{emp201Rows.map((r, idx) => <tr key={r.id} className={`border-t ${idx % 2 ? 'bg-slate-50' : 'bg-white'}`}><td className="px-3 py-2">{r.employeeName}</td><td className="px-3 py-2 text-right">{fmtR(r.grossEarnings || r.grossSalary)}</td><td className="px-3 py-2 text-right">{fmtR(r.paye)}</td><td className="px-3 py-2 text-right">{fmtR(r.uifEmployee)}</td><td className="px-3 py-2 text-right">{fmtR(r.uifEmployer)}</td><td className="px-3 py-2 text-right">{fmtR(r.sdl)}</td><td className="px-3 py-2 text-right">{fmtR(Number(r.retirementEmployee || 0) + Number(r.retirementEmployer || 0))}</td></tr>)}<tr className="border-t bg-slate-100 font-semibold"><td className="px-3 py-2">Totals</td><td className="px-3 py-2 text-right">{fmtR(emp201Totals.gross)}</td><td className="px-3 py-2 text-right">{fmtR(emp201Totals.paye)}</td><td className="px-3 py-2 text-right">{fmtR(emp201Totals.uifEmployee)}</td><td className="px-3 py-2 text-right">{fmtR(emp201Totals.uifEmployer)}</td><td className="px-3 py-2 text-right">{fmtR(emp201Totals.sdl)}</td><td className="px-3 py-2 text-right">{fmtR(emp201Totals.retirement)}</td></tr></tbody></table>
          </div>
        </div>
      )}

      {activePayrollTab === 'irp5' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <label className="text-sm text-slate-600">Tax Year Start<input className="mt-1 border rounded-lg px-3 py-2 ml-3" type="number" value={irp5Year} onChange={(e) => setIrp5Year(Number(e.target.value || now.getFullYear()))} /></label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-2 text-left">Employee Name</th><th className="px-3 py-2 text-right">Total Gross</th><th className="px-3 py-2 text-right">Total PAYE</th><th className="px-3 py-2 text-right">Total UIF</th><th className="px-3 py-2 text-right">Total SDL</th></tr></thead><tbody>{Object.values(irp5Rows).map((r, idx) => <tr key={r.employeeId} className={`border-t ${idx % 2 ? 'bg-slate-50' : 'bg-white'}`}><td className="px-3 py-2">{r.employeeName}</td><td className="px-3 py-2 text-right">{fmtR(r.gross)}</td><td className="px-3 py-2 text-right">{fmtR(r.paye)}</td><td className="px-3 py-2 text-right">{fmtR(r.uif)}</td><td className="px-3 py-2 text-right">{fmtR(r.sdl)}</td></tr>)}</tbody></table>
          </div>
        </div>
      )}

      {activePayrollTab === 'provisional' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-slate-600">Estimated Taxable Income<input className="mt-1 w-full border rounded-lg px-3 py-2" type="number" value={provEstimatedIncome} onChange={(e) => setProvEstimatedIncome(Number(e.target.value || 0))} /></label>
            <label className="text-sm text-slate-600">Prior Year Taxable Income<input className="mt-1 w-full border rounded-lg px-3 py-2" type="number" value={provPriorYearIncome} onChange={(e) => setProvPriorYearIncome(Number(e.target.value || 0))} /></label>
            <label className="text-sm text-slate-600">Age<input className="mt-1 w-full border rounded-lg px-3 py-2" type="number" value={provAge} onChange={(e) => setProvAge(Number(e.target.value || 0))} /></label>
            <label className="text-sm text-slate-600">Employees Tax Already Paid<input className="mt-1 w-full border rounded-lg px-3 py-2" type="number" value={provEmployeesTaxPaid} onChange={(e) => setProvEmployeesTaxPaid(Number(e.target.value || 0))} /></label>
            <label className="text-sm text-slate-600">Provisional Tax Year<input className="mt-1 w-full border rounded-lg px-3 py-2" type="number" value={provYear} onChange={(e) => setProvYear(Number(e.target.value || now.getFullYear()))} /></label>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white" onClick={calculateProvisional}>Calculate</button>
          {provResult && <div className="border rounded-xl p-4 bg-slate-50 space-y-1"><p><b>Annual Tax (before rebates):</b> {fmtR(provResult.annualTaxBeforeRebates)}</p><p><b>Less: Primary Rebate:</b> {fmtR(provResult.rebates.primary)}</p><p><b>Less: Secondary Rebate:</b> {fmtR(provResult.rebates.secondary)}</p><p><b>Less: Tertiary Rebate:</b> {fmtR(provResult.rebates.tertiary)}</p><p><b>Net Annual Tax:</b> {fmtR(provResult.netAnnualTax)}</p><p><b>Less: Employees Tax Already Paid:</b> {fmtR(provResult.employeesTaxPaid)}</p><p><b>1st Provisional Payment — due 31 August {provYear}:</b> {fmtR(provResult.firstPayment)}</p><p><b>2nd Provisional Payment — due 28 February {provYear + 1}:</b> {fmtR(provResult.secondPayment)}</p>{provResult.warning80 && <p className="mt-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm">Warning: Your estimate is below 80% of prior year income. SARS may impose penalties if actual income exceeds the estimate.</p>}</div>}
        </div>
      )}
    </div>
  );
};

export default AccountingDashboard;
