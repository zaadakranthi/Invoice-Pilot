
import { DepreciationChart } from '@/components/depreciation-chart';
import { PageHeader } from '@/components/page-header';

export default function DepreciationChartPage() {
  return (
    <div>
      <PageHeader
        title="Fixed Assets & Depreciation"
        description="Manage your fixed assets and calculate depreciation using the WDV method."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <DepreciationChart />
      </main>
    </div>
  );
}
