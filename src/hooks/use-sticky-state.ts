
'use client';

import { useState, useEffect } from 'react';

// NOTE: This hook is deprecated for workspace data.
// It is now only used for global, non-workspace-specific state like `users`.
// For workspace-specific data, see the manual localStorage logic in `data-context.tsx`.

function useStickyState<T>(defaultValue: T, key: string) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
        const stickyValue = window.localStorage.getItem(key);
        return stickyValue !== null && stickyValue !== 'undefined'
          ? JSON.parse(stickyValue)
          : defaultValue;
    } catch (error) {
        console.error("Error parsing sticky state from localStorage", error);
        return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        // This hook is now read-only to prevent conflicts with Firestore.
        // Data is now persisted in Firestore via the DataContext.
        // window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export default useStickyState;
