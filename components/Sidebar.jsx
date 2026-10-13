'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Home, Search, PlusSquare, Bell, Bookmark, User, LogOut, ShieldCheck } from 'lucide-react';
import { logoutUser } from '@/store/authSlice';
import UserAvatar from './UserAvatar';

const navItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/create', label: 'Create', icon: PlusSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/requests', label: 'Requests', icon: ShieldCheck },
];

export default function Sidebar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  const profileHref = user?.username ? `/profile/${user.username}` : '/login';

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white/80 p-4 backdrop-blur xl:block">
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">S</div>
          <div>
            <div className="text-lg font-bold text-slate-900">Social</div>
            <div className="text-xs text-slate-500">Connect</div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          {user ? (
            <Link
              href={profileHref}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <User size={18} />
              Profile
            </Link>
          ) : null}
        </nav>

        {user ? (
          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-900">{user.name}</div>
                <div className="truncate text-xs text-slate-500">@{user.username}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <div className="mt-auto rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            Sign in to post and connect
          </div>
        )}
      </div>
    </aside>
  );
}
