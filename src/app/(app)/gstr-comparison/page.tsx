
import { GstrComparison } from '@/components/gstr-comparison';
import { PageHeader } from '@/components/page-header';

export default function GstrComparisonPage() {
  return (
    <div>
      <PageHeader
        title="GSTR-1 vs GSTR-3B Comparison"
        description="Compare outward supplies for a selected period to find discrepancies."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <GstrComparison />
      </main>
    </div>
  );
}
