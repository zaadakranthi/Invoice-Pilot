
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

export default function GstrAnnualUploadPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAutoFetch = () => {
    setIsFetching(true);
    toast({
        title: 'Fetching Data...',
        description: 'Auto-fetching data from your monthly returns. This may take a moment.',
    });
    setTimeout(() => {
        setIsFetching(false);
        toast({
            title: 'Data Prefilled!',
            description: 'Your GSTR-9 has been prefilled. Proceeding to the wizard.',
        });
        router.push('/gstr-annual/wizard/1');
    }, 2500);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      toast({ title: 'File Uploaded', description: 'Processing your GSTR-9 data...' });
      
      // Simulate processing
      setTimeout(() => {
          setIsUploading(false);
          toast({
              title: 'Data Extracted!',
              description: 'Your GSTR-9 has been prefilled from the uploaded file.',
          });
          router.push('/gstr-annual/wizard/1');
      }, 1500);
  }

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, headers: string[]) => {
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        // Optional: Add column widths for better formatting
        const colWidths = headers.map(h => ({ wch: h.length > 20 ? 30 : 20 }));
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("Table 4 - Outward Taxable", ["GSTIN", "Invoice No", "Invoice Date", "Taxable Value", "IGST", "CGST", "SGST", "Cess"]);
    addSheet("Table 5 - Outward Non-Taxable", ["GSTIN", "Description", "Taxable Value", "Exempt Value", "Nil Rated Value", "Non-GST Value"]);
    addSheet("Table 6 - ITC Availed", ["GSTIN", "Invoice No", "Invoice Date", "Description", "IGST", "CGST", "SGST", "Cess", "ITC Type"]);
    addSheet("Table 8 - ITC vs GSTR-2A", ["Supplier GSTIN", "Invoice No", "Invoice Date", "Taxable Value", "IGST", "CGST", "SGST", "Cess"]);
    addSheet("Table 17 - HSN Outward", ["HSN Code", "Description", "UQC", "Quantity", "Taxable Value", "IGST", "CGST", "SGST", "Cess"]);
    addSheet("Table 18 - HSN Inward", ["HSN Code", "Description", "UQC", "Quantity", "Taxable Value", "IGST", "CGST", "SGST", "Cess"]);

    XLSX.writeFile(wb, "GSTR-9_Data_Template.xlsx");

    toast({
      title: 'Template Downloaded',
      description: 'The Excel template for GSTR-9 data has been downloaded.'
    });
  }

  return (
    <div>
      <PageHeader
        title="Step 1: Start Your Annual Filing"
        description="Choose how to populate your GSTR-9 data."
        backHref="/gstr-annual"
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
                                Recommended. We'll prefill GSTR-9 from your monthly data.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                        Our system will automatically compile all your sales (GSTR-1) and purchase (GSTR-3B) data recorded throughout the financial year to pre-populate the annual return form.
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
                            <CardTitle>Upload GSTR-9 Data</CardTitle>
                            <CardDescription>
                                For new users or if your data is outside this system.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground">
                       Upload the GSTR-9 JSON file from the GST portal, or fill out our Excel template and upload it here.
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="gstr9-upload">Upload File (JSON, Excel, CSV)</Label>
                        <Input id="gstr9-upload" type="file" onChange={handleFileUpload} disabled={isUploading} accept=".json, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2 items-stretch">
                     <Button className="w-full" variant="secondary" onClick={handleDownloadTemplate}>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Download Blank Excel Template
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </main>
    </div>
  );
}
