
import { HsnCodeManagement } from '@/components/hsn-code-management';
import { PageHeader } from '@/components/page-header';

export default function HsnCodesAdminPage() {
  return (
    <div>
      <PageHeader
        title="HSN/SAC Code Master"
        description="Manage the central database of HSN/SAC codes and their GST rates for all users."
        backHref="/admin"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <HsnCodeManagement />
      </main>
    </div>
  );
}
