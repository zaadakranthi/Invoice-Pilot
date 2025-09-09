
import { InvoiceForm } from '@/components/invoice-form';
import { PageHeader } from '@/components/page-header';

export default function NewInvoicePage() {
  return (
    <div>
      <PageHeader title="New Invoice" backHref="/invoices" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <InvoiceForm />
      </main>
    </div>
  );
}
