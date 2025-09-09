'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit, PlusCircle, MoreVertical } from 'lucide-react';
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
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { LedgerAccount } from '@/lib/types';
import { useData } from '@/context/data-context';

const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Account name is required'),
  category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense'], {
    required_error: "You need to select a primary category.",
  }),
  classification: z.string().optional(),
});

const classificationOptions = {
    Asset: ['Fixed Asset', 'Current Asset', 'Investment', 'Fictitious Asset'],
    Liability: ['Capital', 'Loans (Liabilities)', 'Current Liabilities', 'Suspense A/c'],
    Income: ['Direct Incomes', 'Indirect Incomes'],
    Expense: ['Direct Expenses', 'Indirect Expenses', 'Purchase Accounts'],
    Equity: ['Capital Account', 'Reserves & Surplus'],
};


export function ChartOfAccounts() {
  const { chartOfAccounts, setChartOfAccounts } = useData();
  const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      category: 'Expense',
      classification: '',
    },
  });
  
  const category = form.watch('category');
  
  useEffect(() => {
    // When category changes, reset the classification
    form.setValue('classification', '');
  }, [category, form]);

  useEffect(() => {
    if (editingAccount) {
      form.reset(editingAccount);
    } else {
      form.reset({
        name: '',
        category: 'Expense',
        classification: '',
      });
    }
  }, [editingAccount, form]);

  function onSubmit(values: z.infer<typeof accountSchema>) {
    const accounts = chartOfAccounts || [];
    if (editingAccount) {
      setChartOfAccounts(
        accounts.map((acc: LedgerAccount) =>
          acc.id === editingAccount.id ? { ...acc, ...values } : acc
        )
      );
      toast({ title: 'Account updated successfully!' });
    } else {
      const newAccount = {
        ...values,
        id: `acc-${Date.now()}`,
      };
      setChartOfAccounts([...accounts, newAccount]);
      toast({ title: 'Account added successfully!' });
    }
    setEditingAccount(null);
    form.reset();
  }
  
  const handleEdit = (account: LedgerAccount) => {
    setEditingAccount(account);
  };

  const handleDelete = (id: string) => {
    const accounts = chartOfAccounts || [];
    setChartOfAccounts(accounts.filter((acc: LedgerAccount) => acc.id !== id));
    toast({ title: 'Account deleted.' });
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <CardTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-8 items-end">
                     <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="e.g., Factory Rent, Office Salaries" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Primary Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="Asset">Asset</SelectItem><SelectItem value="Liability">Liability</SelectItem>
                                <SelectItem value="Equity">Equity</SelectItem><SelectItem value="Income">Income</SelectItem>
                                <SelectItem value="Expense">Expense</SelectItem>
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="classification" render={({ field }) => (
                        <FormItem><FormLabel>Classification / Group</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a classification..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {(classificationOptions[category] || []).map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {editingAccount && (<Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>)}
                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4"/>{editingAccount ? 'Update Account' : 'Add Account'}</Button>
            </CardFooter>
            </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>All ledger accounts for your business.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {(chartOfAccounts || []).map((account: LedgerAccount) => (
                <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.category}</TableCell>
                    <TableCell>{account.classification || '-'}</TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(account)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you sure?</DialogTitle>
                                    <DialogDescription>
                                    This action cannot be undone. This will permanently delete the account.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild><Button variant="destructive" onClick={() => handleDelete(account.id)}>Delete</Button></DialogClose>
                                </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
