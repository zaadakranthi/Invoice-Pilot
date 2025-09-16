
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Download,
  Eye,
  MoreVertical,
  PlusCircle,
  Search,
  FileDown,
  Upload,
  CreditCard,
  Zap,
  Truck,
  Edit,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import type { PaymentReceived, Invoice } from '@/lib/types';
import { useData } from '@/context/data-context';
import { EWayBillForm } from '@/components/eway-bill-form';

type InvoiceCopyType = 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' | 'INTERNAL COPY - NOT FOR GST PURPOSES';

export default function InvoicesPage() {
  const { toast } = useToast();
  const { invoices, setInvoices, addPaymentReceived, updateInvoice, brandingSettings, getInvoiceById, getCustomerByName } = useData();
  const router = useRouter();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEWayBillDialogOpen, setIsEWayBillDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMode, setPaymentMode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceType, setInvoiceType] = useState<'Goods' | 'Services'>('Goods');
  
  const generatePdf = (invoice: Invoice, copyType: InvoiceCopyType) => {
    const customer = getCustomerByName(invoice.client);
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    let copyLabel = '';
    switch(copyType) {
        case 'ORIGINAL': copyLabel = 'Original for Recipient'; break;
        case 'DUPLICATE': copyLabel = invoiceType === 'Goods' ? 'Duplicate for Transporter' : 'Duplicate for Supplier'; break;
        case 'TRIPLICATE': copyLabel = 'Triplicate for Supplier'; break;
        default: copyLabel = 'INTERNAL COPY – NOT FOR GST PURPOSES'; break;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(copyLabel, pageWidth - 14, 22, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Invoice', 14, 22);

    if (brandingSettings?.logoDataUri) {
        doc.addImage(brandingSettings.logoDataUri, 'PNG', 150, 15, 40, 20);
    }
    
    autoTable(doc, {
        startY: 30,
        body: [
            [
                { content: 'Billed From:', styles: { fontStyle: 'bold' } },
                { content: 'Billed To:', styles: { fontStyle: 'bold' } }
            ],
            [
                `${brandingSettings?.businessName || ''}\\n${brandingSettings?.address || ''}`,
                `${customer?.name || invoice.client}\\n${customer?.billingAddress || ''}`
            ],
            [
                { content: `GSTIN: ${brandingSettings?.gstin || ''}`, styles: { fontStyle: 'bold' } },
                { content: `GSTIN: ${customer?.gstin || ''}`, styles: { fontStyle: 'bold' } }
            ]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } }
    });
    
    const afterBilledToY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
        startY: afterBilledToY + 5,
        body: [
            [`Invoice No:`, invoice.id, `Invoice Date:`, format(parseISO(invoice.date), 'PPP')],
            [`Subject:`, `Sale of ${invoiceType}`, `Due Date:`, format(addDays(parseISO(invoice.date), 30), 'PPP')],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        bodyStyles: { fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 70 }, 2: { cellWidth: 25 }, 3: { cellWidth: 'auto' } },
    });

    const tableColumn = ["#", "Item Description", "HSN/SAC", "Qty", "Rate", "GST %", "Amount"];
    const tableRows: any[][] = [];
    invoice.lineItems.forEach((item, index) => {
        const itemData = [
            index + 1,
            item.description,
            item.hsnCode,
            item.quantity,
            `₹${item.rate.toLocaleString('en-IN')}`,
            `${item.gstRate}%`,
            `₹${(item.quantity * item.rate).toLocaleString('en-IN')}`
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: (doc as any).lastAutoTable.finalY + 5,
        theme: 'striped',
        headStyles: { fillColor: [34, 34, 34] },
        columnStyles: {
            0: { cellWidth: 10 }, 
            1: { cellWidth: 65 }, 
            2: { cellWidth: 20, halign: 'center' },
            3: { halign: 'right', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 15 },
            6: { halign: 'right', cellWidth: 30 },
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    
    const summaryBody = [
        ['Subtotal', `₹${invoice.taxableValue.toLocaleString('en-IN')}`],
        ...(invoice.igst > 0 ? [['IGST', `₹${invoice.igst.toLocaleString('en-IN')}`]] : []),
        ...(invoice.cgst > 0 ? [['CGST', `₹${invoice.cgst.toLocaleString('en-IN')}`]] : []),
        ...(invoice.sgst > 0 ? [['SGST', `₹${invoice.sgst.toLocaleString('en-IN')}`]] : []),
        ...(invoice.cess > 0 ? [['CESS', `₹${invoice.cess.toLocaleString('en-IN')}`]] : []),
        ...(invoice.tcs?.applicable ? [[`TCS (${invoice.tcs.rate}%)`, `₹${invoice.tcs.amount.toLocaleString('en-IN')}`]] : []),
        [{ content: 'Total', styles: { fontStyle: 'bold' } }, { content: `₹${invoice.totalAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } }],
        ['Amount Paid', `- ₹${invoice.amountPaid.toLocaleString('en-IN')}`],
        [{ content: 'Balance Due', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }, { content: `₹${(invoice.totalAmount - invoice.amountPaid).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
    ];
    
    autoTable(doc, {
        body: summaryBody,
        startY: finalY + 5,
        theme: 'plain',
        tableWidth: 90,
        margin: { left: pageWidth - 104 },
        styles: { fontSize: 9, cellPadding: 2, halign: 'right' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
    });

    let yPos = (doc as any).lastAutoTable.finalY;
    yPos = Math.max(yPos, finalY + 10);
    
    if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(8);
    doc.text('Terms & Conditions', 14, yPos);
    yPos += 4;
    const termsLines = doc.splitTextToSize(brandingSettings?.termsAndConditions || '', 80);
    doc.text(termsLines, 14, yPos);

    if (brandingSettings?.signatureDataUrl) {
        doc.addImage(brandingSettings.signatureDataUrl, 'PNG', 140, yPos, 50, 20);
    }
    doc.text(brandingSettings?.signatureName || 'For ' + brandingSettings?.businessName, 140, yPos + 25);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated with InvoicePilot', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`Invoice-${invoice.id}-${copyType}.pdf`);
    toast({ title: 'Download Successful', description: `${copyType} of Invoice ${invoice.id} has been downloaded.` });
  };


  const handleOpenDownloadDialog = (invoiceId: string) => {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find invoice details.' });
        return;
    }
    setSelectedInvoice(invoice);
    setIsCopyDialogOpen(true);
  };


  const handleBulkExport = () => {
    const header = ['Invoice ID', 'Date', 'Client Name', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'CESS', 'Total Value'];
    const rows = invoices.map(invoice => 
      [
        invoice.id,
        invoice.date,
        `"${invoice.client}"`,
        invoice.gstin,
        invoice.taxableValue,
        invoice.cgst,
        invoice.sgst,
        invoice.igst,
        invoice.cess,
        invoice.totalAmount
      ].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "invoices_gstr1_export.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful!', description: 'Invoices have been exported in GSTR-1 format.' });
  };
  
  const handleDownloadTemplate = () => {
    const header = 'invoiceId,date,clientName,gstin,taxableValue,cgst,sgst,igst,cess,totalValue\\n';
    const sampleData = 'INV-101,2024-05-20,Stark Industries,29AABCU9603R1ZJ,105932.2,9533.9,9533.9,0,0,125000';
    const csvContent = `data:text/csv;charset=utf-8,${header}${sampleData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'invoice_upload_template.csv');
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
      const lines = text.split('\\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast({ variant: 'destructive', title: 'Invalid CSV', description: 'CSV file must have a header and at least one data row.' });
        return;
      }
      
      const header = lines[0].trim().split(',');
      const requiredHeaders = ['invoiceId', 'date', 'clientName', 'gstin', 'taxableValue', 'cgst', 'sgst', 'igst', 'cess', 'totalValue'];
      
      const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
      if (missingHeaders.length > 0) {
        toast({ variant: 'destructive', title: 'Invalid CSV Header', description: `Missing columns: ${missingHeaders.join(', ')}` });
        return;
      }

      const newInvoices: Invoice[] = [];
      lines.slice(1).forEach(line => {
        const values = line.trim().split(',');
        const rowData = header.reduce((obj, h, index) => {
          obj[h as keyof typeof rowData] = values[index];
          return obj;
        }, {} as any);
        
        const invoice: Invoice = {
          id: rowData.invoiceId,
          date: rowData.date,
          client: rowData.clientName,
          gstin: rowData.gstin,
          taxableValue: parseFloat(rowData.taxableValue) || 0,
          cgst: parseFloat(rowData.cgst) || 0,
          sgst: parseFloat(rowData.sgst) || 0,
          igst: parseFloat(rowData.igst) || 0,
          cess: parseFloat(rowData.cess) || 0,
          totalAmount: parseFloat(rowData.totalValue) || 0,
          amountPaid: 0,
          status: 'Pending',
          lineItems: [],
          financialYear: ''
        };
        newInvoices.push(invoice);
      });

      setInvoices(prev => [...prev, ...newInvoices]);
      toast({ title: 'Invoices imported successfully!', description: `${newInvoices.length} invoices were added.` });
      setIsUploadDialogOpen(false);
    };
    reader.readAsText(file);
  };

  const handleOpenPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount('');
    setPaymentDate(new Date());
    setPaymentMode('');
    setIsPaymentDialogOpen(true);
  };

  const handleOpenEWayBillDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEWayBillDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount || !paymentMode) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all payment details.' });
      return;
    }
    const amount = parseFloat(paymentAmount as string);
    const newAmountPaid = selectedInvoice.amountPaid + amount;
    
    if (newAmountPaid > selectedInvoice.totalAmount) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Payment cannot exceed the total amount due.' });
      return;
    }
    
    const newPayment: Omit<PaymentReceived, 'id'|'financialYear'> = {
        customerId: selectedInvoice.client,
        date: format(paymentDate!, 'yyyy-MM-dd'),
        amount: amount,
        mode: paymentMode,
        accountId: 'cash', 
        invoiceId: selectedInvoice.id,
    };
    addPaymentReceived(newPayment);

    let newStatus = selectedInvoice.status;
    if (newAmountPaid >= selectedInvoice.totalAmount) {
        newStatus = 'Paid';
    } else if (newAmountPaid > 0) {
        newStatus = 'Partially Paid';
    }
    updateInvoice({ ...selectedInvoice, amountPaid: newAmountPaid, status: newStatus }, selectedInvoice.lineItems);
    
    toast({ title: 'Payment Recorded!', description: `₹${amount.toLocaleString('en-IN')} recorded for ${selectedInvoice.id}.` });
    setIsPaymentDialogOpen(false);
  };

  const getStatusInfo = (invoice: Invoice) => {
    const balance = invoice.totalAmount - invoice.amountPaid;
    if (balance <= 0) return { variant: 'paid', text: 'Paid' };
    if (invoice.amountPaid > 0) return { variant: 'partially-paid', text: 'Partially Paid' };
    if (invoice.status === 'Overdue') return { variant: 'destructive', text: 'Overdue' };
    return { variant: 'pending', text: 'Pending' };
  };
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);


  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create, manage, and track all your sales invoices."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or client..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleBulkExport}>
                <FileDown className="mr-2 h-4 w-4" /> Export as CSV
              </Button>
               <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Bulk Upload Invoices (GSTR-1 Format)</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with your invoice data. The format should match the GSTR-1 export.
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
              <Button asChild variant="secondary">
                <Link href="/invoices/quick">
                  <Zap className="mr-2 h-4 w-4" /> Quick Invoice
                </Link>
              </Button>
              <Button asChild>
                <Link href="/invoices/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Invoice
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const statusInfo = getStatusInfo(invoice);
                  const balanceDue = invoice.totalAmount - invoice.amountPaid;
                  return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>₹{Math.round(invoice.totalAmount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{Math.round(balanceDue).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusInfo.variant === 'destructive' ? 'destructive' : 'secondary'}
                        className={cn({
                            'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30': statusInfo.variant === 'paid',
                            'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30': statusInfo.variant === 'partially-paid',
                            'bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30': statusInfo.variant === 'pending',
                            'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30': statusInfo.variant === 'destructive'
                        })}
                      >
                        {statusInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/invoices/edit/${invoice.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDownloadDialog(invoice.id)}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {balanceDue > 0 && (
                            <DropdownMenuItem onClick={() => handleOpenPaymentDialog(invoice)}>
                              <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                           <DropdownMenuItem onClick={() => handleOpenEWayBillDialog(invoice)}>
                              <Truck className="mr-2 h-4 w-4" /> Generate E-Way Bill
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}\
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedInvoice?.id}</DialogTitle>
            <DialogDescription>
              Record a new payment received for this invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
                placeholder={`Max: ₹${Math.round(((selectedInvoice?.totalAmount || 0) - (selectedInvoice?.amountPaid || 0))).toLocaleString('en-IN')}`}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMode" className="text-right">Payment Mode</Label>
              <Select onValueChange={setPaymentMode} value={paymentMode}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleRecordPayment}>Save Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEWayBillDialogOpen} onOpenChange={setIsEWayBillDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
           <DialogHeader>
             <DialogTitle>Generate E-Way Bill JSON</DialogTitle>
             <DialogDescription>
               Fill in the transportation details to generate the E-Way Bill JSON file for upload.
             </DialogDescription>
           </DialogHeader>
           {selectedInvoice && <EWayBillForm invoice={selectedInvoice} onClose={() => setIsEWayBillDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice Copy</DialogTitle>
            <DialogDescription>Select the type of invoice to generate the appropriate copies as per GST rules.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label>Invoice For:</Label>
                <Select value={invoiceType} onValueChange={(value: 'Goods' | 'Services') => setInvoiceType(value)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Goods">Supply of Goods</SelectItem>
                        <SelectItem value="Services">Supply of Services</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label>Download Copy:</Label>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => selectedInvoice && generatePdf(selectedInvoice, 'ORIGINAL')}>
                  <FileText className="mr-2 h-4 w-4"/>Original for Recipient
                </Button>
                <Button variant="outline" onClick={() => selectedInvoice && generatePdf(selectedInvoice, 'DUPLICATE')}>
                  <FileText className="mr-2 h-4 w-4"/>Duplicate for {invoiceType === 'Goods' ? 'Transporter' : 'Supplier'}
                </Button>
                {invoiceType === 'Goods' && (
                  <Button variant="outline" onClick={() => selectedInvoice && generatePdf(selectedInvoice, 'TRIPLICATE')}>
                    <FileText className="mr-2 h-4 w-4"/>Triplicate for Supplier
                  </Button>
                )}
                 <Button variant="secondary" onClick={() => selectedInvoice && generatePdf(selectedInvoice, 'INTERNAL COPY - NOT FOR GST PURPOSES')}>
                  <FileText className="mr-2 h-4 w-4"/>Internal Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
