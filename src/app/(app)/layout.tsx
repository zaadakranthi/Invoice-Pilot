
'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/sidebar-nav';
import { AppFooter } from '@/components/app-footer';
import { useEffect, useState } from 'react';
import { useData } from '@/context/data-context';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { rootUser, authUser, authLoading, isReady } = useData();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || authLoading || !rootUser || !isReady) return;

    if (!rootUser.onboarded) {
      if (pathname !== '/onboarding') router.replace('/onboarding');
      return; 
    }
    
    const isProfessional = rootUser?.role === 'professional';
    const isManagingClient = !!authUser?.ownerId; 

    // Redirect a professional to their admin dashboard if they are not managing a client
    if (isProfessional && !isManagingClient) {
        if (!pathname.startsWith('/admin')) {
            router.replace('/admin');
        }
    } else {
        // Redirect anyone else (direct users, or professionals managing a client) away from the admin area
        if (pathname.startsWith('/admin')) {
            router.replace('/dashboard');
        }
    }

  }, [rootUser, authUser, authLoading, isReady, isClient, pathname, router]);

  if (!isClient || authLoading || !isReady) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Initializing Workspace...</p>
      </div>
    );
  }
  
  if (authUser && !authUser.onboarded && pathname !== '/onboarding') {
     return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Redirecting to Onboarding...</p>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col sm:pl-14">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </div>
      </div>
  );
}
