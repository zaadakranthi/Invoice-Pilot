
import { DayBook } from '@/components/day-book';
import { PageHeader } from '@/components/page-header';

export default function DayBookPage() {
  return (
    <div>
      <PageHeader
        title="Day Book"
        description="View and filter all financial transactions for a specific period."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <DayBook />
      </main>
    </div>
  );
}
