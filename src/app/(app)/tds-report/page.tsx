
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMonth, getQuarter, parseISO } from 'date-fns';


interface TdsEntry {
    docId: string;
    partyName: string;
    partyPan: string;
    date: string;
    amount: number;
    section: string;
    taxAmount: number;
}

const financialYears = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24'];
const months = [
  { name: 'April', value: 3 }, { name: 'May', value: 4 }, { name: 'June', value: 5 },
  { name: 'July', value: 6 }, { name: 'August', value: 7 }, { name: 'September', value: 8 },
  { name: 'October', value: 9 }, { name: 'November', value: 10 }, { name: 'December', value: 11 },
  { name: 'January', value: 0 }, { name: 'February', value: 1 }, { name: 'March', value: 2 }
];
const quarters = [
  { name: 'Q1: Apr - Jun', value: 1 },
  { name: 'Q2: Jul - Sep', value: 2 },
  { name: 'Q3: Oct - Dec', value: 3 },
  { name: 'Q4: Jan - Mar', value: 4 },
];

export default function TdsReportPage() {
    const { bills, vendors, brandingSettings } = useData();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(financialYears[0]);
    const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedQuarter, setSelectedQuarter] = useState(getQuarter(new Date()));

    const allTdsEntries = useMemo(() => {
        const entries: TdsEntry[] = [];
        
        bills.forEach(bill => {
            if (bill.tds?.applicable) {
                const vendor = vendors.find(v => v.name === bill.vendor);
                 entries.push({
                    docId: bill.id,
                    partyName: bill.vendor,
                    partyPan: vendor?.pan || 'N/A',
                    date: bill.date,
                    amount: bill.totalAmount,
                    section: bill.tds.section,
                    taxAmount: bill.tds.amount,
                });
            }
        });

        return entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bills, vendors]);

    const filteredEntries = useMemo(() => {
        const [startYearStr] = selectedYear.split(' ')[1].split('-');
        const startYear = parseInt(startYearStr);

        const periodFiltered = allTdsEntries.filter(entry => {
            const entryDate = parseISO(entry.date);
            const entryMonth = getMonth(entryDate);
            const entryYear = entryDate.getFullYear();
            const entryQuarter = getQuarter(entryDate);

            let financialYearStart, financialYearEnd;
            if (selectedYear.includes('-')) {
              const [fy_start, fy_end] = selectedYear.split(' ')[1].split('-');
              financialYearStart = new Date(parseInt(fy_start), 3, 1);
              financialYearEnd = new Date(parseInt(fy_start) + 1, 2, 31);
            } else {
              // Handle single year format if necessary
              financialYearStart = new Date(startYear, 3, 1);
              financialYearEnd = new Date(startYear + 1, 2, 31);
            }
            
            const inFinancialYear = entryDate >= financialYearStart && entryDate <= financialYearEnd;
            
            if (!inFinancialYear) return false;

            if (periodType === 'monthly') {
                return entryMonth === selectedMonth;
            } else {
                return entryQuarter === selectedQuarter;
            }
        });
        
        if (!searchTerm) return periodFiltered;

        return periodFiltered.filter(entry => 
            entry.docId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.partyPan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.section.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allTdsEntries, searchTerm, selectedYear, periodType, selectedMonth, selectedQuarter]);

    const handleExportCsv = () => {
        const tan = brandingSettings?.tan || 'NOT SET';
        const header = ['TAN', 'PAN of Party', 'Party Name', 'Date', 'Transaction Amount', 'Section', 'TDS Amount'];
        const rows = filteredEntries.map(e => 
            [tan, e.partyPan, `"${e.partyName}"`, e.date, e.amount, e.section, e.taxAmount].join(',')
        );
        const csvContent = [header.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "tds_report.csv";
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Successful!', description: 'TDS report has been exported.' });
    };

    return (
        <div>
            <PageHeader
              title="TDS Report"
              description="A consolidated report of all TDS entries for filing (from Purchases)."
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>TDS Filing Report</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search report..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" onClick={handleExportCsv}>
                                    <Download className="mr-2 h-4 w-4" /> Export CSV
                                </Button>
                                 <Button variant="outline" disabled>
                                    <Upload className="mr-2 h-4 w-4" /> Import CSV
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                           <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {financialYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={periodType} onValueChange={(v) => setPeriodType(v as any)}>
                                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                </SelectContent>
                            </Select>
                            {periodType === 'monthly' ? (
                                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Month"/></SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            ) : (
                                 <Select value={String(selectedQuarter)} onValueChange={(v) => setSelectedQuarter(Number(v))}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Quarter"/></SelectTrigger>
                                    <SelectContent>
                                         {quarters.map(q => <SelectItem key={q.value} value={String(q.value)}>{q.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bill ID</TableHead>
                                    <TableHead>Vendor Name</TableHead>
                                    <TableHead>Vendor PAN</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Section</TableHead>
                                    <TableHead className="text-right">Transaction Amount</TableHead>
                                    <TableHead className="text-right">TDS Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.length > 0 ? filteredEntries.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{entry.docId}</TableCell>
                                        <TableCell>{entry.partyName}</TableCell>
                                        <TableCell>{entry.partyPan}</TableCell>
                                        <TableCell>{entry.date}</TableCell>
                                        <TableCell>{entry.section}</TableCell>
                                        <TableCell className="text-right font-mono">₹{entry.amount.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-mono">₹{entry.taxAmount.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">No TDS entries found for the selected period.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
