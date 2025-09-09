import type { 
    Customer, Vendor, Product, BrandingSettings, BankAccount, LedgerAccount, 
    PaymentReceived, PaymentMade, Invoice, PurchaseBill, 
    JournalVoucher, CapitalAccount, Drawing, User, TeamMember, AuditLog, HsnCode, CreditNote, DebitNote
} from './types';
import { format } from 'date-fns';

export const generateClientCode = () => `C-${Date.now().toString().slice(-4)}`;
export const generateVendorCode = () => `V-${Date.now().toString().slice(-4)}`;

// =================================================================
// 1. MASTER DATA
// =================================================================

export const initialBranding: BrandingSettings = {
  logoDataUri: null,
  legalName: 'Demo Enterprises Pvt. Ltd.',
  businessName: 'Demo Enterprises',
  address: '1st Floor, Demo Building,\nMain Road, Mumbai, Maharashtra 400001',
  gstin: '27ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  tan: 'MUMA12345A',
  natureOfBusiness: 'Trading & Services',
  entityType: 'Private Limited Company',
  termsAndConditions: '1. Payment due within 15 days.\n2. All disputes subject to Mumbai jurisdiction.',
  signatureName: 'For Demo Enterprises Pvt. Ltd.',
  signatureDataUrl: null,
  invoicePrefix: 'DEMO-',
  nextInvoiceNumber: 2,
};

export const initialCustomers: Customer[] = [
  { id: 'cust-1', clientCode: 'C-001', name: 'Stark Industries', email: 'tony@stark.com', phone: '9876543210', gstin: '29AABCU9603R1ZJ', pan: 'AABCU9603R', billingAddress: 'Stark Tower, 10880 Malibu Point, 90265', shippingAddress: 'Stark Tower, 10880 Malibu Point, 90265' },
];

export const initialVendors: Vendor[] = [
    { id: 'vend-1', vendorCode: 'V-001', name: 'Raw Materials Inc.', email: 'supply@raw.com', phone: '8765432109', gstin: '22AAAAA0000A1Z5', pan: 'AAAAA0000A', billingAddress: 'Industrial Area, Phase 1, Chennai, Tamil Nadu' },
];

export const initialProducts: Product[] = [
    { id: 'prod-1', name: 'Adamantium Widget', productType: 'Finished Good', uom: 'PCS', hsnCode: '7326', gstRate: 18, salePrice: 1000, purchasePrice: 600, openingStockQty: 50, openingStockRate: 600, currentStock: 0 },
    { id: 'prod-2', name: 'Consulting Services', productType: 'Service', uom: 'HRS', hsnCode: '9983', gstRate: 18, salePrice: 2000, purchasePrice: 0, openingStockQty: 0, openingStockRate: 0, currentStock: 0 },
];

export const initialBankAccounts: BankAccount[] = [
    { id: 'cash', accountType: 'Cash', accountName: 'Cash on Hand', openingBalance: 50000 },
    { id: 'bank-1', accountType: 'Bank', accountName: 'HDFC Bank Savings', bankName: 'HDFC Bank', accountNumber: '1234567890', ifscCode: 'HDFC0001234', openingBalance: 500000 },
];

export const initialChartOfAccounts: LedgerAccount[] = [
    { id: 'sales', name: 'Sales Revenue', category: 'Income', classification: 'Direct Incomes' },
    { id: 'commission', name: 'Commission Received', category: 'Income', classification: 'Indirect Incomes' },
    { id: 'purchases', name: 'Purchases', category: 'Expense', classification: 'Purchase Accounts' },
    { id: 'rent', name: 'Rent Expense', category: 'Expense', classification: 'Indirect Expenses' },
    { id: 'receivables', name: 'Accounts Receivable', category: 'Asset', classification: 'Current Asset' },
    { id: 'payables', name: 'Accounts Payable', category: 'Liability', classification: 'Current Liabilities' },
    { id: 'cash', name: 'Cash & Bank', category: 'Asset', classification: 'Current Asset' },
    { id: 'assets', name: 'Fixed Assets', category: 'Asset', classification: 'Fixed Asset' },
    { id: 'stock', name: 'Stock', category: 'Asset', classification: 'Current Asset' },
    { id: 'capital', name: 'Capital Account', category: 'Equity', classification: 'Capital Account' },
    { id: 'drawings', name: 'Drawings', category: 'Drawings', classification: 'Capital Account' },
    { id: 'output-cgst', name: 'Output CGST', category: 'Liability', classification: 'Current Liabilities' },
    { id: 'output-sgst', name: 'Output SGST', category: 'Liability', classification: 'Current Liabilities' },
    { id: 'output-igst', name: 'Output IGST', category: 'Liability', classification: 'Current Liabilities' },
    { id: 'input-gst', name: 'Input GST', category: 'Asset', classification: 'Current Asset' },
];

export const initialTeamMembers: TeamMember[] = [];
export const initialUsers: User[] = [];

// =================================================================
// 2. TRANSACTIONAL DATA
// =================================================================

const transactionDate = '2025-09-06';

// --- Entry 1: Sales Invoice ---
export const initialInvoices: Invoice[] = [
  { 
    id: 'DEMO-1', 
    client: 'Stark Industries', 
    gstin: '29AABCU9603R1ZJ', 
    date: transactionDate,
    totalAmount: 118000, 
    amountPaid: 0,
    status: 'Pending', 
    taxableValue: 100000, 
    cgst: 0, 
    sgst: 0, 
    igst: 18000, 
    cess: 0, 
    lineItems: [
        { id: 1, productId: 'prod-1', description: 'Adamantium Widget', quantity: 100, rate: 1000, hsnCode: '7326', gstRate: 18, cessRate: 0 }
    ],
    financialYear: '2025-26' 
  },
];

// --- Entry 2: Purchase Bill ---
export const initialPurchaseBills: PurchaseBill[] = [
    { 
        id: 'VENDOR-001', 
        vendor: 'Raw Materials Inc.', 
        totalAmount: 70800, 
        amountPaid: 0,
        date: transactionDate, 
        taxableValue: 60000, 
        gstAmount: 10800, 
        lineItems: [
            { id: 1, productId: 'prod-1', description: 'Adamantium Widget', quantity: 100, rate: 600, hsnCode: '7326', gstRate: 18, cessRate: 0 }
        ], 
        financialYear: '2025-26' 
    },
];

// --- Entry 3: Payment Receipt ---
export const initialPaymentsReceived: PaymentReceived[] = [
    { 
        id: 'REC-001', 
        customerId: 'Stark Industries', 
        date: transactionDate,
        amount: 88500, 
        mode: 'Bank Transfer', 
        accountId: 'bank-1', 
        invoiceId: 'DEMO-1', 
        financialYear: '2025-26' 
    },
];

// --- Entry 4: Payment Made ---
export const initialPaymentsMade: PaymentMade[] = [
    { 
        id: 'PAY-001', 
        vendorId: 'Raw Materials Inc.', 
        date: transactionDate, 
        amount: 50000, 
        mode: 'Bank Transfer', 
        accountId: 'bank-1', 
        billId: 'VENDOR-001', 
        financialYear: '2025-26' 
    },
];

// --- Entry 5 & 6: Journal Vouchers / General Entries ---
// Updated to include journal entries for initial invoice and purchase bill
export const initialJournalVouchers: JournalVoucher[] = [
    // JV for initial invoice DEMO-1
    {
        id: 'JV-INV-DEMO-1',
        date: transactionDate,
        narration: 'Sale to Stark Industries via Invoice #DEMO-1',
        amount: 118000,
        debitEntries: [{ accountId: 'cust-1', amount: 118000 }],
        creditEntries: [
            { accountId: 'sales', amount: 100000 },
            { accountId: 'output-igst', amount: 18000 }
        ],
        financialYear: '2025-26'
    },
    // JV for initial purchase VENDOR-001
    {
        id: 'JV-PUR-VENDOR-001',
        date: transactionDate,
        narration: 'Purchase from Raw Materials Inc. via Bill #VENDOR-001',
        amount: 70800,
        debitEntries: [
            { accountId: 'purchases', amount: 60000 },
            { accountId: 'input-gst', amount: 10800 }
        ],
        creditEntries: [{ accountId: 'vend-1', amount: 70800 }],
        financialYear: '2025-26'
    },
    { 
        id: 'JV-001', 
        date: transactionDate,
        narration: 'Office rent for the month paid via bank transfer.', 
        amount: 45000, 
        debitEntries: [{ accountId: 'rent', amount: 45000 }], 
        creditEntries: [{ accountId: 'bank-1', amount: 45000 }], 
        financialYear: '2025-26' 
    },
    { 
        id: 'JV-002', 
        date: transactionDate,
        narration: 'Commission received in cash.', 
        amount: 10000, 
        debitEntries: [{ accountId: 'cash', amount: 10000 }], 
        creditEntries: [{ accountId: 'commission', amount: 10000 }], 
        financialYear: '2025-26' 
    },
];

// --- Entry 7: Credit Note (Sales Return) ---
export const initialCreditNotes: CreditNote[] = [
    {
        id: 'CN-001',
        client: 'Stark Industries',
        originalInvoice: 'DEMO-1',
        date: transactionDate,
        totalAmount: 11800,
        taxableValue: 10000,
        igst: 1800,
        lineItems: [
             { id: 1, productId: 'prod-1', description: 'Adamantium Widget', quantity: 10, rate: 1000, hsnCode: '7326', gstRate: 18, cessRate: 0 }
        ],
        financialYear: '2025-26'
    }
];

// --- Entry 8: Debit Note (Purchase Return) ---
export const initialDebitNotes: DebitNote[] = [
    {
        id: 'DN-001',
        vendor: 'Raw Materials Inc.',
        originalBill: 'VENDOR-001',
        date: transactionDate,
        totalAmount: 7080,
        taxableValue: 6000,
        gstAmount: 1080,
        lineItems: [
             { id: 1, productId: 'prod-1', description: 'Adamantium Widget', quantity: 10, rate: 600, hsnCode: '7326', gstRate: 18, cessRate: 0 }
        ],
        financialYear: '2025-26'
    }
];

// --- Entry 9: Capital Account & Drawings ---
export const initialCapitalAccounts: CapitalAccount[] = [
    { id: 'cap-1', partnerName: 'Proprietor', openingBalance: 1200000, additions: 500000, shareOfProfit: 0, financialYear: '2025-26' },
];
export const initialDrawings: Drawing[] = [
    { id: 'draw-1', partnerId: 'cap-1', date: transactionDate, amount: 25000, description: 'Personal use', financialYear: '2025-26' },
];

// --- Audit Log (Sample) ---
export const initialAuditLog: AuditLog[] = [
    { id: 'log-1', timestamp: new Date(2025, 8, 6) as any, user: 'system', action: 'Create', entity: 'Invoice', entityId: 'DEMO-1', details: 'Created invoice for Stark Industries', financialYear: '2025-26' },
];


// =================================================================
// 3. GLOBAL DATA (Not User or FY Specific)
// =================================================================

export const initialHsnCodes: HsnCode[] = [
  { id: 'hsn-1', code: '7326', description: 'Other articles of iron or steel', type: 'Goods', gstRate: 18, cessRate: 0, effectiveFrom: '2017-07-01', status: 'Active' },
  { id: 'hsn-2', code: '9983', description: 'Other professional, technical and business services', type: 'Services', gstRate: 18, cessRate: 0, effectiveFrom: '2017-07-01', status: 'Active' },
];
