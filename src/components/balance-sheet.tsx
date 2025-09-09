
'use client';

import { useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useData } from '@/context/data-context';
import { CheckCircle, AlertTriangle, Send } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type GroupedAccounts = {
  [group: string]: {
    [account: string]: { value: number; ledgerId?: string };
  };
};

export function BalanceSheet({ dateRange }: { dateRange?: DateRange }) {
  const { trialBalanceData, chartOfAccounts, customers, vendors, invoices, bills, journalVouchers, postJournalEntryForTransaction } = useData();
  const router = useRouter();
  const [showDiscrepancy, setShowDiscrepancy] = useState(false);

  const { capitalAndLiabilities, assets, unpostedTransactions } = useMemo(() => {
    const liabs: GroupedAccounts = {};
    const assetItems: GroupedAccounts = {};
    let netProfit = 0;

    if (!trialBalanceData?.data) {
      return { capitalAndLiabilities: {}, assets: {}, unpostedTransactions: [] };
    }

    const allAccounts = [
      ...chartOfAccounts,
      ...customers.map(c => ({ id: c.id, name: c.name, category: 'Asset' as const, classification: 'Current Assets' })),
      ...vendors.map(v => ({ id: v.id, name: v.name, category: 'Liability' as const, classification: 'Current Liabilities' }))
    ];
    
    // Calculate P&L from Trial Balance
    trialBalanceData.data.forEach(entry => {
        const accountInfo = allAccounts.find(acc => acc.id === entry.id);
        const category = accountInfo?.category;
        if (category === 'Income') {
            netProfit += entry.credit - entry.debit;
        } else if (category === 'Expense') {
            netProfit -= entry.debit - entry.credit;
        }
    });

    // Populate Assets and Liabilities from Trial Balance
    trialBalanceData.data.forEach(entry => {
      const accountInfo = allAccounts.find(acc => acc.id === entry.id);
      if (!accountInfo) return;

      const { category, classification, name, id } = accountInfo;
      const balance = entry.debit - entry.credit;

      if (balance === 0) return;

      const group = classification || category;

      if (category === 'Asset') {
        if (!assetItems[group]) assetItems[group] = {};
        assetItems[group][name] = { value: balance, ledgerId: id };
      } else if (category === 'Liability' || category === 'Equity') {
        if (!liabs[group]) liabs[group] = {};
        liabs[group][name] = { value: -balance, ledgerId: id };
      }
    });

    // Add Net Profit/Loss to the correct side
    const capitalGroup = liabs['Capital Account'] || {};
    if (netProfit >= 0) {
      capitalGroup['Net Profit'] = { value: netProfit };
    } else {
      if (!assetItems['Miscellaneous Expenditure']) assetItems['Miscellaneous Expenditure'] = {};
      assetItems['Miscellaneous Expenditure']['Net Loss'] = { value: Math.abs(netProfit) };
    }
    if (Object.keys(capitalGroup).length > 0) {
      liabs['Capital Account'] = capitalGroup;
    }

    // Check for unposted transactions
    const postedInvoiceIds = new Set(journalVouchers.map(jv => jv.id.replace('JV-INV-', '')));
    const postedBillIds = new Set(journalVouchers.map(jv => jv.id.replace('JV-PUR-', '')));
    
    const unpostedInv = invoices
        .filter(i => !postedInvoiceIds.has(i.id))
        .map(i => ({ type: 'Invoice' as const, id: i.id, amount: i.totalAmount, date: i.date }));

    const unpostedB = bills
        .filter(b => !postedBillIds.has(b.id))
        .map(b => ({ type: 'Purchase' as const, id: b.id, amount: b.totalAmount, date: b.date }));
        
    const unposted = [...unpostedInv, ...unpostedB];

    return { capitalAndLiabilities: liabs, assets: assetItems, unpostedTransactions: unposted };

  }, [trialBalanceData, chartOfAccounts, customers, vendors, invoices, bills, journalVouchers]);

  const calculateGroupTotal = (group: GroupedAccounts) => {
    return Object.values(group).reduce((total, accounts) => {
      return total + Object.values(accounts).reduce((subTotal, { value }) => subTotal + value, 0);
    }, 0);
  };

  const totalLiabilities = calculateGroupTotal(capitalAndLiabilities);
  const totalAssets = calculateGroupTotal(assets);
  const difference = totalAssets - totalLiabilities;
  const isBalanced = Math.abs(Math.round(difference)) === 0;

  const handleRowClick = (ledgerId?: string) => {
    if (!ledgerId) return;
    if (trialBalanceData?.source === 'upload') return;
    router.push(`/general-ledger?account=${ledgerId}`);
  };

  const handlePost = async (type: 'Invoice' | 'Purchase', id: string) => {
    await postJournalEntryForTransaction(type, id);
  };
  
  const renderGroup = (groupedAccounts: GroupedAccounts) => (
    <Accordion type="multiple" defaultValue={Object.keys(groupedAccounts)} className="w-full">
      {Object.entries(groupedAccounts).map(([groupName, accounts]) => {
        const groupTotal = Object.values(accounts).reduce((acc, { value }) => acc + value, 0);
        return (
          <AccordionItem value={groupName} key={groupName}>
            <AccordionTrigger className="font-semibold py-2">
              <div className="flex justify-between w-full pr-4">
                <span>{groupName}</span>
                <span className="font-mono">₹{Math.round(groupTotal).toLocaleString('en-IN')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table className="bg-muted/30">
                <TableBody>
                  {Object.entries(accounts).map(([accountName, { value, ledgerId }]) => (
                    <TableRow key={accountName} onClick={() => handleRowClick(ledgerId)} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="pl-8">{accountName}</TableCell>
                      <TableCell className="text-right font-mono">₹{Math.round(value).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <Card className="shadow-none border-none">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-0 border">
            {/* Liabilities Side */}
            <div className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead>Liabilities</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
                    <TableBody>
                        <TableRow><TableCell colSpan={2} className="p-0">{renderGroup(capitalAndLiabilities)}</TableCell></TableRow>
                    </TableBody>
                </Table>
            </div>
            {/* Assets Side */}
              <div className="p-0 border-l">
                <Table>
                    <TableHeader><TableRow><TableHead>Assets</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
                    <TableBody>
                         <TableRow><TableCell colSpan={2} className="p-0">{renderGroup(assets)}</TableCell></TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-0 border border-t-0 font-bold bg-muted/50">
            <div className="flex justify-between p-4">
                <span>Total Liabilities</span>
                <span className="font-mono">₹{Math.round(totalLiabilities).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between p-4 border-l">
                <span>Total Assets</span>
                <span className="font-mono">₹{Math.round(totalAssets).toLocaleString('en-IN')}</span>
            </div>
        </div>
        <Dialog open={!isBalanced ? showDiscrepancy : false} onOpenChange={setShowDiscrepancy}>
          <DialogTrigger asChild>
              <div
                onClick={() => !isBalanced && setShowDiscrepancy(true)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-md mt-4 print:hidden',
                  isBalanced
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800 cursor-pointer hover:bg-red-200'
                )}
              >
                {isBalanced ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>
                  {isBalanced
                    ? 'Balance Sheet is tallied.'
                    : `Totals do not match! Difference: ₹${Math.round(difference).toLocaleString('en-IN')}. Click to see why.`}
                </span>
              </div>
          </DialogTrigger>
           <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Discrepancy Report</DialogTitle>
                    <DialogDescription>
                        The following transactions have not yet been posted to the journal, which can cause the Balance Sheet to not tally. You can post them from here.
                    </DialogDescription>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unpostedTransactions.length > 0 ? unpostedTransactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.type}</TableCell>
                                <TableCell>{tx.id}</TableCell>
                                <TableCell className="text-right font-mono">₹{tx.amount.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => handlePost(tx.type, tx.id)}>
                                        <Send className="mr-2 h-3 w-3"/> Post Entry
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center">No unposted transactions found. The discrepancy may be due to other reasons.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
