
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import type { CapitalAccount } from '@/lib/types';

const accountSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required'),
  openingBalance: z.coerce.number().min(0, 'Opening balance must be a positive number'),
  additions: z.coerce.number().min(0, 'Additions must be a positive number'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export function CapitalAccounts() {
  const { capitalAccounts, drawings, addCapitalAccount, updateCapitalAccount, deleteCapitalAccount } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CapitalAccount | null>(null);
  const { toast } = useToast();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      partnerName: '',
      openingBalance: 0,
      additions: 0,
    },
  });
  
  const handleBalanceChange = (id: string, field: 'openingBalance' | 'additions', value: number) => {
    const account = capitalAccounts.find(a => a.id === id);
    if(account) {
        updateCapitalAccount({...account, [field]: value});
    }
  }

  if (!capitalAccounts || !drawings) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Capital Accounts Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Loading data...</p>
            </CardContent>
        </Card>
    )
  }

  const handleOpenDialog = (account: CapitalAccount | null = null) => {
    setEditingAccount(account);
    if (account) {
        form.reset(account);
    } else {
        form.reset({ partnerName: '', openingBalance: 0, additions: 0 });
    }
    setIsDialogOpen(true);
  };
  
  const onSubmit: SubmitHandler<AccountFormData> = (data) => {
    if (editingAccount) {
      updateCapitalAccount({
          ...editingAccount,
          ...data,
      });
      toast({ title: 'Account Updated', description: `Capital account for ${data.partnerName} has been updated.` });
    } else {
      addCapitalAccount({
          ...data,
          shareOfProfit: 0, // This would be calculated at year-end
      });
      toast({ title: 'Account Added', description: `Capital account for ${data.partnerName} has been created.` });
    }
    form.reset();
    setIsDialogOpen(false);
    setEditingAccount(null);
  };

  const handleDelete = (id: string) => {
    deleteCapitalAccount(id);
    toast({ title: 'Account Removed', description: 'The capital account has been removed.' });
  };
  
  const partnerDrawings = (partnerId: string) => {
    return drawings.filter(d => d.partnerId === partnerId).reduce((acc, d) => acc + d.amount, 0);
  };

  const totalOpening = capitalAccounts.reduce((acc, account) => acc + account.openingBalance, 0);
  const totalAdditions = capitalAccounts.reduce((acc, account) => acc + account.additions, 0);
  const totalDrawings = drawings.reduce((acc, d) => acc + d.amount, 0);
  const totalClosing = capitalAccounts.reduce((acc, account) => {
      const closing = account.openingBalance + account.additions + account.shareOfProfit - partnerDrawings(account.id);
      return acc + closing;
  }, 0);


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4 print:hidden">
          <div>
            <CardTitle>Capital Accounts Schedule</CardTitle>
            <CardDescription>A summary of partner/proprietor capital accounts.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Partner/Capital
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner/Proprietor Name</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Additions</TableHead>
                  <TableHead className="text-right">Drawings</TableHead>
                  <TableHead className="text-right">Share of Profit</TableHead>
                  <TableHead className="text-right">Closing Balance</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capitalAccounts.map((account) => {
                  const drawings = partnerDrawings(account.id);
                  const closingBalance = account.openingBalance + account.additions + account.shareOfProfit - drawings;
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.partnerName}</TableCell>
                      <TableCell className="text-right font-mono">
                        <Input type="number" value={account.openingBalance} onChange={(e) => handleBalanceChange(account.id, 'openingBalance', Number(e.target.value))} className="text-right" />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <Input type="number" value={account.additions} onChange={(e) => handleBalanceChange(account.id, 'additions', Number(e.target.value))} className="text-right" />
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">₹{Math.round(drawings).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">₹{Math.round(account.shareOfProfit).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono">₹{Math.round(closingBalance).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right print:hidden">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(account)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">₹{Math.round(totalOpening).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">₹{Math.round(totalAdditions).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">₹{Math.round(totalDrawings).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono"></TableCell>
                    <TableCell className="text-right font-mono">₹{Math.round(totalClosing).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="print:hidden"></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingAccount ? 'Edit' : 'Add'} Capital Account</DialogTitle>
                  <DialogDescription>
                      {editingAccount ? 'Update the details for this capital account.' : 'Add a new partner or proprietor and their capital details.'}
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} id="capital-account-form" className="space-y-4 py-4">
                      <FormField
                          control={form.control}
                          name="partnerName"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Partner/Proprietor Name</FormLabel>
                              <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                          <FormField
                          control={form.control}
                          name="openingBalance"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Opening Balance</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                              control={form.control}
                              name="additions"
                              render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Additions This Year</FormLabel>
                                  <FormControl><Input type="number" {...field} /></FormControl>
                                  <FormMessage />
                              </FormItem>
                              )}
                          />
                      </div>
                  </form>
              </Form>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" form="capital-account-form">{editingAccount ? 'Update Account' : 'Add Account'}</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
