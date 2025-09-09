
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, UserCircle, Settings, LogOut, Repeat, Home } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { useMemo } from 'react';

export function MainHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const { authUser, users, switchUser, rootUser } = useData();

  const isProfessional = rootUser?.role === 'professional';
  
  const myClients = useMemo(() => {
    if (!rootUser?.id || !users) return [];
    // Ensure we don't include the professional's own user object in the client list
    return users.filter(u => u.ownerId === rootUser.id && u.id !== rootUser.id);
  }, [users, rootUser]);
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({ title: 'Logged Out', description: 'You have been successfully signed out.'});
        router.push('/login');
    } catch (error) {
        console.error('Logout Error:', error);
        toast({ variant: 'destructive', title: 'Logout Failed', description: 'An error occurred while signing out.'});
    }
  }

  const handleSwitch = (targetId: string) => {
    if (targetId === authUser?.id) return;
    switchUser(targetId);
  }

  const getWorkspaceName = () => {
    if (!authUser) return "Loading...";
    if (authUser.id === rootUser?.id) return "My Workspace";
    return authUser.name;
  };

  return (
    <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b bg-white print:hidden">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Briefcase className="size-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">
            InvoicePilot
          </h1>
        </Link>
        {isProfessional && (
            <div className="hidden sm:block">
              <Select onValueChange={handleSwitch} value={authUser?.id || ''}>
                  <SelectTrigger className="w-[280px]">
                     <span className="text-muted-foreground mr-2">Managing:</span>
                     <SelectValue placeholder="Select a workspace...">
                       {getWorkspaceName()}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                      {rootUser && <SelectItem value={rootUser.id}>My Workspace ({rootUser.name})</SelectItem>}
                      {myClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/pricing">Pricing</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{rootUser?.name || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
             {isProfessional && (
                <DropdownMenuItem asChild>
                    <Link href="/admin">
                        <Repeat className="mr-2 h-4 w-4" />
                        <span>Professional Dashboard</span>
                    </Link>
                </DropdownMenuItem>
             )}
            <DropdownMenuItem asChild>
              <Link href="/branding">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
