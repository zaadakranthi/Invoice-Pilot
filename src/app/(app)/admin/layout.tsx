import type { ReactNode } from 'react';

// Since the admin section might have a different layout or sidebar in the future,
// we'll give it its own layout file. For now, it will just pass children through.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
