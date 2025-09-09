'use client';

import { BalanceSheet } from '@/components/balance-sheet';
import { PageHeader } from '@/components/page-header';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/date-range-picker';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function BalanceSheetPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: new Date(),
    });

  return (
    <div>
      <PageHeader
        title="Balance Sheet"
        description="A snapshot of your company's financial position at a specific point in time."
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !dateRange?.to && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.to ? `As on ${format(dateRange.to, 'PPP')}` : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateRange?.to}
              onSelect={(date) => setDateRange(prev => ({...prev, to: date}))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <BalanceSheet dateRange={dateRange} />
      </main>
    </div>
  );
}
