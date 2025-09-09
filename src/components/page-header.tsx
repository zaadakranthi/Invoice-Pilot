
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MainHeader } from './main-header';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, backHref, children }: PageHeaderProps) {
  return (
    <>
      <MainHeader />
      <header className="p-4 sm:p-6 lg:p-8 pt-0 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {backHref && (
            <Button variant="outline" size="icon" asChild className="hidden sm:inline-flex">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {children && <div>{children}</div>}
      </header>
    </>
  );
}
