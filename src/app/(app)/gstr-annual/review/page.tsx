
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function GstrAnnualReviewPage() {
  const router = useRouter();
  const { invoices, bills, brandingSettings } = useData();
  const { toast } = useToast();

  const handleProceed = () => {
    router.push('/gstr-annual/file');
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const financialYear = "2023-24"; // This would be dynamic in a real app

    // --- MOCK DATA FOR DEMONSTRATION ---
    const outwardSupplies = invoices.reduce((acc, inv) => {
        acc.taxableValue += inv.taxableValue;
        acc.cgst += inv.cgst;
        acc.sgst += inv.sgst;
        acc.igst += inv.igst;
        acc.cess += inv.cess;
        return acc;
    }, { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 });

    const itcSummary = bills.reduce((acc, bill) => {
        acc.itcClaimed += bill.gstAmount;
        return acc;
    }, { itcClaimed: 0 });

    // --- PDF GENERATION ---
    doc.setFontSize(14);
    doc.text(`GSTR-9 Annual Return for ${brandingSettings?.businessName || ''}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Financial Year: ${financialYear}`, 105, 22, { align: 'center' });
    doc.text(`GSTIN: ${brandingSettings?.gstin || ''}`, 105, 29, { align: 'center' });

    let yPos = 40;
    const addSection = (title: string, head: string[][], body: any[][], options = {}) => {
        if (yPos > 250) { doc.addPage(); yPos = 15; }
        doc.setFontSize(11);
        doc.text(title, 14, yPos);
        yPos += 7;
        autoTable(doc, {
            head,
            body,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 1.5 },
            ...options,
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    };
    
    // Part II
    addSection(
        'Part II: Details of Outward and inward supplies made during the financial year',
        [['Description', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'CESS']],
        [
            ['(4) Supplies made to unregistered persons (B2C)', '0', '0', '0', '0', '0'],
            ['(5) Supplies made to registered persons (B2B)', outwardSupplies.taxableValue.toLocaleString('en-IN'), outwardSupplies.cgst.toLocaleString('en-IN'), outwardSupplies.sgst.toLocaleString('en-IN'), outwardSupplies.igst.toLocaleString('en-IN'), outwardSupplies.cess.toLocaleString('en-IN')],
            ['(6) Zero rated supply (Export) on payment of tax', '0', '0', '0', '0', '0'],
            ['(7) Supplies to SEZs on payment of tax', '0', '0', '0', '0', '0'],
        ]
    );

    // Part III
    addSection(
        'Part III: Details of ITC as declared in returns filed during the financial year',
        [['Description', 'Type', 'IGST', 'CGST', 'SGST', 'CESS']],
        [
             ['(6A) Total ITC availed through GSTR-3B', 'Total', itcSummary.itcClaimed.toLocaleString('en_IN'), '0', '0', '0'],
             ['(6B) Inward supplies (other than imports and inward supplies liable to reverse charge)', 'Inputs', '0', '0', '0', '0'],
             ['(6C) Inward supplies received from unregistered persons liable to reverse charge', 'Inputs', '0', '0', '0', '0'],
             ['(7) Details of ITC Reversed and Ineligible ITC', 'Reversal', '0', '0', '0', '0'],
             ['(8) Other ITC related information', 'ITC as per 2A', '0', '0', '0', '0'],
        ]
    );

    // Part IV
    addSection(
        'Part IV: Details of tax paid as declared in returns filed during the financial year',
        [['Description', 'Payable Amount', 'Paid through Cash', 'Paid through ITC (IGST)', 'Paid through ITC (CGST)', 'Paid through ITC (SGST)']],
        [
            ['IGST', outwardSupplies.igst.toLocaleString('en-IN'), '0', '0', '0', '0'],
            ['CGST', outwardSupplies.cgst.toLocaleString('en-IN'), '0', '0', '0', '0'],
            ['SGST', outwardSupplies.sgst.toLocaleString('en-IN'), '0', '0', '0', '0'],
            ['CESS', outwardSupplies.cess.toLocaleString('en-IN'), '0', '0', '0', '0'],
        ]
    );

    doc.save(`GSTR9_Draft_${financialYear}.pdf`);
    toast({ title: 'PDF Downloaded', description: 'GSTR-9 draft summary has been downloaded.' });
  };

  return (
    <div>
      <PageHeader
        title="Step 3: Review & Compare"
        description="Review the complete GSTR-9 summary and compare with your monthly returns."
        backHref="/gstr-annual/wizard/1"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Review Your GSTR-9</CardTitle>
                    <CardDescription>This section contains a complete view of the generated GSTR-9 form. Download the draft for review.</CardDescription>
                </div>
                <Button variant="outline" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Draft PDF
                </Button>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Full GSTR-9 Review Component Placeholder</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleProceed}>Proceed to Filing</Button>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
}
