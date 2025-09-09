
import { DebitNoteForm } from '@/components/debit-note-form';
import { PageHeader } from '@/components/page-header';

export default function NewDebitNotePage() {
  return (
    <div>
      <PageHeader title="New Debit Note" backHref="/debit-notes" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <DebitNoteForm />
      </main>
    </div>
  );
}
