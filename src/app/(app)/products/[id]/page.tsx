
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product, Invoice, PurchaseBill, CreditNote, DebitNote } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockMovement {
    date: string;
    type: 'Opening Stock' | 'Sale' | 'Purchase' | 'Sales Return' | 'Purchase Return';
    reference: string;
    inQty: number;
    outQty: number;
    balance: number;
}

export default function ProductStockLedgerPage() {
    const { id } = useParams();
    const { products, invoices, bills, creditNotes, debitNotes } = useData();

    const [product, setProduct] = useState<Product | null>(null);

    useEffect(() => {
        const foundProduct = products.find(p => p.id === id);
        setProduct(foundProduct || null);
    }, [id, products]);

    const stockMovements = useMemo(() => {
        if (!product) return [];

        let movements: Omit<StockMovement, 'balance'>[] = [];

        // Filter transactions for this product
        invoices.forEach(inv => inv.lineItems.forEach(li => {
            if (li.productId === product.id) {
                movements.push({ date: inv.date, type: 'Sale', reference: inv.id, inQty: 0, outQty: li.quantity });
            }
        }));
        bills.forEach(bill => bill.lineItems.forEach(li => {
            if (li.productId === product.id) {
                movements.push({ date: bill.date, type: 'Purchase', reference: bill.id, inQty: li.quantity, outQty: 0 });
            }
        }));
        creditNotes.forEach(cn => cn.lineItems.forEach(li => {
            if (li.productId === product.id) {
                movements.push({ date: cn.date, type: 'Sales Return', reference: cn.id, inQty: li.quantity, outQty: 0 });
            }
        }));
         debitNotes.forEach(dn => dn.lineItems.forEach(li => {
            if (li.productId === product.id) {
                movements.push({ date: dn.date, type: 'Purchase Return', reference: dn.id, inQty: 0, outQty: li.quantity });
            }
        }));

        movements.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

        let runningBalance = product.openingStockQty || 0;
        const ledger: StockMovement[] = [{
            date: '',
            type: 'Opening Stock',
            reference: 'Opening Balance',
            inQty: 0,
            outQty: 0,
            balance: runningBalance,
        }];

        movements.forEach(move => {
            runningBalance = runningBalance + move.inQty - move.outQty;
            ledger.push({ ...move, balance: runningBalance });
        });
        
        return ledger;

    }, [product, invoices, bills, creditNotes, debitNotes]);

    if (!product) {
        return (
            <div>
                <PageHeader title="Product Not Found" backHref="/products" />
                <main className="p-4 sm:p-6 lg:p-8">
                    <Card>
                        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
                        <CardContent><p>The requested product could not be found.</p></CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    const getTypeBadge = (type: StockMovement['type']) => {
        switch(type) {
            case 'Purchase':
            case 'Sales Return':
                return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100/80"><ArrowDownLeft className="h-3 w-3 mr-1"/> Stock In</Badge>;
            case 'Sale':
            case 'Purchase Return':
                 return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100/80"><ArrowUpRight className="h-3 w-3 mr-1"/> Stock Out</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>
        }
    }

    return (
        <div>
            <PageHeader title={`Stock Ledger: ${product.name}`} backHref="/products" />
            <main className="p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Movement</CardTitle>
                        <CardDescription>A chronological record of all stock transactions for this item.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Transaction Type</TableHead>
                                    <TableHead>Reference ID</TableHead>
                                    <TableHead className="text-right">Inward (Qty)</TableHead>
                                    <TableHead className="text-right">Outward (Qty)</TableHead>
                                    <TableHead className="text-right">Closing Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockMovements.map((move, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{move.date ? format(parseISO(move.date), 'dd-MM-yyyy') : '-'}</TableCell>
                                        <TableCell>{getTypeBadge(move.type)}</TableCell>
                                        <TableCell>{move.reference}</TableCell>
                                        <TableCell className="text-right font-mono text-green-600">{move.inQty > 0 ? move.inQty.toLocaleString() : '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-red-600">{move.outQty > 0 ? move.outQty.toLocaleString() : '-'}</TableCell>
                                        <TableCell className="text-right font-mono font-bold">{move.balance.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
