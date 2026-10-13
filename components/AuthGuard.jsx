'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, requireAuth = true }) {
  const router = useRouter();
  const { user, status, bootstrapped } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!bootstrapped) return;

    if (requireAuth && !user) {
      router.replace('/login');
      return;
    }

    if (!requireAuth && user) {
      router.replace('/feed');
    }
  }, [bootstrapped, requireAuth, router, user]);

  if (!bootstrapped && requireAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading your session...
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  return children;
}
