
import { BankAccountManagement } from '@/components/bank-account-management';
import { PageHeader } from '@/components/page-header';

export default function BankAccountsPage() {
  return (
    <div>
      <PageHeader
        title="Bank & Cash Accounts"
        description="Manage all your configured cash and bank accounts."
        backHref="/cash-and-bank"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <BankAccountManagement />
      </main>
    </div>
  );
}
