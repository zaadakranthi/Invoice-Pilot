
'use client';

import { JournalVoucherForm } from '@/components/journal-voucher-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export default function NewJournalVoucherPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div>
      <PageHeader title="New General Transaction" backHref="/journal-vouchers">
        <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
        </Button>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <JournalVoucherForm isUploadDialogOpen={isUploadOpen} onUploadDialogChange={setIsUploadOpen} />
      </main>
    </div>
  );
}
