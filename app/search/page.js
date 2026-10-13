'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchTerm = query.trim();
    if (!searchTerm) {
      setUsers([]);
      setSearching(false);
      setError('');
      return undefined;
    }

    let active = true;
    setSearching(true);
    setError('');
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.get(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
        if (active) setUsers(extractApiData(response)?.users || []);
      } catch (searchError) {
        if (active) {
          setUsers([]);
          setError(searchError.message || 'Profile search failed.');
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl pb-24">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-bold text-slate-900">Search profiles</h1>
          <p className="mt-1 text-sm text-slate-500">Search by any part of a name or username.</p>
        </header>

        <label className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-slate-400">
          <SearchIcon size={19} className="shrink-0 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or username"
            aria-label="Search profiles by name or username"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-5" aria-live="polite">
          {searching ? <p className="py-4 text-sm text-slate-500">Searching...</p> : null}
          {error ? <p role="alert" className="py-4 text-sm text-red-700">{error}</p> : null}
          {!query.trim() ? <p className="py-4 text-sm text-slate-500">Start typing to find a profile.</p> : null}
          {!searching && !error && query.trim() && users.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No profiles found.</p>
          ) : null}
          {users.length ? (
            <ul className="divide-y divide-slate-200">
              {users.map((user) => (
                <li key={user._id}>
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3 py-4 hover:bg-slate-50">
                    <UserAvatar user={user} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span>
                      <span className="block truncate text-sm text-slate-500">@{user.username}</span>
                    </span>
                    <span className="text-xs text-slate-500">{user.isPrivate ? 'Private' : 'Profile'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}