
import { BrandingForm } from '@/components/branding-form';
import { PageHeader } from '@/components/page-header';

export default function BrandingPage() {
  return (
    <div>
      <PageHeader
        title="Company Branding & Details"
        description="Manage your company's branding, details, default terms, and signature for this workspace."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <BrandingForm />
      </main>
    </div>
  );
}
