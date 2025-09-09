
'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  PlusCircle,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useState, useMemo } from 'react';
import { useData } from '@/context/data-context';
import { format, parseISO } from 'date-fns';

export default function JournalVouchersPage() {
  const { journalVouchers } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVouchers = useMemo(() => {
    if (!journalVouchers) return [];
    return journalVouchers.filter(voucher =>
      voucher.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.narration.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [journalVouchers, searchTerm]);

  return (
    <div>
      <PageHeader
        title="Journal Vouchers"
        description="Record non-cash or adjustment entries."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>All Journal Vouchers</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or narration..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/journal-vouchers/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> New General Transaction
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{voucher.id}</TableCell>
                    <TableCell>{format(parseISO(voucher.date), 'dd-MM-yyyy')}</TableCell>
                    <TableCell>{voucher.narration}</TableCell>
                    <TableCell className="text-right font-mono">₹{voucher.amount.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
