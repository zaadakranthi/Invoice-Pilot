
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/data-context';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export function ReportCoverLetter() {
    const { invoices, bills, brandingSettings } = useData();
    const [financials, setFinancials] = useState({
        totalRevenue: 0,
        grossProfit: 0,
        netProfit: 0,
        netWorth: 0,
    });

    useEffect(() => {
        const totalRevenue = invoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
        // This is a simplified calculation for demonstration. A real P&L would be more complex.
        const totalCOGS = bills.reduce((acc, b) => acc + b.taxableValue, 0); 
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - 360000; // Assuming static indirect expenses for prototype
        const netWorth = 1000000 + netProfit; // Assuming static opening capital for prototype

        setFinancials({ totalRevenue, grossProfit, netProfit, netWorth });

    }, [invoices, bills]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Covering Letter</CardTitle>
                <CardDescription>
                    This is an auto-generated summary letter for your financial report.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                <p>To Whomsoever It May Concern,</p>

                <p>
                    This is to certify that M/s <strong>{brandingSettings?.companyName || '[Company Name]'}</strong>, having its registered office at {brandingSettings?.companyAddress?.replace(/\n/g, ', ') || '[Company Address]'}, has prepared its financial statements for the year ended 31st March, {new Date().getFullYear()}.
                </p>

                <p>
                    Based on the books of accounts and other information provided to us, we are summarizing the key financial performance indicators as follows:
                </p>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Nature of Business</TableCell>
                                <TableCell>{brandingSettings?.natureOfBusiness || '[Nature of Business]'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Revenue from Operations</TableCell>
                                <TableCell className="font-mono">₹{financials.totalRevenue.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Gross Profit</TableCell>
                                <TableCell className="font-mono">₹{financials.grossProfit.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Net Profit After Tax</TableCell>
                                <TableCell className="font-mono">₹{financials.netProfit.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Net Worth (as at year-end)</TableCell>
                                <TableCell className="font-mono">₹{financials.netWorth.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                
                <p>
                    This letter is issued upon the specific request of the company for general purposes, without any risk and responsibility on our part.
                </p>

                <div className="pt-8">
                    <p>For [Your Firm's Name],</p>
                    <div className="h-16"></div>
                    <p>(Authorized Signatory)</p>
                    <p>Date: {format(new Date(), 'dd-MM-yyyy')}</p>
                    <p>Place: [Your City]</p>
                </div>
            </CardContent>
        </Card>
    )
}
