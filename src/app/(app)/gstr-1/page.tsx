
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Download, FileJson } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useData } from '@/context/data-context';
import { getYear, getMonth, parseISO } from 'date-fns';

const financialYears = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24'];
const months = [
  { name: 'January', value: 0 }, { name: 'February', value: 1 }, { name: 'March', value: 2 },
  { name: 'April', value: 3 }, { name: 'May', value: 4 }, { name: 'June', value: 5 },
  { name: 'July', value: 6 }, { name: 'August', value: 7 }, { name: 'September', value: 8 },
  { name: 'October', value: 9 }, { name: 'November', value: 10 }, { name: 'December', value: 11 }
];

export default function Gstr1ReportPage() {
  const { invoices, brandingSettings } = useData();
  const [b2bInvoices, setB2bInvoices] = useState<Invoice[]>([]);
  const [b2cInvoices, setB2cInvoices] = useState<Invoice[]>([]);
  const [creditNotesRegistered, setCreditNotesRegistered] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(financialYears[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { toast } = useToast();
  
  useEffect(() => {
    if (!invoices) return;
    
    const yearToFilter = parseInt(selectedYear.split(' ')[1].slice(0, 4));
    
    const filtered = invoices.filter((inv) => {
      const invDate = parseISO(inv.date);
      const invYear = getYear(invDate);
      const invMonth = getMonth(invDate);
      
      let financialYearOfInvoice = invYear;
      if (invMonth < 3) { 
        financialYearOfInvoice = invYear - 1;
      }

      return financialYearOfInvoice === yearToFilter && invMonth === selectedMonth;
    });

    setB2bInvoices(filtered.filter((inv) => inv.gstin));
    setB2cInvoices(filtered.filter((inv) => !inv.gstin));
    // Credit note logic would go here if they were implemented
    setCreditNotesRegistered([]);

  }, [invoices, selectedYear, selectedMonth]);

  const handleCsvExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Section,GSTIN/UIN,Receiver Name,Invoice No.,Invoice Date,Invoice Value,Taxable Value,IGST,CGST,SGST,CESS,Total Tax\n";
    
    b2bInvoices.forEach(inv => {
        csvContent += `B2B,${inv.gstin},"${inv.client}",${inv.id},${inv.date},${inv.totalAmount},${inv.taxableValue},${inv.igst},${inv.cgst},${inv.sgst},${inv.cess},${inv.cgst + inv.sgst + inv.igst + inv.cess}\n`;
    });
    b2cInvoices.forEach(inv => {
        csvContent += `B2C,,"${inv.client}",${inv.id},${inv.date},${inv.totalAmount},${inv.taxableValue},${inv.igst},${inv.cgst},${inv.sgst},${inv.cess},${inv.cgst + inv.sgst + inv.igst + inv.cess}\n`;
    });
    creditNotesRegistered.forEach(note => {
        const tax = (note.value * 0.18); // Simplified
        csvContent += `CDNR,${note.gstin},"${note.client}",${note.id},${note.date},${note.value},${note.value - tax},0,${tax/2},${tax/2},0,${tax}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const monthName = months.find(m => m.value === selectedMonth)?.name;
    link.setAttribute("download", `GSTR1_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "GSTR-1 report has been exported as CSV." });
  };

  const handleJsonExport = () => {
    if (!brandingSettings?.gstin) {
        toast({ variant: 'destructive', title: 'GSTIN Missing', description: 'Please set your company GSTIN in the branding settings.' });
        return;
    }

    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const yearStr = selectedYear.split(' ')[1].slice(0, 4);
    const returnPeriod = `${monthStr}${yearStr}`;
    const companyGstin = brandingSettings.gstin;

    const b2bData = b2bInvoices.map(inv => ({
        ctin: inv.gstin,
        inv: [{
            inum: inv.id,
            idt: new Date(inv.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
            val: inv.totalAmount,
            pos: companyGstin.substring(0, 2), // Assuming intra-state
            rchrg: "N",
            itms: [{
                num: 1,
                itm_det: {
                    txval: inv.taxableValue,
                    rt: (inv.cgst + inv.sgst + inv.igst) / inv.taxableValue * 100,
                    camt: inv.cgst,
                    samt: inv.sgst,
                    iamt: inv.igst,
                    csamt: inv.cess
                }
            }]
        }]
    }));

    // For B2CS, we aggregate by rate
    const b2csAggregated = b2cInvoices.reduce((acc, inv) => {
        const rate = (inv.cgst + inv.sgst + inv.igst) / inv.taxableValue * 100;
        if (!acc[rate]) {
            acc[rate] = { txval: 0, camt: 0, samt: 0, iamt: 0, csamt: 0 };
        }
        acc[rate].txval += inv.taxableValue;
        acc[rate].camt += inv.cgst;
        acc[rate].samt += inv.sgst;
        acc[rate].iamt += inv.igst;
        acc[rate].csamt += inv.cess;
        return acc;
    }, {} as Record<number, { txval: number, camt: number, samt: number, iamt: number, csamt: number }>);
    
    const b2csData = Object.entries(b2csAggregated).map(([rate, data]) => ({
        sply_ty: "INTRA",
        pos: companyGstin.substring(0, 2),
        typ: "OE",
        rt: Number(rate),
        txval: data.txval,
        camt: data.camt,
        samt: data.samt,
        iamt: data.iamt,
        csamt: data.csamt,
    }));


    const gstr1Json = {
      gstin: companyGstin,
      fp: returnPeriod,
      gt: b2bInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) + b2cInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      cur_gt: b2bInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) + b2cInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      b2b: b2bData,
      b2c: [], // Not implemented
      b2cl: [], // Not implemented
      b2cs: b2csData,
      cdnr: [], // Not implemented
      cdnur: [], // Not implemented
      exp: [], // Not implemented
      at: [], // Not implemented
      txpd: [], // Not implemented
      hsn: {}, // Not implemented
    };

    const jsonString = JSON.stringify(gstr1Json, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'GSTR1.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "JSON Export Successful", description: "GSTR-1 JSON file has been downloaded." });
  };


  return (
    <div>
        <PageHeader
          title="GSTR-1 Filing Preparation"
          description="Generate GSTR-1 summaries from your sales data for a selected period."
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle>GSTR-1 Summary</CardTitle>
                    <CardDescription>The data below is automatically populated from your sales and credit note entries.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {financialYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Select Month"/></SelectTrigger>
                    <SelectContent>
                        {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleCsvExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                    </Button>
                    <Button variant="outline" onClick={handleJsonExport}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export JSON
                    </Button>
                </div>
                </CardHeader>
            </Card>
            
            <Accordion type="multiple" defaultValue={['b2b', 'b2c', 'cdnr']} className="w-full space-y-4">
                <Card>
                <AccordionItem value="b2b" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4">
                        <div className="text-left">
                        <p className="font-semibold text-lg">4A, 4B, 4C, 6B, 6C - B2B Invoices</p>
                        <p className="text-sm text-muted-foreground">Taxable outward supplies to a registered person</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>GSTIN/UIN</TableHead>
                            <TableHead>Receiver Name</TableHead>
                            <TableHead>Invoice No.</TableHead>
                            <TableHead className="text-right">Taxable Value</TableHead>
                            <TableHead className="text-right">IGST</TableHead>
                            <TableHead className="text-right">CGST</TableHead>
                            <TableHead className="text-right">SGST</TableHead>
                            <TableHead className="text-right">CESS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {b2bInvoices.length > 0 ? b2bInvoices.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell>{inv.gstin}</TableCell>
                                <TableCell>{inv.client}</TableCell>
                                <TableCell>{inv.id}</TableCell>
                                <TableCell className="text-right font-mono">₹{inv.taxableValue.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{inv.igst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{inv.cgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{inv.sgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{inv.cess.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center">No B2B invoices for this period.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                </Card>

                <Card>
                <AccordionItem value="b2c" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4">
                        <div className="text-left">
                        <p className="font-semibold text-lg">7 - B2C (Others)</p>
                        <p className="text-sm text-muted-foreground">Taxable outward supplies to an unregistered person</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Receiver Name</TableHead>
                            <TableHead>Invoice No.</TableHead>
                            <TableHead className="text-right">Invoice Value</TableHead>
                            <TableHead className="text-right">Total Tax</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {b2cInvoices.length > 0 ? b2cInvoices.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell>{inv.client}</TableCell>
                                <TableCell>{inv.id}</TableCell>
                                <TableCell className="text-right font-mono">₹{inv.totalAmount.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{(inv.cgst + inv.sgst + inv.igst + inv.cess).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No B2C invoices for this period.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                </Card>
                
                <Card>
                <AccordionItem value="cdnr" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4">
                        <div className="text-left">
                        <p className="font-semibold text-lg">9B - Credit/Debit Notes (Registered)</p>
                        <p className="text-sm text-muted-foreground">Credit/Debit notes issued to registered persons</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>GSTIN/UIN</TableHead>
                            <TableHead>Receiver Name</TableHead>
                            <TableHead>Note No.</TableHead>
                            <TableHead className="text-right">Note Value</TableHead>
                            <TableHead className="text-right">Taxable Value</TableHead>
                            <TableHead className="text-right">Total Tax</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {creditNotesRegistered.length > 0 ? creditNotesRegistered.map((note) => (
                            <TableRow key={note.id}>
                                <TableCell>{note.gstin}</TableCell>
                                <TableCell>{note.client}</TableCell>
                                <TableCell>{note.id}</TableCell>
                                <TableCell className="text-right font-mono">₹{note.value.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{(note.value - note.tax).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{note.tax.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">No credit/debit notes for this period.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                </Card>
            </Accordion>
        </main>
    </div>
  );
}
