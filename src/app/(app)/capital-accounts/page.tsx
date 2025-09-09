
import { CapitalAccounts } from '@/components/capital-accounts';
import { PageHeader } from '@/components/page-header';

export default function CapitalAccountsPage() {
  return (
    <div>
      <PageHeader
        title="Capital Accounts Schedule"
        description="A summary of partner/proprietor capital accounts."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CapitalAccounts />
      </main>
    </div>
  );
}
