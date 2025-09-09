
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CalendarDays, CheckCircle } from 'lucide-react';
import { format, endOfMonth } from 'date-fns';

const getComplianceDates = () => {
    const today = new Date();
    const currentMonth = format(today, 'MMMM yyyy');
    const lastDayOfMonth = endOfMonth(today);

    return [
        {
            title: 'GSTR-1 Filing',
            dueDate: `11th ${currentMonth}`,
            description: 'Monthly return for outward supplies.',
            isComplete: today.getDate() > 11,
        },
        {
            title: 'GSTR-3B Filing',
            dueDate: `20th ${currentMonth}`,
            description: 'Monthly summary return and tax payment.',
            isComplete: today.getDate() > 20,
        },
        {
            title: 'TDS Payment',
            dueDate: `7th ${currentMonth}`,
            description: 'Deposit of tax deducted at source.',
            isComplete: today.getDate() > 7,
        }
    ]
}


export function ComplianceCalendar() {
    const deadlines = getComplianceDates();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    <span>Compliance Calendar - {format(new Date(), 'MMMM')}</span>
                </CardTitle>
                <CardDescription>
                    Key GST and compliance deadlines for the current month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {deadlines.map(deadline => (
                         <li key={deadline.title} className="flex items-start gap-4">
                            <div>
                                {deadline.isComplete ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                                ) : (
                                    <Bell className="h-5 w-5 text-amber-500 mt-1" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{deadline.title}</p>
                                <p className="text-sm text-muted-foreground">{deadline.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">Due Date</p>
                                <p className="text-xs text-muted-foreground">{deadline.dueDate}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
