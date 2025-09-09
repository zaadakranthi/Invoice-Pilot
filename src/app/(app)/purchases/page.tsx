
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Eye,
  MoreVertical,
  PlusCircle,
  Search,
  CreditCard,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { useData } from '@/context/data-context';
import type { PurchaseBill } from '@/lib/types';


export default function PurchasesPage() {
  const { toast } = useToast();
  const { bills, addPaymentMade, updateBill } = useData();
  const router = useRouter();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMode, setPaymentMode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenPaymentDialog = (bill: PurchaseBill) => {
    setSelectedBill(bill);
    setPaymentAmount('');
    setPaymentDate(new Date());
    setPaymentMode('');
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedBill || !paymentAmount || !paymentMode) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all payment details.' });
      return;
    }
    const amount = parseFloat(paymentAmount as string);
    const newAmountPaid = selectedBill.amountPaid + amount;
    
    if (newAmountPaid > selectedBill.totalAmount) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Payment cannot exceed the total amount due.' });
      return;
    }

    try {
      addPaymentMade({
          id: `PAY-OUT-${Date.now()}`,
          vendorId: selectedBill.vendor,
          date: format(paymentDate!, 'yyyy-MM-dd'),
          amount: amount,
          mode: paymentMode,
          accountId: 'cash', // Defaulting to cash for now
          billId: selectedBill.id,
      });

      updateBill({ ...selectedBill, amountPaid: newAmountPaid });
      toast({ title: 'Payment Recorded!', description: `₹${amount.toLocaleString('en-IN')} recorded for ${selectedBill.id}.` });
      setIsPaymentDialogOpen(false);
    } catch(error: any) {
       toast({ variant: 'destructive', title: 'Payment Failed', description: error.message });
    }
  };

  const getStatusInfo = (bill: PurchaseBill) => {
    const balance = bill.totalAmount - bill.amountPaid;
    if (balance <= 0) return { variant: 'paid', text: 'Paid' };
    if (bill.amountPaid > 0) return { variant: 'partially-paid', text: 'Partially Paid' };
    return { variant: 'pending', text: 'Pending' };
  };

  const filteredBills = useMemo(() => {
    return bills.filter(bill =>
      bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bills, searchTerm]);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Record and manage all your purchase bills from vendors."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>All Purchase Bills</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or vendor..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/purchases/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Purchase
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  const statusInfo = getStatusInfo(bill);
                  const balanceDue = bill.totalAmount - bill.amountPaid;
                  return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.id}</TableCell>
                    <TableCell>{bill.vendor}</TableCell>
                    <TableCell>₹{bill.totalAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{balanceDue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusInfo.variant === 'paid' ? 'secondary' : 'destructive'}
                        className={cn({
                            'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30': statusInfo.variant === 'paid',
                            'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30': statusInfo.variant === 'partially-paid',
                            'bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30': statusInfo.variant === 'pending',
                        })}
                      >
                        {statusInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell>{bill.date}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/purchases/${bill.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => router.push(`/purchases/edit/${bill.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {balanceDue > 0 && (
                            <DropdownMenuItem onClick={() => handleOpenPaymentDialog(bill)}>
                              <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

       <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedBill?.id}</DialogTitle>
            <DialogDescription>
              Record a new payment made for this purchase bill.
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
                placeholder={`Max: ₹${((selectedBill?.totalAmount || 0) - (selectedBill?.amountPaid || 0)).toLocaleString('en-IN')}`}
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
    </div>
  );
}
