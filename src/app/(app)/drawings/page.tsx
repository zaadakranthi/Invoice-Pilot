
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const drawingSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  partnerId: z.string().min(1, 'Please select a partner'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero'),
  description: z.string().min(1, 'Description is required'),
});

type DrawingFormData = z.infer<typeof drawingSchema>;

export default function DrawingsPage() {
  const { capitalAccounts, drawings, addDrawing } = useData();
  const { toast } = useToast();

  const form = useForm<DrawingFormData>({
    resolver: zodResolver(drawingSchema),
    defaultValues: {
      date: new Date(),
      partnerId: '',
      amount: 0,
      description: '',
    },
  });
  
  const onSubmit = (data: DrawingFormData) => {
    addDrawing({
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
    });
    toast({ title: 'Drawing Recorded', description: 'The drawing has been successfully recorded.' });
    form.reset();
    form.setValue('date', new Date());
  }

  return (
    <div>
      <PageHeader
        title="Drawings"
        description="Record withdrawals for personal use by partners or the proprietor."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Record a Drawing</CardTitle>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                           <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !form.watch('date') && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch('date') ? format(form.watch('date'), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                         <PopoverContent className="w-auto p-0">
                           <Calendar mode="single" selected={form.watch('date')} onSelect={(date) => form.setValue('date', date as Date)} initialFocus />
                         </PopoverContent>
                      </Popover>
                      {form.formState.errors.date && <p className="text-sm font-medium text-destructive">{form.formState.errors.date.message}</p>}
                   </div>
                   <div className="space-y-2">
                      <Label>Partner/Proprietor</Label>
                      <Select onValueChange={(value) => form.setValue('partnerId', value)} value={form.watch('partnerId')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a partner" />
                        </SelectTrigger>
                        <SelectContent>
                          {capitalAccounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.partnerName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.partnerId && <p className="text-sm font-medium text-destructive">{form.formState.errors.partnerId.message}</p>}
                   </div>
                   <div className="space-y-2">
                     <Label>Amount</Label>
                     <Input type="number" {...form.register('amount')} />
                     {form.formState.errors.amount && <p className="text-sm font-medium text-destructive">{form.formState.errors.amount.message}</p>}
                   </div>
                   <div className="space-y-2">
                     <Label>Description</Label>
                     <Input {...form.register('description')} placeholder="e.g., Cash withdrawal" />
                     {form.formState.errors.description && <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>}
                   </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Drawing
                    </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Drawings History</CardTitle>
                <CardDescription>A list of all recorded drawings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawings.map(drawing => {
                        const partner = capitalAccounts.find(p => p.id === drawing.partnerId);
                        return (
                           <TableRow key={drawing.id}>
                             <TableCell>{drawing.date}</TableCell>
                             <TableCell>{partner?.partnerName || 'N/A'}</TableCell>
                             <TableCell>{drawing.description}</TableCell>
                             <TableCell className="text-right font-mono">₹{Math.round(drawing.amount).toLocaleString('en-IN')}</TableCell>
                           </TableRow>
                        )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
