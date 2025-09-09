

'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Vendor, BankAccount, PaymentMade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CreditCard, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/context/data-context';

export default function PayablesPage() {
  const { vendors, bills, paymentsMade, journalVouchers, addPaymentMade, updateBill, bankAccounts } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedVendorName, setSelectedVendorName] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [associatedBill, setAssociatedBill] = useState('');

  const payablesSummary = useMemo(() => {
    const summary: Record<string, { totalBilled: number; totalPaid: number; balance: number; ledger: any[], id: string, name: string }> = {};
    
    const allVendorIds = new Set<string>();
    vendors.forEach(v => allVendorIds.add(v.id));
    bills.forEach(b => {
        const vendor = vendors.find(v => v.name === b.vendor);
        if(vendor) allVendorIds.add(vendor.id);
    });
    paymentsMade.forEach(p => {
        const vendor = vendors.find(v => v.name === p.vendorId);
        if(vendor) allVendorIds.add(vendor.id);
    });
    journalVouchers.forEach(jv => {
      jv.creditEntries.forEach(entry => {
        if(vendors.some(v => v.id === entry.accountId)) allVendorIds.add(entry.accountId);
      });
       jv.debitEntries.forEach(entry => {
        if(vendors.some(v => v.id === entry.accountId)) allVendorIds.add(entry.accountId);
      });
    });

    allVendorIds.forEach(vendorId => {
        const vendor = vendors.find(v => v.id === vendorId);
        if(vendor) {
            summary[vendorId] = { totalBilled: 0, totalPaid: 0, balance: 0, ledger: [], id: vendor.id, name: vendor.name };
        }
    });

    journalVouchers.forEach(jv => {
        // Credit to vendor (e.g., Rent Payable to Vendor)
        jv.creditEntries.forEach(entry => {
            if (summary[entry.accountId]) {
                 summary[entry.accountId].totalBilled += entry.amount;
                 summary[entry.accountId].ledger.push({ type: 'bill', date: jv.date, details: jv.narration, amount: entry.amount });
            }
        });
        // Debit to vendor (e.g., Payment to Vendor)
        jv.debitEntries.forEach(entry => {
             if (summary[entry.accountId]) {
                 summary[entry.accountId].totalPaid += entry.amount;
                 const particulars = jv.creditEntries.map(ce => ce.accountId === 'cash' ? 'Cash' : (bankAccounts.find(ba => ba.id === ce.accountId)?.accountName) || 'Bank').join(', ');
                 summary[entry.accountId].ledger.push({ type: 'payment', date: jv.date, details: `Paid via ${particulars}`, amount: entry.amount });
            }
        });
    });


    Object.keys(summary).forEach(vendorId => {
        summary[vendorId].balance = summary[vendorId].totalBilled - summary[vendorId].totalPaid;
        summary[vendorId].ledger.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const allSummaries = Object.values(summary);

    if (!searchTerm) {
        return allSummaries;
    }
    
    return allSummaries.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  }, [vendors, bills, paymentsMade, bankAccounts, searchTerm, journalVouchers]);
  
  const totalOutstanding = useMemo(() => {
    return payablesSummary.reduce((acc, vendor) => acc + vendor.balance, 0);
  }, [payablesSummary]);

  const handleOpenPaymentDialog = (vendorName: string) => {
    setSelectedVendorName(vendorName);
    setPaymentAmount('');
    setPaymentDate(new Date());
    setPaymentMode('');
    setPaymentAccountId('');
    setAssociatedBill('');
    setPaymentReference('');
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedVendorName || !paymentAmount || !paymentMode) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all payment details.' });
      return;
    }
    const accountToCredit = paymentMode === 'Cash' ? 'cash' : paymentAccountId;

    if (!accountToCredit) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select an account to pay from.' });
      return;
    }

    const amount = parseFloat(paymentAmount as string);
    const newPayment: Omit<PaymentMade, 'id' | 'financialYear'> = {
        vendorId: selectedVendorName,
        date: format(paymentDate!, 'yyyy-MM-dd'),
        amount: amount,
        mode: paymentMode,
        accountId: accountToCredit,
        billId: associatedBill || undefined,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
    };
    
    addPaymentMade(newPayment);

    if (associatedBill) {
        const billToUpdate = bills.find(b => b.id === associatedBill);
        if(billToUpdate) {
            updateBill({ ...billToUpdate, amountPaid: billToUpdate.amountPaid + amount });
        }
    }
    
    toast({ title: 'Payment Recorded!', description: `₹${amount.toLocaleString('en-IN')} recorded for ${selectedVendorName}.` });
    setIsPaymentDialogOpen(false);
  };

  const vendorOutstandingBills = useMemo(() => {
    if (!selectedVendorName) return [];
    return bills.filter(bill => bill.vendor === selectedVendorName && bill.amountPaid < bill.totalAmount);
  }, [selectedVendorName, bills]);

  return (
    <>
      <div>
        <PageHeader
          title="Payables"
          description="Track outstanding payments and manage vendor ledgers."
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                      <CardTitle>Payables Summary</CardTitle>
                      <CardDescription>
                          Total outstanding amount across all vendors is{' '}
                          <span className="font-bold text-destructive">
                              ₹{totalOutstanding.toLocaleString('en-IN')}
                          </span>.
                      </CardDescription>
                  </div>
                   <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search vendors..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                      {payablesSummary.map((vendor) => (
                          <AccordionItem value={vendor.id} key={vendor.id}>
                              <AccordionTrigger>
                                  <div className="w-full flex justify-between items-center pr-4">
                                      <span className="font-semibold text-lg">{vendor.name}</span>
                                      <div className="text-right">
                                          <p className="text-sm text-muted-foreground">Outstanding</p>
                                          <p className="font-bold text-destructive">
                                              ₹{vendor.balance.toLocaleString('en-IN')}
                                          </p>
                                      </div>
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="p-4 bg-muted/50 rounded-md">
                                      <div className="flex justify-between items-center mb-4">
                                          <h4 className="font-semibold">Vendor Ledger</h4>
                                          <div className="flex gap-2">
                                              <Button variant="default" size="sm" onClick={() => handleOpenPaymentDialog(vendor.name)}>
                                                <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                                              </Button>
                                          </div>
                                      </div>
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>Date</TableHead>
                                                  <TableHead>Details</TableHead>
                                                  <TableHead className="text-right">Debit (Paid)</TableHead>
                                                  <TableHead className="text-right">Credit (Billed)</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {vendor.ledger.map((entry, index) => (
                                                  <TableRow key={index}>
                                                      <TableCell>{entry.date}</TableCell>
                                                      <TableCell>{entry.details}</TableCell>
                                                      <TableCell className="text-right font-mono text-green-600">
                                                          {entry.type === 'payment' ? `₹${entry.amount.toLocaleString('en-IN')}`: '-'}
                                                      </TableCell>
                                                      <TableCell className="text-right font-mono">
                                                          {entry.type === 'bill' ? `₹${entry.amount.toLocaleString('en-IN')}`: '-'}
                                                      </TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                  </Accordion>
              </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Record Payment to {selectedVendorName}</DialogTitle>
            <DialogDescription>
              Record a new payment made to this vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
                placeholder="Enter amount paid"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMode" className="text-right">Payment Mode</Label>
              <Select onValueChange={setPaymentMode} value={paymentMode}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMode !== 'Cash' && (
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">Paid From Account</Label>
                <Select onValueChange={setPaymentAccountId} value={paymentAccountId}>
                    <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                    {bankAccounts.filter(acc => acc.accountType === 'Bank').map(account => (
                        <SelectItem key={account.id} value={account.id}>{account.accountName}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            )}
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billId" className="text-right">Apply to Bill (Optional)</Label>
                <Select onValueChange={setAssociatedBill} value={associatedBill}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an outstanding bill" />
                    </SelectTrigger>
                    <SelectContent>
                        {vendorOutstandingBills.map(bill => {
                            const balance = bill.totalAmount - bill.amountPaid;
                            return (
                                <SelectItem key={bill.id} value={bill.id}>
                                    {bill.id} (Due: ₹{balance.toLocaleString('en-IN')})
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reference" className="text-right">Reference No.</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="col-span-3"
                placeholder="Cheque No., UTR, Txn ID"
              />
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
              <Textarea
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Cheque to ICICI Bank"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleRecordPayment}>Save Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
