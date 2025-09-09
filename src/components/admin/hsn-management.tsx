
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileDown, Search, Upload, Edit, Trash2 } from 'lucide-react';
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
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import type { HsnCode } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const hsnSchema = z.object({
  code: z.string().min(4, 'HSN/SAC code is required'),
  description: z.string().min(3, 'Description is required'),
  type: z.enum(['Goods', 'Services']),
  gstRate: z.coerce.number().min(0, 'GST rate is required'),
  cessRate: z.coerce.number().min(0, 'CESS rate is required').optional().default(0),
  effectiveFrom: z.date({ required_error: 'Effective from date is required' }),
  status: z.enum(['Active', 'Obsolete']),
});

type HsnFormData = z.infer<typeof hsnSchema>;

export function HsnCodeManagement() {
  const { hsnCodes, bulkAddHsnCodes, addHsnCode, updateHsnCode, deleteHsnCode } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [editingCode, setEditingCode] = useState<HsnCode | null>(null);
  const { toast } = useToast();

  const form = useForm<HsnFormData>({
    resolver: zodResolver(hsnSchema),
    defaultValues: {
      code: '',
      description: '',
      type: 'Goods',
      gstRate: 18,
      cessRate: 0,
      effectiveFrom: new Date(),
      status: 'Active',
    },
  });

  useEffect(() => {
    if (editingCode) {
        form.reset({
            ...editingCode,
            effectiveFrom: parseISO(editingCode.effectiveFrom)
        });
    } else {
        form.reset({
            code: '',
            description: '',
            type: 'Goods',
            gstRate: 18,
            cessRate: 0,
            effectiveFrom: new Date(),
            status: 'Active',
        });
    }
  }, [editingCode, form]);

  const filteredCodes = useMemo(() => {
    if (!hsnCodes) return [];
    if (!searchTerm) return hsnCodes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return hsnCodes.filter(
      (code) =>
        code.code.toLowerCase().includes(lowercasedTerm) ||
        code.description.toLowerCase().includes(lowercasedTerm)
    );
  }, [hsnCodes, searchTerm]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };
  
  const handleBulkUploadSubmit = () => {
    if (!uploadedFile) {
        toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a CSV file to upload.'});
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            toast({ variant: 'destructive', title: 'Invalid CSV', description: 'CSV file must have a header and at least one data row.' });
            return;
        }

        const header = lines[0].trim().toLowerCase().split(',');
        const requiredHeaders = ['code', 'description', 'type', 'gstrate', 'cessrate', 'effectivefrom', 'status'];
        const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
        if (missingHeaders.length > 0) {
            toast({ variant: 'destructive', title: 'Invalid CSV Header', description: `Missing columns: ${missingHeaders.join(', ')}` });
            return;
        }

        try {
            const newCodes: Omit<HsnCode, 'id'>[] = lines.slice(1).map(line => {
                const values = line.trim().split(',');
                const codeData = header.reduce((obj, h, index) => {
                  obj[h] = values[index];
                  return obj;
                }, {} as any);

                return {
                    code: codeData.code,
                    description: codeData.description.replace(/"/g, ''),
                    type: codeData.type === 'Goods' ? 'Goods' : 'Services',
                    gstRate: parseFloat(codeData.gstrate) || 0,
                    cessRate: parseFloat(codeData.cessrate) || 0,
                    effectiveFrom: codeData.effectivefrom,
                    status: codeData.status === 'Active' ? 'Active' : 'Obsolete',
                }
            });
            await bulkAddHsnCodes(newCodes);
            toast({ title: 'Upload Successful', description: `${newCodes.length} HSN/SAC codes have been added or updated.`});
            setIsUploadDialogOpen(false);
            setUploadedFile(null);
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'An error occurred during the bulk upload process.' });
        }
    };
    reader.readAsText(uploadedFile);
  }

  const handleDownloadTemplate = () => {
    const header = 'code,description,type,gstRate,cessRate,effectiveFrom,status\n';
    const sampleData = '1001,"Wheat and meslin.",Goods,5,0,2017-07-01,Active\n9972,"Real estate services",Services,18,0,2017-07-01,Active';
    const csvContent = `data:text/csv;charset=utf-8,${header}${sampleData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'hsn_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const onSubmit = async (data: HsnFormData) => {
      const hsnData = {
          ...data,
          effectiveFrom: format(data.effectiveFrom, 'yyyy-MM-dd')
      };
      
      try {
        if(editingCode) {
            await updateHsnCode(editingCode.id, hsnData);
            toast({ title: 'HSN/SAC Code Updated', description: `Code ${data.code} has been successfully updated.` });
        } else {
             if (hsnCodes.some(c => c.code === hsnData.code)) {
              toast({ variant: 'destructive', title: 'Duplicate Code', description: 'This HSN/SAC code already exists.' });
              return;
            }
            await addHsnCode(hsnData);
            toast({ title: 'HSN/SAC Code Added', description: `Code ${data.code} has been successfully added.` });
        }
        setEditingCode(null);
        form.reset();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
      }
  }

  const onEdit = (code: HsnCode) => setEditingCode(code);
  
  const onDelete = async (id: string) => {
      try {
          await deleteHsnCode(id);
          toast({ title: 'HSN Code Deleted' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message ?? 'Could not delete the HSN code.' });
      }
  };


  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingCode ? 'Edit' : 'Add'} HSN/SAC Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="e.g., 998314" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., IT design services" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Goods">Goods</SelectItem><SelectItem value="Services">Services</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="gstRate" render={({ field }) => (<FormItem><FormLabel>GST Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cessRate" render={({ field }) => (<FormItem><FormLabel>CESS Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="effectiveFrom" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Effective From</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4 opacity-50" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Obsolete">Obsolete</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="w-full">{editingCode ? 'Update Code' : 'Add Code'}</Button>
                  {editingCode && (<Button type="button" variant="outline" onClick={() => setEditingCode(null)} className="w-full">Cancel</Button>)}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>HSN/SAC Code Database</CardTitle>
                <CardDescription>A central repository for all HSN/SAC codes and their respective tax rates.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by code or description..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Upload HSN/SAC Codes</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to add or update HSN/SAC codes in bulk. If a code already exists, its details will be updated.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="csv-file">CSV File</Label>
                                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="link" onClick={handleDownloadTemplate}>Download Sample Template</Button>
                            <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                            <Button type="button" onClick={handleBulkUploadSubmit} disabled={!uploadedFile}>
                                <Upload className="mr-2 h-4 w-4" /> Upload File
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>{code.gstRate}%</TableCell>
                    <TableCell>{code.status}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(code)}><Edit className="h-4 w-4" /></Button>
                        <Dialog>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you sure?</DialogTitle>
                                    <DialogDescription>This action will permanently delete the code {code.code}.</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild><Button variant="destructive" onClick={() => onDelete(code.id)}>Delete</Button></DialogClose>
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
