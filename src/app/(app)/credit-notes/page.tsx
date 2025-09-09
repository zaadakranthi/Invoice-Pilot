
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
  MoreVertical,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const creditNotes = [
  {
    id: 'CN-001',
    client: 'Stark Industries',
    originalInvoice: 'INV-004',
    amount: 50000,
    date: '2023-09-25',
  },
  {
    id: 'CN-002',
    client: 'Wayne Enterprises',
    originalInvoice: 'INV-005',
    amount: 25000,
    date: '2023-11-08',
  },
];


export default function CreditNotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter(note =>
      note.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div>
      <PageHeader
        title="Credit Notes"
        description="Manage credit notes issued for sales returns or price corrections."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>All Credit Notes</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or client..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/credit-notes/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Credit Note
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit Note ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Original Invoice</TableHead>
                   <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreditNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.id}</TableCell>
                    <TableCell>{note.client}</TableCell>
                    <TableCell>{note.originalInvoice}</TableCell>
                    <TableCell>{note.date}</TableCell>
                    <TableCell className="text-right font-mono">₹{Math.round(note.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toast({ title: 'Feature not implemented' })}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
