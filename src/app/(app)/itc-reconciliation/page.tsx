
import { ItcReconciliation } from '@/components/itc-reconciliation';
import { PageHeader } from '@/components/page-header';

export default function ItcReconciliationPage() {
  return (
    <div>
      <PageHeader
        title="ITC Reconciliation (GSTR-2B vs Books)"
        description="Upload your GSTR-2B CSV and our AI will reconcile it with your purchase records."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <ItcReconciliation />
      </main>
    </div>
  );
}
