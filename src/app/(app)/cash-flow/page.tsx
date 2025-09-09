
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { DateRangePicker } from '@/components/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfYear, endOfYear } from 'date-fns';
import { CashFlowStatement } from '@/components/cash-flow-statement';

export default function CashFlowPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });

    return (
        <div>
            <PageHeader
                title="Cash Flow Statement"
                description="View the sources and uses of cash for a specified period."
            >
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </PageHeader>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <CashFlowStatement dateRange={dateRange} />
            </main>
        </div>
    );
}
