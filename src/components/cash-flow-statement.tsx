
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import type { DateRange } from 'react-day-picker';
import { isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';

export function CashFlowStatement({ dateRange }: { dateRange?: DateRange }) {
  const { journalVouchers, chartOfAccounts } = useData();

  const {
    operatingActivities,
    investingActivities,
    financingActivities,
    netIncrease,
    openingCash,
    closingCash,
  } = useMemo(() => {
    if (!chartOfAccounts) return { operatingActivities: {}, investingActivities: {}, financingActivities: {}, netIncrease: 0, openingCash: 0, closingCash: 0 };
    
    const fromDate = dateRange?.from;
    const toDate = dateRange?.to;

    const filterByDate = (jvDateStr: string) => {
        const d = parseISO(jvDateStr);
        if (fromDate && isBefore(d, fromDate)) return false;
        if (toDate && isAfter(d, toDate)) return false;
        return true;
    }
    
    const openingJVs = journalVouchers.filter(jv => fromDate && isBefore(parseISO(jv.date), fromDate));
    const periodJVs = journalVouchers.filter(jv => filterByDate(jv.date));

    let op: Record<string, number> = {};
    let inv: Record<string, number> = {};
    let fin: Record<string, number> = {};
    
    let openingCashBalance = 0;

    const processJVsForCash = (jvs: typeof journalVouchers, target: 'opening' | 'period') => {
        jvs.forEach(jv => {
            jv.debitEntries.forEach(entry => {
                const acc = chartOfAccounts.find(a => a.id === entry.accountId);
                if (!acc) return;
                
                if (target === 'opening' && acc.name === 'Cash & Bank') openingCashBalance += entry.amount;
                if (target === 'period') {
                    if (acc.category === 'Income' || acc.category === 'Expense') op[acc.name] = (op[acc.name] || 0) + entry.amount;
                    if (acc.category === 'Asset' && acc.classification?.includes('Fixed')) inv[acc.name] = (inv[acc.name] || 0) + entry.amount;
                    if (acc.category === 'Equity' || acc.classification?.includes('Loans')) fin[acc.name] = (fin[acc.name] || 0) + entry.amount;
                }
            });
            jv.creditEntries.forEach(entry => {
                const acc = chartOfAccounts.find(a => a.id === entry.accountId);
                 if (!acc) return;

                if (target === 'opening' && acc.name === 'Cash & Bank') openingCashBalance -= entry.amount;
                if (target === 'period') {
                    if (acc.category === 'Income' || acc.category === 'Expense') op[acc.name] = (op[acc.name] || 0) - entry.amount;
                    if (acc.category === 'Asset' && acc.classification?.includes('Fixed')) inv[acc.name] = (inv[acc.name] || 0) - entry.amount;
                    if (acc.category === 'Equity' || acc.classification?.includes('Loans')) fin[acc.name] = (fin[acc.name] || 0) - entry.amount;
                }
            });
        });
    }
    
    processJVsForCash(openingJVs, 'opening');
    processJVsForCash(periodJVs, 'period');
    
    const netOp = Object.values(op).reduce((a, b) => a + b, 0);
    const netInv = Object.values(inv).reduce((a, b) => a + b, 0);
    const netFin = Object.values(fin).reduce((a, b) => a + b, 0);
    
    const netChange = netOp + netInv + netFin;

    return {
        operatingActivities: op,
        investingActivities: inv,
        financingActivities: fin,
        netIncrease: netChange,
        openingCash: openingCashBalance,
        closingCash: openingCashBalance + netChange
    };
  }, [dateRange, journalVouchers, chartOfAccounts]);


  const renderSection = (title: string, data: Record<string, number>, total: number) => (
     <>
        <TableRow className="bg-muted/50 font-bold">
            <TableCell>{title}</TableCell>
            <TableCell></TableCell>
        </TableRow>
        {Object.entries(data).map(([key, value]) => (
            <TableRow key={key}>
                <TableCell className="pl-8">{key}</TableCell>
                <TableCell className="text-right font-mono">{Math.round(value).toLocaleString('en-IN')}</TableCell>
            </TableRow>
        ))}
        <TableRow className="font-semibold border-t">
            <TableCell>Net Cash from {title.split('from ')[1]}</TableCell>
            <TableCell className="text-right font-mono">{Math.round(total).toLocaleString('en-IN')}</TableCell>
        </TableRow>
     </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Statement</CardTitle>
        <CardDescription>
            A summary of the cash generated and used by the company during the specified period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Particulars</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {renderSection('Cash Flow from Operating Activities', operatingActivities, Object.values(operatingActivities).reduce((a, b) => a + b, 0))}
                {renderSection('Cash Flow from Investing Activities', investingActivities, Object.values(investingActivities).reduce((a, b) => a + b, 0))}
                {renderSection('Cash Flow from Financing Activities', financingActivities, Object.values(financingActivities).reduce((a, b) => a + b, 0))}
                 <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Net Increase/(Decrease) in Cash</TableCell>
                    <TableCell className="text-right font-mono">{Math.round(netIncrease).toLocaleString('en-IN')}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Opening Cash & Bank Balance</TableCell>
                    <TableCell className="text-right font-mono">{Math.round(openingCash).toLocaleString('en-IN')}</TableCell>
                </TableRow>
                 <TableRow className="font-bold text-lg border-t-2">
                    <TableCell>Closing Cash & Bank Balance</TableCell>
                    <TableCell className="text-right font-mono">{Math.round(closingCash).toLocaleString('en-IN')}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
