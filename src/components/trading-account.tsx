
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { TrialBalanceEntry } from '@/lib/types';
import { isAfter, isBefore, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const getAccountValue = (data: TrialBalanceEntry[], accountName: string): { debit: number, credit: number } => {
    const account = data.find(item => item.account.toLowerCase().includes(accountName.toLowerCase()));
    return { debit: account?.debit || 0, credit: account?.credit || 0 };
};

export function TradingAccount({ dateRange }: { dateRange?: DateRange }) {
  const { invoices, journalVouchers, chartOfAccounts, trialBalanceData } = useData();
  const router = useRouter();

  const { totalSales, directExpenses, openingStock, closingStock } = useMemo(() => {
    if (trialBalanceData?.data) {
        const sales = getAccountValue(trialBalanceData.data, 'sales');
        const purchases = getAccountValue(trialBalanceData.data, 'purchases');
        const directExp = getAccountValue(trialBalanceData.data, 'direct expenses');
        const opening = getAccountValue(trialBalanceData.data, 'opening stock');
        return {
            totalSales: sales.credit,
            directExpenses: purchases.debit + directExp.debit,
            openingStock: opening.debit,
            closingStock: 200000, // Closing stock is an adjustment, not in TB
        }
    } else {
        if (!chartOfAccounts) {
            return { totalSales: 0, directExpenses: 0, openingStock: 0, closingStock: 0 };
        }
        
        const fromDate = dateRange?.from;
        const toDate = dateRange?.to;

        const filterByDate = (itemDate: string) => {
            const d = parseISO(itemDate);
            if (fromDate && isBefore(d, fromDate)) return false;
            if (toDate && isAfter(d, toDate)) return false;
            return true;
        }
        
        const filteredInvoices = invoices.filter(i => filterByDate(i.date));
        const filteredJournalVouchers = journalVouchers.filter(jv => filterByDate(jv.date));

        const totalSales = filteredInvoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
        const directExpenseAccounts = new Set(chartOfAccounts.filter(acc => acc.classification === 'Direct Expenses' || acc.classification === 'Purchase Accounts').map(acc => acc.id));
        const directExpenses = (filteredJournalVouchers || [])
            .flatMap(jv => jv.debitEntries || [])
            .filter(entry => entry && directExpenseAccounts.has(entry.accountId))
            .reduce((acc, entry) => acc + entry.amount, 0);
        return { totalSales, directExpenses, openingStock: 150000, closingStock: 200000 };
    }
  }, [invoices, journalVouchers, chartOfAccounts, trialBalanceData, dateRange]);


  const totalDebits = openingStock + directExpenses;
  const totalCredits = totalSales + closingStock;
  const grossProfit = totalCredits - totalDebits;
  const balancingTotal = totalCredits > totalDebits ? totalCredits : totalDebits;

  const handleRowClick = (ledgerId: string) => {
    if (trialBalanceData?.source === 'upload') return;
    router.push(`/general-ledger?account=${ledgerId}`);
  }

  return (
    <Card className="shadow-none border-none">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-0 border">
            {/* Debits Side */}
            <div className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Particulars</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow onClick={() => handleRowClick('stock')} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>To Opening Stock</TableCell>
                            <TableCell className="text-right font-mono">{Math.round(openingStock).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                        <TableRow onClick={() => handleRowClick('purchases')} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>To Direct Expenses/Purchases</TableCell>
                            <TableCell className="text-right font-mono">{Math.round(directExpenses).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                          {grossProfit >= 0 && (
                            <TableRow className="font-bold">
                                <TableCell>To Gross Profit c/d (transferred to P&L)</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(grossProfit).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Credits Side */}
              <div className="p-0 border-l">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Particulars</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow onClick={() => handleRowClick('sales')} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>By Sales</TableCell>
                            <TableCell className="text-right font-mono">{Math.round(totalSales).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                        <TableRow onClick={() => handleRowClick('stock')} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>By Closing Stock</TableCell>
                            <TableCell className="text-right font-mono">{Math.round(closingStock).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                        {grossProfit < 0 && (
                            <TableRow className="font-bold">
                                <TableCell>By Gross Loss c/d (transferred to P&L)</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(Math.abs(grossProfit)).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )}
                         {grossProfit > 0 && (
                            <TableRow style={{ visibility: 'hidden' }}>
                                <TableCell>Placeholder</TableCell>
                                <TableCell>Placeholder</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
         <div className="grid grid-cols-2 gap-0 border border-t-0 font-bold bg-muted/50">
            <div className="flex justify-between p-4">
                <span>Total</span>
                <span className="font-mono">₹{Math.round(balancingTotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between p-4 border-l">
                <span>Total</span>
                <span className="font-mono">₹{Math.round(balancingTotal).toLocaleString('en-IN')}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
