
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Trash2, PlusCircle, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { Vendor, Product, PurchaseBill, LineItem, HsnCode } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { Combobox } from './ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { useRouter } from 'next/navigation';

interface PurchaseFormProps {
  billId?: string;
}

export function PurchaseForm({ billId }: PurchaseFormProps) {
  const { vendors, addVendor, products, addBill, getBillById, updateBill, hsnCodes } = useData();
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditMode = !!billId;

  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState<Date | undefined>(new Date());
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: Date.now(), productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, cessRate: 0 },
  ]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [originalLineItems, setOriginalLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (isEditMode) {
      const existingBill = getBillById(billId);
      if (existingBill) {
        setBillNumber(existingBill.id);
        setBillDate(parseISO(existingBill.date));
        const vendor = vendors.find(v => v.name === existingBill.vendor);
        setSelectedVendor(vendor || null);
        setVendorSearch(vendor?.name || '');
        setLineItems(existingBill.lineItems || [{ id: Date.now(), productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, cessRate: 0 }]);
        setOriginalLineItems(existingBill.lineItems || []);
      }
    }
  }, [billId, isEditMode, getBillById, vendors]);

  const generateVendorCode = () => `VDR-${Date.now().toString().slice(-6)}`;

  const handleSelectVendor = (vendorId: string, vendorName?: string) => {
    if (vendorId === vendorName) { // New vendor
      const newVendor = addVendor({
        name: vendorName,
        email: '', phone: '', gstin: '', pan: '', billingAddress: '',
      });
      setSelectedVendor(newVendor);
      setVendorSearch(newVendor.name);
      toast({ title: 'Vendor Created', description: `New vendor "${vendorName}" has been added. You can add more details later.`});
    } else {
      const vendor = vendors.find((v) => v.id === vendorId) || null;
      setSelectedVendor(vendor);
      setVendorSearch(vendor?.name || '');
    }
  };

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, cessRate: 0 },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof LineItem, value: any) => {
    const updatedItems = lineItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setLineItems(updatedItems);
  };
  
  const handleHsnSelect = (itemId: number, hsnCodeValue: string) => {
      const hsnRecord = hsnCodes.find(h => h.code === hsnCodeValue);
      if (hsnRecord) {
           const updatedItems = lineItems.map((item) =>
                item.id === itemId ? { 
                    ...item,
                    hsnCode: hsnRecord.code,
                    description: item.description || hsnRecord.description,
                    gstRate: hsnRecord.gstRate,
                    cessRate: hsnRecord.cessRate || 0,
                } : item
            );
            setLineItems(updatedItems);
      }
  }

  const handleProductSelect = (itemId: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = lineItems.map((item) =>
        item.id === itemId ? { 
          ...item, 
          productId: product.id,
          description: product.name,
          rate: product.purchasePrice,
          hsnCode: product.hsnCode,
          gstRate: product.gstRate,
          cessRate: product.cessRate || 0,
        } : item
      );
      setLineItems(updatedItems);
    }
  };
  
  const calculateAmount = (item: LineItem) => item.quantity * item.rate;
  const calculateGST = (amount: number, gstRate: number) => (amount * gstRate) / 100;

  const subTotal = lineItems.reduce((acc, item) => acc + calculateAmount(item), 0);
  const totalGST = lineItems.reduce((acc, item) => acc + calculateGST(calculateAmount(item), item.gstRate), 0);
  const grandTotal = subTotal + totalGST;
  
  const vendorOptions = vendors.map(v => ({ value: v.id, label: v.name }));
  const hsnOptions = hsnCodes.map(h => ({ value: h.code, label: `${h.code} - ${h.description}` }));
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  const handleSaveBill = async () => {
    if (!selectedVendor || !billNumber) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a vendor and enter a bill number.' });
        return;
    }

    const billData: Omit<PurchaseBill, 'amountPaid' | 'financialYear'> = {
        id: billNumber,
        vendor: selectedVendor.name,
        date: format(billDate!, 'yyyy-MM-dd'),
        taxableValue: subTotal,
        gstAmount: totalGST,
        totalAmount: grandTotal,
        lineItems: lineItems,
    };
    
    if (isEditMode) {
      const existingBill = getBillById(billId);
      await updateBill({ ...existingBill!, ...billData }, originalLineItems);
      toast({ title: 'Purchase Bill Updated!', description: `Bill #${billNumber} has been updated.` });
    } else {
      await addBill(billData, billNumber);
      toast({ title: 'Purchase Bill Saved!', description: `Bill #${billNumber} has been recorded.` });
    }
    router.push('/purchases');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Purchase Bill' : 'New Purchase Bill'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="grid gap-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Combobox
                options={vendorOptions}
                value={selectedVendor?.id || ''}
                inputValue={vendorSearch}
                onInputChange={setVendorSearch}
                onSelect={handleSelectVendor}
                placeholder="Select or create vendor..."
                searchPlaceholder="Search vendors..."
                notFoundMessage="No vendor found."
                createMessage="Create"
              />
            </div>
             <div className="grid grid-cols-2 gap-4 col-span-2">
              <div className="grid gap-2">
                <Label htmlFor="billNumber">Bill Number</Label>
                <Input id="billNumber" value={billNumber} onChange={e => setBillNumber(e.target.value)} />
              </div>
              <div className="grid gap-2">
                 <Label htmlFor="billDate">Bill Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !billDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {billDate ? format(billDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={billDate} onSelect={setBillDate} initialFocus />
                    </PopoverContent>
                  </Popover>
              </div>
            </div>
        </div>
        
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Vendor Details</h3>
            <Textarea placeholder="Billing Address" rows={4} value={selectedVendor?.billingAddress || ''} readOnly className="bg-muted/50" />
            <Input placeholder="GSTIN" value={selectedVendor?.gstin || ''} readOnly className="bg-muted/50" />
        </div>
        
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Product / Service</TableHead>
                <TableHead className="w-[20%]">HSN/SAC Code</TableHead>
                <TableHead className="w-[120px]">Qty</TableHead>
                <TableHead className="w-[180px]">Rate</TableHead>
                <TableHead className="w-[180px]">Amount</TableHead>
                <TableHead className="w-[120px]">GST%</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Combobox
                      options={productOptions}
                      value={item.productId}
                      onSelect={(value) => handleProductSelect(item.id, value)}
                      placeholder="Select a product"
                      searchPlaceholder="Search products..."
                      notFoundMessage="No product found."
                    />
                  </TableCell>
                  <TableCell>
                    <Combobox
                        options={hsnOptions}
                        value={item.hsnCode}
                        inputValue={item.hsnCode}
                        onInputChange={(searchVal) => handleItemChange(item.id, 'hsnCode', searchVal)}
                        onSelect={(hsn) => handleHsnSelect(item.id, hsn)}
                        placeholder="Search HSN..."
                        searchPlaceholder="Type to search HSN..."
                        notFoundMessage="No HSN found."
                        className="font-normal"
                     />
                  </TableCell>
                  <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className="min-w-[80px]" /></TableCell>
                  <TableCell><Input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="min-w-[120px]" /></TableCell>
                  <TableCell><Input value={calculateAmount(item).toFixed(2)} readOnly className="bg-muted/50 font-medium min-w-[120px]"/></TableCell>
                  <TableCell>
                     <Select value={String(item.gstRate)} onValueChange={(value) => handleItemChange(item.id, 'gstRate', parseInt(value))}>
                        <SelectTrigger><SelectValue placeholder="GST %" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem><SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} disabled={lineItems.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total GST</span><span>₹{totalGST.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-4"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/purchases')}>Cancel</Button>
        <Button onClick={handleSaveBill}><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Update Bill' : 'Save Bill'}</Button>
      </CardFooter>
    </Card>
  );
}
