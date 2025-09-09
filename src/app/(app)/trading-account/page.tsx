
'use client';

import { TradingAccount } from '@/components/trading-account';
import { PageHeader } from '@/components/page-header';
import { useState } from 'react';
import { DateRangePicker } from '@/components/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function TradingAccountPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  return (
    <div>
      <PageHeader
        title="Trading Account"
        description="Calculate your gross profit or loss from buying and selling goods."
      >
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <TradingAccount dateRange={dateRange} />
      </main>
    </div>
  );
}
