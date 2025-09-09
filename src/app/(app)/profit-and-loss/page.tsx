
'use client';

import { ProfitAndLoss } from '@/components/profit-and-loss';
import { PageHeader } from '@/components/page-header';
import { DateRangePicker } from '@/components/date-range-picker';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function ProfitAndLossPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  return (
    <div>
      <PageHeader
        title="Profit & Loss Account"
        description="A summary of revenues, costs, and expenses incurred during a specified period."
      >
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <ProfitAndLoss dateRange={dateRange} />
      </main>
    </div>
  );
}
