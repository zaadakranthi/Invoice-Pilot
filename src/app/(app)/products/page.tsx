
import { ProductManagement } from '@/components/product-management';
import { PageHeader } from '@/components/page-header';

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products & Services"
        description="Manage your central repository of goods and services."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <ProductManagement />
      </main>
    </div>
  );
}
