
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const defaultNotes = `1.  **General Information & Significant Accounting Policies**

    a) **Basis of Accounting:** The financial statements are prepared under the historical cost convention on an accrual basis, in accordance with the Generally Accepted Accounting Principles (GAAP) in India.

    b) **Revenue Recognition:** Revenue from the sale of goods is recognized upon the transfer of significant risks and rewards of ownership to the buyer. Revenue from services is recognized as and when the services are rendered.

    c) **Fixed Assets:** Fixed assets are stated at cost less accumulated depreciation.

    d) **Depreciation:** Depreciation on fixed assets is provided on the Written Down Value (WDV) method at the rates prescribed under the Income Tax Act, 1961.

2.  **Other Notes**

    a) The figures in the financial statements have been rounded off to the nearest rupee.

    b) Previous year's figures have been regrouped/reclassified wherever necessary to correspond with the current year's classification/disclosure.
`;


export function ReportNotesToAccounts() {
    const [notes, setNotes] = useState(defaultNotes);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notes to Accounts</CardTitle>
                <CardDescription>
                    Standard accounting policies and disclosures. You can edit the content below before printing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                />
            </CardContent>
        </Card>
    );
}
