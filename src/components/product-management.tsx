
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
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
import { Trash2, Edit, Upload, FileDown, Search, Wand2, Loader2, Eye } from 'lucide-react';
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
import type { Product, HsnCode } from '@/lib/types';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useData } from '@/context/data-context';
import { Combobox } from './ui/combobox';
import { getHsnCodeSuggestion } from '@/app/actions';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  productType: z.enum(['Finished Good', 'Raw Material', 'Service'], {
    required_error: "You need to select a product type.",
  }),
  itemCategory: z.string().optional(),
  minimumReorderLevel: z.coerce.number().optional(),
  uom: z.string().min(1, 'Unit of Measurement is required'),
  hsnCode: z.string().min(1, 'HSN code is required'),
  gstRate: z.coerce.number().min(0, 'GST rate must be a positive number'),
  cessRate: z.coerce.number().min(0, 'CESS rate must be a positive number').optional(),
  salePrice: z.coerce.number().min(0, 'Sale price must be a positive number'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price must be a positive number'),
  openingStockQty: z.coerce.number().min(0, 'Opening stock quantity must be a positive number'),
  openingStockRate: z.coerce.number().min(0, 'Opening stock rate must be a positive number'),
});

export function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct, hsnCodes } = useData();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuggestingHsn, setIsSuggestingHsn] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      productType: 'Finished Good',
      itemCategory: '',
      minimumReorderLevel: 0,
      uom: 'PCS',
      hsnCode: '',
      gstRate: 18,
      cessRate: 0,
      salePrice: 0,
      purchasePrice: 0,
      openingStockQty: 0,
      openingStockRate: 0,
    },
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset(editingProduct);
    } else {
      form.reset({
        name: '',
        productType: 'Finished Good',
        itemCategory: '',
        minimumReorderLevel: 0,
        uom: 'PCS',
        hsnCode: '',
        gstRate: 18,
        cessRate: 0,
        salePrice: 0,
        purchasePrice: 0,
        openingStockQty: 0,
        openingStockRate: 0,
      });
    }
  }, [editingProduct, form]);

  const hsnOptions = useMemo(() => {
    if (!hsnCodes) return [];
    return hsnCodes.map(h => ({ value: h.code, label: `${h.code} - ${h.description}` }));
  }, [hsnCodes]);

  const handleHsnSelect = (hsnCode: string) => {
    const selectedHsn = hsnCodes.find(h => h.code === hsnCode);
    if (selectedHsn) {
        form.setValue('hsnCode', selectedHsn.code);
        form.setValue('gstRate', selectedHsn.gstRate);
        form.setValue('cessRate', selectedHsn.cessRate || 0);
    }
  }

  async function onSubmit(values: z.infer<typeof productSchema>) {
    if (editingProduct) {
      await updateProduct({ ...editingProduct, ...values });
      toast({ title: 'Product updated successfully!' });
    } else {
      await addProduct(values);
      toast({ title: 'Product added successfully!' });
    }
    setEditingProduct(null);
    form.reset();
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    toast({ title: 'Product deleted.' });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    form.reset();
  };

  const handleSuggestHsn = async () => {
      const productName = form.getValues('name');
      if (!productName) {
          toast({ variant: 'destructive', title: 'Product Name Required', description: 'Please enter a product name to suggest an HSN code.'});
          return;
      }
      setIsSuggestingHsn(true);
      try {
          const result = await getHsnCodeSuggestion({ productDescription: productName });
          const hsnCode = result; // Direct string from action
          form.setValue('hsnCode', hsnCode);
          toast({ title: 'HSN Code Suggested!', description: `Found code ${hsnCode} for ${productName}.`});
      } catch (error) {
          toast({ variant: 'destructive', title: 'Suggestion Failed', description: 'Could not get an HSN code suggestion at this time.' });
      } finally {
          setIsSuggestingHsn(false);
      }
  }

  const handleDownloadTemplate = () => {
    const header = 'name,productType,uom,hsnCode,gstRate,cessRate,salePrice,purchasePrice,openingStockQty,openingStockRate\n';
    const sampleData = '"T-Shirt","Finished Good","PCS","610910","12","0","500","250","100","250"';
    const csvContent = `data:text/csv;charset=utf-8,${header}${sampleData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'product_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast({ variant: 'destructive', title: 'Invalid CSV', description: 'CSV file must have a header and at least one data row.' });
        return;
      }
      
      const header = lines[0].trim().split(',');
      const requiredHeaders = ['name','productType','uom','hsnCode','gstRate','salePrice','purchasePrice','openingStockQty','openingStockRate'];
      const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
      if (missingHeaders.length > 0) {
        toast({ variant: 'destructive', title: 'Invalid CSV Header', description: `Missing columns: ${missingHeaders.join(', ')}` });
        return;
      }
      
      const newProducts: Omit<Product, 'id'>[] = [];
       for (let i = 1; i < lines.length; i++) {
        const values = lines[i].trim().split(',');
        const productData = header.reduce((obj, h, index) => {
          obj[h] = values[index];
          return obj;
        }, {} as any);
        
        const validation = productSchema.safeParse(productData);
        if (validation.success) {
          newProducts.push(validation.data);
        } else {
           console.warn(`Skipping invalid row ${i}:`, validation.error.flatten().fieldErrors)
        }
      }

      newProducts.forEach(addProduct);
      toast({ title: 'Products imported successfully!', description: `${newProducts.length} products were added.` });
      setIsUploadDialogOpen(false);
    };
    reader.readAsText(file);
  };
  
  const handleBulkExport = () => {
    const header = ['Name', 'Type', 'UOM', 'HSN/SAC', 'GST Rate', 'CESS Rate', 'Sale Price', 'Purchase Price', 'Opening Qty', 'Opening Rate'];
    const rows = products.map(p => 
      [`"${p.name}"`, p.productType, p.uom, p.hsnCode, p.gstRate, p.cessRate || 0, p.salePrice, p.purchasePrice, p.openingStockQty, p.openingStockRate].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful!', description: 'Products list has been exported.' });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.hsnCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);


  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product/Service'}</CardTitle>
            <CardDescription>
              {editingProduct ? 'Update product details.' : 'Fill in details to add a new product.'}
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., T-Shirt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Finished Good">Finished Good</SelectItem>
                            <SelectItem value="Raw Material">Raw Material</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="uom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UOM</FormLabel>
                        <FormControl><Input placeholder="e.g., PCS, KG" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-2 gap-4 items-end">
                   <FormField
                    control={form.control}
                    name="hsnCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HSN/SAC Code</FormLabel>
                          <Combobox
                             options={hsnOptions}
                             value={field.value}
                             inputValue={field.value || ''}
                             onInputChange={(val) => field.onChange(val)}
                             onSelect={handleHsnSelect}
                             placeholder="Select HSN/SAC"
                             searchPlaceholder="Search HSN/SAC..."
                             notFoundMessage="No code found."
                          />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleSuggestHsn} disabled={isSuggestingHsn}>
                    {isSuggestingHsn ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                     Suggest
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Rate (%)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem><SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="cessRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CESS Rate (%)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-6"/>
                <h3 className="text-lg font-medium">Pricing & Stock</h3>

                <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="openingStockQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Stock</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="minimumReorderLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  {editingProduct && (
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
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Product & Service List</CardTitle>
              <CardDescription>View and manage all your products and services.</CardDescription>
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
                    <DialogTitle>Bulk Upload Products</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with your product data. The file should have columns for all product fields.
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>HSN/SAC</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <Link href={`/products/${product.id}`} className="hover:underline">{product.name}</Link>
                    </TableCell>
                    <TableCell>{product.productType}</TableCell>
                    <TableCell>{product.hsnCode}</TableCell>
                    <TableCell>₹{product.salePrice.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{product.currentStock || 0} {product.uom}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/products/${product.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View Ledger
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-start p-2 h-auto font-normal text-destructive hover:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Are you sure?</DialogTitle>
                                        <DialogDescription>This action cannot be undone. This will permanently delete the product.</DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <DialogClose asChild><Button variant="destructive" onClick={() => handleDelete(product.id)}>Delete</Button></DialogClose>
                                    </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                              </DropdownMenuItem>
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
    </div>
  );
}
