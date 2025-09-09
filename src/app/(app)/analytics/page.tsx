
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { useData } from '@/context/data-context';
import { useMemo } from 'react';
import { subMonths, format, startOfMonth } from 'date-fns';

const chartConfig: ChartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--primary))',
  },
};

export default function AnalyticsPage() {
    const { invoices, customers } = useData();

    const salesData = useMemo(() => {
        const data: { month: string; sales: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            data.push({
                month: format(date, 'MMM'),
                sales: 0,
            });
        }
        invoices.forEach(invoice => {
            const month = format(new Date(invoice.date), 'MMM');
            const index = data.findIndex(d => d.month === month);
            if (index !== -1) {
                data[index].sales += invoice.totalAmount;
            }
        });
        return data;
    }, [invoices]);

    const topClients = useMemo(() => {
        const clientSales: Record<string, number> = {};
        invoices.forEach(invoice => {
            clientSales[invoice.client] = (clientSales[invoice.client] || 0) + invoice.totalAmount;
        });

        return Object.entries(clientSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({
                name,
                amount,
                status: 'Paid', // Simplified for this view
            }));
    }, [invoices]);

    const recentInvoices = useMemo(() => {
        return invoices.slice(-5).reverse();
    }, [invoices]);


    const getStatusInfo = (invoice: any) => {
        const balance = invoice.totalAmount - invoice.amountPaid;
        if (balance <= 0) return { variant: 'paid', text: 'Paid' };
        if (invoice.amountPaid > 0) return { variant: 'partially-paid', text: 'Partially Paid' };
        if (invoice.status === 'Overdue') return { variant: 'destructive', text: 'Overdue' };
        return { variant: 'pending', text: 'Pending' };
    };

  return (
    <div>
      <PageHeader
        title="Analytics & Reports"
        description="Visualize your financial data with monthly sales charts and top client lists."
        backHref="/dashboard"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Monthly Sales Overview</CardTitle>
                     <CardDescription>Sales performance over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={salesData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                             <YAxis tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}K`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                             <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Top Clients</CardTitle>
                    <CardDescription>Your most valuable clients this period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Billed Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topClients.map(client => {
                                return (
                                <TableRow key={client.name}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell className="text-right font-mono">₹{Math.round(client.amount).toLocaleString('en-IN')}</TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>A quick look at your most recent billing activities.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Client</TableHead>
                             <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {recentInvoices.map(invoice => {
                             const statusInfo = getStatusInfo(invoice);
                             return (
                             <TableRow key={invoice.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/invoices/${invoice.id}`} className="hover:underline">{invoice.id}</Link>
                                </TableCell>
                                <TableCell>{invoice.client}</TableCell>
                                <TableCell>
                                     <Badge
                                        variant={statusInfo.variant === 'destructive' ? 'destructive' : 'secondary'}
                                        className={cn('text-xs', {
                                            'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30': statusInfo.variant === 'paid',
                                            'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30': statusInfo.variant === 'partially-paid',
                                            'bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30': statusInfo.variant === 'pending',
                                        })}
                                    >
                                        {statusInfo.text}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">₹{Math.round(invoice.totalAmount).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                         )})}
                    </TableBody>
                 </Table>
            </CardContent>
         </Card>
      </main>
    </div>
  );
}
