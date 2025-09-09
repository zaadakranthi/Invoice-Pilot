
import { InvoiceForm } from '@/components/invoice-form';
import { PageHeader } from '@/components/page-header';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div>
      <PageHeader title={`Edit Invoice #${id}`} backHref="/invoices" />
      <main className="flex-1 p-4 sm:p-6 pt-0">
        <InvoiceForm invoiceId={id} />
      </main>
    </div>
  );
}
