
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from './ui/button';
import { Download, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import type { TrialBalanceEntry } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';

export function TrialBalance() {
  const { trialBalanceData, setTrialBalanceData, setAsOnDateForTrial, asOnDateForTrial } = useData();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadDate, setUploadDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined' && !uploadDate) {
        setUploadDate(new Date());
    }
  }, [uploadDate]);
  
  const ledgerData = trialBalanceData?.data || [];
  const dataSourceText = trialBalanceData?.source === 'upload' ? `(Using Uploaded Data as on ${format(new Date(trialBalanceData.date), "PPP")})` : '(Using Live Transactional Data)';


  const totalDebits = ledgerData.reduce((acc, item) => acc + item.debit, 0);
  const totalCredits = ledgerData.reduce(
    (acc, item) => acc + item.credit,
    0
  );
  const isBalanced = Math.round(totalDebits) === Math.round(totalCredits);

  const handleDownloadTemplate = () => {
    const header = 'Account,Debit,Credit\n';
    const sampleData = [
        'Capital,0,1000000',
        'Sales Revenue,0,2500000',
        'Accounts Receivable,500000,0',
        'Purchases,1200000,0',
        'Indirect Expenses,400000,0',
        'Fixed Assets,1500000,0',
        'Cash & Bank,100000,0',
        'Accounts Payable,0,200000',
    ].join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${header}${sampleData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'trial_balance_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCsv = () => {
    const header = ['Account', 'Debit', 'Credit'];
    const rows = ledgerData.map(item => 
      [`"${item.account}"`, item.debit, item.credit].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Trial_Balance_as_on_${format(new Date(trialBalanceData?.date || Date.now()), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful', description: 'Trial Balance has been exported as CSV.' });
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!uploadDate) {
        toast({ variant: 'destructive', title: 'Date Required', description: 'Please select the date for this trial balance.' });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            toast({ variant: 'destructive', title: 'Invalid CSV', description: 'CSV file must have a header and at least one data row.' });
            return;
        }

        const header = lines[0].trim().toLowerCase().split(',');
        if (header[0] !== 'account' || header[1] !== 'debit' || header[2] !== 'credit') {
            toast({ variant: 'destructive', title: 'Invalid Header', description: 'CSV must have columns: Account,Debit,Credit' });
            return;
        }
        
        const newTrialBalanceData: TrialBalanceEntry[] = [];
        for (let i = 1; i < lines.length; i++) {
            const [account, debit, credit] = lines[i].trim().split(',');
            newTrialBalanceData.push({
                account: account.replace(/"/g, ''),
                debit: parseFloat(debit) || 0,
                credit: parseFloat(credit) || 0,
            });
        }
        setTrialBalanceData({
            date: format(uploadDate, 'yyyy-MM-dd'),
            data: newTrialBalanceData,
            source: 'upload',
        });
        toast({ title: 'Trial Balance Uploaded!', description: `All financial reports will now be generated from this data for the period ending ${format(uploadDate, 'PPP')}.` });
        setIsUploadDialogOpen(false);
    };
    reader.readAsText(file);
  };

  const handleRowClick = (item: any) => {
    if (trialBalanceData?.source === 'upload') {
        toast({ title: "Drill-down Disabled", description: "Drill-down is not available for uploaded trial balances."});
        return;
    }
    const accountId = item.id;
    if (accountId) {
      router.push(`/general-ledger?account=${accountId}`);
    }
  };


  if (!trialBalanceData) {
    return <Card><CardHeader><CardTitle>Loading...</CardTitle></CardHeader></Card>
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <CardTitle>Trial Balance</CardTitle>
          <CardDescription>
            As on {trialBalanceData ? format(new Date(trialBalanceData.date), 'PPP') : '...'} {dataSourceText}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !asOnDateForTrial && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {asOnDateForTrial ? format(asOnDateForTrial, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={asOnDateForTrial} onSelect={(date) => setAsOnDateForTrial(date)} initialFocus />
                </PopoverContent>
            </Popover>
           <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Upload Trial Balance</DialogTitle>
                <DialogDescription>
                    Upload a CSV file of your Trial Balance to automatically generate all financial statements. This will override transactional data for reporting.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Trial Balance as on Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !uploadDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {uploadDate ? format(uploadDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar mode="single" selected={uploadDate} onSelect={setUploadDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv-file">CSV File (Account, Debit, Credit)</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="link" onClick={handleDownloadTemplate}>Download Sample Template</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export as CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Title</TableHead>
              <TableHead className="text-right">Debit (₹)</TableHead>
              <TableHead className="text-right">Credit (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerData.map((item) => (
              <TableRow key={item.account} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{item.account}</TableCell>
                <TableCell className="text-right font-mono">
                  {item.debit > 0 ? Math.round(item.debit).toLocaleString('en-IN') : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.credit > 0 ? Math.round(item.credit).toLocaleString('en-IN') : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell className="text-right font-mono">
                ₹{Math.round(totalDebits).toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="text-right font-mono">
                ₹{Math.round(totalCredits).toLocaleString('en-IN')}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
      <CardFooter>
        <div
          className={cn(
            'w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-md',
            isBalanced
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {isBalanced ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>
            {isBalanced
              ? 'Totals are balanced.'
              : `Totals do not match! Difference: ₹${Math.round(totalDebits - totalCredits).toLocaleString('en-IN')}`}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
