
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle } from 'lucide-react';
import type { LedgerAccount } from '@/lib/types';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { DateRangePicker } from '../date-range-picker';
import { DateRange } from 'react-day-picker';

type LedgerEntry = {
    date: string;
    details: string;
    debit: number;
    credit: number;
};

function GeneralLedgerContent() {
  const { journalVouchers, chartOfAccounts, customers, vendors } = useData();
  const searchParams = useSearchParams();
  const accountQuery = searchParams.get('account');

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const allAccounts: { value: string, label: string }[] = useMemo(() => {
    if (!chartOfAccounts) return [];
    
    const customerAccounts = customers.map(c => ({ value: c.id, label: c.name}));
    const vendorAccounts = vendors.map(v => ({ value: v.id, label: v.name}));

    return [
        ...chartOfAccounts.map(c => ({ value: c.id, label: c.name })),
        ...customerAccounts, 
        ...vendorAccounts
    ];
  }, [chartOfAccounts, customers, vendors]);


  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  
  const selectedAccount = useMemo(() => {
      if (!selectedAccountId) return null;
      const accountInfo = allAccounts.find(acc => acc.value === selectedAccountId);
      const chartOfAccountInfo = chartOfAccounts.find(acc => acc.id === selectedAccountId);
      if (!accountInfo) return null;
      
      return {
          id: accountInfo.value,
          name: accountInfo.label,
          category: chartOfAccountInfo?.category
      };
  }, [selectedAccountId, allAccounts, chartOfAccounts]);

  useEffect(() => {
    if (accountQuery && !selectedAccountId) {
      setSelectedAccountId(accountQuery);
      setAccountSearch(allAccounts.find(a => a.value === accountQuery)?.label || '');
    } else if (allAccounts.length > 0 && !selectedAccountId) {
      // Default to sales or first account if no query
      const defaultAccount = allAccounts.find(acc => acc.value === 'sales') || allAccounts[0];
      setSelectedAccountId(defaultAccount.value);
      setAccountSearch(defaultAccount.label);
    }
  }, [accountQuery, allAccounts, selectedAccountId]);
  

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    setAccountSearch(allAccounts.find(a => a.value === accountId)?.label || '');
  };
  
  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    if (!selectedAccount || !journalVouchers) return [];
    
    let entries: LedgerEntry[] = [];
    
    const filteredJVs = journalVouchers.filter(jv => {
        if (!dateRange?.from || !dateRange.to) return true; // Show all if no range
        const jvDate = parseISO(jv.date);
        return jvDate >= dateRange.from && jvDate <= dateRange.to;
    });

    filteredJVs.forEach(jv => {
        let isDebit = jv.debitEntries.some(e => e.accountId === selectedAccount.id);
        let isCredit = jv.creditEntries.some(e => e.accountId === selectedAccount.id);

        if (isDebit) {
            const entry = jv.debitEntries.find(e => e.accountId === selectedAccount.id)!;
            const particulars = jv.creditEntries.map(ce => allAccounts.find(a => a.value === ce.accountId)?.label || ce.accountId).join(', ');
            entries.push({
                date: jv.date,
                details: `To ${particulars} (${jv.narration})`,
                debit: entry.amount,
                credit: 0,
            });
        }
        if (isCredit) {
            const entry = jv.creditEntries.find(e => e.accountId === selectedAccount.id)!;
            const particulars = jv.debitEntries.map(de => allAccounts.find(a => a.value === de.accountId)?.label || de.accountId).join(', ');
            entries.push({
                date: jv.date,
                details: `By ${particulars} (${jv.narration})`,
                debit: 0,
                credit: entry.amount,
            });
        }
    });

    return entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [selectedAccount, journalVouchers, allAccounts, dateRange]);

  const { totalDebits, totalCredits, closingBalance } = useMemo(() => {
    let debits = 0;
    let credits = 0;
    ledgerEntries.forEach(entry => {
        debits += entry.debit;
        credits += entry.credit;
    });
    // Balance calculation depends on account type
    const balance = (selectedAccount?.category === 'Asset' || selectedAccount?.category === 'Expense')
        ? debits - credits
        : credits - debits;

    return { totalDebits: debits, totalCredits: credits, closingBalance: balance };
  }, [ledgerEntries, selectedAccount]);
  
  const accountOptions = allAccounts.map(acc => ({ value: acc.value, label: acc.label }));


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Ledger Details</CardTitle>
            <CardDescription>
              View the detailed transaction history for any account.
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
             <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Combobox
                options={accountOptions}
                value={selectedAccountId || ''}
                inputValue={accountSearch}
                onInputChange={setAccountSearch}
                onSelect={handleAccountChange}
                placeholder="Select an account..."
                searchPlaceholder="Search accounts..."
                notFoundMessage="No account found."
                className="w-[250px]"
            />
            <Button asChild variant="outline">
                <Link href="/accounts">
                    <PlusCircle className="mr-2 h-4 w-4" /> Manage
                </Link>
            </Button>
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedAccount ? (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ledgerEntries.map((entry, index) => {
                     const runningBalanceCalc = (acc: number, curr: LedgerEntry) => (selectedAccount?.category === 'Asset' || selectedAccount?.category === 'Expense') 
                        ? acc + curr.debit - curr.credit 
                        : acc + curr.credit - curr.debit;
                    const runningBalance = ledgerEntries.slice(0, index + 1).reduce(runningBalanceCalc, 0);
                    return (
                        <TableRow key={index}>
                            <TableCell>{format(new Date(entry.date), 'dd-MM-yyyy')}</TableCell>
                            <TableCell>{entry.details}</TableCell>
                            <TableCell className="text-right font-mono">₹{entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : '-'}</TableCell>
                            <TableCell className="text-right font-mono">₹{entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : '-'}</TableCell>
                            <TableCell className="text-right font-mono">
                                ₹{runningBalance.toLocaleString('en-IN')}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            <TableFooter>
                <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>Closing Balance</TableCell>
                    <TableCell className="text-right font-mono">₹{totalDebits.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">₹{totalCredits.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">₹{closingBalance.toLocaleString('en-IN')}</TableCell>
                </TableRow>
            </TableFooter>
            </Table>
        ) : (
            <div className="text-center py-12 text-muted-foreground">
                <p>Please select an account to view its ledger.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function GeneralLedgerPage() {
  return (
    <div>
      <PageHeader
        title="General Ledger"
        description="View the detailed transaction history for any account."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <GeneralLedgerContent />
        </Suspense>
      </main>
    </div>
  );
}
