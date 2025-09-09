
'use client';

import { Features } from '@/components/features';
import { MarketingDisplay } from '@/components/marketing-display';
import { DashboardSummary } from '@/components/dashboard-summary';
import { LatestInvoices } from '@/components/latest-invoices';
import { ComplianceCalendar } from '@/components/compliance-calendar';

const billingFeatures = [
    { title: 'Invoices', description: 'Create & manage sales invoices', href: '/invoices', icon: 'Receipt' },
    { title: 'Purchases', description: 'Record purchase bills', href: '/purchases', icon: 'ShoppingCart' },
    { title: 'Credit Notes', description: 'Issue for sales returns', href: '/credit-notes', icon: 'FileMinus' },
    { title: 'Debit Notes', description: 'Issue for purchase returns', href: '/debit-notes', icon: 'FilePlus' },
];

const gstFilingsFeatures = [
    { title: 'GSTR-1 Filing', description: 'Prepare sales return', href: '/gstr-1', icon: 'FileCheck' },
    { title: 'GSTR-3B Summary', description: 'Prepare tax summary', href: '/gstr-3b', icon: 'Files' },
    { title: 'GSTR-9 Annual', description: 'File annual return', href: '/gstr-annual', icon: 'FileArchive' },
    { title: 'GSTR-9C Reconciliation', description: 'Reconcile financials', href: '/gstr-9c', icon: 'FileArchive' },
]

const analyticsFeatures = [
    { title: 'Analytics & Reports', description: 'View sales and client data', href: '/analytics', icon: 'CandlestickChart'},
    { title: 'ITC Reconciliation', description: 'Match input tax credit', href: '/itc-reconciliation', icon: 'FileCheck' },
    { title: 'GSTR Comparison', description: 'Compare GSTR-1 vs 3B', href: '/gstr-comparison', icon: 'Files' },
    { title: 'TDS Report', description: 'Report for tax deducted', href: '/tds-report', icon: 'FilePieChart' },
    { title: 'TCS Report', description: 'Report for tax collected', href: '/tcs-report', icon: 'FilePieChart' },
    { title: 'Audit Trail', description: 'Track all activities', href: '/audit-trail', icon: 'History' },
];

const partiesAndItemsFeatures = [
    { title: 'Customers', description: 'Manage your customers', href: '/customers', icon: 'Users' },
    { title: 'Vendors', description: 'Manage your suppliers', href: '/vendors', icon: 'Building' },
    { title: 'Products & Services', description: 'Manage goods & services', href: '/products', icon: 'Package' },
];

const dayToDayFeatures = [
    { title: 'Day Book', description: 'View all transactions', href: '/day-book', icon: 'Book' },
    { title: 'Journal Vouchers', description: 'Record adjustment entries', href: '/journal-vouchers', icon: 'BookText' },
    { title: 'Receivables', description: 'Track payments due', href: '/receivables', icon: 'FileText' },
    { title: 'Payables', description: 'Track bills to pay', href: '/payables', icon: 'Copy' },
    { title: 'Cash & Bank', description: 'View cash & bank ledger', href: '/cash-and-bank', icon: 'Wallet' },
    { title: 'General Ledger', description: 'View all account ledgers', href: '/general-ledger', icon: 'BookOpenCheck' },
    { title: 'Trial Balance', description: 'View ledger balances', href: '/trial-balance', icon: 'Scale' },
];

const financialStatementsFeatures = [
    { title: 'Trading Account', description: 'Calculate gross profit', href: '/trading-account', icon: 'CandlestickChart' },
    { title: 'Profit & Loss', description: 'Calculate net profit', href: '/profit-and-loss', icon: 'Landmark' },
    { title: 'Balance Sheet', description: 'View financial position', href: '/balance-sheet', icon: 'Sheet' },
    { title: 'Cash Flow Statement', description: 'View cash movement', href: '/cash-flow', icon: 'Wind' },
    { title: 'Depreciation Chart', description: 'Manage fixed assets', href: '/depreciation-chart', icon: 'TrendingDown' },
    { title: 'Capital Accounts', description: 'Manage partner capital', href: '/capital-accounts', icon: 'PiggyBank' },
    { title: 'Drawings', description: 'Record personal drawings', href: '/drawings', icon: 'UserMinus' },
];

const servicesAndSettingsFeatures = [
    { title: 'Financial Reports', description: 'Generate full financial reports', href: '/financial-reports', icon: 'Sheet' },
    { title: 'CMA Report', description: 'Generate CMA for bank loans', href: '/cma-report', icon: 'CmaIcon' },
    { title: 'Book an Appointment', description: 'Consult a CA or Auditor', href: '/book-appointment', icon: 'CalendarCheck' },
    { title: 'Company Settings', description: 'Customize your brand', href: '/branding', icon: 'HeartHandshake' },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <MarketingDisplay />
        <DashboardSummary />
        
        <Features title="Billing" features={billingFeatures} className="grid-cols-2 md:grid-cols-4" />
        <Features title="GST Filings" features={gstFilingsFeatures} className="grid-cols-2 md:grid-cols-4" />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-8">
                <Features title="Analytics & Reconciliation" features={analyticsFeatures} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-3" />
                <ComplianceCalendar />
            </div>
            <div className="lg:col-span-2">
                 <LatestInvoices />
            </div>
        </div>

        <Features title="Parties & Items" features={partiesAndItemsFeatures} className="grid-cols-1 md:grid-cols-3" />
        <Features title="Day-to-Day Accounting" features={dayToDayFeatures} className="grid-cols-2 md:grid-cols-4 lg:grid-cols-7" />
        <Features title="Financial Statements" features={financialStatementsFeatures} className="grid-cols-2 md:grid-cols-4 lg:grid-cols-7" />
        <Features title="Professional Services & Settings" features={servicesAndSettingsFeatures} className="grid-cols-2 md:grid-cols-4" />
        
      </main>
    </div>
  );
}
