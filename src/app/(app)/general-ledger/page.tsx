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
import { format } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';

type LedgerEntry = {
    date: string;
    details: string;
    debit: number;
    credit: number;
};

function GeneralLedgerContent() {
  const { invoices, bills, paymentsReceived, paymentsMade, journalVouchers, chartOfAccounts, customers, vendors } = useData();
  const searchParams = useSearchParams();
  const accountQuery = searchParams.get('account');

  const allAccounts: LedgerAccount[] = useMemo(() => {
    if (!chartOfAccounts) return [];
    
    const customerAccounts = customers.map(c => ({ id: c.id, name: c.name, category: 'Asset' as const, classification: 'Accounts Receivable'}));
    const vendorAccounts = vendors.map(v => ({ id: v.id, name: v.name, category: 'Liability' as const, classification: 'Accounts Payable'}));

    return [...chartOfAccounts, ...customerAccounts, ...vendorAccounts];
  }, [chartOfAccounts, customers, vendors]);


  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null);
  const [accountSearch, setAccountSearch] = useState('');

  useEffect(() => {
    const accountFromUrl = allAccounts.find(acc => acc.id === accountQuery);
    if (accountFromUrl) {
      setSelectedAccount(accountFromUrl);
      setAccountSearch(accountFromUrl.name);
    } else if (allAccounts.length > 0 && !selectedAccount) {
      // Default to sales or first account if no query
      const defaultAccount = allAccounts.find(acc => acc.id === 'sales') || allAccounts[0];
      setSelectedAccount(defaultAccount);
      setAccountSearch(defaultAccount.name);
    }
  }, [accountQuery, allAccounts, selectedAccount]);
  

  const handleAccountChange = (accountId: string) => {
    const account = allAccounts.find(acc => acc.id === accountId) || null;
    setSelectedAccount(account);
    setAccountSearch(account?.name || '');
  };
  
  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    if (!selectedAccount || !journalVouchers) return [];
    
    let entries: LedgerEntry[] = [];
    
    journalVouchers.forEach(jv => {
        let isDebit = jv.debitEntries.some(e => e.accountId === selectedAccount.id);
        let isCredit = jv.creditEntries.some(e => e.accountId === selectedAccount.id);

        if (isDebit) {
            const entry = jv.debitEntries.find(e => e.accountId === selectedAccount.id)!;
            const particulars = jv.creditEntries.map(ce => allAccounts.find(a => a.id === ce.accountId)?.name || ce.accountId).join(', ');
            entries.push({
                date: jv.date,
                details: `To ${particulars} (${jv.narration})`,
                debit: entry.amount,
                credit: 0,
            });
        }
        if (isCredit) {
            const entry = jv.creditEntries.find(e => e.accountId === selectedAccount.id)!;
            const particulars = jv.debitEntries.map(de => allAccounts.find(a => a.id === de.accountId)?.name || de.accountId).join(', ');
            entries.push({
                date: jv.date,
                details: `By ${particulars} (${jv.narration})`,
                debit: 0,
                credit: entry.amount,
            });
        }
    });

    return entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [selectedAccount, journalVouchers, allAccounts]);

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
  
  const accountOptions = allAccounts.map(acc => ({ value: acc.id, label: acc.name }));


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Ledger Details</CardTitle>
            <CardDescription>
              View the detailed transaction history for any account.
            </CardDescription>
          </div>
          <div className='flex items-center gap-4'>
            <Combobox
                options={accountOptions}
                value={selectedAccount?.id || ''}
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
                    <PlusCircle className="mr-2 h-4 w-4" /> Manage Accounts
                </Link>
            </Button>
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export as PDF
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
