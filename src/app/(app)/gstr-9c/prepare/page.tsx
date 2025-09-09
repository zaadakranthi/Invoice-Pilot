
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, DownloadCloud, Wand2, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';

export default function Gstr9cPreparePage() {
  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAutoFetch = () => {
    setIsFetching(true);
    toast({
        title: 'Fetching Data...',
        description: 'Auto-fetching data from GSTR-9 and Financials. This may take a moment.',
    });
    setTimeout(() => {
        setIsFetching(false);
        toast({
            title: 'Data Prefilled!',
            description: 'Your GSTR-9C has been prefilled. Proceeding to the reconciliation wizard.',
        });
        router.push('/gstr-9c/wizard/5');
    }, 2500);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      toast({ title: 'File Uploaded', description: 'Processing your audited financials...' });
      
      // In a real app, you would parse the file and store the data
      
      setTimeout(() => {
          setIsUploading(false);
          toast({
              title: 'Data Extracted!',
              description: 'Your GSTR-9C has been prefilled from the uploaded file.',
          });
          router.push('/gstr-9c/wizard/5');
      }, 1500);
  }

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, headers: string[][]) => {
        const ws = XLSX.utils.aoa_to_sheet(headers);
        // Optional: Add column widths for better formatting
        const colWidths = headers[0].map(() => ({ wch: 30 }));
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("Table 5 & 6 - Turnover", [
        ["Description", "Amount as per Financials", "Adjustments", "Amount as per GST Returns"],
        [""], // Spacer
        ["Reason/Notes"],
    ]);

    addSheet("Table 7 & 8 - Taxable Turnover", [
        ["Description", "Amount as per Financials", "Adjustments", "Taxable Turnover as per GST Returns"],
        [""], // Spacer
        ["Reason/Notes"],
    ]);

    addSheet("Table 9 & 10 - Tax Paid", [
        ["Tax Head (IGST/CGST/SGST/Cess)", "Tax Payable as per GSTR-9", "Tax Paid as per Books", "Difference"],
        ["IGST"], ["CGST"], ["SGST"], ["CESS"],
        [""],
        ["Reason/Notes"],
    ]);

    addSheet("Table 11 & 12 - ITC", [
        ["Description", "ITC as per Books", "ITC as per GSTR-9", "Difference"],
        [""],
        ["Reason/Notes"],
    ]);
    
    addSheet("Table 13 & 14 - Liability", [
        ["Component (Tax, Interest, etc)", "Amount"],
        ["Tax"], ["Interest"], ["Late Fee"], ["Penalty"], ["Others"],
        [""],
        ["Component", "Recommended Additional Liability", "Remarks"],
        ["Additional Liability"],
    ]);

    addSheet("Part B - Certification", [
        ["Auditor Name", "Membership No.", "Firm Registration No.", "Date", "Place", "Digital Signature (Y/N)"],
    ]);

    XLSX.writeFile(wb, "GSTR-9C_Data_Template.xlsx");

    toast({
      title: 'Template Downloaded',
      description: 'The Excel template for GSTR-9C data has been downloaded.'
    });
  }

  return (
    <div>
      <PageHeader
        title="Step 1: Prepare GSTR-9C Data"
        description="Choose how to populate your reconciliation data."
        backHref="/gstr-9c"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Wand2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Auto-fill from Your Data</CardTitle>
                            <CardDescription>
                                Recommended. We'll prefill GSTR-9C with available data.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                        Our system will automatically compile all your GSTR-9 and financial data to pre-populate the reconciliation statement.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleAutoFetch} disabled={isFetching}>
                        {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isFetching ? 'Fetching Data...' : 'Auto-fill & Proceed'}
                        {!isFetching && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
             <Card className="flex flex-col">
                <CardHeader>
                     <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <FileUp className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Upload Financials</CardTitle>
                            <CardDescription>
                                Upload your Audited Financials (PDF, Excel, CSV).
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Upload your signed balance sheet, P&L, or trial balance. Our AI will attempt to extract the required figures.
                    </p>
                     <div className="space-y-2">
                        <Label htmlFor="financials-upload">Audited Financials File</Label>
                        <Input id="financials-upload" type="file" onChange={handleFileUpload} disabled={isUploading} accept=".pdf, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" variant="secondary" onClick={handleDownloadTemplate}>
                       <DownloadCloud className="mr-2 h-4 w-4" />
                       Download Blank Template
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </main>
    </div>
  );
}
