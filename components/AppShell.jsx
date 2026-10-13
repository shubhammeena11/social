'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Bookmark, Compass, Home, PlusSquare, Search, Settings } from 'lucide-react';
import { fetchMe } from '@/store/authSlice';
import Sidebar from './Sidebar';
import UserAvatar from './UserAvatar';

const mobileNav = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/create', label: 'Create', icon: PlusSquare },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    const theme = window.localStorage.getItem('social-theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <Sidebar />

        <div className="min-h-screen min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Link href="/feed" className="text-lg font-bold tracking-tight text-slate-900">Social</Link>
              </div>

              <div className="flex items-center gap-2">
                {user ? (
                  <Link href={`/profile/${user.username}`} className="hidden md:block">
                    <UserAvatar user={user} size="sm" />
                  </Link>
                ) : (
                  <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Login</Link>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 pb-24 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-2 py-2 backdrop-blur xl:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-7 gap-0">
          {mobileNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 rounded-xl px-0 py-2 text-[9px] font-medium text-slate-600"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
