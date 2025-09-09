
import type { ReactNode } from 'react';

// This layout is for pages outside the main authenticated app (e.g., login, signup)
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">{children}</div>
  );
}
