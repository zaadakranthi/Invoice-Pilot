import { PurchaseForm } from '@/components/purchase-form';
import { PageHeader } from '@/components/page-header';

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title={`Edit Bill #${params.id}`} backHref="/purchases" />
      <main className="flex-1 p-4 sm:p-6 pt-0">
        <PurchaseForm billId={params.id} />
      </main>
    </div>
  );
}
