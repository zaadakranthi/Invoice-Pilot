
import { PurchaseBillDetails } from '@/components/purchase-bill-details';
import { PageHeader } from '@/components/page-header';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function PurchaseBillDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div>
      <PageHeader title={`Purchase Bill #${id}`} backHref="/purchases" />
      <div className="p-4 sm:p-6">
        <Suspense fallback={<PurchaseBillSkeleton />}>
          <PurchaseBillDetails billId={id} />
        </Suspense>
      </div>
    </div>
  );
}

function PurchaseBillSkeleton() {
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
