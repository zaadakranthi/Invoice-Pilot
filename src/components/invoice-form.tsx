
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Trash2, PlusCircle, Save, Wand2, Loader2, RefreshCcw } from 'lucide-react';
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
import type { Customer, Product, BrandingSettings, Invoice, LineItem, TaxDeduction, HsnCode } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SignaturePad } from './signature-pad';
import { getTermsAndConditionsSuggestion } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Combobox } from './ui/combobox';

interface InvoiceFormProps {
    invoiceId?: string;
}

export function InvoiceForm({ invoiceId }: InvoiceFormProps) {
  const { 
    addInvoice, 
    updateInvoice, 
    invoices,
    customers, 
    products, 
    brandingSettings, 
    hsnCodes,
    getInvoiceById
  } = useData();
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditMode = !!invoiceId;

  // Use a state for the manual override of invoice number
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState<string | null>(null);

  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: Date.now(), productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, cessRate: 0 },
  ]);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [terms, setTerms] = useState('');
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureData] = useState<string | null>(null);
  const signaturePadRef = useRef<{ clear: () => void }>(null);
  const [tcs, setTcs] = useState<TaxDeduction>({ applicable: false, section: '206C(1H)', rate: 0.1, amount: 0 });
  const [hsnSearch, setHsnSearch] = useState('');

  // This is now the single source of truth for the displayed invoice number
  const displayInvoiceNumber = useMemo(() => {
    if (isEditMode) return invoiceId;
    if (manualInvoiceNumber !== null) return manualInvoiceNumber;
    if (brandingSettings) {
        return `${brandingSettings.invoicePrefix || 'INV-'}${brandingSettings.nextInvoiceNumber || 1}`;
    }
    return '';
  }, [isEditMode, invoiceId, manualInvoiceNumber, brandingSettings]);
  
  useEffect(() => {
    if (isEditMode && invoices.length > 0) {
      const existingInvoice = getInvoiceById(invoiceId);
      if (existingInvoice) {
        setManualInvoiceNumber(existingInvoice.id);
        setInvoiceDate(parseISO(existingInvoice.date));
        const client = customers.find(c => c.name === existingInvoice.client);
        setSelectedClient(client || null);
        setClientSearch(client?.name || '');
        setLineItems(existingInvoice.lineItems || [{ id: Date.now(), productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18, cessRate: 0 }]);
        if (existingInvoice.tcs) {
            setTcs(existingInvoice.tcs);
        }
      }
    }
    
    if (brandingSettings) {
        setTerms(brandingSettings.termsAndConditions || '');
        setSignatureName(brandingSettings.signatureName || '');
        setSignatureData(brandingSettings.signatureDataUrl || null);
    }
  }, [invoiceId, isEditMode, invoices, customers, brandingSettings, getInvoiceById]);


  const handleSelectClient = (clientId: string) => {
      const client = customers.find((c) => c.id === clientId) || null;
      setSelectedClient(client);
      setClientSearch(client?.name || '');
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
          rate: product.salePrice,
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
  const calculateCESS = (amount: number, cessRate: number) => (amount * cessRate) / 100;

  const isInterState = useMemo(() => {
    if (!brandingSettings?.gstin || !selectedClient?.gstin) return false;
    return brandingSettings.gstin.substring(0, 2) !== selectedClient.gstin.substring(0, 2);
  }, [brandingSettings, selectedClient]);

  const { subTotal, totalCgst, totalSgst, totalIgst, totalCess } = useMemo(() => {
    let sub = 0, cgst = 0, sgst = 0, igst = 0, cess = 0;
    lineItems.forEach(item => {
        const amount = calculateAmount(item);
        const gst = calculateGST(amount, item.gstRate);
        sub += amount;
        cess += calculateCESS(amount, item.cessRate || 0);

        if (isInterState) {
            igst += gst;
        } else {
            cgst += gst / 2;
            sgst += gst / 2;
        }
    });
    return { subTotal: sub, totalCgst: cgst, totalSgst: sgst, totalIgst: igst, totalCess: cess };
  }, [lineItems, isInterState]);
  
  const taxableTotalForTcs = subTotal + totalCgst + totalSgst + totalIgst + totalCess;

  useEffect(() => {
    if (tcs.applicable) {
      const tcsAmount = (taxableTotalForTcs * tcs.rate) / 100;
      setTcs(prev => ({...prev, amount: tcsAmount }));
    } else {
      setTcs(prev => ({...prev, amount: 0 }));
    }
  }, [tcs.applicable, tcs.rate, taxableTotalForTcs]);

  const grandTotal = taxableTotalForTcs + tcs.amount;


  const handleGenerateTerms = async () => {
    setIsGeneratingTerms(true);
    try {
      const companyName = brandingSettings?.businessName || 'our company';
      const result = await getTermsAndConditionsSuggestion({ companyName });
      setTerms(result);
      toast({ title: 'Terms and Conditions generated successfully!' });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to generate terms and conditions.',
      });
    } finally {
      setIsGeneratingTerms(false);
    }
  };
  
  const handleSaveInvoice = async () => {
    if (!selectedClient) {
      toast({ variant: 'destructive', title: 'Customer not selected', description: 'Please select a customer.' });
      return;
    }
    if (lineItems.some(item => !item.productId && !item.description || item.quantity <= 0 || item.rate < 0)) {
        toast({ variant: 'destructive', title: 'Invalid line items', description: 'Please ensure all items have a product, quantity, and a valid rate.' });
        return;
    }
    if (!displayInvoiceNumber) {
        toast({ variant: 'destructive', title: 'Invalid Invoice Number', description: 'Invoice number cannot be empty.' });
        return;
    }
    
    // The invoice ID to be saved is the one currently displayed
    const finalInvoiceId = displayInvoiceNumber;

    const invoiceData: Omit<Invoice, 'id' | 'amountPaid' | 'status' | 'financialYear'> = {
        client: selectedClient.name,
        gstin: selectedClient.gstin,
        date: format(invoiceDate || new Date(), 'yyyy-MM-dd'),
        taxableValue: subTotal,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        cess: totalCess,
        totalAmount: grandTotal,
        lineItems,
        ...(tcs.applicable && { tcs }),
    };
    
    try {
      if (isEditMode) {
          const existingInvoice = getInvoiceById(invoiceId);
          await updateInvoice({
              ...existingInvoice!,
              ...invoiceData,
              id: finalInvoiceId, // The ID can also be edited
          }, existingInvoice?.lineItems || []);
          toast({ title: 'Invoice Updated!', description: `Invoice ${finalInvoiceId} has been updated.` });
      } else {
          // Pass the final desired invoice ID to the creation function
          const dataForCreation = { ...invoiceData, id: finalInvoiceId };
          await addInvoice(dataForCreation);
      }
      router.push('/invoices');
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  const hsnOptions = hsnCodes.map(h => ({ value: h.code, label: `${h.code} - ${h.description}` }));
  const clientOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <CardTitle>{isEditMode ? `Edit Invoice #${invoiceId}` : 'New Invoice'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="grid gap-2">
              <Label htmlFor="clientName">Customer Name</Label>
                <Combobox
                    options={clientOptions}
                    value={selectedClient?.id || ''}
                    inputValue={clientSearch}
                    onInputChange={setClientSearch}
                    onSelect={handleSelectClient}
                    placeholder="Select a customer..."
                    searchPlaceholder="Search customers..."
                    notFoundMessage="No customer found."
                />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input 
                  id="invoiceNumber" 
                  value={displayInvoiceNumber} 
                  onChange={e => setManualInvoiceNumber(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                 <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !invoiceDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={invoiceDate} 
                        onSelect={(date) => {
                            setInvoiceDate(date);
                            setIsDatePickerOpen(false);
                        }} 
                        initialFocus 
                        captionLayout="dropdown-buttons"
                        fromYear={2020}
                        toYear={new Date().getFullYear() + 5}
                      />
                    </PopoverContent>
                  </Popover>
              </div>
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Bill To</h3>
            <Textarea placeholder="Billing Address" rows={4} value={selectedClient?.billingAddress || ''} readOnly className="bg-muted/50" />
            <Input placeholder="GSTIN" value={selectedClient?.gstin || ''} readOnly className="bg-muted/50" />
          </div>
           <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ship To</h3>
            <Textarea placeholder="Shipping Address" rows={4} value={selectedClient?.shippingAddress || ''} readOnly className="bg-muted/50" />
          </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Product / Service</TableHead>
                <TableHead className="w-[20%] min-w-[200px]">HSN/SAC Code</TableHead>
                <TableHead className="w-[120px]">Qty</TableHead>
                <TableHead className="w-[180px]">Rate</TableHead>
                <TableHead className="w-[180px]">Amount</TableHead>
                <TableHead className="w-[120px]">GST%</TableHead>
                <TableHead className="w-[120px]">CESS%</TableHead>
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
                  <TableCell>
                      <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className="min-w-[80px]" />
                  </TableCell>
                  <TableCell>
                      <Input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="min-w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Input value={Math.round(calculateAmount(item)).toLocaleString('en-IN')} readOnly className="bg-muted/50 font-medium min-w-[120px]"/>
                  </TableCell>
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
                  <TableCell>
                     <Input type="number" value={item.cessRate} onChange={(e) => handleItemChange(item.id, 'cessRate', parseFloat(e.target.value) || 0)} className="min-w-[80px]" />
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

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateTerms} disabled={isGeneratingTerms}>
                        {isGeneratingTerms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Generate with AI
                    </Button>
                 </div>
                <Textarea id="terms" rows={5} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
            <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Label>Signature</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => signaturePadRef.current?.clear()}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                 </div>
                <SignaturePad ref={signaturePadRef} onSignatureEnd={(data) => setSignatureData(data)} initialDataUrl={signatureDataUrl} />
                <Input placeholder="Authorized Signatory" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
            </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{Math.round(subTotal).toLocaleString('en-IN')}</span></div>
            {isInterState ? (
                <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><span>₹{Math.round(totalIgst).toLocaleString('en-IN')}</span></div>
            ) : (
                <>
                    <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span>₹{Math.round(totalCgst).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span>₹{Math.round(totalSgst).toLocaleString('en-IN')}</span></div>
                </>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">CESS</span><span>₹{Math.round(totalCess).toLocaleString('en-IN')}</span></div>
            
            <div className="flex items-center space-x-2 py-2">
                <Switch id="tcs-mode" checked={tcs.applicable} onCheckedChange={(checked) => setTcs(prev => ({ ...prev, applicable: checked }))} />
                <Label htmlFor="tcs-mode" className="text-base">Apply TCS (Tax Collected at Source)</Label>
            </div>
            
            {tcs.applicable && (
                <div className="grid grid-cols-3 gap-4 items-center pl-8">
                     <Input 
                        placeholder="Section" 
                        value={tcs.section}
                        onChange={(e) => setTcs(prev => ({...prev, section: e.target.value}))}
                     />
                     <div className="relative">
                        <Input 
                            type="number"
                            placeholder="Rate" 
                            value={tcs.rate}
                            onChange={(e) => setTcs(prev => ({...prev, rate: parseFloat(e.target.value) || 0}))}
                            className="pr-6"
                        />
                        <span className="absolute inset-y-0 right-2 flex items-center text-sm text-muted-foreground">%</span>
                     </div>
                     <Input value={Math.round(tcs.amount).toLocaleString('en-IN')} readOnly className="bg-muted/50" />
                </div>
            )}
            
            <div className="flex justify-between font-bold text-xl border-t pt-4"><span>Grand Total</span><span>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/invoices')}>Cancel</Button>
        <Button onClick={handleSaveInvoice}><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Update Invoice' : 'Save Invoice'}</Button>
      </CardFooter>
    </Card>
    </>
  );
}
