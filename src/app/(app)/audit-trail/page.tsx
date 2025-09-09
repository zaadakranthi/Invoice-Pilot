
import { AuditTrail } from '@/components/audit-trail';
import { PageHeader } from '@/components/page-header';

export default function AuditTrailPage() {
  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="A chronological log of all activities and changes in the system."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <AuditTrail />
      </main>
    </div>
  );
}
