
import { PurchaseForm } from '@/components/purchase-form';
import { PageHeader } from '@/components/page-header';

export default function NewPurchasePage() {
  return (
    <div>
      <PageHeader title="New Purchase Bill" backHref="/purchases" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <PurchaseForm />
      </main>
    </div>
  );
}
