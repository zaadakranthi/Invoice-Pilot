
import { AppointmentBookingForm } from '@/components/appointment-booking-form';
import { PageHeader } from '@/components/page-header';

export default function BookAppointmentPage() {
  return (
    <div>
      <PageHeader
        title="Book an Appointment"
        description="Schedule a session with a Chartered Accountant or Auditor for expert advice."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <AppointmentBookingForm />
      </main>
    </div>
  );
}
