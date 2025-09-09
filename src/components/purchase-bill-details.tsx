
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
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
import type { BrandingSettings, PurchaseBill, Vendor } from '@/lib/types';
import { useData } from '@/context/data-context';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface FullPurchaseBill extends PurchaseBill {
  vendorDetails: Vendor | null;
}

export function PurchaseBillDetails({ billId }: { billId: string }) {
  const { getBillById, vendors, brandingSettings } = useData();
  const [billData, setBillData] = useState<FullPurchaseBill | null>(null);
  
  useEffect(() => {
    if (billId) {
      const basicBill = getBillById(billId);

      if (basicBill) {
        const vendorDetails = vendors.find(v => v.name === basicBill.vendor) || null;
        setBillData({
            ...basicBill,
            vendorDetails,
        });
      }
    }
  }, [billId, getBillById, vendors]);

  if (!billData) {
    return (
        <div className="p-4 sm:p-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Purchase Bill Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The bill you are looking for does not exist or could not be loaded.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  const subTotal = billData.taxableValue;
  const totalGST = billData.gstAmount;
  const grandTotal = billData.totalAmount;
  const totalPaid = billData.amountPaid;
  const balanceDue = grandTotal - totalPaid;

  const getStatusInfo = () => {
    if (balanceDue <= 0) return { variant: 'paid', text: 'Paid' };
    if (totalPaid > 0) return { variant: 'partially-paid', text: 'Partially Paid' };
    return { variant: 'pending', text: 'Pending' };
  };
  const statusInfo = getStatusInfo();

  return (
    <Card className="max-w-4xl mx-auto">
    <CardHeader className="flex flex-row justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Purchase Bill</h1>
            <p className="text-muted-foreground">#{billData.id}</p>
        </div>
        <div>
        <Badge
            className={
            statusInfo.variant === 'paid'
                ? 'bg-green-500/20 text-green-700 border-green-500/30'
                : statusInfo.variant === 'partially-paid'
                ? 'bg-blue-500/20 text-blue-700 border-blue-500/30'
                : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
            }
        >
            {statusInfo.text}
        </Badge>
        </div>
    </CardHeader>
    <CardContent className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-2">
                <h3 className="font-semibold">From (Vendor)</h3>
                {billData.vendorDetails ? (
                <>
                    <p className="font-bold text-lg">{billData.vendorDetails.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {billData.vendorDetails.billingAddress.split('\n').map((line, i) => (
                        <span key={i} className="block">{line}</span>
                        ))}
                    </p>
                    <p className="text-sm">
                        <strong>GSTIN:</strong> {billData.vendorDetails.gstin}
                    </p>
                </>
                ) : (
                <p className="text-sm text-muted-foreground">{billData.vendor}</p>
                )}
            </div>
            <div className="space-y-2 sm:text-right">
                <h3 className="font-semibold">To</h3>
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
            <p className="text-sm text-muted-foreground"><strong>Bill Date:</strong> {format(parseISO(billData.date), 'PPP')}</p>
            </div>
        </div>
        <div>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {billData.lineItems.map((item, index) => (
                <TableRow key={index}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">₹{item.rate.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">₹{(item.quantity * item.rate).toLocaleString('en-IN')}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>

        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-4">
                <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                <span>Total GST</span>
                <span>₹{totalGST.toLocaleString('en-IN')}</span>
                </div>
                 <div className="flex justify-between">
                <span>Total Paid</span>
                <span>- ₹{totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-xl">
                <span>Balance Due</span>
                <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    </CardContent>
    <CardFooter className="text-center text-xs text-muted-foreground">
        This is a record of a purchase.
    </CardFooter>
    </Card>
  );
}
