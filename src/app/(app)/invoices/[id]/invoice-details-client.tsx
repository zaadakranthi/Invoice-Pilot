
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { BrandingSettings, Invoice, LineItem, Customer, PaymentReceived } from '@/lib/types';
import Image from 'next/image';
import { useData } from '@/context/data-context';
import { format, addDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

// A more detailed invoice type for the detail page
interface FullInvoice extends Invoice {
  clientDetails: Customer | null;
  payments: PaymentReceived[];
  dueDate: string;
}

export function InvoiceDetailsClient({ invoiceId }: { invoiceId: string }) {
  const { getInvoiceById, getPaymentsForInvoice, getCustomerByName, brandingSettings } = useData();
  const [invoiceData, setInvoiceData] = useState<FullInvoice | null>(null);
  
  useEffect(() => {
    if (invoiceId) {
      const basicInvoice = getInvoiceById(invoiceId);

      if (basicInvoice) {
        const clientDetails = getCustomerByName(basicInvoice.client);
        const payments = getPaymentsForInvoice(invoiceId);
        const dueDate = format(addDays(parseISO(basicInvoice.date), 30), 'yyyy-MM-dd');

        setInvoiceData({
            ...basicInvoice,
            clientDetails,
            payments,
            dueDate,
        });
      }
    }
  }, [invoiceId, getInvoiceById, getCustomerByName, getPaymentsForInvoice]);

  if (!invoiceData) {
    return (
        <div className="p-4 sm:p-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Invoice Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The invoice you are looking for does not exist or could not be loaded.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  const subTotal = invoiceData.lineItems.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const totalGST = invoiceData.cgst + invoiceData.sgst + invoiceData.igst;
  const totalCess = invoiceData.cess;
  const grandTotal = invoiceData.totalAmount;
  const totalPaid = invoiceData.amountPaid;
  const balanceDue = grandTotal - totalPaid;

  const getStatusInfo = () => {
    if (balanceDue <= 0) return { variant: 'paid', text: 'Paid' };
    if (totalPaid > 0) return { variant: 'partially-paid', text: 'Partially Paid' };
    if (new Date(invoiceData.dueDate) < new Date() && balanceDue > 0) return { variant: 'destructive', text: 'Overdue' };
    return { variant: 'pending', text: 'Pending' };
  };
  const statusInfo = getStatusInfo();

  return (
    <Card className="max-w-4xl mx-auto">
    <CardHeader className="flex flex-row justify-between items-start">
        <div>
        <h1 className="text-3xl font-bold">Invoice</h1>
        <p className="text-muted-foreground">#{invoiceData.id}</p>
        </div>
        <div>
        <Badge
            className={
            statusInfo.variant === 'paid'
                ? 'bg-green-500/20 text-green-700 border-green-500/30'
                : statusInfo.variant === 'partially-paid'
                ? 'bg-blue-500/20 text-blue-700 border-blue-500/30'
                : statusInfo.variant === 'pending'
                ? 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                : 'bg-red-500/20 text-red-700 border-red-500/30'
            }
        >
            {statusInfo.text}
        </Badge>
        </div>
    </CardHeader>
    <CardContent className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-2">
            <h3 className="font-semibold">Billed To</h3>
            {invoiceData.clientDetails ? (
            <>
                <p className="font-bold text-lg">{invoiceData.clientDetails.name}</p>
                <p className="text-sm text-muted-foreground">
                    {invoiceData.clientDetails.billingAddress.split('\n').map((line, i) => (
                    <span key={i} className="block">{line}</span>
                    ))}
                </p>
                <p className="text-sm">
                    <strong>GSTIN:</strong> {invoiceData.clientDetails.gstin}
                </p>
            </>
            ) : (
            <p className="text-sm text-muted-foreground">Client details not found.</p>
            )}
        </div>
        <div className="space-y-2 sm:text-right">
            <h3 className="font-semibold">From</h3>
            {brandingSettings ? (
            <>
                <p className="font-bold text-lg">{brandingSettings.businessName || brandingSettings.legalName}</p>
                <p className="text-sm text-muted-foreground">
                {brandingSettings.address?.split('\n').map((line, i) => (
                    <span key={i} className="block">{line}</span>
                ))}
                </p>
                <p className="text-sm">
                <strong>GSTIN:</strong> {brandingSettings.gstin}
                </p>
            </>
            ) : (
                <p className="text-sm text-muted-foreground">Company details not set.</p>
            )}
        </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-8">
            <div>
            <p className="text-sm text-muted-foreground"><strong>Invoice Date:</strong> {format(parseISO(invoiceData.date), 'PPP')}</p>
            <p className="text-sm text-muted-foreground"><strong>Due Date:</strong> {format(parseISO(invoiceData.dueDate), 'PPP')}</p>
            </div>
        </div>
        <div>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-center">GST %</TableHead>
                <TableHead className="text-right">Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {invoiceData.lineItems.map((item, index) => (
                <TableRow key={index}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                <TableCell className="text-center">{item.gstRate}%</TableCell>
                <TableCell className="text-right">₹{(item.quantity * item.rate).toFixed(2)}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <div>
            <h3 className="font-semibold mb-2">Terms & Conditions</h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{brandingSettings?.termsAndConditions}</p>
            </div>
            <div className="flex flex-col items-end justify-end gap-2 text-right">
            {brandingSettings?.signatureDataUrl && (
                <Image src={brandingSettings.signatureDataUrl} alt="Signature" width={150} height={75} />
            )}
            <p className="text-sm font-semibold">{brandingSettings?.signatureName || 'Authorized Signatory'}</p>
            </div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
        <div>
                <h3 className="font-semibold mb-2">Payment History</h3>
            {invoiceData.payments.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoiceData.payments.map((p, i) => (
                        <TableRow key={i}>
                            <TableCell>{format(parseISO(p.date), 'PPP')}</TableCell>
                            <TableCell>{p.mode}</TableCell>
                            <TableCell className="text-right">₹{p.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
            )}
        </div>
        <div className="w-full space-y-4 self-end">
            <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
            <span>Total GST</span>
            <span>₹{totalGST.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
            <span>CESS</span>
            <span>₹{totalCess.toFixed(2)}</span>
            </div>
            {invoiceData.tcs?.applicable && (
              <div className="flex justify-between">
                <span>TCS ({invoiceData.tcs.rate}%)</span>
                <span>₹{invoiceData.tcs.amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
            <span>Total Paid</span>
            <span>- ₹{totalPaid.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-xl">
            <span>Balance Due</span>
            <span>₹{balanceDue.toFixed(2)}</span>
            </div>
        </div>
        </div>
    </CardContent>
    <CardFooter className="text-center text-xs text-muted-foreground">
        Generated with InvoicePilot
    </CardFooter>
    </Card>
  );
}
