
import { TrialBalance } from '@/components/trial-balance';
import { PageHeader } from '@/components/page-header';

export default function TrialBalancePage() {
  return (
    <div>
      <PageHeader
        title="Trial Balance"
        description="A list of all your general ledger accounts to verify mathematical accuracy."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <TrialBalance />
      </main>
    </div>
  );
}
