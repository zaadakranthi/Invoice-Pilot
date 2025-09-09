
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { compareGstrReports } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { GstrComparisonOutput } from '@/ai/flows/compare-gstr-reports';

const mockGstr1Data = {
  taxableValue: 479500,
  cgst: 42349,
  sgst: 42349,
  igst: 0,
};

const mockGstr3bData = {
  taxableValue: 475000,
  cgst: 42000,
  sgst: 42000,
  igst: 0,
};

type ReportData = typeof mockGstr1Data;

const financialYears = ['FY 2024-25', 'FY 2023-24', 'FY 2022-23'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function GstrComparison() {
  const [gstr1Data, setGstr1Data] = useState(mockGstr1Data);
  const [gstr3bData, setGstr3bData] = useState(mockGstr3bData);
  const [selectedYear, setSelectedYear] = useState(financialYears[1]);
  const [selectedMonth, setSelectedMonth] = useState(months[9]); // October
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<GstrComparisonOutput | null>(null);
  const { toast } = useToast();

  const comparisonFields: (keyof ReportData)[] = ['taxableValue', 'cgst', 'sgst', 'igst'];
  
  const getFieldName = (field: keyof ReportData) => {
    switch(field) {
        case 'taxableValue': return 'Taxable Value';
        case 'cgst': return 'CGST';
        case 'sgst': return 'SGST';
        case 'igst': return 'IGST';
    }
  }

  const handleCompare = async () => {
    setIsLoading(true);
    setAiResult(null);
    try {
        const result = await compareGstrReports({
            gstr1DataJson: JSON.stringify(gstr1Data),
            gstr3bDataJson: JSON.stringify(gstr3bData),
        });
        setAiResult(result);
        toast({ title: 'Comparison Complete', description: 'AI has analyzed the deviations.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to get AI comparison.' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>GSTR-1 vs. GSTR-3B Comparison</CardTitle>
                <CardDescription>
                  Compare outward supplies for a selected period to find discrepancies.
                </CardDescription>
              </div>
               <div className="flex items-center gap-2">
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
                <Button onClick={handleCompare} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                    Analyze with AI
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportDataTable title="GSTR-1 Data (from Invoices)" data={gstr1Data} />
            <ReportDataTable title="GSTR-3B Data (Summary)" data={gstr3bData} />
          </div>
        </CardContent>
      </Card>
      
      {aiResult && (
        <Card>
            <CardHeader>
                <CardTitle>AI Analysis & Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Deviations Found:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {aiResult.deviations.map((d, i) => <li key={i}><strong>{d.field}:</strong> {d.deviation}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Suggestions for Compliance:</h3>
                    <p className="text-sm whitespace-pre-wrap">{aiResult.suggestions}</p>
                </div>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comparison Summary for {selectedMonth}, {selectedYear}</CardTitle>
          <CardDescription>
            A direct mathematical comparison of the values. Differences are highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead className="text-right">GSTR-1 Value</TableHead>
                <TableHead className="text-right">GSTR-3B Value</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonFields.map((field) => {
                const gstr1Value = gstr1Data[field];
                const gstr3bValue = gstr3bData[field];
                const difference = gstr1Value - gstr3bValue;
                const isMismatched = difference !== 0;

                return (
                  <TableRow key={field} className={cn(isMismatched && 'bg-destructive/10')}>
                    <TableCell className={cn('font-medium', isMismatched && 'text-destructive')}>
                      {getFieldName(field)}
                    </TableCell>
                    <TableCell className="text-right font-mono">₹{gstr1Value.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">₹{gstr3bValue.toLocaleString('en-IN')}</TableCell>
                    <TableCell className={cn('text-right font-mono', isMismatched ? 'text-destructive font-bold' : 'text-muted-foreground')}>
                      ₹{difference.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportDataTable({ title, data }: { title: string; data: ReportData }) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Taxable Value</TableCell>
              <TableCell className="text-right font-mono">₹{data.taxableValue.toLocaleString('en-IN')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">CGST</TableCell>
              <TableCell className="text-right font-mono">₹{data.cgst.toLocaleString('en-IN')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">SGST</TableCell>
              <TableCell className="text-right font-mono">₹{data.sgst.toLocaleString('en-IN')}</TableCell>
            </TableRow>
             <TableRow>
              <TableCell className="font-medium">IGST</TableCell>
              <TableCell className="text-right font-mono">₹{data.igst.toLocaleString('en-IN')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
