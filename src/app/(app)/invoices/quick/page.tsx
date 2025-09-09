
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Save } from 'lucide-react';
import type { Customer, Product, BrandingSettings, Invoice } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';

export default function QuickInvoicePage() {
  const { addInvoice, invoices, customers, products, brandingSettings } = useData();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (brandingSettings) {
      const nextNumber = brandingSettings?.nextInvoiceNumber || invoices.length + 1;
      const prefix = brandingSettings?.invoicePrefix || 'INV-';
      setInvoiceNumber(`${prefix}${nextNumber}`);
    }
  }, [brandingSettings, invoices]);

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId) || null;
    setSelectedCustomer(customer);
    setCustomerSearch(customer?.name || '');
  };

  const handleSelectProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId) || null;
    setSelectedProduct(product);
    setProductSearch(product?.name || '');
    if (product) {
      setPrice(product.salePrice);
    }
  };

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));
  
  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedProduct || quantity <= 0 || price < 0) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill in all fields with valid values to create the invoice.'
        });
        return;
    }
    
    const subTotal = quantity * price;
    const gstRate = selectedProduct.gstRate || 0;
    const cessRate = selectedProduct.cessRate || 0;
    const gstAmount = (subTotal * gstRate) / 100;
    const cessAmount = (subTotal * cessRate) / 100;
    const grandTotal = subTotal + gstAmount + cessAmount;

    const newInvoice = {
      id: invoiceNumber,
      client: selectedCustomer.name,
      gstin: selectedCustomer.gstin,
      date: format(new Date(), 'yyyy-MM-dd'),
      taxableValue: subTotal,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      cess: cessAmount,
      totalAmount: grandTotal,
      lineItems: [
        {
          id: Date.now(),
          productId: selectedProduct.id,
          description: selectedProduct.name,
          quantity: quantity,
          rate: price,
          hsnCode: selectedProduct.hsnCode,
          gstRate: selectedProduct.gstRate,
          cessRate: selectedProduct.cessRate || 0,
        }
      ]
    };
    
    await addInvoice(newInvoice);
    
    toast({
        title: 'Invoice Created!',
        description: `Quick invoice for ${selectedCustomer.name} has been created successfully.`
    });
    

    router.push('/invoices');
  }

  return (
    <div>
        <PageHeader title="Quick Invoice" backHref="/invoices" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create a Quick Invoice</CardTitle>
                <CardDescription>Enter the essential details to generate an invoice quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Combobox
                        options={customerOptions}
                        value={selectedCustomer?.id || ''}
                        inputValue={customerSearch}
                        onInputChange={setCustomerSearch}
                        onSelect={handleSelectCustomer}
                        placeholder="Select a customer..."
                        searchPlaceholder="Search customers..."
                        notFoundMessage="No customer found."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="productName">Product / Service</Label>
                    <Combobox
                        options={productOptions}
                        value={selectedProduct?.id || ''}
                        inputValue={productSearch}
                        onInputChange={setProductSearch}
                        onSelect={handleSelectProduct}
                        placeholder="Select a product..."
                        searchPlaceholder="Search products..."
                        notFoundMessage="No product found."
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">Price (per unit)</Label>
                        <Input id="price" type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.push('/invoices')}>Cancel</Button>
                <Button onClick={handleSubmit}><Save className="mr-2 h-4 w-4" /> Create Invoice</Button>
            </CardFooter>
            </Card>
        </main>
    </div>
  );
}
