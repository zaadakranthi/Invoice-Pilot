

import { Timestamp } from 'firebase/firestore';

// =================================================================
// 0. CORE & HELPER TYPES
// =================================================================
export interface LineItem {
  id: number;
  productId: string;
  description: string;
  quantity: number;
  rate: number;
  hsnCode: string;
  gstRate: number;
  cessRate: number;
}

export interface TaxDeduction {
    applicable: boolean;
    section: string;
    rate: number;
    amount: number;
}

export interface JournalEntry {
    accountId: string;
    amount: number;
}

export interface HsnCode {
  id: string;
  code: string;
  description: string;
  type: 'Goods' | 'Services';
  gstRate: number;
  cessRate: number;
  effectiveFrom: string; // 'YYYY-MM-DD'
  status: 'Active' | 'Obsolete';
}


// =================================================================
// 1. USER & AUTHENTICATION
// =================================================================
export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: 'superadmin' | 'professional' | 'direct' | 'Admin' | 'Employee' | 'Viewer';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  onboarded: boolean;
  ownerId?: string; // If they are a team member, this points to the main user
  activeChildId?: string; // For professionals to switch between client workspaces
  
  // --- Fields for businesses/users ---
  legalName?: string;
  phone?: string;
  pan?: string;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;

  // --- New fields specifically for 'professional' role ---
  professionalType?: 'CA' | 'CS' | 'CMA' | 'Advocate' | 'Accountant' | 'Other';
  membershipNumber?: string;
  officeAddress?: string;
  enrollmentDate?: string; // YYYY-MM-DD
  activeFinancialYear?: string; // e.g. "2024-25"
}


// =================================================================
// 2. PARTIES (Master Data)
// =================================================================
export interface Customer {
  id: string;
  clientCode: string;
  name: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  billingAddress: string;
  shippingAddress: string;
  openingBalance?: number;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  billingAddress: string;
  openingBalance?: number;
}


// =================================================================
// 3. ITEMS (Master Data)
// =================================================================
export interface Product {
    id: string;
    name: string;
    productType: 'Finished Good' | 'Raw Material' | 'Service';
    itemCategory?: string; // New
    minimumReorderLevel?: number; // New
    uom: string;
    hsnCode: string;
    gstRate: number;
    cessRate?: number;
    salePrice: number;
    purchasePrice: number;
    openingStockQty: number;
    openingStockRate: number;
    currentStock?: number;
}


// =================================================================
// 4. CORE TRANSACTIONS (FY-Specific)
// =================================================================
export interface Invoice {
  id: string;
  customerId: string;
  client: string; // This can be deprecated in the future but kept for now
  gstin: string;
  date: string; // 'YYYY-MM-DD'
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalAmount: number;
  amountPaid: number;
  status: string;
  lineItems: LineItem[];
  tcs?: TaxDeduction;
  financialYear: string;
}

export interface PurchaseBill {
  id: string;
  vendorId: string;
  vendor: string; // This can be deprecated in the future but kept for now
  totalAmount: number;
  amountPaid: number;
  date: string; // 'YYYY-MM-DD'
  taxableValue: number;
  gstAmount: number;
  lineItems: LineItem[];
  tds?: TaxDeduction;
  financialYear: string;
}

export interface CreditNote {
    id: string;
    customerId: string;
    client: string; // This can be deprecated in the future but kept for now
    originalInvoice: string;
    date: string; // 'YYYY-MM-DD'
    totalAmount: number;
    taxableValue: number;
    igst: number;
    lineItems: LineItem[];
    financialYear: string;
}

export interface DebitNote {
    id: string;
    vendorId: string;
    vendor: string; // This can be deprecated in the future but kept for now
    originalBill: string;
    date: string; // 'YYYY-MM-DD'
    totalAmount: number;
    taxableValue: number;
    gstAmount: number;
    lineItems: LineItem[];
    financialYear: string;
}

export interface PaymentReceived {
  id: string;
  customerId: string;
  date: string; // 'YYYY-MM-DD'
  amount: number;
  mode: string;
  accountId: string; // Links to BankAccount
  reference?: string;
  notes?: string;
  invoiceId?: string;
  financialYear: string;
}

export interface PaymentMade {
  id: string;
  vendorId: string;
  date: string; // 'YYYY-MM-DD'
  amount: number;
  mode: string;
  accountId: string; // Links to BankAccount
  reference?: string;
  notes?: string;
  billId?: string;
  financialYear: string;
}


// =================================================================
// 5. ACCOUNTING & LEDGERS
// =================================================================
export interface BankAccount {
  id: string;
  accountType: 'Bank' | 'Cash';
  accountName: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  openingBalance?: number;
}

export interface LedgerAccount {
  id: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense' | 'Drawings';
  classification?: string;
}

export interface JournalVoucher {
    id: string;
    date: string; // 'YYYY-MM-DD'
    narration: string;
    amount: number;
    debitEntries: JournalEntry[];
    creditEntries: JournalEntry[];
    financialYear: string;
}

export interface TrialBalanceEntry {
  account: string;
  id: string;
  debit: number;
  credit: number;
}

export interface DatedTrialBalance {
  date: string; // The "as on" date
  data: TrialBalanceEntry[];
  source: 'transactional' | 'upload';
}


// =================================================================
// 6. CAPITAL & OWNERSHIP (FY-Specific)
// =================================================================
export interface CapitalAccount {
    id: string;
    partnerName: string;
    openingBalance: number;
    additions: number;
    shareOfProfit: number;
    financialYear: string;
}

export interface Drawing {
    id: string;
    date: string; // 'YYYY-MM-DD'
    partnerId: string;
    amount: number;
    description: string;
    financialYear: string;
}


// =================================================================
// 7. SETTINGS & METADATA
// =================================================================
export interface Settings {
    financialYearStart: string; // "01-04"
    financialYearEnd: string; // "31-03"
    currentYear: string; // "2023-2024"
}

export interface BrandingSettings {
    logoDataUri: string | null;
    legalName: string;
    businessName: string;
    address: string;
    gstin: string;
    pan: string;
    tan?: string;
    natureOfBusiness: string;
    entityType: string;
    termsAndConditions: string;
    signatureName: string;
    signatureDataUrl: string | null;
    invoicePrefix: string;
    nextInvoiceNumber: number;
}

export interface AuditLog {
  id: string;
  timestamp: Timestamp;
  user: string;
  action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout';
  entity: string;
  entityId: string;
  details: string;
  financialYear: string;
  ipAddress?: string;
  deviceInfo?: string;
}

// =================================================================
// 8. COMPLIANCE
// =================================================================
export interface GstReturn {
    id: string;
    returnType: 'GSTR1' | 'GSTR3B' | 'GSTR9' | 'GSTR9C';
    period: string; // "MM-YYYY" or "YYYY-YYYY"
    filedStatus: 'Pending' | 'Filed' | 'Error';
    filedDate?: Timestamp;
    acknowledgementNo?: string;
    uploadedData: any;
    matchedData?: any;
    financialYear: string;
}

export interface ItcReconciliation {
    id: string;
    vendorId: string;
    invoiceId: string;
    gstr2bRef: string;
    status: 'Matched' | 'Mismatch' | 'PendingIn2B' | 'PendingInBooks';
    remarks?: string;
    financialYear: string;
}

// Represents a stored GSTR-9/9C filing process
export interface GstrAnnualReturn {
    id: string;
    userId: string;
    financialYear: string; // e.g., "2023-24"
    type: 'GSTR-9' | 'GSTR-9C';
    status: 'not_started' | 'in_progress' | 'draft' | 'filed';
    source: 'prefill' | 'upload' | 'manual';
    
    // Stores the structured data for each table
    data: {
        [key: string]: any; // Allows for table_4, table_5, etc.
    };
    
    // For GSTR-9C
    certification?: {
        caCertificateUrl?: string; // Link to Firebase Storage
        caName?: string;
        membershipNo?: string;
        isAuditRequired?: boolean;
    };
    
    validationErrors?: {
        table: string; // e.g., "Table 4"
        field: string; // e.g., "Taxable Value"
        message: string;
    }[];
    
    uploadedFileRef?: string; // Reference to original uploaded file in Storage
    
    createdAt: Timestamp;
    updatedAt: Timestamp;
}


export interface CaCertificate {
    id: string;
    userId: string;
    year: string;
    fileUrl: string; // URL to the uploaded certificate in Firebase Storage
    uploadedAt: Timestamp;
}

export interface TeamMember {
  id: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Employee' | 'Viewer';
  status: 'Active' | 'Invited';
}
