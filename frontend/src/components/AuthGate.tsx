'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, validateSession, clearAuth } = useAuthStore();
  const [forceReady, setForceReady] = useState(false);

  // Fallback: Force ready after 2 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Rehydration timeout, forcing ready state');
        setForceReady(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    // Skip validation on public routes
    const publicRoutes = ['/', '/login', '/register'];
    if (publicRoutes.includes(pathname)) {
      return;
    }

    // Wait for store to finish loading (or force ready)
    if (isLoading && !forceReady) {
      return;
    }

    // Validate session
    const isValid = validateSession();
    
    if (!isValid || !isAuthenticated) {
      console.warn('⚠️ Invalid session in AuthGate, redirecting to login');
      clearAuth();
      router.replace('/login');
    }
  }, [isLoading, forceReady, isAuthenticated, pathname, validateSession, clearAuth, router]);

  if (isLoading && !forceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

