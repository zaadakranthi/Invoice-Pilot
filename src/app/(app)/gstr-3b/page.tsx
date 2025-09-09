
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileWarning, RefreshCcw, FileJson } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { useData } from '@/context/data-context';
import { getYear, getMonth, parseISO } from 'date-fns';

interface GstSummary {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
}

const financialYears = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24'];
const months = [
  { name: 'January', value: 0 }, { name: 'February', value: 1 }, { name: 'March', value: 2 },
  { name: 'April', value: 3 }, { name: 'May', value: 4 }, { name: 'June', value: 5 },
  { name: 'July', value: 6 }, { name: 'August', value: 7 }, { name: 'September', value: 8 },
  { name: 'October', value: 9 }, { name: 'November', value: 10 }, { name: 'December', value: 11 }
];

export default function Gstr3bPage() {
  const { invoices, bills, brandingSettings } = useData();
  const [outwardSupplies, setOutwardSupplies] = useState<GstSummary>({ taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });
  const [eligibleITC, setEligibleITC] = useState<Omit<GstSummary, 'taxableValue'>>({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
  const [itcSource, setItcSource] = useState('books');
  const [selectedYear, setSelectedYear] = useState(financialYears[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { toast } = useToast();

  const fetchDataForPeriod = useMemo(() => {
    const yearToFilter = parseInt(selectedYear.split(' ')[1].slice(0, 4));

    const filterByPeriod = (item: any) => {
        const itemDate = parseISO(item.date);
        const itemYear = getYear(itemDate);
        const itemMonth = getMonth(itemDate);
        
        let financialYearOfItem = itemYear;
        if (itemMonth < 3) { // Before April
          financialYearOfItem = itemYear - 1;
        }
        return financialYearOfItem === yearToFilter && itemMonth === selectedMonth;
    };

    // Calculate Outward Supplies from Invoices
    const filteredInvoices = invoices.filter(filterByPeriod);
    const outwardSummary = filteredInvoices.reduce((acc: GstSummary, inv: any) => {
        acc.taxableValue += inv.taxableValue;
        acc.igst += inv.igst;
        acc.cgst += inv.cgst;
        acc.sgst += inv.sgst;
        acc.cess += inv.cess;
        return acc;
    }, { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });
    setOutwardSupplies(outwardSummary);

    // Calculate Eligible ITC from Bills
    const filteredBills = bills.filter(filterByPeriod);
    const itcSummary = filteredBills.reduce((acc: Omit<GstSummary, 'taxableValue'>, bill: any) => {
        // This is a simplified calculation. A real system would need to differentiate IGST/CGST/SGST in purchase bills.
        const totalGst = bill.gstAmount || 0;
        const isInterState = brandingSettings?.gstin?.substring(0, 2) !== '27'; // Assuming all vendors are from outside Maharashtra if company is not
        if (isInterState) {
            acc.igst += totalGst;
        } else {
            acc.cgst += totalGst / 2;
            acc.sgst += totalGst / 2;
        }
        return acc;
    }, { igst: 0, cgst: 0, sgst: 0, cess: 0 });
    setEligibleITC(itcSummary);
    setItcSource('books'); // Defaulting to books for now
    
  }, [invoices, bills, selectedYear, selectedMonth, brandingSettings]);

  const taxPayable = {
      igst: Math.max(0, outwardSupplies.igst - eligibleITC.igst),
      cgst: Math.max(0, outwardSupplies.cgst - eligibleITC.cgst),
      sgst: Math.max(0, outwardSupplies.sgst - eligibleITC.sgst),
      cess: Math.max(0, outwardSupplies.cess - eligibleITC.cess),
  };
  const totalTaxPayable = taxPayable.igst + taxPayable.cgst + taxPayable.sgst + taxPayable.cess;

  const handleCsvExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Section,Description,Taxable Value,IGST,CGST,SGST,CESS\n";
    csvContent += `3.1,(a) Outward taxable supplies,${outwardSupplies.taxableValue},${outwardSupplies.igst},${outwardSupplies.cgst},${outwardSupplies.sgst},${outwardSupplies.cess}\n`;
    csvContent += "4,(C) Net ITC Available,," + `${eligibleITC.igst},${eligibleITC.cgst},${eligibleITC.sgst},${eligibleITC.cess}\n`;
    csvContent += "6.1,Tax to be Paid in Cash,," + `${taxPayable.igst},${taxPayable.cgst},${taxPayable.sgst},${taxPayable.cess}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const monthName = months.find(m => m.value === selectedMonth)?.name;
    link.setAttribute("download", `GSTR3B_Summary_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "GSTR-3B summary has been exported as CSV." });
  };
  
  const handleJsonExport = () => {
     if (!brandingSettings?.gstin) {
        toast({ variant: 'destructive', title: 'GSTIN Missing', description: 'Please set your company GSTIN in the branding settings.' });
        return;
    }

    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const yearStr = selectedYear.split(' ')[1].slice(0, 4);

    const gstr3bJson = {
      gstin: brandingSettings.gstin,
      ret_period: `${monthStr}${yearStr}`,
      sup_details: {
        osup_det: {
          txval: outwardSupplies.taxableValue,
          iamt: outwardSupplies.igst,
          camt: outwardSupplies.cgst,
          samt: outwardSupplies.sgst,
          csamt: outwardSupplies.cess
        },
        osup_zero: null,
        osup_nil_exmp: null,
        isup_rev: null,
        osup_nongst: null
      },
      itc_elg: {
        itc_avl: [
          { ty: "OTH", iamt: eligibleITC.igst, camt: eligibleITC.cgst, samt: eligibleITC.sgst, csamt: eligibleITC.cess }
        ],
        itc_rev: [],
        itc_net: { iamt: eligibleITC.igst, camt: eligibleITC.cgst, samt: eligibleITC.sgst, csamt: eligibleITC.cess },
        itc_inelg: []
      },
      intr_ltfee: {}
    };

    const jsonString = JSON.stringify(gstr3bJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'GSTR3B.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "JSON Export Successful", description: "GSTR-3B JSON file has been downloaded." });
  }

  return (
    <div>
      <PageHeader
        title="GSTR-3B Summary"
        description="A consolidated summary of your sales and purchases for tax liability calculation."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle>Summary for Filing</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {financialYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Select month"/></SelectTrigger>
                    <SelectContent>
                        {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => { /* fetchDataForPeriod is now handled by useMemo */ }}><RefreshCcw className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={handleCsvExport}><Download className="mr-2 h-4 w-4"/> Export CSV</Button>
                    <Button variant="outline" onClick={handleJsonExport}><FileJson className="mr-2 h-4 w-4"/> Export JSON</Button>
                </div>
            </CardHeader>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>3.1 Details of Outward and inward supplies liable to reverse charge</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nature of Supplies</TableHead>
                                <TableHead className="text-right">Taxable Value</TableHead>
                                <TableHead className="text-right">IGST</TableHead>
                                <TableHead className="text-right">CGST</TableHead>
                                <TableHead className="text-right">SGST</TableHead>
                                <TableHead className="text-right">CESS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.taxableValue.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.igst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.cgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.sgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.cess.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">(d) Inward supplies (liable to reverse charge)</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>4. Eligible ITC</CardTitle>
                    {itcSource === 'reconciled' && <CardDescription className="text-green-600">Displaying ITC from your latest reconciliation.</CardDescription>}
                    {itcSource === 'books' && <CardDescription className="text-amber-600">Displaying ITC as per your purchase books. Reconcile for accuracy.</CardDescription>}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">IGST</TableHead>
                                <TableHead className="text-right">CGST</TableHead>
                                <TableHead className="text-right">SGST</TableHead>
                                <TableHead className="text-right">CESS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">(A) ITC Available (whether in full or part)</TableCell>
                                <TableCell></TableCell><TableCell></TableCell><TableCell></TableCell><TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="pl-8">(5) All other ITC</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.igst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.cgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.sgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.cess.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>(B) ITC Reversed</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                                <TableCell className="text-right font-mono">₹0</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                                <TableCell>(C) Net ITC Available (A) - (B)</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.igst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.cgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.sgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{eligibleITC.cess.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>6.1 Payment of tax</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">IGST</TableHead>
                                <TableHead className="text-right">CGST</TableHead>
                                <TableHead className="text-right">SGST</TableHead>
                                <TableHead className="text-right">CESS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Total Tax Liability</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.igst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.cgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.sgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{outwardSupplies.cess.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Paid through ITC</TableCell>
                                <TableCell className="text-right font-mono">₹{Math.min(outwardSupplies.igst, eligibleITC.igst).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{Math.min(outwardSupplies.cgst, eligibleITC.cgst).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{Math.min(outwardSupplies.sgst, eligibleITC.sgst).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{Math.min(outwardSupplies.cess, eligibleITC.cess).toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>Tax to be Paid in Cash</TableCell>
                                <TableCell className="text-right font-mono">₹{taxPayable.igst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{taxPayable.cgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{taxPayable.sgst.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-right font-mono">₹{taxPayable.cess.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    
                    {totalTaxPayable > 0 ? (
                        <Alert>
                            <FileWarning className="h-4 w-4" />
                            <AlertTitle>Tax Due!</AlertTitle>
                            <AlertDescription>
                            You have a total tax liability of <strong>₹{totalTaxPayable.toLocaleString('en-IN')}</strong> to be paid in cash.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert variant="default" className="border-green-500/50 text-green-700">
                            <AlertTitle className="text-green-800">No Cash Liability</AlertTitle>
                            <AlertDescription>
                            Your available Input Tax Credit covers your tax liability for this period. No cash payment is due.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
