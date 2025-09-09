
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
import { Trash2, Edit } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import type { BankAccount } from '@/lib/types';
import { useData } from '@/context/data-context';


const accountSchema = z.object({
  id: z.string().optional(),
  accountType: z.enum(['Bank', 'Cash']),
  accountName: z.string().min(1, 'Account name is required'),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  branchName: z.string().optional(),
  openingBalance: z.coerce.number().optional(),
}).refine(data => {
    if (data.accountType === 'Bank') {
        return !!data.bankName && !!data.accountNumber && !!data.ifscCode;
    }
    return true;
}, {
    message: "Bank details are required for a bank account",
    path: ["bankName"],
});

export function BankAccountManagement() {
  const { bankAccounts, setBankAccounts } = useData();
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountType: 'Bank',
      accountName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      openingBalance: 0,
    },
  });

  const accountType = form.watch('accountType');
  
  useEffect(() => {
    if (editingAccount) {
      form.reset(editingAccount);
    } else {
      form.reset({
        accountType: 'Bank',
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        openingBalance: 0,
      });
    }
  }, [editingAccount, form]);


  function onSubmit(values: z.infer<typeof accountSchema>) {
    if (editingAccount) {
      setBankAccounts(
        bankAccounts.map((acc) =>
          acc.id === editingAccount.id ? { ...acc, ...values } : acc
        )
      );
      toast({ title: 'Account updated successfully!' });
    } else {
      const newAccount = {
        ...values,
        id: `acc-${Date.now()}`,
      };
      setBankAccounts([...bankAccounts, newAccount]);
      toast({ title: 'Account added successfully!' });
    }
    setEditingAccount(null);
    form.reset();
  }
  
  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
  };

  const handleDelete = (id: string) => {
    if (id === 'cash') {
        toast({ variant: 'destructive', title: 'Cannot Delete', description: 'The default cash account cannot be deleted.'});
        return;
    }
    setBankAccounts(bankAccounts.filter((acc) => acc.id !== id));
    toast({ title: 'Account deleted.' });
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    form.reset();
  };


  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bank">Bank Account</SelectItem>
                          <SelectItem value="Cash">Cash Account</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder={accountType === 'Bank' ? 'e.g., HDFC Bank Savings' : 'e.g., Petty Cash'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="openingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Balance</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {accountType === 'Bank' && (
                    <>
                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl><Input placeholder="HDFC Bank" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ifscCode"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>IFSC Code</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="branchName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Branch Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="w-full">
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </Button>
                  {editingAccount && (
                    <Button type="button" variant="outline" onClick={cancelEdit} className="w-full">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Account List</CardTitle>
            <CardDescription>All your configured cash and bank accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bank / Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.accountName}</TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell>
                      {account.accountType === 'Bank' ? `${account.bankName} - ${account.accountNumber}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                           <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will permanently delete the account.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button variant="destructive" onClick={() => handleDelete(account.id)}>Delete</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
