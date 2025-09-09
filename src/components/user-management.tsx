

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileDown, Search, Repeat, Edit, PlusCircle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Badge } from './ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useRouter } from 'next/navigation';

const userManagementSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Client name is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits.').optional().or(z.literal('')),
  gstin: z.string().length(15, 'GSTIN must be 15 characters.').optional().or(z.literal('')),
  pan: z.string().length(10, 'PAN must be 10 characters.').optional().or(z.literal('')),
  billingAddress: z.string().min(1, 'Billing address is required.'),
  shippingAddress: z.string().optional().or(z.literal('')),
  role: z.enum(['superadmin', 'professional', 'direct', 'Admin', 'Employee', 'Viewer']),
});


export function UserManagement() {
    const { authUser, users, updateUser, addUser, switchUser } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { toast } = useToast();
    
    const isSuperAdmin = authUser?.role === 'superadmin';
    const isProfessional = authUser?.role === 'professional';

    const form = useForm<z.infer<typeof userManagementSchema>>({
      resolver: zodResolver(userManagementSchema),
      defaultValues: {
        name: '', email: '', phone: '', gstin: '', pan: '', billingAddress: '', shippingAddress: '', role: 'direct'
      },
    });

    useEffect(() => {
        if (editingUser) {
            form.reset({
                ...editingUser,
                shippingAddress: editingUser.shippingAddress || editingUser.billingAddress
            });
        } else {
            form.reset({ name: '', email: '', phone: '', gstin: '', pan: '', billingAddress: '', shippingAddress: '', role: 'direct' });
        }
    }, [editingUser, form]);


    const myClients = useMemo(() => {
        if (!authUser || !users) return [];
        if (isSuperAdmin) return users;
        if (isProfessional) return users.filter(u => u.ownerId === authUser.id);
        return [];
    }, [users, isSuperAdmin, isProfessional, authUser]);


    const filteredUsers = useMemo(() => {
        if (!searchTerm) return myClients;
        return myClients.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.gstin && user.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [myClients, searchTerm]);

    async function onSubmit(values: z.infer<typeof userManagementSchema>) {
        if (editingUser) {
            const dataToUpdate = { ...values };
            if (!dataToUpdate.shippingAddress) {
                dataToUpdate.shippingAddress = dataToUpdate.billingAddress;
            }
            await updateUser(editingUser.id, dataToUpdate);
            toast({ title: 'User updated successfully!' });
        }
        setEditingUser(null);
    }

    const handleAddNewClient = async () => {
        if (!authUser) return;
        try {
            await addUser({ name: 'New Client', ownerId: authUser.id });
            toast({ title: 'New Client Workspace Created', description: 'You can now manage their data from this screen.' });
        } catch(error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Could not create a new client workspace: ${error.message}`});
        }
    }
    
    const exportToCsv = (data: any[], filename: string) => {
        const headers = ['Name', 'Email', 'Phone', 'GSTIN', 'PAN', 'Role', 'Billing Address', 'Shipping Address'];
        const rows = data.map(u => [
            `"${u.name}"`, u.email, u.phone || '', u.gstin || '', u.pan || '', u.role,
            `"${(u.billingAddress || '').replace(/"/g, '""')}"`, `"${(u.shippingAddress || '').replace(/"/g, '""')}"`
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Export Successful', description: `User data has been downloaded to ${filename}.` });
    };
    
    const mainContent = (
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>{isSuperAdmin ? "System Users" : "My Clients"}</CardTitle>
                    <CardDescription>
                        {isSuperAdmin ? "Manage all users across the platform." : "Manage all your client workspaces."}
                    </CardDescription>
                </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, etc..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isProfessional && (
                        <Button onClick={handleAddNewClient}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Client
                        </Button>
                    )}
                    <Button onClick={() => exportToCsv(filteredUsers, 'all_users.csv')} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                        <TableRow key={user.id} className={cn(editingUser?.id === user.id && 'bg-muted/50')}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                            <TableCell className="font-mono">{user.gstin || "N/A"}</TableCell>
                            <TableCell>
                                  <Badge variant={user.onboarded ? 'default' : 'secondary'}>
                                    {user.onboarded ? "Active" : "Pending Onboarding"}
                                  </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                                    <Edit className="mr-2 h-4 w-4"/> Manage Details
                                </Button>
                                {(isProfessional || isSuperAdmin) && user.id !== authUser?.id && (
                                     <Button size="sm" onClick={() => switchUser(user.id)}>
                                        <Repeat className="mr-2 h-4 w-4"/> Manage Workspace
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">No users found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    );
    
    if (!isSuperAdmin && !isProfessional) {
        return <div className="text-center p-8">This page is for Admins and Professionals only.</div>
    }

    return (
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>{editingUser ? `Edit: ${editingUser.name}` : 'User Details'}</CardTitle>
                    <CardDescription>
                        {editingUser ? 'Update the details for this user.' : 'Select a user to manage their details.'}
                    </CardDescription>
                </CardHeader>
                {editingUser ? (
                    <CardContent>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input disabled {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            {isSuperAdmin && <FormField control={form.control} name="role" render={({ field }) => (
                               <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="direct">Direct User</SelectItem>
                                </SelectContent>
                                </Select>
                               <FormMessage /></FormItem>
                            )}/>}
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="pan" render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                            <FormField control={form.control} name="billingAddress" render={({ field }) => (<FormItem><FormLabel>Billing Address</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            
                            <div className="flex gap-2 pt-2">
                              <Button type="submit" className="w-full">Save Changes</Button>
                              <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="w-full">Cancel</Button>
                            </div>
                          </form>
                        </Form>
                    </CardContent>
                ) : (
                    <CardContent>
                        <div className="text-center text-sm text-muted-foreground py-10">
                            <p>Select a user from the list to view or edit their details.</p>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
        <div className="md:col-span-2">{mainContent}</div>
      </div>
    );
}

    