
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Wand2, Loader2, CheckCircle, AlertTriangle, XCircle, HelpCircle, Save } from 'lucide-react';
import { reconcileItc } from '@/app/actions';
import type { ReconciliationOutput } from '@/ai/flows/reconcile-itc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useData } from '@/context/data-context';

const financialYears = ['FY 2024-25', 'FY 2023-24', 'FY 2022-23'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function ItcReconciliation() {
  const { bills } = useData();
  const [gstr2bData, setGstr2bData] = useState<string | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationOutput | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(financialYears[1]);
  const [selectedMonth, setSelectedMonth] = useState(months[9]); // October


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setGstr2bData(text);
      toast({ title: 'GSTR-2B file loaded successfully.' });
    };
    reader.readAsText(file);
  };

  const handleReconcile = async () => {
    if (!gstr2bData) {
      toast({ variant: 'destructive', title: 'Please upload GSTR-2B data first.' });
      return;
    }
    setIsReconciling(true);
    setReconciliationResult(null);
    try {
      // In a real app, you would filter purchase data for the selected period
      const result = await reconcileItc({
        purchaseDataJson: JSON.stringify(bills),
        gstr2bCsvData: gstr2bData,
      });
      setReconciliationResult(result);
      toast({ title: 'Reconciliation Complete!', description: 'Review the results below.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Reconciliation Failed', description: 'An unexpected error occurred.' });
    } finally {
      setIsReconciling(false);
    }
  };
  
  const handleAcceptItc = () => {
    if (!reconciliationResult) return;
    const acceptedItc = {
        cgst: reconciliationResult.summary.matchedCgst,
        sgst: reconciliationResult.summary.matchedSgst,
    }
    localStorage.setItem('acceptedItc', JSON.stringify(acceptedItc));
    toast({ title: 'Reconciled ITC Accepted!', description: 'GSTR-3B summary will now use this updated ITC amount.' });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered ITC Reconciliation</CardTitle>
          <CardDescription>Upload your GSTR-2B CSV and our AI will reconcile it with your purchase records for the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
                 <div className="grid gap-2 w-full">
                    <Label htmlFor="period">Select Period</Label>
                    <div className="flex gap-2">
                         <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {financialYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid gap-2 w-full">
                    <Label htmlFor="gstr2b-file">Upload GSTR-2B CSV File</Label>
                    <Input id="gstr2b-file" type="file" accept=".csv" onChange={handleFileUpload} />
                </div>
                <div className="flex items-end">
                    <Button onClick={handleReconcile} disabled={!gstr2bData || isReconciling} className="w-full whitespace-nowrap">
                    {isReconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Reconcile with AI
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      {reconciliationResult && (
        <Card>
            <CardHeader>
                <CardTitle>Reconciliation Report for {selectedMonth}, {selectedYear}</CardTitle>
                <CardDescription>Here is the breakdown of the reconciliation between your books and GSTR-2B.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <Card className="p-4">
                        <CardHeader className="p-0 pb-2"><CheckCircle className="mx-auto h-8 w-8 text-green-600"/></CardHeader>
                        <CardTitle className="text-2xl font-bold">₹{reconciliationResult.summary.matchedTaxableValue.toLocaleString('en-IN')}</CardTitle>
                        <CardDescription>Perfectly Matched (Taxable)</CardDescription>
                    </Card>
                     <Card className="p-4">
                        <CardHeader className="p-0 pb-2"><AlertTriangle className="mx-auto h-8 w-8 text-amber-600"/></CardHeader>
                        <CardTitle className="text-2xl font-bold">{reconciliationResult.mismatched.length}</CardTitle>
                        <CardDescription>Mismatched Invoices</CardDescription>
                    </Card>
                     <Card className="p-4">
                        <CardHeader className="p-0 pb-2"><XCircle className="mx-auto h-8 w-8 text-red-600"/></CardHeader>
                        <CardTitle className="text-2xl font-bold">{reconciliationResult.missingInBooks.length}</CardTitle>
                        <CardDescription>Missing in Your Books</CardDescription>
                    </Card>
                     <Card className="p-4">
                        <CardHeader className="p-0 pb-2"><HelpCircle className="mx-auto h-8 w-8 text-blue-600"/></CardHeader>
                        <CardTitle className="text-2xl font-bold">{reconciliationResult.missingInGstr2b.length}</CardTitle>
                        <CardDescription>Not in GSTR-2B</CardDescription>
                    </Card>
                </div>
                
                <Separator />

                <Accordion type="multiple" defaultValue={['matched', 'mismatched']} className="w-full space-y-4">
                    <Card>
                        <AccordionItem value="matched" className="border-b-0">
                            <AccordionTrigger className="px-6"><h3 className="font-semibold text-lg">Perfect Matches ({reconciliationResult.perfectMatches.length})</h3></AccordionTrigger>
                            <AccordionContent className="px-6"><ReconciliationTable data={reconciliationResult.perfectMatches} /></AccordionContent>
                        </AccordionItem>
                    </Card>
                    <Card>
                        <AccordionItem value="mismatched" className="border-b-0">
                            <AccordionTrigger className="px-6"><h3 className="font-semibold text-lg">Mismatched Invoices ({reconciliationResult.mismatched.length})</h3></AccordionTrigger>
                             <AccordionContent className="px-6">
                                <p className="text-sm text-muted-foreground mb-4">{reconciliationResult.mismatched.length > 0 ? reconciliationResult.mismatched[0].reason : ''}</p>
                                <ReconciliationTable data={reconciliationResult.mismatched} />
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                    <Card>
                        <AccordionItem value="missing-in-books" className="border-b-0">
                            <AccordionTrigger className="px-6"><h3 className="font-semibold text-lg">Missing in Your Books ({reconciliationResult.missingInBooks.length})</h3></AccordionTrigger>
                            <AccordionContent className="px-6"><ReconciliationTable data={reconciliationResult.missingInBooks} /></AccordionContent>
                        </AccordionItem>
                    </Card>
                     <Card>
                        <AccordionItem value="missing-in-gstr2b" className="border-b-0">
                            <AccordionTrigger className="px-6"><h3 className="font-semibold text-lg">Not in GSTR-2B ({reconciliationResult.missingInGstr2b.length})</h3></AccordionTrigger>
                            <AccordionContent className="px-6"><ReconciliationTable data={reconciliationResult.missingInGstr2b} /></AccordionContent>
                        </AccordionItem>
                    </Card>
                </Accordion>

            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/50 p-6 rounded-b-lg">
                <div>
                    <p className="text-lg font-bold">Total Eligible ITC from Matched Invoices:</p>
                    <p className="text-sm">
                        CGST: <span className="font-mono">₹{reconciliationResult.summary.matchedCgst.toLocaleString('en-IN')}</span> + 
                        SGST: <span className="font-mono">₹{reconciliationResult.summary.matchedSgst.toLocaleString('en-IN')}</span>
                    </p>
                </div>
                <Button onClick={handleAcceptItc}>
                    <Save className="mr-2 h-4 w-4" /> Accept and Update GSTR-3B
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}


function ReconciliationTable({ data }: { data: any[] }) {
    if (data.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No records in this category.</p>
    }
    const headers = Object.keys(data[0] || {});
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {headers.map(h => <TableHead key={h}>{h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index}>
                        {headers.map(h => <TableCell key={h}>{row[h]}</TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
