
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import * as firestore from '@/lib/firestore';
import type { 
    Invoice, PurchaseBill, PaymentReceived, PaymentMade, JournalVoucher, 
    CapitalAccount, Drawing, User, DatedTrialBalance, AuditLog, LineItem, CreditNote, DebitNote,
    Customer, Vendor, Product, BrandingSettings, BankAccount, LedgerAccount, 
    HsnCode, TeamMember, TrialBalanceEntry
} from '@/lib/types';
import { useRouter } from 'next/navigation';
import { initialBranding, generateClientCode, generateVendorCode, initialProducts, initialChartOfAccounts, initialBankAccounts, initialTeamMembers, initialHsnCodes, initialCustomers, initialVendors, initialInvoices, initialJournalVouchers } from '@/lib/initial-data';
import { onSnapshot, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { isAfter, isBefore, parseISO } from 'date-fns';

// --- CONTEXT TYPE DEFINITION ---
interface DataContextType {
    isReady: boolean;
    rootUser: User | null;
    authUser: User | null; // This is the ACTIVE user/workspace
    authLoading: boolean;
    workspaceId: string | null;

    invoices: Invoice[];
    bills: PurchaseBill[];
    creditNotes: CreditNote[];
    debitNotes: DebitNote[];
    paymentsReceived: PaymentReceived[];
    paymentsMade: PaymentMade[];
    journalVouchers: JournalVoucher[];
    capitalAccounts: CapitalAccount[];
    drawings: Drawing[];
    auditLog: AuditLog[];
    trialBalanceData: DatedTrialBalance | null;
    asOnDateForTrial: Date | undefined;
    setAsOnDateForTrial: (date: Date | undefined) => void;
    
    brandingSettings: BrandingSettings | null;
    customers: Customer[];
    vendors: Vendor[];
    products: Product[];
    chartOfAccounts: LedgerAccount[];
    bankAccounts: BankAccount[];
    hsnCodes: HsnCode[];
    teamMembers: TeamMember[];
    users: User[]; 

    switchUser: (targetUserId: string) => Promise<void>;
    addUser: (user: Partial<User>) => Promise<User | void>;
    updateUser: (userId: string, user: Partial<User>) => Promise<void>;
    setTrialBalanceData: (data: DatedTrialBalance | null) => void;
    setBrandingSettings: (settings: BrandingSettings) => Promise<void>;
    addCustomer: (customer: Omit<Customer, 'id' | 'clientCode'>) => Promise<Customer>;
    updateCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    addVendor: (vendor: Omit<Vendor, 'id' | 'vendorCode'>) => Promise<Vendor>;
    updateVendor: (vendor: Vendor) => Promise<void>;
    deleteVendor: (id: string) => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    setChartOfAccounts: (accounts: LedgerAccount[]) => Promise<void>;
    bulkAddHsnCodes: (codes: Omit<HsnCode, 'id'>[]) => Promise<void>;
    addHsnCode: (code: Omit<HsnCode, 'id'>) => Promise<void>;
    updateHsnCode: (id: string, data: Partial<HsnCode>) => Promise<void>;
    deleteHsnCode: (id: string) => Promise<void>;
    addInvoice: (invoiceData: Omit<Invoice, 'amountPaid' | 'status' | 'financialYear'> & { id: string }) => Promise<{ success: boolean; error?: string; }>;
    updateInvoice: (invoice: Invoice, originalLineItems: LineItem[]) => Promise<void>;
    addBill: (bill: Omit<PurchaseBill, 'amountPaid' | 'financialYear'>, billNumber: string) => Promise<void>;
    updateBill: (billToUpdate: PurchaseBill, originalLineItems?: LineItem[]) => Promise<void>;
    addCreditNote: (note: Omit<CreditNote, 'financialYear'>) => Promise<void>;
    addDebitNote: (note: Omit<DebitNote, 'financialYear'>) => Promise<void>;
    addPaymentReceived: (payment: Omit<PaymentReceived, 'id' | 'financialYear'>) => Promise<void>;
    addPaymentMade: (payment: Omit<PaymentMade, 'id' | 'financialYear'>) => Promise<void>;
    addJournalVoucher: (voucher: Omit<JournalVoucher, 'amount' | 'financialYear'>) => Promise<void>;
    postJournalEntryForTransaction: (type: 'Invoice' | 'Purchase', id: string) => Promise<void>;
    addCapitalAccount: (account: Omit<CapitalAccount, 'id' | 'financialYear'>) => Promise<void>;
    updateCapitalAccount: (account: CapitalAccount) => Promise<void>;
    deleteCapitalAccount: (id: string) => Promise<void>;
    addDrawing: (drawing: Omit<Drawing, 'id' | 'financialYear'>) => Promise<void>;
    getInvoiceById: (id: string) => Invoice | undefined;
    getBillById: (id: string) => PurchaseBill | undefined;
    getCustomerByName: (name: string) => Customer | undefined;
    getPaymentsForInvoice: (invoiceId: string) => PaymentReceived[];
    performYearEndClose: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const financialYear = '2025-26'; // Simplified for prototype

type WorkspaceData = {
    invoices: Invoice[]; bills: PurchaseBill[]; creditNotes: CreditNote[]; debitNotes: DebitNote[];
    paymentsReceived: PaymentReceived[]; paymentsMade: PaymentMade[]; journalVouchers: JournalVoucher[];
    capitalAccounts: CapitalAccount[]; drawings: Drawing[]; auditLog: AuditLog[];
    trialBalanceData: DatedTrialBalance | null; customers: Customer[]; vendors: Vendor[];
    products: Product[]; chartOfAccounts: LedgerAccount[]; bankAccounts: BankAccount[];
    brandingSettings: BrandingSettings | null; teamMembers: TeamMember[];
};

const getInitialWorkspaceData = (): WorkspaceData => ({
    invoices: [], bills: [], creditNotes: [], debitNotes: [], paymentsReceived: [], paymentsMade: [],
    journalVouchers: [], capitalAccounts: [], drawings: [], auditLog: [], trialBalanceData: null,
    customers: [], vendors: [], products: [], chartOfAccounts: [],
    bankAccounts: [], brandingSettings: null, teamMembers: []
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [fbAuthUser, authLoading] = useAuthState(auth);
    const [rootUser, setRootUser] = useState<User | null>(null);
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const { toast } = useToast();
    
    const [workspaceData, setWorkspaceData] = useState<WorkspaceData>(getInitialWorkspaceData());
    
    const [users, setUsers] = useState<User[]>([]);
    const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
    const [asOnDateForTrial, setAsOnDateForTrial] = useState<Date | undefined>();

    const workspaceId = activeUser?.id || null;
    const isReady = !!workspaceId && !!rootUser;
    
    // Effect for handling auth state changes and setting up the root user
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (fbAuthUser) {
            const userDocRef = doc(db, 'users', fbAuthUser.uid);
            unsubscribe = onSnapshot(userDocRef, async (userDoc) => {
                if (userDoc.exists()) {
                    const userProfile = { id: userDoc.id, ...userDoc.data() } as User;
                    setRootUser(userProfile);
                    const targetId = (userProfile.role === 'professional' && userProfile.activeChildId && userProfile.activeChildId !== userProfile.id) 
                        ? userProfile.activeChildId 
                        : userProfile.id;
                    
                    if (activeUser?.id !== targetId) {
                         const targetUser = await firestore.getUser(targetId);
                         if (targetUser) setActiveUser(targetUser);
                    }
                }
            });
        } else if (!authLoading) {
            setRootUser(null);
            setActiveUser(null);
            router.push('/login');
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fbAuthUser, activeUser?.id, authLoading, router]);

    
    // Effect for loading LIVE data from Firestore when workspaceId changes
    useEffect(() => {
        if (!workspaceId) return;

        const collectionListeners = [
            firestore.listenToCollection<Invoice>(`users/${workspaceId}/invoices`, (data) => setWorkspaceData(prev => ({ ...prev, invoices: data }))),
            firestore.listenToCollection<PurchaseBill>(`users/${workspaceId}/bills`, (data) => setWorkspaceData(prev => ({ ...prev, bills: data }))),
            firestore.listenToCollection<Customer>(`users/${workspaceId}/customers`, (data) => setWorkspaceData(prev => ({ ...prev, customers: data }))),
            firestore.listenToCollection<Vendor>(`users/${workspaceId}/vendors`, (data) => setWorkspaceData(prev => ({ ...prev, vendors: data }))),
            firestore.listenToCollection<Product>(`users/${workspaceId}/products`, (data) => setWorkspaceData(prev => ({ ...prev, products: data }))),
            firestore.listenToCollection<LedgerAccount>(`users/${workspaceId}/chartOfAccounts`, (data) => setWorkspaceData(prev => ({ ...prev, chartOfAccounts: data.length > 0 ? data : initialChartOfAccounts }))),
            firestore.listenToCollection<JournalVoucher>(`users/${workspaceId}/journalVouchers`, (data) => setWorkspaceData(prev => ({ ...prev, journalVouchers: data }))),
            firestore.listenToCollection<PaymentReceived>(`users/${workspaceId}/paymentsReceived`, (data) => setWorkspaceData(prev => ({ ...prev, paymentsReceived: data }))),
            firestore.listenToCollection<PaymentMade>(`users/${workspaceId}/paymentsMade`, (data) => setWorkspaceData(prev => ({ ...prev, paymentsMade: data }))),
            firestore.listenToCollection<CreditNote>(`users/${workspaceId}/creditNotes`, (data) => setWorkspaceData(prev => ({...prev, creditNotes: data}))),
            firestore.listenToCollection<DebitNote>(`users/${workspaceId}/debitNotes`, (data) => setWorkspaceData(prev => ({...prev, debitNotes: data}))),
            firestore.listenToCollection<CapitalAccount>(`users/${workspaceId}/capitalAccounts`, (data) => setWorkspaceData(prev => ({...prev, capitalAccounts: data}))),
            firestore.listenToCollection<Drawing>(`users/${workspaceId}/drawings`, (data) => setWorkspaceData(prev => ({...prev, drawings: data}))),
            firestore.listenToCollection<BankAccount>(`users/${workspaceId}/bankAccounts`, (data) => setWorkspaceData(prev => ({ ...prev, bankAccounts: data.length > 0 ? data : initialBankAccounts }))),
        ];

        const docListener = firestore.listenToDoc<BrandingSettings>(`users/${workspaceId}/settings/branding`, (data) => {
            setWorkspaceData(prev => ({ ...prev, brandingSettings: data || initialBranding }));
        });

        return () => {
            collectionListeners.forEach(unsubscribe => unsubscribe());
            docListener();
        };

    }, [workspaceId]);

    // Load global data (HSN codes) and professional's client list
    useEffect(() => {
        const loadGlobalData = async () => {
             if (rootUser && rootUser.role === 'professional') {
                const clientUsers = await firestore.getManagedUsers(rootUser.id);
                setUsers(clientUsers);
             }
             if (hsnCodes.length === 0) {
                 const fetchedHsnCodes = await firestore.getHsnCodes();
                 setHsnCodes(fetchedHsnCodes.length > 0 ? fetchedHsnCodes : initialHsnCodes);
             }
        };
        if (rootUser) {
            loadGlobalData();
        }
    }, [rootUser, hsnCodes.length]);

     useEffect(() => {
        if (typeof window !== 'undefined' && !asOnDateForTrial) {
            setAsOnDateForTrial(new Date());
        }
     }, [asOnDateForTrial]);
    
    const switchUser = useCallback(async (targetUserId: string) => {
        if (!rootUser?.id || !workspaceId) return;
        await firestore.updateUser(rootUser.id, { activeChildId: targetUserId });
        const targetUser = rootUser.id === targetUserId ? rootUser : await firestore.getUser(targetUserId);
        if (targetUser) {
            setActiveUser(targetUser);
            router.push(rootUser.id === targetUserId ? '/admin' : '/dashboard');
        }
    }, [rootUser, router, workspaceId]);
    
    const logAction = useCallback(async (action: Omit<AuditLog, 'id' | 'timestamp' | 'user' | 'financialYear'>) => {
        if (!rootUser || !workspaceId) return;
        const logEntry: Omit<AuditLog, 'id'> = {
            ...action, user: rootUser.name || 'System', timestamp: new Date() as any, financialYear
        };
        await firestore.addDocToSubcollection(workspaceId, 'auditLog', logEntry);
    }, [rootUser, workspaceId, financialYear]);

    const updateStock = useCallback(async (lineItems: LineItem[], operation: 'add' | 'subtract') => {
        if (!workspaceId) return;
        for (const item of lineItems) {
            const productRef = doc(db, `users/${workspaceId}/products`, item.productId);
            await firestore.updateDocTransaction(productRef, (product) => {
                const currentStock = (product.currentStock || 0);
                const quantityChange = (operation === 'add' ? item.quantity : -item.quantity);
                return { currentStock: currentStock + quantityChange };
            });
        }
    }, [workspaceId]);
    
    const addJournalVoucher = useCallback(async (voucher: Omit<JournalVoucher, 'amount' | 'financialYear'>) => {
        if (!workspaceId) return;
        const id = voucher.id || `JV-${Date.now()}`;
        const amount = voucher.debitEntries.reduce((sum, e) => sum + e.amount, 0);
        const newVoucherData = { ...voucher, id, amount, financialYear };
        await firestore.setDocInSubcollection(workspaceId, 'journalVouchers', id, newVoucherData);
        await logAction({ action: 'Create', entity: 'Journal Voucher', entityId: id, details: `Created JV for ₹${amount}: ${voucher.narration}`});
    }, [workspaceId, financialYear, logAction]);
    
    const postJournalEntryForTransaction = useCallback(async (type: 'Invoice' | 'Purchase', id: string) => {
        if(!workspaceId) return;
        const jvId = `JV-${type === 'Invoice' ? 'INV' : 'PUR'}-${id}`;
        
        const jvExists = await firestore.docExists(`users/${workspaceId}/journalVouchers/${jvId}`);
        if (jvExists) {
            // toast({ variant: 'default', title: 'Already Posted', description: 'A journal entry for this transaction already exists.' });
            return;
        }

        if (type === 'Invoice') {
            const invoice = await firestore.getDocFromSubcollection<Invoice>(workspaceId, 'invoices', id);
            if (!invoice) return;
            const customer = workspaceData.customers.find(c => c.name === invoice.client);
            const creditEntries = [{ accountId: 'sales', amount: invoice.taxableValue }];
            if (invoice.cgst > 0) creditEntries.push({ accountId: 'output-cgst', amount: invoice.cgst });
            if (invoice.sgst > 0) creditEntries.push({ accountId: 'output-sgst', amount: invoice.sgst });
            if (invoice.igst > 0) creditEntries.push({ accountId: 'output-igst', amount: invoice.igst });
            await addJournalVoucher({ id: jvId, date: invoice.date, narration: `Sale to ${invoice.client} via Invoice #${invoice.id}`, debitEntries: [{ accountId: customer?.id || 'receivables', amount: invoice.totalAmount }], creditEntries });
        } else { // Purchase
            const bill = await firestore.getDocFromSubcollection<PurchaseBill>(workspaceId, 'bills', id);
            if (!bill) return;
            const vendor = workspaceData.vendors.find(v => v.name === bill.vendor);
            const debitEntries = [{ accountId: 'purchases', amount: bill.taxableValue }];
            if (bill.gstAmount > 0) debitEntries.push({ accountId: 'input-gst', amount: bill.gstAmount });
            await addJournalVoucher({ id: jvId, date: bill.date, narration: `Purchase from ${bill.vendor} via Bill #${bill.id}`, debitEntries, creditEntries: [{ accountId: vendor?.id || 'payables', amount: bill.totalAmount }] });
        }
        // toast({ title: 'Transaction Posted', description: `Journal entry for ${id} has been created.` });

    }, [workspaceId, addJournalVoucher, toast, workspaceData.customers, workspaceData.vendors]);

    const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'amountPaid' | 'status' | 'financialYear'> & { id: string }) => {
        if (!workspaceId) return { success: false, error: "No active workspace" };
        const invoiceExists = await firestore.docExists(`users/${workspaceId}/invoices/${invoiceData.id}`);
        if (invoiceExists) {
            return { success: false, error: `An invoice with ID ${invoiceData.id} already exists.` };
        }
        const dataForState = { ...invoiceData, amountPaid: 0, status: 'Pending', financialYear };
        await firestore.setDocInSubcollection(workspaceId, 'invoices', invoiceData.id, dataForState);
        await updateStock(invoiceData.lineItems, 'subtract');
        await postJournalEntryForTransaction('Invoice', invoiceData.id);
        toast({ title: 'Invoice Saved!', description: `Invoice ${invoiceData.id} has been created.` });
        return { success: true };
    }, [workspaceId, financialYear, updateStock, postJournalEntryForTransaction, toast]);
    
    const updateInvoice = async (invoice: Invoice, originalLineItems: LineItem[]) => {
        if (!workspaceId) return;
        await firestore.updateDocInSubcollection(workspaceId, 'invoices', invoice.id, invoice);
        await updateStock(originalLineItems, 'add');
        await updateStock(invoice.lineItems, 'subtract');
    };

    const addBill = useCallback(async (bill: Omit<PurchaseBill, 'amountPaid' | 'financialYear'>, billNumber: string) => {
        if (!workspaceId) return;
        const newBillData = { ...bill, id: billNumber, amountPaid: 0, financialYear };
        await firestore.setDocInSubcollection(workspaceId, 'bills', billNumber, newBillData);
        await updateStock(bill.lineItems, 'add');
        await postJournalEntryForTransaction('Purchase', bill.id);
    }, [workspaceId, financialYear, updateStock, postJournalEntryForTransaction]);
    
    const updateBill = async (billToUpdate: PurchaseBill, originalLineItems?: LineItem[]) => {
        if (!workspaceId) return;
        await firestore.updateDocInSubcollection(workspaceId, 'bills', billToUpdate.id, billToUpdate);
        if (originalLineItems) {
          await updateStock(originalLineItems, 'subtract');
          await updateStock(billToUpdate.lineItems, 'add');
        }
    };
    
    const addCreditNote = useCallback(async (note: Omit<CreditNote, 'financialYear'>) => {
        if (!workspaceId) return;
        await firestore.addDocToSubcollection(workspaceId, 'creditNotes', { ...note, financialYear });
        const customer = workspaceData.customers.find(c => c.name === note.client);
        await addJournalVoucher({
            id: `JV-CN-${note.id}`,
            date: note.date,
            narration: `Sales Return from ${note.client} via Credit Note #${note.id}`,
            debitEntries: [{ accountId: 'sales', amount: note.taxableValue }, { accountId: 'output-igst', amount: note.igst }],
            creditEntries: [{ accountId: customer?.id || 'receivables', amount: note.totalAmount }],
        });
    }, [workspaceId, financialYear, addJournalVoucher, workspaceData.customers]);

    const addDebitNote = useCallback(async (note: Omit<DebitNote, 'financialYear'>) => {
        if (!workspaceId) return;
        await firestore.addDocToSubcollection(workspaceId, 'debitNotes', { ...note, financialYear });
        const vendor = workspaceData.vendors.find(v => v.name === note.vendor);
        await addJournalVoucher({
            id: `JV-DN-${note.id}`,
            date: note.date,
            narration: `Purchase Return to ${note.vendor} via Debit Note #${note.id}`,
            debitEntries: [{ accountId: vendor?.id || 'payables', amount: note.totalAmount }],
            creditEntries: [
                { accountId: 'purchases', amount: note.taxableValue },
                { accountId: 'input-gst', amount: note.gstAmount },
            ],
        });
    }, [workspaceId, financialYear, addJournalVoucher, workspaceData.vendors]);
    
    const addPaymentReceived = async (payment: Omit<PaymentReceived, 'id'|'financialYear'>) => {
        if (!workspaceId) return;
        const newPayment = { ...payment, id: `PAY-IN-${Date.now()}`, financialYear };
        await firestore.addDocToSubcollection(workspaceId, 'paymentsReceived', newPayment);
        const customer = workspaceData.customers.find(c => c.name === payment.customerId);
        await addJournalVoucher({
            id: `JV-REC-${newPayment.id}`,
            date: payment.date,
            narration: `Payment from ${payment.customerId} via ${payment.mode}`,
            debitEntries: [{ accountId: payment.accountId, amount: payment.amount }],
            creditEntries: [{ accountId: customer?.id || 'receivables', amount: payment.amount }],
        });
    };

    const addPaymentMade = useCallback(async (payment: Omit<PaymentMade, 'id' | 'financialYear'>) => {
        if (!workspaceId) return;
        const newPayment = { ...payment, id: `PAY-OUT-${Date.now()}`, financialYear };
        await firestore.addDocToSubcollection(workspaceId, 'paymentsMade', newPayment);
        const vendor = workspaceData.vendors.find(v => v.name === payment.vendorId);
        await addJournalVoucher({
            id: `JV-PAY-${newPayment.id}`,
            date: payment.date,
            narration: `Payment to ${payment.vendorId} via ${payment.mode}`,
            debitEntries: [{ accountId: vendor?.id || 'payables', amount: payment.amount }],
            creditEntries: [{ accountId: payment.accountId, amount: payment.amount }],
        });
    }, [workspaceId, financialYear, addJournalVoucher, workspaceData.vendors]);

    const trialBalanceData = useMemo(() => {
        if (!isReady || !asOnDateForTrial) return null;
        if (workspaceData.trialBalanceData?.source === 'upload') {
            return workspaceData.trialBalanceData;
        }

        const { journalVouchers, chartOfAccounts, customers, vendors } = workspaceData;
        const filteredJournalVouchers = journalVouchers.filter(jv => !isAfter(parseISO(jv.date), asOnDateForTrial));
        
        const accounts = new Map<string, { debit: number; credit: number }>();
        const accountDetails = new Map<string, { name: string }>();

        [...chartOfAccounts, ...customers, ...vendors].forEach(acc => {
          accounts.set(acc.id, { debit: 0, credit: 0 });
          accountDetails.set(acc.id, { name: acc.name });
        });

        filteredJournalVouchers.forEach(jv => {
          jv.debitEntries.forEach(entry => {
            if (!accounts.has(entry.accountId)) accounts.set(entry.accountId, { debit: 0, credit: 0 });
            const acc = accounts.get(entry.accountId)!;
            acc.debit += entry.amount;
          });
          jv.creditEntries.forEach(entry => {
            if (!accounts.has(entry.accountId)) accounts.set(entry.accountId, { debit: 0, credit: 0 });
            const acc = accounts.get(entry.accountId)!;
            acc.credit += entry.amount;
          });
        });
        
        const tbEntries: TrialBalanceEntry[] = Array.from(accounts.entries()).map(([accountId, balances]) => {
            const details = accountDetails.get(accountId) || { name: accountId };
            const netBalance = balances.debit - balances.credit;

            if (Math.abs(netBalance) < 0.01) return null;

            if (netBalance > 0) {
                return {
                    account: details.name,
                    id: accountId,
                    debit: netBalance,
                    credit: 0,
                };
            } else {
                return {
                    account: details.name,
                    id: accountId,
                    debit: 0,
                    credit: Math.abs(netBalance),
                };
            }
        }).filter((item): item is TrialBalanceEntry => item !== null);

        return {
            date: asOnDateForTrial.toISOString(),
            data: tbEntries,
            source: 'transactional'
        };

    }, [isReady, asOnDateForTrial, workspaceData]);

    const performYearEndClose = async () => {
        // This is a placeholder for the complex year-end logic.
        // A full implementation would involve creating closing JVs, and transferring balances.
        if(!rootUser?.id) return;
        const currentYear = rootUser.activeFinancialYear || '2025-26';
        const nextYear = `${parseInt(currentYear.split('-')[0]) + 1}-${String(parseInt(currentYear.split('-')[1]) + 1).padStart(2, '0')}`;
        await firestore.updateUser(rootUser.id, { activeFinancialYear: nextYear });
    };

    const value: DataContextType = {
        isReady, rootUser, authUser: activeUser, authLoading, workspaceId,
        invoices: workspaceData.invoices,
        bills: workspaceData.bills,
        creditNotes: workspaceData.creditNotes,
        debitNotes: workspaceData.debitNotes,
        paymentsReceived: workspaceData.paymentsReceived,
        paymentsMade: workspaceData.paymentsMade,
        journalVouchers: workspaceData.journalVouchers,
        capitalAccounts: workspaceData.capitalAccounts,
        drawings: workspaceData.drawings,
        auditLog: workspaceData.auditLog,
        trialBalanceData,
        asOnDateForTrial,
        setAsOnDateForTrial,
        users, hsnCodes,
        customers: workspaceData.customers,
        vendors: workspaceData.vendors,
        products: workspaceData.products,
        chartOfAccounts: workspaceData.chartOfAccounts,
        bankAccounts: workspaceData.bankAccounts,
        brandingSettings: workspaceData.brandingSettings,
        teamMembers: workspaceData.teamMembers,
        switchUser,
        addUser: async (user) => {
            const newUser = await firestore.addUser(user);
            if (newUser) {
                setUsers(prev => [...prev, newUser]);
                return newUser;
            }
        },
        updateUser: async (userId, user) => {
          await firestore.updateUser(userId, user);
          setUsers(prev => prev.map(u => u.id === userId ? {...u, ...user} as User : u));
          if (userId === activeUser?.id) {
              setActiveUser(prev => ({...prev, ...user} as User));
          }
        },
        setTrialBalanceData: (data) => firestore.setDocInSubcollection(workspaceId!, 'state', 'trialBalance', { data }),
        setBrandingSettings: async (settings) => {
            await firestore.setDocInSubcollection(workspaceId!, 'settings', 'branding', settings);
        },
        addCustomer: async (customer) => {
            const newCustomer: Customer = { ...customer, id: `cust-${Date.now()}`, clientCode: generateClientCode() };
            await firestore.addDocToSubcollection(workspaceId!, 'customers', newCustomer, newCustomer.id);
            return newCustomer;
        },
        updateCustomer: async (customer) => await firestore.updateDocInSubcollection(workspaceId!, 'customers', customer.id, customer),
        deleteCustomer: async (id) => await firestore.deleteDocFromSubcollection(workspaceId!, 'customers', id),
        addVendor: async (vendor) => {
            const newVendor: Vendor = { ...vendor, id: `vend-${Date.now()}`, vendorCode: generateVendorCode() };
            await firestore.addDocToSubcollection(workspaceId!, 'vendors', newVendor, newVendor.id);
            return newVendor;
        },
        updateVendor: async (vendor) => await firestore.updateDocInSubcollection(workspaceId!, 'vendors', vendor.id, vendor),
        deleteVendor: async (id) => await firestore.deleteDocFromSubcollection(workspaceId!, 'vendors', id),
        addProduct: async (product) => {
            const newProduct: Product = { ...product, id: `prod-${Date.now()}`, currentStock: product.openingStockQty };
            await firestore.addDocToSubcollection(workspaceId!, 'products', newProduct, newProduct.id);
        },
        updateProduct: async (product) => await firestore.updateDocInSubcollection(workspaceId!, 'products', product.id, product),
        deleteProduct: async (id) => await firestore.deleteDocFromSubcollection(workspaceId!, 'products', id),
        setChartOfAccounts: async (accounts) => await firestore.setDocInSubcollection(workspaceId!, 'state', 'chartOfAccounts', { accounts }),
        bulkAddHsnCodes: async (codes) => {
            await firestore.bulkAddHsnCodes(codes);
            const updatedHsnCodes = await firestore.getHsnCodes();
            setHsnCodes(updatedHsnCodes);
        },
        addHsnCode: async (code) => {
            const newCode = await firestore.addHsnCode(code);
            setHsnCodes(prev => [...prev, newCode]);
        },
        updateHsnCode: async (id, data) => {
            await firestore.updateHsnCode(id, data);
            setHsnCodes(prev => prev.map(c => c.id === id ? { ...c, ...data } as HsnCode : c));
        },
        deleteHsnCode: async (id) => {
            await firestore.deleteHsnCode(id);
            setHsnCodes(prev => prev.filter(c => c.id !== id));
        },
        addInvoice, updateInvoice, addBill, updateBill,
        addCreditNote,
        addDebitNote,
        postJournalEntryForTransaction,
        addPaymentReceived,
        addPaymentMade,
        addJournalVoucher,
        addCapitalAccount: async (account) => await firestore.addDocToSubcollection(workspaceId!, 'capitalAccounts', { ...account, financialYear }),
        updateCapitalAccount: async (account) => await firestore.updateDocInSubcollection(workspaceId!, 'capitalAccounts', account.id, account),
        deleteCapitalAccount: async (id) => await firestore.deleteDocFromSubcollection(workspaceId!, 'capitalAccounts', id),
        addDrawing: async (drawing) => await firestore.addDocToSubcollection(workspaceId!, 'drawings', { ...drawing, financialYear }),
        getInvoiceById: (id) => workspaceData.invoices.find(inv => inv.id === id),
        getBillById: (id) => workspaceData.bills.find(b => b.id === id),
        getCustomerByName: (name) => workspaceData.customers.find(c => c.name === name),
        getPaymentsForInvoice: (invoiceId) => workspaceData.paymentsReceived.filter(p => p.invoiceId === invoiceId),
        performYearEndClose,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
