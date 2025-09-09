
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Users, FileText, FilePieChart, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Skeleton } from './ui/skeleton';

export function DashboardSummary() {
  const { invoices, bills, isReady, customers } = useData();
  
  const summaryStats = useMemo(() => {
    if (!isReady) return { receivables: 0, payables: 0, taxLiability: 0, customers: 0 };
    
    const totalReceivables = (invoices || []).reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);
    const totalPayables = (bills || []).reduce((acc, bill) => acc + (bill.totalAmount - bill.amountPaid), 0);
    
    const taxPayable = (invoices || []).reduce((acc, inv) => acc + inv.cgst + inv.sgst + inv.igst + inv.cess, 0);
    const taxReceivable = (bills || []).reduce((acc, bill) => acc + bill.gstAmount, 0);
    const netTaxLiability = taxPayable - taxReceivable;

    const totalCustomers = (customers || []).length;

    return {
      receivables: totalReceivables,
      payables: totalPayables,
      taxLiability: netTaxLiability,
      customers: totalCustomers,
    };
  }, [isReady, invoices, bills, customers]);

  if (!isReady) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{Math.round(summaryStats.receivables).toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">Outstanding from customers</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{Math.round(summaryStats.payables).toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">Due to vendors</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Tax Liability</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{Math.round(summaryStats.taxLiability).toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">GST payable for the period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryStats.customers}</div>
          <p className="text-xs text-muted-foreground">Total customers managed</p>
        </CardContent>
      </Card>
    </div>
  );
}
