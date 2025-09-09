
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
} from '@/components/ui/table';
import { ArrowDownLeft, ArrowUpRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { useData } from '@/context/data-context';

export default function CashAndBankPage() {
  const { paymentsReceived, paymentsMade } = useData();
  const [openingBalance] = useState(50000); // Initial cash/bank balance

  const ledgerEntries = useMemo(() => {
    const received = paymentsReceived.map(p => ({ ...p, type: 'receipt' as const, party: p.customerId }));
    const paid = paymentsMade.map(p => ({ ...p, type: 'payment' as const, party: p.vendorId }));

    const allTransactions = [...received, ...paid].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentBalance = openingBalance;
    
    return allTransactions.map(tx => {
        if (tx.type === 'receipt') {
            currentBalance += tx.amount;
        } else {
            currentBalance -= tx.amount;
        }
        return { ...tx, balance: currentBalance };
    });
  }, [openingBalance, paymentsReceived, paymentsMade]);

  const finalBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : openingBalance;

  return (
    <div>
      <PageHeader
        title="Cash & Bank Ledger"
        description="A chronological record of all your cash and bank transactions."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Consolidated Ledger</CardTitle>
              </div>
              <div className='flex items-center gap-4'>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">₹{finalBalance.toLocaleString('en-IN')}</p>
                </div>
                <Button asChild>
                    <Link href="/cash-and-bank/accounts">
                        <PlusCircle className="mr-2 h-4 w-4" /> Manage Accounts
                    </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6}>Opening Balance</TableCell>
                  <TableCell className="text-right font-mono">₹{openingBalance.toLocaleString('en-IN')}</TableCell>
                </TableRow>
                {ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{entry.party}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.type === 'receipt' ? (
                           <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100/80">
                             <ArrowDownLeft className="h-3 w-3 mr-1"/> Receipt
                           </Badge>
                        ) : (
                           <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100/80">
                             <ArrowUpRight className="h-3 w-3 mr-1"/> Payment
                           </Badge>
                        )}
                        <span>via {entry.mode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{entry.reference || '-'}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {entry.type === 'receipt' ? `₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {entry.type === 'payment' ? `₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
