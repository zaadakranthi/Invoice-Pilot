
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Briefcase,
    Receipt,
    ShoppingCart,
    Users,
    Package,
    FileCheck,
    BarChart2,
    Landmark,
    Settings,
    LogOut,
    HeartHandshake,
    Shield,
    Repeat,
    FileArchive,
    Wallet,
    Scale,
    Telescope,
    Clock,
    Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    children?: Omit<NavItem, 'icon' | 'children'>[];
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { 
      href: '/invoices', 
      label: 'Billing', 
      icon: Receipt,
      children: [
        { href: '/invoices', label: 'Invoices' },
        { href: '/purchases', label: 'Purchases' },
        { href: '/credit-notes', label: 'Credit Notes' },
        { href: '/debit-notes', label: 'Debit Notes' },
      ]
    },
    { 
      href: '/gstr-1', 
      label: 'GST Filings', 
      icon: FileCheck,
      children: [
        { href: '/gstr-1', label: 'GSTR-1 Filing' },
        { href: '/gstr-3b', label: 'GSTR-3B Summary' },
        { href: '/gstr-annual', label: 'GSTR-9 Annual Return' },
        { href: '/gstr-9c', label: 'GSTR-9C Reconciliation' },
      ]
    },
     { 
      href: '/analytics', 
      label: 'Analytics & Tools', 
      icon: Telescope,
      children: [
        { href: '/analytics', label: 'Analytics & Reports'},
        { href: '/itc-reconciliation', label: 'ITC Reconciliation' },
        { href: '/gstr-comparison', label: 'GSTR Comparison' },
        { href: '/tds-report', label: 'TDS Report' },
        { href: '/tcs-report', label: 'TCS Report' },
        { href: '/audit-trail', label: 'Audit Trail' },
      ]
    },
    { 
      href: '/balance-sheet', 
      label: 'Accounting', 
      icon: Landmark,
      children: [
        { href: '/receivables', label: 'Receivables' },
        { href: '/payables', label: 'Payables' },
        { href: '/cash-and-bank', label: 'Cash & Bank' },
        { href: '/general-ledger', label: 'General Ledger' },
        { href: '/trial-balance', label: 'Trial Balance' },
        { href: '/balance-sheet', label: 'Balance Sheet' },
        { href: '/profit-and-loss', label: 'Profit & Loss' },
        { href: '/cash-flow', label: 'Cash Flow Statement' },
      ]
    },
    { 
      href: '/customers', 
      label: 'Parties & Items', 
      icon: Users,
       children: [
        { href: '/customers', label: 'Customers' },
        { href: '/vendors', label: 'Vendors' },
        { href: '/products', label: 'Products & Services' },
      ]
    },
    { 
        href: '/financial-reports', 
        label: 'Professional Services', 
        icon: HeartHandshake,
        children: [
            { href: '/financial-reports', label: 'Financial Reports' },
            { href: '/cma-report', label: 'CMA Report' },
            { href: '/book-appointment', label: 'Book Appointment' },
        ]
    },
];


export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { rootUser } = useData();
  
  const isProfessional = rootUser?.role === 'professional';
  const isSuperAdmin = rootUser?.role === 'superadmin';

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

  const isNavItemActive = (item: NavItem) => {
    if (item.href === '/settings/year-end' && pathname.startsWith('/settings')) {
        return true;
    }
    if (item.children) {
      // If it has children, check if the current path starts with any child href
      return item.children.some(child => pathname.startsWith(child.href));
    }
    // Otherwise, check for an exact match or if it's the dashboard
    return pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex print:hidden">
        <TooltipProvider>
            <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                <Link
                href="/dashboard"
                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                >
                    <Briefcase className="h-4 w-4 transition-all group-hover:scale-110" />
                    <span className="sr-only">InvoicePilot</span>
                </Link>

                {navItems.map((item) => (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                isNavItemActive(item) && !pathname.startsWith('/admin') && "bg-accent text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p className="font-semibold">{item.label}</p>
                            {item.children && (
                                <ul className="mt-2 space-y-1">
                                    {item.children.map(child => (
                                        <li key={child.href} className={cn("text-sm", pathname === child.href && "text-primary font-bold")}>
                                            <Link href={child.href}>{child.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                {(isProfessional || isSuperAdmin) && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Link
                            href="/admin"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                pathname.startsWith('/admin') && 'bg-accent text-accent-foreground'
                            )}
                        >
                            <Shield className="h-5 w-5" />
                            <span className="sr-only">Admin Panel</span>
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="font-semibold">Professional / Admin</p>
                          <ul className="mt-2 space-y-1">
                            <li className={cn("text-sm", pathname === "/admin" && "text-primary font-bold")}><Link href="/admin">Dashboard</Link></li>
                            <li className={cn("text-sm", pathname === "/admin/users" && "text-primary font-bold")}><Link href="/admin/users">Client Management</Link></li>
                            <li className={cn("text-sm", pathname === "/admin/hsn-codes" && "text-primary font-bold")}><Link href="/admin/hsn-codes">HSN/SAC Codes</Link></li>
                          </ul>
                        </TooltipContent>
                    </Tooltip>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                    <Link
                        href="/settings/year-end"
                        className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8", pathname.startsWith('/settings') && "bg-accent text-accent-foreground")}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p className="font-semibold">Settings</p>
                        <ul className="mt-2 space-y-1">
                             <li className={cn("text-sm", pathname.startsWith('/branding') && "text-primary font-bold")}><Link href="/branding">Branding & Details</Link></li>
                             <li className={cn("text-sm", pathname.startsWith('/settings/year-end') && "text-primary font-bold")}><Link href="/settings/year-end">Year End Process</Link></li>
                        </ul>
                    </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Logout</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
            </nav>
        </TooltipProvider>
    </aside>
  );
}
