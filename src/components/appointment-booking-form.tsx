
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const availableTimeSlots = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry'
];


export function AppointmentBookingForm() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentMode, setAppointmentMode] = useState('');
  const [professionalType, setProfessionalType] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [area, setArea] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const { toast } = useToast();

  const handleBooking = () => {
    if (!date || !selectedTime || !appointmentMode || !professionalType || !appointmentReason) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please select a date, time, and all appointment details.',
        });
        return;
    }

    toast({
        title: 'Appointment Booked!',
        description: `Your ${appointmentMode} with a ${professionalType} for "${appointmentReason}" is confirmed for ${format(date, 'PPP')} at ${selectedTime}. Lead from: ${area}, ${selectedState}.`,
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Schedule an Appointment</CardTitle>
        <CardDescription>
          Book a session with a Chartered Accountant or Auditor for expert advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Select Professional</Label>
                    <Select value={professionalType} onValueChange={setProfessionalType}>
                        <SelectTrigger><SelectValue placeholder="Select a professional" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Chartered Accountant">Chartered Accountant</SelectItem>
                            <SelectItem value="Auditor">Auditor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Mode of Appointment</Label>
                    <Select value={appointmentMode} onValueChange={setAppointmentMode}>
                        <SelectTrigger><SelectValue placeholder="Select a mode" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Video Call">Video Call</SelectItem>
                            <SelectItem value="Phone Call">Phone Call</SelectItem>
                            <SelectItem value="Personal">Personal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
           </div>
           <div className="space-y-2">
             <Label>Reason for Appointment</Label>
             <Select value={appointmentReason} onValueChange={setAppointmentReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="GST Filing Query">GST Filing Query</SelectItem>
                    <SelectItem value="Audit Preparation">Audit Preparation</SelectItem>
                    <SelectItem value="Tax Planning">Tax Planning</SelectItem>
                    <SelectItem value="Company Registration">Company Registration</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
            </Select>
           </div>
           <div className="space-y-2">
             <Label>Contact Details</Label>
             <Input placeholder="Your Email or Phone Number" />
           </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Input id="area" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g., Koramangala, Bandra" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger id="state"><SelectValue placeholder="Select a state" /></SelectTrigger>
                        <SelectContent>
                            {indianStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
           </div>
        </div>
        <div className="flex flex-col items-center">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
            />
            {date && (
                <div className="mt-4 w-full">
                    <h3 className="text-center font-semibold mb-2">Available Slots for {format(date, 'PPP')}</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {availableTimeSlots.map(time => (
                            <Button
                                key={time}
                                variant={selectedTime === time ? 'default' : 'outline'}
                                onClick={() => setSelectedTime(time)}
                                className={cn(selectedTime === time && 'bg-primary text-primary-foreground')}
                            >
                                {time}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleBooking} className="w-full md:w-auto ml-auto">
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Appointment
        </Button>
      </CardFooter>
    </Card>
  );
}
