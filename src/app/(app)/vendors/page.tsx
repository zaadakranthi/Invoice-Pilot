
import { VendorManagement } from '@/components/vendor-management';
import { PageHeader } from '@/components/page-header';

export default function VendorsPage() {
  return (
    <div>
      <PageHeader
        title="Vendor Management"
        description="Add, view, and manage all your vendor and supplier details."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <VendorManagement />
      </main>
    </div>
  );
}
