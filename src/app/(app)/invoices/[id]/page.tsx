
import { InvoiceDetailsClient } from './invoice-details-client';
import { PageHeader } from '@/components/page-header';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div>
      <PageHeader title={`Invoice #${id}`} backHref="/invoices" />
      <div className="p-4 sm:p-6">
        <Suspense fallback={<InvoiceSkeleton />}>
          <InvoiceDetailsClient invoiceId={id} />
        </Suspense>
      </div>
    </div>
  );
}

function InvoiceSkeleton() {
    return (
         <div className="p-4 sm:p-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                     <Skeleton className="h-8 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
