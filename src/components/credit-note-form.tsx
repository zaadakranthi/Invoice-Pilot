
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { Customer, Product, CreditNote } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface LineItem {
  id: number;
  productId: string;
  description: string;
  quantity: number;
  rate: number;
  hsnCode: string;
  gstRate: number;
}

const initialInvoices = [
  { id: 'INV-001', client: 'Stark Industries' },
  { id: 'INV-002', client: 'Wayne Enterprises' },
  { id: 'INV-004', client: 'Stark Industries' },
  { id: 'INV-005', client: 'Wayne Enterprises' },
];

export function CreditNoteForm() {
  const { customers, products, addCreditNote } = useData();
  const router = useRouter();
  const { toast } = useToast();
  const [noteNumber, setNoteNumber] = useState('');
  const [noteDate, setNoteDate] = useState<Date | undefined>(new Date());
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18 },
  ]);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const prefix = 'CN-';
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setNoteNumber(`${prefix}${randomNumber}`);
  }, []);

  const handleSelectClient = (clientId: string) => {
    const client = customers.find((c) => c.id === clientId) || null;
    setSelectedClient(client);
  };

  const handleAddItem = () => {
    setLineItems([...lineItems, { id: Date.now(), productId: '', description: '', quantity: 1, rate: 0, hsnCode: '', gstRate: 18 }]);
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
  
   const handleProductSelect = (itemId: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = lineItems.map((item) =>
        item.id === itemId ? { 
          ...item, 
          productId: product.id,
          description: product.name,
          hsnCode: product.hsnCode,
          gstRate: product.gstRate,
        } : item
      );
      setLineItems(updatedItems);
    }
  };

  const calculateAmount = (item: LineItem) => item.quantity * item.rate;
  const subTotal = lineItems.reduce((acc, item) => acc + calculateAmount(item), 0);
  const totalGST = lineItems.reduce((acc, item) => acc + (calculateAmount(item) * item.gstRate) / 100, 0);
  const grandTotal = subTotal + totalGST;

  const handleSave = () => {
    if (!selectedClient || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select a client and add at least one item." });
      return;
    }
    
    const newCreditNote: Omit<CreditNote, 'financialYear'> = {
      id: noteNumber,
      client: selectedClient.name,
      originalInvoice: 'INV-004', // Placeholder
      date: format(noteDate || new Date(), 'yyyy-MM-dd'),
      totalAmount: grandTotal,
      taxableValue: subTotal,
      igst: totalGST, // Simplified, should check for inter-state
      lineItems: lineItems.map(li => ({...li, cessRate: 0})),
    };
    
    addCreditNote(newCreditNote);
    toast({ title: "Success", description: `Credit Note ${noteNumber} created successfully.` });
    router.push('/credit-notes');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Note Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="grid gap-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Select onValueChange={handleSelectClient}>
              <SelectTrigger id="clientName">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4 col-span-2">
            <div className="grid gap-2">
              <Label htmlFor="noteNumber">Credit Note Number</Label>
              <Input id="noteNumber" value={noteNumber} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="noteDate">Credit Note Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !noteDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {noteDate ? format(noteDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={noteDate} onSelect={setNoteDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
           <div className="grid gap-2">
              <Label htmlFor="originalInvoice">Original Invoice No.</Label>
               <Select>
                <SelectTrigger id="originalInvoice">
                  <SelectValue placeholder="Select original invoice" />
                </SelectTrigger>
                <SelectContent>
                  {initialInvoices.filter(inv => inv.client === selectedClient?.name).map(inv => (
                     <SelectItem key={inv.id} value={inv.id}>{inv.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
           <div className="grid gap-2">
             <Label htmlFor="reason">Reason for Issuing</Label>
             <Input id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Sales Return, Price Correction"/>
           </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Product / Service</TableHead>
                <TableHead>HSN Code</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>GST%</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                     <Select onValueChange={(value) => handleProductSelect(item.id, value)}>
                      <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={item.hsnCode} readOnly className="bg-muted/50"/></TableCell>
                  <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}/></TableCell>
                  <TableCell><Input value={Math.round(calculateAmount(item)).toLocaleString('en-IN')} readOnly className="bg-muted/50"/></TableCell>
                  <TableCell>
                    <Select value={String(item.gstRate)} onValueChange={(v) => handleItemChange(item.id, 'gstRate', parseInt(v))}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
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
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{Math.round(subTotal).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total GST</span><span>₹{Math.round(totalGST).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-4"><span>Grand Total</span><span>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Credit Note</Button>
      </CardFooter>
    </Card>
  );
}
