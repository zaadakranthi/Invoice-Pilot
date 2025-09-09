
import { CustomerManagement } from '@/components/customer-management';
import { PageHeader } from '@/components/page-header';

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Customer Management"
        description="Add, view, and manage all your customer details."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CustomerManagement />
      </main>
    </div>
  );
}
