
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '@/context/data-context';

export default function Gstr9cCertifyPage() {
  const { toast } = useToast();
  const { brandingSettings } = useData();

  const handleUpload = () => {
    toast({ title: 'Certificate Uploaded', description: 'Auditor\'s certificate has been attached to the filing.' });
  };
  
  const handleDownloadDraft = () => {
    const doc = new jsPDF();
    const financialYear = "2023-24"; // This would be dynamic

    // Header
    doc.setFontSize(16);
    doc.text('FORM GSTR-9C', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('PART-A: RECONCILIATION STATEMENT', 105, 22, { align: 'center' });
    
    let yPos = 30;

    const addTable = (title: string, head: string[][], body: (string|number)[][]) => {
        if (yPos > 250) { doc.addPage(); yPos = 15; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, yPos);
        yPos += 7;
        autoTable(doc, {
            head,
            body,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 1.5, halign: 'right' },
            columnStyles: { 0: { halign: 'left', fontStyle: 'normal' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    };
    
    // Table 5
    addTable(
        '5. Reconciliation of gross turnover',
        [['Particulars', 'Amount (INR)']],
        [
            ['A. Turnover as per audited Annual Financial Statement', '0'],
            ['I. Annual turnover as per GSTR-9', '0'],
            ['Q. Un-reconciled turnover', '0'],
        ]
    );

    // Table 7
    addTable(
        '7. Reconciliation of taxable turnover',
        [['Particulars', 'Amount (INR)']],
        [
            ['A. Annual turnover after adjustments (from 5Q)', '0'],
            ['F. Taxable turnover as per liability declared in GSTR-9', '0'],
            ['G. Un-reconciled taxable turnover (F - A)', '0'],
        ]
    );
    
     // Table 9
    addTable(
        '9. Reconciliation of rate wise liability and amount payable thereon',
        [['Tax Rate', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Cess']],
        [
            ['5%', '0', '0', '0', '0', '0'],
            ['12%', '0', '0', '0', '0', '0'],
            ['18%', '0', '0', '0', '0', '0'],
            ['28%', '0', '0', '0', '0', '0'],
        ]
    );
    
     // Table 12
    addTable(
        '12. Reconciliation of Net Input Tax Credit (ITC)',
        [['Particulars', 'Amount (INR)']],
        [
            ['A. ITC availed as per audited Annual Financial Statement', '0'],
            ['C. ITC availed as per GSTR-9', '0'],
            ['D. Un-reconciled ITC', '0'],
        ]
    );

    doc.save(`GSTR-9C_Draft_${financialYear}.pdf`);
    toast({ title: 'Downloading Draft...', description: 'A PDF of the GSTR-9C form is being generated.' });
  }

  return (
    <div>
      <PageHeader
        title="Step 3: Auditor Certification"
        description="Download the draft GSTR-9C, get it signed, and upload the certificate."
        backHref="/gstr-9c"
      >
        <Button variant="outline" onClick={handleDownloadDraft}>
            <Download className="mr-2 h-4 w-4" /> Download Draft GSTR-9C
        </Button>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Part B: Certification Details</CardTitle>
            <CardDescription>
              This section is to be filled by the Chartered Accountant or Cost Accountant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ca-name">Name of Auditor</Label>
                <Input id="ca-name" placeholder="e.g., A. K. Sharma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership-no">Membership No.</Label>
                <Input id="membership-no" placeholder="e.g., 123456" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="firm-name">Name of Audit Firm</Label>
              <Input id="firm-name" placeholder="e.g., Sharma & Associates" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate-upload">Upload Signed Certificate (PDF)</Label>
              <Input id="certificate-upload" type="file" accept=".pdf" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" /> Save & Upload Certificate
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
