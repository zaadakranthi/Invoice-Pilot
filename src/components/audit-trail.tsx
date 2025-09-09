
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';
import { useData } from '@/context/data-context';
import { format, parseISO } from 'date-fns';
import { DateRangePicker } from './date-range-picker';
import { DateRange } from 'react-day-picker';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export function AuditTrail() {
    const { auditLog, users } = useData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedAction, setSelectedAction] = useState('all');
    
    const filteredLog = useMemo(() => {
        let entries = auditLog;

        if (dateRange?.from && dateRange?.to) {
            entries = entries.filter(e => {
                const entryDate = parseISO(e.timestamp);
                return entryDate >= dateRange.from! && entryDate <= dateRange.to!;
            });
        }
        
        if (selectedUser !== 'all') {
            entries = entries.filter(e => e.user === selectedUser);
        }

        if (selectedAction !== 'all') {
            entries = entries.filter(e => e.action === selectedAction);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            entries = entries.filter(e => 
                e.entity.toLowerCase().includes(lowercasedTerm) ||
                e.entityId.toLowerCase().includes(lowercasedTerm) ||
                e.details.toLowerCase().includes(lowercasedTerm)
            );
        }

        return entries;
    }, [auditLog, dateRange, searchTerm, selectedUser, selectedAction]);

    const getActionBadgeVariant = (action: 'Create' | 'Update' | 'Delete') => {
        switch(action) {
            case 'Create': return 'bg-green-100 text-green-800';
            case 'Update': return 'bg-amber-100 text-amber-800';
            case 'Delete': return 'bg-red-100 text-red-800';
        }
    }


    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Audit Trail</CardTitle>
                        <CardDescription>A chronological log of all activities and changes in the system.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search details..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    </div>
                </div>
                 <div className="flex items-center gap-2 pt-4">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange}/>
                     <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by user..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {users.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={selectedAction} onValueChange={setSelectedAction}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by action..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="Create">Create</SelectItem>
                            <SelectItem value="Update">Update</SelectItem>
                            <SelectItem value="Delete">Delete</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Entity ID</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLog.length > 0 ? filteredLog.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{format(parseISO(entry.timestamp), 'dd/MM/yy hh:mm:ss a')}</TableCell>
                                <TableCell>{entry.user}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn(getActionBadgeVariant(entry.action))}>
                                        {entry.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>{entry.entity}</TableCell>
                                <TableCell className="font-mono text-xs">{entry.entityId}</TableCell>
                                <TableCell>{entry.details}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center">No audit logs found for the selected filters.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
