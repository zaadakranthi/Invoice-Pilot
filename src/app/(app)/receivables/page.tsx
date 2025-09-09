
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
import type { Customer, BankAccount, PaymentReceived, Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, Search } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
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

export default function ReceivablesPage() {
  const { customers, invoices, paymentsReceived, journalVouchers, addPaymentReceived, updateInvoice, bankAccounts } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [associatedInvoice, setAssociatedInvoice] = useState('');

  const receivablesSummary = useMemo(() => {
    const summary: Record<string, { totalBilled: number; totalReceived: number; balance: number; ledger: any[], id: string, name: string }> = {};
    
    // 1. Initialize summary for all customers that have transactions.
    const allCustomerIds = new Set<string>();
    customers.forEach(c => allCustomerIds.add(c.id));
    invoices.forEach(i => {
      const customer = customers.find(c => c.name === i.client);
      if(customer) allCustomerIds.add(customer.id);
    });
    paymentsReceived.forEach(p => {
      const customer = customers.find(c => c.name === p.customerId);
      if(customer) allCustomerIds.add(customer.id);
    });
     journalVouchers.forEach(jv => {
      [...jv.creditEntries, ...jv.debitEntries].forEach(entry => {
        if(customers.some(c => c.id === entry.accountId)) allCustomerIds.add(entry.accountId);
      });
    });

    allCustomerIds.forEach(customerId => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            summary[customerId] = { 
                totalBilled: customer.openingBalance || 0, 
                totalReceived: 0, 
                balance: 0, 
                ledger: [], 
                id: customer.id, 
                name: customer.name 
            };
            if (customer.openingBalance) {
                summary[customerId].ledger.push({ type: 'invoice', date: 'FY-Start', details: 'Opening Balance', amount: customer.openingBalance });
            }
        }
    });

    // 2. Populate ledger from Journal Vouchers
    journalVouchers.forEach(jv => {
        // Debit to customer (e.g., Sale)
        jv.debitEntries.forEach(entry => {
            if (summary[entry.accountId]) {
                 summary[entry.accountId].totalBilled += entry.amount;
                 const creditParticulars = jv.creditEntries.map(ce => bankAccounts.find(a => a.id === ce.accountId)?.accountName || ce.accountId).join(', ');
                 summary[entry.accountId].ledger.push({ type: 'invoice', date: jv.date, details: `To ${creditParticulars} (${jv.narration})`, amount: entry.amount });
            }
        });
        // Credit to customer (e.g., Payment Received)
        jv.creditEntries.forEach(entry => {
             if (summary[entry.accountId]) {
                 summary[entry.accountId].totalReceived += entry.amount;
                 const debitParticulars = jv.debitEntries.map(de => bankAccounts.find(a => a.id === de.accountId)?.accountName || 'Cash').join(', ');
                 summary[entry.accountId].ledger.push({ type: 'payment', date: jv.date, details: `By ${debitParticulars} (${jv.narration})`, amount: entry.amount });
            }
        });
    });
    
    Object.keys(summary).forEach(customerId => {
        summary[customerId].balance = summary[customerId].totalBilled - summary[customerId].totalReceived;
        summary[customerId].ledger.sort((a,b) => {
            if (a.date === 'FY-Start') return -1;
            if (b.date === 'FY-Start') return 1;
            return new Date(a.date).getTime() - new Date(b.date).getTime()
        });
    });
    
    const allSummaries = Object.values(summary);

    if (!searchTerm) {
      return allSummaries;
    }

    return allSummaries.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  }, [customers, invoices, paymentsReceived, bankAccounts, searchTerm, journalVouchers]);
  
  const totalOutstanding = useMemo(() => {
    return receivablesSummary.reduce((acc, client) => acc + client.balance, 0);
  }, [receivablesSummary]);
  
  const handleOpenReceiptDialog = (customerName: string) => {
    setSelectedCustomerName(customerName);
    setPaymentAmount('');
    setPaymentDate(new Date());
    setPaymentMode('');
    setPaymentAccountId('');
    setAssociatedInvoice('');
    setPaymentReference('');
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  const handleRecordReceipt = () => {
    if (!selectedCustomerName || !paymentAmount || !paymentMode) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all receipt details.' });
      return;
    }
     if (paymentMode !== 'Cash' && !paymentAccountId) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select an account to deposit to.' });
      return;
    }
    const amount = parseFloat(paymentAmount as string);
    const newPayment: Omit<PaymentReceived, 'id' | 'financialYear'> = {
        customerId: selectedCustomerName,
        date: format(paymentDate!, 'yyyy-MM-dd'),
        amount: amount,
        mode: paymentMode,
        accountId: paymentAccountId,
        invoiceId: associatedInvoice || undefined,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
    };
    
    addPaymentReceived(newPayment);

    if (associatedInvoice) {
        const invoiceToUpdate = invoices.find(inv => inv.id === associatedInvoice);
        if (invoiceToUpdate) {
            const newAmountPaid = invoiceToUpdate.amountPaid + amount;
            let newStatus = invoiceToUpdate.status;
            if (newAmountPaid >= invoiceToUpdate.totalAmount) {
                newStatus = 'Paid';
            } else if (newAmountPaid > 0) {
                newStatus = 'Partially Paid';
            }
            updateInvoice({ ...invoiceToUpdate, amountPaid: newAmountPaid, status: newStatus }, invoiceToUpdate.lineItems);
        }
    }
    
    toast({ title: 'Receipt Recorded!', description: `₹${amount.toLocaleString('en-IN')} recorded for ${selectedCustomerName}.` });
    setIsPaymentDialogOpen(false);
  };

  const customerOutstandingInvoices = useMemo(() => {
    if (!selectedCustomerName) return [];
    return invoices.filter(inv => inv.client === selectedCustomerName && inv.amountPaid < inv.totalAmount);
  }, [selectedCustomerName, invoices]);

  return (
    <>
      <div>
        <PageHeader
          title="Receivables"
          description="Track outstanding payments and manage customer ledgers."
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Card>
              <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Receivables Summary</CardTitle>
                      <CardDescription>
                          Total outstanding amount across all customers is{' '}
                          <span className="font-bold text-primary">
                              ₹{totalOutstanding.toLocaleString('en-IN')}
                          </span>.
                      </CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                      {receivablesSummary.map((customer) => (
                          <AccordionItem value={customer.id} key={customer.id}>
                              <AccordionTrigger>
                                  <div className="w-full flex justify-between items-center pr-4">
                                      <span className="font-semibold text-lg">{customer.name}</span>
                                      <div className="text-right">
                                          <p className="text-sm text-muted-foreground">Outstanding</p>
                                          <p className={`font-bold ${customer.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                              ₹{customer.balance.toLocaleString('en-IN')}
                                          </p>
                                      </div>
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="p-4 bg-muted/50 rounded-md">
                                      <div className="flex justify-between items-center mb-4">
                                          <h4 className="font-semibold">Customer Ledger</h4>
                                          <div className="flex gap-2">
                                              <Button variant="default" size="sm" onClick={() => handleOpenReceiptDialog(customer.name)}>
                                                <CreditCard className="mr-2 h-4 w-4" /> Record Receipt
                                              </Button>
                                          </div>
                                      </div>
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>Date</TableHead>
                                                  <TableHead>Details</TableHead>
                                                  <TableHead className="text-right">Debit (Billed)</TableHead>
                                                  <TableHead className="text-right">Credit (Paid)</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {customer.ledger.map((entry, index) => (
                                                  <TableRow key={index}>
                                                      <TableCell>{entry.date === 'FY-Start' ? 'Opening' : format(new Date(entry.date), 'dd-MM-yyyy')}</TableCell>
                                                      <TableCell>{entry.details}</TableCell>
                                                      <TableCell className="text-right font-mono">
                                                          {entry.type === 'invoice' ? `₹${entry.amount.toLocaleString('en-IN')}`: '-'}
                                                      </TableCell>
                                                      <TableCell className="text-right font-mono text-green-600">
                                                          {entry.type === 'payment' ? `₹${entry.amount.toLocaleString('en-IN')}`: '-'}
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
            <DialogTitle>Record Receipt from {selectedCustomerName}</DialogTitle>
            <DialogDescription>
              Record a new payment received from this customer.
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
                placeholder="Enter amount received"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">Receipt Date</Label>
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
              <Label htmlFor="paymentMode" className="text-right">Mode</Label>
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
                    <Label htmlFor="accountId" className="text-right">Deposit To</Label>
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
                <Label htmlFor="invoiceId" className="text-right">Apply to Invoice (Optional)</Label>
                <Select onValueChange={setAssociatedInvoice} value={associatedInvoice}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an outstanding invoice" />
                    </SelectTrigger>
                    <SelectContent>
                        {customerOutstandingInvoices.map(inv => {
                            const balance = inv.totalAmount - inv.amountPaid;
                            return (
                                <SelectItem key={inv.id} value={inv.id}>
                                    {inv.id} (Due: ₹{balance.toLocaleString('en-IN')})
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
                placeholder="e.g., Cheque from HDFC Bank"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleRecordReceipt}>Save Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
