
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

export function ProfitAndLoss({ dateRange }: { dateRange?: DateRange }) {
  const { invoices, journalVouchers, chartOfAccounts, trialBalanceData } = useData();
  const router = useRouter();

  const { grossProfit, indirectExpenses, indirectIncomes } = useMemo(() => {
    if (!chartOfAccounts) {
        return { grossProfit: 0, indirectExpenses: {}, indirectIncomes: {} };
    }
    
    if (trialBalanceData?.data) {
        const tb = trialBalanceData.data;
        const sales = getAccountValue(tb, 'sales');
        const purchases = getAccountValue(tb, 'purchases');
        const directExp = getAccountValue(tb, 'direct expenses');
        const openingStock = getAccountValue(tb, 'opening stock');
        const closingStock = 200000; // Adjustment, not in TB

        const gp = (sales.credit + closingStock) - (openingStock.debit + purchases.debit + directExp.debit);
        
        const indirectExp: Record<string, number> = {};
        const indirectInc: Record<string, number> = {};
        
        tb.forEach(entry => {
            const accountInfo = chartOfAccounts.find(acc => acc.id === entry.id);
            if (accountInfo?.classification === 'Indirect Expenses') {
                indirectExp[entry.account] = entry.debit;
            } else if (accountInfo?.classification === 'Indirect Incomes') {
                 indirectInc[entry.account] = entry.credit;
            }
        });
        
        return {
            grossProfit: gp,
            indirectExpenses: indirectExp,
            indirectIncomes: indirectInc
        }
    } else {
        // Fallback logic if TB is not available
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
        const openingStock = 150000;
        const closingStock = 200000;
        const directExpenseAccounts = new Set(chartOfAccounts.filter(acc => acc.classification === 'Direct Expenses' || acc.classification === 'Purchase Accounts').map(acc => acc.id));
        const indirectExpenseAccounts = new Set(chartOfAccounts.filter(acc => acc.classification === 'Indirect Expenses').map(acc => acc.id));
        const indirectIncomeAccounts = new Set(chartOfAccounts.filter(acc => acc.classification === 'Indirect Incomes').map(acc => acc.id));
        let directExpenses = 0;
        const indirectExpenses: Record<string, number> = {};
        const indirectIncomes: Record<string, number> = {};

        (filteredJournalVouchers || []).forEach(jv => {
            (jv.debitEntries || []).forEach(entry => {
                if (entry && directExpenseAccounts.has(entry.accountId)) {
                    directExpenses += entry.amount;
                } else if (entry && indirectExpenseAccounts.has(entry.accountId)) {
                    const account = chartOfAccounts.find(a => a.id === entry.accountId);
                    if (account) indirectExpenses[account.name] = (indirectExpenses[account.name] || 0) + entry.amount;
                }
            });
            (jv.creditEntries || []).forEach(entry => {
                if (entry && indirectIncomeAccounts.has(entry.accountId)) {
                    const account = chartOfAccounts.find(a => a.id === entry.accountId);
                    if (account) indirectIncomes[account.name] = (indirectIncomes[account.name] || 0) + entry.amount;
                }
            });
        });
      
        const grossProfit = (totalSales + closingStock) - (openingStock + directExpenses);
        return { grossProfit, indirectExpenses, indirectIncomes };
    }
  }, [invoices, journalVouchers, chartOfAccounts, trialBalanceData, dateRange]);


  const totalIndirectIncomes = Object.values(indirectIncomes).reduce((acc, val) => acc + val, 0);
  const totalIndirectExpenses = Object.values(indirectExpenses).reduce((acc, val) => acc + val, 0);
  
  const totalCreditsSide = (grossProfit > 0 ? grossProfit : 0) + totalIndirectIncomes;
  const totalDebitsSide = (grossProfit < 0 ? Math.abs(grossProfit) : 0) + totalIndirectExpenses;

  const netProfit = totalCreditsSide - totalDebitsSide;
  
  const balancingTotal = totalCreditsSide > totalDebitsSide ? totalCreditsSide : totalDebitsSide;

  const handleRowClick = (accountName: string) => {
    if (trialBalanceData?.source === 'upload') return; // Cannot drill down from uploaded TB
    const account = chartOfAccounts.find(acc => acc.name === accountName);
    if (account) {
        router.push(`/general-ledger?account=${account.id}`);
    } else {
        console.warn(`Could not find account: ${accountName}`);
    }
  };

  return (
    <Card className="shadow-none border-none">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-0 border">
            {/* Debits Side - Expenses */}
            <div className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Particulars</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grossProfit < 0 && (
                            <TableRow onClick={() => router.push(`/trading-account`)} className="cursor-pointer hover:bg-muted/50">
                                <TableCell>To Gross Loss b/d</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(Math.abs(grossProfit)).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )}
                        {Object.entries(indirectExpenses).map(([key, value]) => (
                            <TableRow key={key} onClick={() => handleRowClick(key)} className="cursor-pointer hover:bg-muted/50">
                                <TableCell>To {key}</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(value).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        ))}
                          {netProfit >= 0 && (
                            <TableRow className="font-bold">
                                <TableCell>To Net Profit (Transferred to Capital A/c)</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(netProfit).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Credits Side - Incomes */}
              <div className="p-0 border-l">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Particulars</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grossProfit > 0 && (
                            <TableRow onClick={() => router.push(`/trading-account`)} className="cursor-pointer hover:bg-muted/50">
                                <TableCell>By Gross Profit b/d</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(grossProfit).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )}
                          {Object.entries(indirectIncomes).map(([key, value]) => (
                            <TableRow key={key} onClick={() => handleRowClick(key)} className="cursor-pointer hover:bg-muted/50">
                                <TableCell>By {key}</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(value).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        ))}
                        {netProfit < 0 && (
                            <TableRow className="font-bold">
                                <TableCell>By Net Loss (Transferred to Capital A/c)</TableCell>
                                <TableCell className="text-right font-mono">{Math.round(Math.abs(netProfit)).toLocaleString('en-IN')}</TableCell>
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
