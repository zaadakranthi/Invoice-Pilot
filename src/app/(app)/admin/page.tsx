
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users2, PlusCircle, ArrowRight, Repeat, CreditCard, FileStack, Bot, Activity } from 'lucide-react';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Mock data for the admin dashboard as per ADMIN_PANEL_SPEC.md
const adminStats = {
  activeSubscriptions: { total: 150, pro: 100, business: 50 },
  eWayBillsToday: 45,
  gstrReportsToday: 120,
  aiFeaturesUsedToday: 256,
};

const activityFeed = [
    { user: 'Rohan Sharma', feature: 'Upgraded to Business Plan', plan: 'Business', timestamp: '2 mins ago' },
    { user: 'Priya Mehta', feature: 'Used ITC Reconciliation', plan: 'Pro', timestamp: '5 mins ago' },
    { user: 'Ankit Desai', feature: 'Generated GSTR-1 Report', plan: 'Pro', timestamp: '10 mins ago' },
    { user: 'Sunita Patil', feature: 'Generated E-Way Bill', plan: 'Business', timestamp: '12 mins ago' },
    { user: 'Vikram Singh', feature: 'Used AI Logo Analysis', plan: 'Starter', timestamp: '15 mins ago' },
];


export default function AdminDashboardPage() {
  const { rootUser, users, addUser, switchUser } = useData();
  const router = useRouter();
  const { toast } = useToast();

  const isSuperAdmin = rootUser?.role === 'superadmin';
  const isProfessional = rootUser?.role === 'professional';

  const myClients = (isSuperAdmin || isProfessional) && users && rootUser ? users.filter(u => u.ownerId === rootUser?.id) : [];

  const getPageTitle = () => {
    if (isSuperAdmin) return "Super Admin Panel";
    if (isProfessional) return "Professional Dashboard";
    return "Dashboard";
  }
  
  const getPageDescription = () => {
      if (isSuperAdmin) return "Welcome, Admin. Here is a real-time overview of your application's activity.";
      if (isProfessional) return "Manage your clients and view their activities.";
      return "Your personal business dashboard."
  }

  const handleAddNewClient = async () => {
    if (!rootUser) return;
    try {
        const newClient = await addUser({ name: 'New Client', ownerId: rootUser.id });
        if (newClient) {
            toast({ title: 'New Client Workspace Created', description: 'You can now manage their data from the User Management screen.' });
        }
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: `Could not create a new client workspace: ${error.message}`});
    }
  }

  const renderSuperAdminDashboard = () => (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adminStats.activeSubscriptions.total}</div>
                    <p className="text-xs text-muted-foreground">Pro: {adminStats.activeSubscriptions.pro}, Business: {adminStats.activeSubscriptions.business}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">E-Way Bills (Today)</CardTitle>
                    <FileStack className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adminStats.eWayBillsToday}</div>
                    <p className="text-xs text-muted-foreground">Total E-Way Bills generated</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">GSTR Reports (Today)</CardTitle>
                    <FileStack className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adminStats.gstrReportsToday}</div>
                    <p className="text-xs text-muted-foreground">GSTR-1 & GSTR-3B reports</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Features Used (Today)</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{adminStats.aiFeaturesUsedToday}</div>
                    <p className="text-xs text-muted-foreground">Total AI-powered actions</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Live Activity Feed</CardTitle>
                    <Activity className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Activity</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activityFeed.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="font-medium">{item.user}</div>
                                        <div className="text-xs text-muted-foreground">{item.plan} Plan</div>
                                    </TableCell>
                                    <TableCell>{item.feature}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Link href="/admin/users" className="group">
                <Card className="h-full transition-all duration-200 group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">User Management</CardTitle>
                        <Users2 className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Total registered users on the platform</p>
                        <Button variant="link" className="p-0 h-auto mt-4">View and Manage Users <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    </CardContent>
                </Card>
            </Link>
        </div>
    </div>
  );

  const renderProfessionalDashboard = () => (
     <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                 <div>
                    <CardTitle>My Clients</CardTitle>
                    <CardDescription>A list of all client workspaces you manage.</CardDescription>
                 </div>
                 <Button onClick={handleAddNewClient}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
                 </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client Name</TableHead>
                            <TableHead>GSTIN</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myClients.length > 0 ? myClients.map(client => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>{client.gstin || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => switchUser(client.id)}>
                                        <Repeat className="mr-2 h-4 w-4" />
                                        Manage Workspace
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">You haven't added any clients yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <Button variant="link" className="w-full mt-4" asChild>
                    <Link href="/admin/users">View All Clients <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>
        <Link href="/admin/users" className="group">
        <Card className="h-full transition-all duration-200 group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users2 className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">View, search, and manage all your clients in detail.</p>
                <div className="text-2xl font-bold mt-2">Go to User Management</div>
            </CardContent>
        </Card>
        </Link>
    </div>
  );


  return (
    <div>
      <PageHeader
        title={getPageTitle()}
        description={getPageDescription()}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {isSuperAdmin ? renderSuperAdminDashboard() : isProfessional ? renderProfessionalDashboard() : (
             <Card>
                <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
                <CardContent>
                    <p>This area is for Professional and Admin users only.</p>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
