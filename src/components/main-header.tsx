
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCircle, Settings, LogOut, Repeat } from 'lucide-react';
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
import { MobileNav } from './sidebar-nav';

export function MainHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const { authUser, users, switchUser, rootUser } = useData();

  const isProfessional = rootUser?.role === 'professional';
  
  const myClients = useMemo(() => {
    if (!rootUser?.id || !users) return [];
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
        <MobileNav />
        {isProfessional && (
            <div className="sm:hidden">
              <Select onValueChange={handleSwitch} value={authUser?.id || ''}>
                  <SelectTrigger className="w-[180px] sm:w-[280px]">
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
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
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
