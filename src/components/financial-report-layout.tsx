
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ReportCoverLetter } from './report-cover-letter';
import { ReportNotesToAccounts } from './report-notes-to-accounts';
import { TradingAccount } from '@/components/trading-account';
import { ProfitAndLoss } from '@/components/profit-and-loss';
import { BalanceSheet } from '@/components/balance-sheet';
import { DepreciationChart } from '@/components/depreciation-chart';
import { CapitalAccounts } from '@/components/capital-accounts';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from './date-range-picker';
import { endOfMonth, startOfMonth } from 'date-fns';

export function FinancialReportLayout() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });


  const handlePrint = () => {
    const printContent = document.getElementById('print-view');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const styles = Array.from(document.styleSheets)
          .map((styleSheet) => {
            try {
              return Array.from(styleSheet.cssRules)
                .map((rule) => rule.cssText)
                .join('');
            } catch (e) {
              console.warn('Could not read stylesheet rules:', e);
              return '';
            }
          })
          .join('\n');
          
        const links = Array.from(document.getElementsByTagName('link'));
        let linkTags = '';
        links.forEach(link => {
            if (link.rel === 'stylesheet') {
                linkTags += link.outerHTML;
            }
        });

        printWindow.document.write(`
          <html>
            <head>
              <title>Financial Report</title>
              ${linkTags}
              <style>
                @media print {
                  body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .print-page-break-before {
                    page-break-before: always;
                  }
                }
              </style>
              <style>${styles}</style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
      }
    }
  };

  return (
    <Card className="card-print">
      <CardHeader className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <CardTitle>Financial Report</CardTitle>
                <CardDescription>
                A complete set of financial statements for your business.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                <Button variant="outline" onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print / Export Full Report
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Interactive View for Screen */}
        <div className="print:hidden">
            <Tabs defaultValue="cover-letter">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                <TabsTrigger value="statements">Financial Statements</TabsTrigger>
                <TabsTrigger value="schedules">Schedules</TabsTrigger>
                <TabsTrigger value="notes">Notes to Accounts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cover-letter" className="mt-6">
                <ReportCoverLetter />
            </TabsContent>

            <TabsContent value="statements" className="mt-6 space-y-8">
                <TradingAccount dateRange={dateRange} />
                <ProfitAndLoss dateRange={dateRange} />
                <BalanceSheet dateRange={dateRange} />
            </TabsContent>
            
            <TabsContent value="schedules" className="mt-6 space-y-8">
                <DepreciationChart />
                <CapitalAccounts />
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
                <ReportNotesToAccounts />
            </TabsContent>
            </Tabs>
        </div>
        
        {/* Flattened View for Printing */}
        <div id="print-view" className="hidden print:block">
            <div className="print-page-break-before-auto">
                <ReportCoverLetter />
            </div>
            <div className="print-page-break-before">
                <TradingAccount dateRange={dateRange} />
            </div>
             <div className="print-page-break-before">
                <ProfitAndLoss dateRange={dateRange} />
            </div>
             <div className="print-page-break-before">
                <BalanceSheet dateRange={dateRange} />
            </div>
             <div className="print-page-break-before">
                <DepreciationChart />
            </div>
             <div className="print-page-break-before">
                <CapitalAccounts />
            </div>
             <div className="print-page-break-before">
                <ReportNotesToAccounts />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
