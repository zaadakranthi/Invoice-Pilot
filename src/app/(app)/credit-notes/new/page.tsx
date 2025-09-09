
import { CreditNoteForm } from '@/components/credit-note-form';
import { PageHeader } from '@/components/page-header';

export default function NewCreditNotePage() {
  return (
    <div>
      <PageHeader title="New Credit Note" backHref="/credit-notes" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <CreditNoteForm />
      </main>
    </div>
  );
}
