
import { CmaReportGenerator } from '@/components/cma-report-generator';
import { PageHeader } from '@/components/page-header';

export default function CmaReportPage() {
  return (
    <div>
      <PageHeader
        title="CMA Report & Projections"
        description="Generate a Credit Monitoring Arrangement report for bank loan proposals."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CmaReportGenerator />
      </main>
    </div>
  );
}
