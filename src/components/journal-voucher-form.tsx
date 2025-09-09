
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, PlusCircle, Save, Trash2 } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import type { JournalVoucher, Vendor, LedgerAccount, Customer, JournalEntry } from '@/lib/types';
import { Combobox } from './ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const newAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
});

interface JournalVoucherFormProps {
    isUploadDialogOpen?: boolean;
    onUploadDialogChange?: (isOpen: boolean) => void;
}

export function JournalVoucherForm({ isUploadDialogOpen = false, onUploadDialogChange = () => {} }: JournalVoucherFormProps) {
  const { addJournalVoucher, chartOfAccounts, setChartOfAccounts, customers, vendors } = useData();
  const [voucherNumber, setVoucherNumber] = useState('');
  const [voucherDate, setVoucherDate] = useState<Date | undefined>(undefined);
  const [narration, setNarration] = useState('');
  const [debitEntries, setDebitEntries] = useState<JournalEntry[]>([{ accountId: '', amount: 0 }]);
  const [creditEntries, setCreditEntries] = useState<JournalEntry[]>([{ accountId: '', amount: 0 }]);

  const [isAccountCreationDialogOpen, setIsAccountCreationDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const newAccountForm = useForm<z.infer<typeof newAccountSchema>>({
    resolver: zodResolver(newAccountSchema),
    defaultValues: { name: '', category: 'Expense' },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setVoucherDate(new Date());
        setVoucherNumber(`JV-${Date.now().toString().slice(-6)}`);
    }
  }, []);
  
  const allAccountOptions = [
      ...chartOfAccounts.map(acc => ({ value: acc.id, label: acc.name, group: acc.category })),
      ...customers.map(c => ({ value: c.id, label: c.name, group: 'Customers' })),
      ...vendors.map(v => ({ value: v.id, label: v.name, group: 'Vendors' })),
  ];

  const handleEntryChange = (index: number, type: 'debit' | 'credit', field: keyof JournalEntry, value: any) => {
    const entries = type === 'debit' ? [...debitEntries] : [...creditEntries];
    const entry = { ...entries[index], [field]: value };
    entries[index] = entry;
    if (type === 'debit') {
      setDebitEntries(entries);
    } else {
      setCreditEntries(entries);
    }
  };

  const addEntry = (type: 'debit' | 'credit') => {
    if (type === 'debit') {
      setDebitEntries([...debitEntries, { accountId: '', amount: 0 }]);
    } else {
      setCreditEntries([...creditEntries, { accountId: '', amount: 0 }]);
    }
  };
  
  const removeEntry = (index: number, type: 'debit' | 'credit') => {
    if (type === 'debit' && debitEntries.length > 1) {
        setDebitEntries(debitEntries.filter((_, i) => i !== index));
    } else if (type === 'credit' && creditEntries.length > 1) {
        setCreditEntries(creditEntries.filter((_, i) => i !== index));
    }
  };
  
  const totalDebits = debitEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const totalCredits = creditEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const difference = totalDebits - totalCredits;

  const handleSave = () => {
    if (totalDebits === 0 || totalCredits === 0) {
        toast({ variant: 'destructive', title: 'Incomplete Entry', description: 'Debit and Credit totals cannot be zero.' });
        return;
    }
    if (Math.abs(difference) > 0.01) { // Allow for small floating point inaccuracies
        toast({ variant: 'destructive', title: 'Totals Mismatch', description: 'Total debits and total credits must be equal.' });
        return;
    }
    if (debitEntries.some(e => !e.accountId) || creditEntries.some(e => !e.accountId)) {
        toast({ variant: 'destructive', title: 'Account not selected', description: 'Please select an account for all entries.' });
        return;
    }

    const newVoucher: Omit<JournalVoucher, 'amount'> = {
        id: voucherNumber,
        date: format(voucherDate!, 'yyyy-MM-dd'),
        narration: narration || 'Journal Voucher Entry',
        debitEntries,
        creditEntries,
    };

    addJournalVoucher(newVoucher);
    toast({ title: 'Journal Voucher Saved!', description: `Voucher ${voucherNumber} has been recorded.` });
    router.push('/journal-vouchers');
  };
  
   const handleCreateNewAccount = (values: z.infer<typeof newAccountSchema>) => {
    const newAccount: LedgerAccount = {
      ...values,
      id: `acc-${Date.now()}`
    };
    setChartOfAccounts((prev: LedgerAccount[]) => [...prev, newAccount]);
    toast({ title: 'New Account Created', description: `Account "${values.name}" was added successfully.` });
    setIsAccountCreationDialogOpen(false);
    newAccountForm.reset();
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Create Journal Voucher</CardTitle>
        <CardDescription>Manually record debits and credits for adjustments and other non-standard transactions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="grid gap-2">
              <Label htmlFor="voucherNumber">Voucher Number</Label>
              <Input id="voucherNumber" value={voucherNumber} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="voucherDate">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !voucherDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {voucherDate ? format(voucherDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={voucherDate} onSelect={setVoucherDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            {/* Debit Side */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Debit Entries</h3>
                {debitEntries.map((entry, index) => (
                    <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                            <Label>Account</Label>
                             <Combobox
                                options={allAccountOptions}
                                value={entry.accountId}
                                onSelect={(value) => handleEntryChange(index, 'debit', 'accountId', value)}
                                placeholder="Select account..."
                                searchPlaceholder="Search accounts..."
                                notFoundMessage="No account found."
                             />
                        </div>
                        <div className="w-36">
                            <Label>Amount</Label>
                            <Input type="number" value={entry.amount || ''} onChange={(e) => handleEntryChange(index, 'debit', 'amount', parseFloat(e.target.value))} />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeEntry(index, 'debit')} disabled={debitEntries.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button variant="outline" size="sm" onClick={() => addEntry('debit')}><PlusCircle className="mr-2 h-4 w-4" /> Add Debit Line</Button>
            </div>
            {/* Credit Side */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Credit Entries</h3>
                {creditEntries.map((entry, index) => (
                    <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                            <Label>Account</Label>
                             <Combobox
                                options={allAccountOptions}
                                value={entry.accountId}
                                onSelect={(value) => handleEntryChange(index, 'credit', 'accountId', value)}
                                placeholder="Select account..."
                                searchPlaceholder="Search accounts..."
                                notFoundMessage="No account found."
                             />
                        </div>
                        <div className="w-36">
                            <Label>Amount</Label>
                            <Input type="number" value={entry.amount || ''} onChange={(e) => handleEntryChange(index, 'credit', 'amount', parseFloat(e.target.value))} />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeEntry(index, 'credit')} disabled={creditEntries.length <= 1}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addEntry('credit')}><PlusCircle className="mr-2 h-4 w-4" /> Add Credit Line</Button>
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className={cn("p-2 rounded-md font-semibold text-right", totalDebits > 0 && "bg-muted")}>
                Total Debit: ₹{totalDebits.toLocaleString('en-IN')}
            </div>
            <div className={cn("p-2 rounded-md font-semibold text-right", totalCredits > 0 && "bg-muted")}>
                 Total Credit: ₹{totalCredits.toLocaleString('en-IN')}
            </div>
        </div>
        {difference !== 0 && (
            <div className="text-center text-destructive font-bold">
                Difference: ₹{difference.toLocaleString('en-IN')}
            </div>
        )}

        <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Textarea id="narration" rows={3} value={narration} onChange={e => setNarration(e.target.value)} placeholder="Enter a brief explanation for the entry..."/>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/journal-vouchers')}>Cancel</Button>
        <Button onClick={handleSave} disabled={difference !== 0 || totalDebits === 0}>
            <Save className="mr-2 h-4 w-4" /> Save Transaction
        </Button>
      </CardFooter>
    </Card>

    <Dialog open={isAccountCreationDialogOpen} onOpenChange={setIsAccountCreationDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Ledger Account</DialogTitle>
                <DialogDescription>Add a new account to your Chart of Accounts.</DialogDescription>
            </DialogHeader>
            <Form {...newAccountForm}>
                <form onSubmit={newAccountForm.handleSubmit(handleCreateNewAccount)} id="new-account-form" className="space-y-4 py-4">
                     <FormField control={newAccountForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Account Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={newAccountForm.control} name="category" render={({ field }) => (
                         <FormItem><FormLabel>Primary Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Asset">Asset</SelectItem>
                                    <SelectItem value="Liability">Liability</SelectItem>
                                    <SelectItem value="Equity">Equity</SelectItem>
                                    <SelectItem value="Income">Income</SelectItem>
                                    <SelectItem value="Expense">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                         <FormMessage /></FormItem>
                     )} />
                </form>
            </Form>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAccountCreationDialogOpen(false)}>Cancel</Button>
                <Button type="submit" form="new-account-form">Create Account</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
