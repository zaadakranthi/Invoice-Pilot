
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { useData } from '@/context/data-context';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

export function LatestInvoices() {
  const { invoices, isReady } = useData();
  
  const latestInvoices = invoices.slice(-5).reverse();

  const getStatusInfo = (invoice: any) => {
    const balance = invoice.totalAmount - invoice.amountPaid;
    if (balance <= 0) return { variant: 'paid', text: 'Paid' };
    if (invoice.amountPaid > 0) return { variant: 'partially-paid', text: 'Partially Paid' };
    if (invoice.status === 'Overdue') return { variant: 'destructive', text: 'Overdue' };
    return { variant: 'pending', text: 'Pending' };
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Latest Invoices</CardTitle>
        <CardDescription>A quick look at your most recent billing.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isReady ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              latestInvoices.map((invoice, index) => {
                const statusInfo = getStatusInfo(invoice);
                return (
                <TableRow key={`${invoice.id}-${index}`}>
                  <TableCell>
                      <div className="font-medium">{invoice.client}</div>
                      <div className="text-xs text-muted-foreground">{invoice.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusInfo.variant === 'destructive' ? 'destructive' : 'secondary'}
                      className={cn('text-xs', {
                        'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30': statusInfo.variant === 'paid',
                        'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30': statusInfo.variant === 'partially-paid',
                        'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30': statusInfo.variant === 'destructive',
                        'bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30': statusInfo.variant === 'pending',
                      })}
                    >
                      {statusInfo.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{Math.round(invoice.totalAmount).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant="outline">
            <Link href="/invoices">View All Invoices <ArrowRight className="ml-2 h-4 w-4"/></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
