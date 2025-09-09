'use client'

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

const wizardSteps = [
  { id: '1', title: 'Part I: Basic Information', description: 'Tables 1, 2 & 3' },
  { id: '2', title: 'Part II: Details of Outward Supplies', description: 'Tables 4 & 5' },
  { id: '3', title: 'Part III: Details of ITC', description: 'Tables 6, 7 & 8' },
  { id: '4', title: 'Part IV: Details of Tax Paid', description: 'Table 9' },
  { id: '5', title: 'Part V: Previous FY Transactions', description: 'Tables 10, 11, 12 & 13' },
  { id: '6', title: 'Part VI: Other Information', description: 'Tables 15, 16, 17, 18 & 19' },
];

export default function Gstr9WizardStepPage() {
  const params = useParams();
  const step = params.step as string;
  const currentStepInfo = wizardSteps.find(s => s.id === step);

  const renderStepContent = (step: string) => {
    switch (step) {
      case '1':
        return (
          <Table>
            <TableBody>
              <TableRow><TableCell className="font-medium">1. Financial Year</TableCell><TableCell>2023-24</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">2. GSTIN</TableCell><TableCell>27ABCDE1234F1Z5</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">3A. Legal Name</TableCell><TableCell>Demo Enterprises Pvt Ltd</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">3B. Trade Name</TableCell><TableCell>Demo Enterprises</TableCell></TableRow>
            </TableBody>
          </Table>
        );
      case '2':
        return (
          <>
            <h4 className="font-bold">Table 4: Details of Outward Supplies on which tax is payable</h4>
            <Table>
              <TableHeader><TableRow><TableHead>Nature of Supplies</TableHead><TableHead>Taxable Value</TableHead><TableHead>CGST</TableHead><TableHead>SGST</TableHead><TableHead>IGST</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell>(A) Supplies made to un-registered persons (B2C)</TableCell><TableCell><Input defaultValue="12,50,000" /></TableCell><TableCell><Input defaultValue="75,000" /></TableCell><TableCell><Input defaultValue="75,000" /></TableCell><TableCell><Input defaultValue="0" /></TableCell></TableRow>
                <TableRow><TableCell>(B) Supplies made to registered persons (B2B)</TableCell><TableCell><Input defaultValue="25,00,000" /></TableCell><TableCell><Input defaultValue="1,50,000" /></TableCell><TableCell><Input defaultValue="1,50,000" /></TableCell><TableCell><Input defaultValue="0" /></TableCell></TableRow>
              </TableBody>
            </Table>
            <h4 className="font-bold pt-6">Table 5: Details of Outward Supplies on which tax is not payable</h4>
             <Table>
                <TableHeader><TableRow><TableHead>Nature of Supplies</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                <TableBody>
                    <TableRow><TableCell>(A) Zero rated supply (Export) without payment of tax</TableCell><TableCell><Input defaultValue="0"/></TableCell></TableRow>
                </TableBody>
             </Table>
          </>
        );
      case '3':
        return (
          <>
            <h4 className="font-bold">Table 6: Details of ITC availed</h4>
            <Table>
              <TableHeader><TableRow><TableHead>Details</TableHead><TableHead>CGST</TableHead><TableHead>SGST</TableHead><TableHead>IGST</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell>(A) Total ITC availed through GSTR-3B</TableCell><TableCell><Input defaultValue="1,20,000" /></TableCell><TableCell><Input defaultValue="1,20,000" /></TableCell><TableCell><Input defaultValue="0" /></TableCell></TableRow>
              </TableBody>
            </Table>
          </>
        );
      case '4':
        return <p>Details of tax paid as declared in returns filed during the financial year will appear here.</p>;
      case '5':
        return <p>Particulars of the transactions for the previous FY declared in returns of April to September of current FY will appear here.</p>;
      case '6':
        return <p>HSN-wise summary and other remaining details will appear here.</p>;
      default:
        return <p>Step not found.</p>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentStepInfo?.title}</CardTitle>
        <CardDescription>
          {currentStepInfo?.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderStepContent(step)}
      </CardContent>
    </Card>
  );
}
