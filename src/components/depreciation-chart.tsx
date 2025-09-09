
'use client'

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, Trash2, Send } from 'lucide-react';
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
import { format, parseISO, isAfter, startOfYear, setMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';

interface Asset {
  id: string;
  name: string;
  block: string;
  cost: number;
  rate: number;
  purchaseDate: string;
}

const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  block: z.string().min(1, 'Asset block is required'),
  cost: z.coerce.number().min(0, 'Cost must be a positive number'),
  rate: z.coerce.number().min(0, 'Rate must be a positive number').max(100, 'Rate cannot exceed 100'),
  purchaseDate: z.date({ required_error: 'Date of purchase is required' }),
});

type AssetFormData = z.infer<typeof assetSchema>;


const initialAssets: Asset[] = [
  { id: 'asset-1', name: 'Office Building', block: 'Building', cost: 5000000, rate: 10, purchaseDate: '2022-04-15' },
  { id: 'asset-2', name: 'Office Furniture', block: 'Furniture & Fixtures', cost: 250000, rate: 10, purchaseDate: '2022-08-10' },
  { id: 'asset-3', name: 'Computers', block: 'Plant & Machinery', cost: 150000, rate: 40, purchaseDate: '2023-11-05' },
  { id: 'asset-4', name: 'Manufacturing Machine', block: 'Plant & Machinery', cost: 1200000, rate: 15, purchaseDate: '2023-06-20' },
];

export function DepreciationChart() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { addJournalVoucher } = useData();

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      block: '',
      cost: 0,
      rate: 15,
      purchaseDate: new Date(),
    },
  });

  const handleFieldChange = (id: string, field: keyof Asset, value: string | number) => {
    setAssets(assets.map(asset => asset.id === id ? { ...asset, [field]: value } : asset));
  };


  const calculateDepreciation = (cost: number, rate: number, purchaseDate: string) => {
    const pDate = parseISO(purchaseDate);
    const financialYearStart = setMonth(startOfYear(pDate), 3); // April 1st of the asset's FY
    const halfYearMark = setMonth(financialYearStart, 9); // October 1st

    const applicableRate = isAfter(pDate, halfYearMark) ? rate / 2 : rate;
    return (cost * applicableRate) / 100;
  };
  
  const handleAddAsset: SubmitHandler<AssetFormData> = (data) => {
    const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        ...data,
        purchaseDate: format(data.purchaseDate, 'yyyy-MM-dd')
    };
    setAssets(prev => [...prev, newAsset]);
    toast({ title: 'Asset Added', description: `"${data.name}" has been added to the chart.` });
    form.reset();
    setIsDialogOpen(false);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
    toast({ title: 'Asset Removed', description: 'The asset has been removed from the chart.' });
  };
  
  const handlePostDepreciation = () => {
    const totalDepreciation = assets.reduce((acc, asset) => acc + calculateDepreciation(asset.cost, asset.rate, asset.purchaseDate), 0);
    
    if (totalDepreciation <= 0) {
        toast({ variant: 'destructive', title: 'No Depreciation', description: 'Total depreciation is zero. Nothing to post.' });
        return;
    }

    addJournalVoucher({
        id: `JV-DEP-${Date.now()}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        narration: 'Depreciation for the year',
        debitEntries: [{ accountId: 'depreciation-expense', amount: totalDepreciation }],
        creditEntries: [{ accountId: 'assets', amount: totalDepreciation }],
    });

    toast({ title: 'Depreciation Posted!', description: `A journal voucher for ₹${Math.round(totalDepreciation).toLocaleString('en-IN')} has been created.`});
  }

  const totalCost = assets.reduce((acc, asset) => acc + asset.cost, 0);
  const totalDepreciation = assets.reduce((acc, asset) => acc + calculateDepreciation(asset.cost, asset.rate, asset.purchaseDate), 0);
  const totalClosingWdv = totalCost - totalDepreciation;

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4 print:hidden">
        <div>
          <CardTitle>Depreciation Chart</CardTitle>
          <CardDescription>As per Income Tax Act (WDV Method)</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Fixed Asset</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new asset to add it to the depreciation chart.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddAsset)} id="add-asset-form" className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Asset Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Laptop" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="block"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Asset Block</FormLabel>
                                    <FormControl><Input placeholder="e.g., Plant & Machinery" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Date of Purchase</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cost / Opening WDV</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rate (%)</FormLabel>
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
                    <Button type="submit" form="add-asset-form">Add Asset</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <TableHead>Asset Name</TableHead>
                <TableHead>Date of Purchase</TableHead>
                <TableHead className="text-right">Cost / Opening WDV</TableHead>
                <TableHead className="text-center w-[120px]">Rate (%)</TableHead>
                <TableHead className="text-right">Depreciation</TableHead>
                <TableHead className="text-right">Closing WDV</TableHead>
                <TableHead className="text-right print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const depreciation = calculateDepreciation(asset.cost, asset.rate, asset.purchaseDate);
                const closingWdv = asset.cost - depreciation;
                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{format(parseISO(asset.purchaseDate), 'dd-MM-yyyy')}</TableCell>
                    <TableCell className="text-right font-mono">
                        <Input type="number" value={asset.cost} onChange={(e) => handleFieldChange(asset.id, 'cost', Number(e.target.value))} className="text-right" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={asset.rate}
                        onChange={(e) => handleFieldChange(asset.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="text-center"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">₹{Math.round(depreciation).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">₹{Math.round(closingWdv).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right print:hidden">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-mono">₹{Math.round(totalCost).toLocaleString('en-IN')}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-mono">₹{Math.round(totalDepreciation).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-mono">₹{Math.round(totalClosingWdv).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="print:hidden"></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-end print:hidden">
        <Button onClick={handlePostDepreciation}>
            <Send className="mr-2 h-4 w-4" /> Post Depreciation to Journal
        </Button>
      </CardFooter>
    </Card>
  );
}
