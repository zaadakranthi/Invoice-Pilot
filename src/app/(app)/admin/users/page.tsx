
import { UserManagement } from '@/components/user-management';
import { PageHeader } from '@/components/page-header';

export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="View, search, and export a list of all registered users or clients."
        backHref="/admin"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <UserManagement />
      </main>
    </div>
  );
}
