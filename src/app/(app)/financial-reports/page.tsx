
import { FinancialReportLayout } from '@/components/financial-report-layout';
import { PageHeader } from '@/components/page-header';

export default function FinancialReportsPage() {
  return (
    <div>
      <PageHeader
        title="Financial Reports"
        description="Generate and view a complete set of financial statements for your business."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <FinancialReportLayout />
      </main>
    </div>
  );
}
