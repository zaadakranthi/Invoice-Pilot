
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { DataProvider } from '@/context/data-context';
import { PwaInstaller } from '@/components/pwa-installer';

export const metadata: Metadata = {
  title: 'InvoicePilot',
  description: 'Free GST Invoicing Web Application',
  manifest: '/manifest.json',
};

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <DataProvider>
          {children}
          <Toaster />
          <PwaInstaller />
        </DataProvider>
      </body>
    </html>
  );
}
