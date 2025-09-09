

'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Edit, Upload, FileDown, Search } from 'lucide-react';
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
import type { Customer } from '@/lib/types';
import { Label } from './ui/label';
import { useData } from '@/context/data-context';

const customerSchema = z.object({
  id: z.string().optional(),
  clientCode: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  gstin: z.string().length(15, 'GSTIN must be 15 characters'),
  pan: z.string().length(10, 'PAN must be 10 characters'),
  billingAddress: z.string().min(1, 'Billing address is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  openingBalance: z.coerce.number().optional(),
});


export function CustomerManagement() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      clientCode: '',
      name: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      shippingAddress: '',
      openingBalance: 0,
    },
  });

  useEffect(() => {
    if (editingCustomer) {
      form.reset(editingCustomer);
    } else {
      form.reset({
        clientCode: '',
        name: '',
        email: '',
        phone: '',
        gstin: '',
        pan: '',
        billingAddress: '',
        shippingAddress: '',
        openingBalance: 0,
      });
    }
  }, [editingCustomer, form]);

  async function onSubmit(values: z.infer<typeof customerSchema>) {
    try {
      if (editingCustomer) {
        await updateCustomer({ ...editingCustomer, ...values});
        toast({ title: 'Customer updated successfully!' });
      } else {
        await addCustomer(values);
        toast({ title: 'Customer added successfully!' });
      }
      setEditingCustomer(null);
      form.reset();
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error saving customer', description: error.message });
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      toast({ title: 'Customer deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error deleting customer', description: error.message });
    }
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    form.reset();
  };

  const handleDownloadTemplate = () => {
    const header = 'name,email,phone,gstin,pan,billingAddress,shippingAddress,openingBalance\n';
    const sampleData = 'Acme Inc,contact@acme.com,9876543210,29ABCDE1234F1Z5,ABCDE1234F,"123 Main St, Anytown","456 Oak Ave, Othertown",5000';
    const csvContent = `data:text/csv;charset=utf-8,${header}${sampleData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'customer_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast({ variant: 'destructive', title: 'Invalid CSV', description: 'CSV file must have a header and at least one data row.' });
        return;
      }

      const header = lines[0].trim().split(',');
      const requiredHeaders = ['name', 'email', 'phone', 'gstin', 'pan', 'billingAddress', 'shippingAddress'];
      
      const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
      if (missingHeaders.length > 0) {
        toast({ variant: 'destructive', title: 'Invalid CSV Header', description: `Missing columns: ${missingHeaders.join(', ')}` });
        return;
      }
      
      const newCustomers: Omit<Customer, 'id' | 'clientCode'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].trim().split(',');
        const customerData = header.reduce((obj, h, index) => {
          obj[h] = values[index];
          return obj;
        }, {} as any);

        const validation = customerSchema.safeParse(customerData);
        if (validation.success) {
            newCustomers.push(validation.data);
        } else {
            console.warn(`Skipping invalid row ${i}:`, validation.error.flatten().fieldErrors)
        }
      }
      
      try {
        await Promise.all(newCustomers.map(addCustomer));
        toast({ title: 'Customers imported successfully!', description: `${newCustomers.length} customers were added.` });
        setIsUploadDialogOpen(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import failed', description: error.message });
      }
    };
    reader.readAsText(file);
  };
  
  const handleBulkExport = () => {
    const header = ['Code', 'Name', 'Email', 'Phone', 'GSTIN', 'PAN', 'Billing Address', 'Shipping Address', 'Opening Balance'];
    const rows = customers.map(c => 
      [c.clientCode, `"${c.name}"`, c.email, c.phone, c.gstin, c.pan, `"${c.billingAddress}"`, `"${c.shippingAddress}"`, c.openingBalance || 0].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "customers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful!', description: 'Customers list has been exported.' });
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.clientCode && customer.clientCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      customer.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
            <CardDescription>
              {editingCustomer
                ? 'Update the details for this customer.'
                : 'Fill in the details to add a new customer.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
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
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="billingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="w-full">
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </Button>
                  {editingCustomer && (
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
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>View and manage all your customers.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleBulkExport}><FileDown className="mr-2 h-4 w-4"/>Export</Button>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Customers</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file with your customer data. The file should have columns for name, email, phone, gstin, pan, billingAddress, and shippingAddress.
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
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.clientCode}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.gstin}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
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
                              This action cannot be undone. This will permanently delete the customer record.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button variant="destructive" onClick={() => handleDelete(customer.id)}>Delete</Button>
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
