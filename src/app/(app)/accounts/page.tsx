
import { ChartOfAccounts } from '@/components/chart-of-accounts';
import { PageHeader } from '@/components/page-header';

export default function ChartOfAccountsPage() {
  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Manage your ledger accounts and their classifications."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <ChartOfAccounts />
      </main>
    </div>
  );
}
