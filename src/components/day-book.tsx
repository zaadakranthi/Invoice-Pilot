
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useData } from '@/context/data-context';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';
import { DateRangePicker } from './date-range-picker';
import { DateRange } from 'react-day-picker';

interface DayBookEntry {
    date: string;
    account: string;
    particulars: string;
    voucherType: string;
    debit: number;
    credit: number;
}

const classificationOptions = {
    Asset: ['Fixed Asset', 'Current Asset', 'Investment', 'Fictitious Asset'],
    Liability: ['Capital', 'Loans (Liabilities)', 'Current Liabilities', 'Suspense A/c'],
    Income: ['Direct Incomes', 'Indirect Incomes'],
    Expense: ['Direct Expenses', 'Indirect Expenses', 'Purchase Accounts'],
    Equity: ['Capital Account', 'Reserves & Surplus'],
};
const allClassifications = Object.values(classificationOptions).flat();

export function DayBook() {
    const { invoices, bills, paymentsMade, paymentsReceived, journalVouchers, chartOfAccounts } = useData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    
    const [filterValue, setFilterValue] = useState('all');
    const [filterSearch, setFilterSearch] = useState('All Transactions');


    const allLedgerEntries: DayBookEntry[] = useMemo(() => {
        if (!chartOfAccounts) return []; // Ensure chartOfAccounts is loaded

        const entries: DayBookEntry[] = [];
        // Invoices (Sales)
        invoices.forEach(inv => {
            entries.push({ date: inv.date, account: 'Sales Revenue', particulars: `To ${inv.client}`, voucherType: 'Sales', debit: 0, credit: inv.taxableValue });
            entries.push({ date: inv.date, account: inv.client, particulars: 'To Sales Revenue', voucherType: 'Sales', debit: inv.totalAmount, credit: 0 });
            if (inv.cgst > 0) entries.push({ date: inv.date, account: 'Output CGST', particulars: `To ${inv.client}`, voucherType: 'Sales', debit: 0, credit: inv.cgst });
            if (inv.sgst > 0) entries.push({ date: inv.date, account: 'Output SGST', particulars: `To ${inv.client}`, voucherType: 'Sales', debit: 0, credit: inv.sgst });
            if (inv.igst > 0) entries.push({ date: inv.date, account: 'Output IGST', particulars: `To ${inv.client}`, voucherType: 'Sales', debit: 0, credit: inv.igst });
        });
        // Bills (Purchases)
        bills.forEach(bill => {
            entries.push({ date: bill.date, account: 'Purchases', particulars: `By ${bill.vendor}`, voucherType: 'Purchase', debit: bill.taxableValue, credit: 0 });
            entries.push({ date: bill.date, account: bill.vendor, particulars: 'By Purchases', voucherType: 'Purchase', debit: 0, credit: bill.totalAmount });
            if (bill.gstAmount > 0) entries.push({ date: bill.date, account: 'Input GST', particulars: `By ${bill.vendor}`, voucherType: 'Purchase', debit: bill.gstAmount, credit: 0 });
        });
        // Payments Made
        paymentsMade.forEach(p => {
            entries.push({ date: p.date, account: p.vendorId, particulars: `To ${p.mode}`, voucherType: 'Payment', debit: p.amount, credit: 0 });
            entries.push({ date: p.date, account: 'Cash & Bank', particulars: `By ${p.vendorId}`, voucherType: 'Payment', debit: 0, credit: p.amount });
        });
        // Payments Received
        paymentsReceived.forEach(p => {
            entries.push({ date: p.date, account: 'Cash & Bank', particulars: `To ${p.customerId}`, voucherType: 'Receipt', debit: p.amount, credit: 0 });
            entries.push({ date: p.date, account: p.customerId, particulars: `By ${p.mode}`, voucherType: 'Receipt', debit: 0, credit: p.amount });
        });
        // Journal Vouchers
        journalVouchers.forEach(jv => {
            jv.debitEntries.forEach(de => {
                const creditParticulars = jv.creditEntries.map(ce => chartOfAccounts.find(a => a.id === ce.accountId)?.name || ce.accountId).join(', ');
                entries.push({ 
                    date: jv.date, 
                    account: chartOfAccounts.find(a => a.id === de.accountId)?.name || de.accountId, 
                    particulars: `To ${creditParticulars} - ${jv.narration}`, 
                    voucherType: 'Journal', 
                    debit: de.amount, 
                    credit: 0 
                });
            });
            jv.creditEntries.forEach(ce => {
                const debitParticulars = jv.debitEntries.map(de => chartOfAccounts.find(a => a.id === de.accountId)?.name || de.accountId).join(', ');
                entries.push({ 
                    date: jv.date, 
                    account: chartOfAccounts.find(a => a.id === ce.accountId)?.name || ce.accountId, 
                    particulars: `By ${debitParticulars} - ${jv.narration}`, 
                    voucherType: 'Journal', 
                    debit: 0, 
                    credit: ce.amount 
                });
            });
        });

        return entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [invoices, bills, paymentsMade, paymentsReceived, journalVouchers, chartOfAccounts]);


    const filteredEntries = useMemo(() => {
        if (!chartOfAccounts) return [];
        let entries = allLedgerEntries;
        // Filter by date
        if (dateRange?.from && dateRange?.to) {
            entries = entries.filter(e => {
                const entryDate = parseISO(e.date);
                return entryDate >= dateRange.from! && entryDate <= dateRange.to!;
            });
        }
        
        // Filter by group or ledger
        if (filterValue !== 'all') {
            const isGroupFilter = allClassifications.includes(filterValue);
            if (isGroupFilter) {
                const accountIdsInGroup = chartOfAccounts.filter(acc => acc.classification === filterValue).map(acc => acc.name);
                entries = entries.filter(e => accountIdsInGroup.includes(e.account));
            } else {
                 entries = entries.filter(e => e.account === filterSearch);
            }
        }

        return entries;
    }, [allLedgerEntries, dateRange, filterValue, filterSearch, chartOfAccounts]);


    const filterOptions = chartOfAccounts ? [
        { value: 'all', label: 'All Transactions' },
        ...allClassifications.map(c => ({ value: c, label: `Group: ${c}`})),
        ...chartOfAccounts.map(acc => ({ value: acc.id, label: acc.name }))
    ] : [];

    const handleFilterSelect = (value: string, label?: string) => {
        setFilterValue(value);
        setFilterSearch(label || filterOptions.find(o => o.value === value)?.label || value);
    }
    
    const totalDebits = filteredEntries.reduce((acc, item) => acc + item.debit, 0);
    const totalCredits = filteredEntries.reduce((acc, item) => acc + item.credit, 0);


    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Day Book</CardTitle>
                        <CardDescription>A chronological list of all financial transactions.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange}/>
                        <Combobox
                            options={filterOptions}
                            value={filterValue}
                            inputValue={filterSearch}
                            onInputChange={setFilterSearch}
                            onSelect={handleFilterSelect}
                            placeholder="Filter by group or ledger..."
                            searchPlaceholder="Search..."
                            notFoundMessage="No match found."
                            className="w-[280px]"
                        />
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Particulars</TableHead>
                            <TableHead>Voucher Type</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEntries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{format(parseISO(entry.date), 'dd-MM-yyyy')}</TableCell>
                                <TableCell className="font-medium">{entry.account}</TableCell>
                                <TableCell>{entry.particulars}</TableCell>
                                <TableCell>{entry.voucherType}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {entry.debit > 0 ? entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {entry.credit > 0 ? entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={4}>Totals</TableCell>
                            <TableCell className="text-right font-mono">₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right font-mono">₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
