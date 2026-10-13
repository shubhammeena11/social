'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Moon, Sun, Users } from 'lucide-react';
import { api, extractApiData } from '@/lib/api/client';
import { logoutUser } from '@/store/authSlice';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';

const visibilityOptions = [
  { value: 'everyone', label: 'Everyone', description: 'Anyone can see your posts.' },
  { value: 'followers', label: 'Followers', description: 'Only people who follow you can see your posts.' },
  { value: 'custom', label: 'Selected followers', description: 'Choose specific people from your followers.' },
];

export default function SettingsPage() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState({ postVisibility: 'everyone', postAudience: [] });
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('social-theme') === 'dark' ? 'dark' : 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  useEffect(() => {
    if (!user?._id) return undefined;
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const [settingsResponse, followersResponse] = await Promise.all([
          api.get('/api/settings'),
          api.get(`/api/users/${user._id}/followers?page=1&limit=50`),
        ]);
        const settingsData = extractApiData(settingsResponse)?.settings;
        const firstPage = extractApiData(followersResponse);
        const followerPages = Math.ceil((firstPage?.total || 0) / 50);
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, followerPages - 1) }, (_, index) =>
            api.get(`/api/users/${user._id}/followers?page=${index + 2}&limit=50`)
          )
        );

        if (!active) return;
        setSettings({
          postVisibility: settingsData?.postVisibility || 'everyone',
          postAudience: settingsData?.postAudience || [],
        });
        setFollowers([
          ...(firstPage?.followers || []),
          ...remainingPages.flatMap((response) => extractApiData(response)?.followers || []),
        ]);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Could not load your settings.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      active = false;
    };
  }, [user?._id]);

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('social-theme', nextTheme);
  };

  const toggleFollower = (followerId) => {
    setSettings((current) => {
      const audience = new Set(current.postAudience);
      if (audience.has(followerId)) audience.delete(followerId);
      else audience.add(followerId);
      return { ...current, postAudience: [...audience] };
    });
    setSaveMessage('');
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveMessage('');
    setError('');
    try {
      const response = await api.patch('/api/settings', settings);
      const savedSettings = extractApiData(response)?.settings;
      if (savedSettings) setSettings(savedSettings);
      setSaveMessage('Post audience saved.');
    } catch (saveError) {
      setError(saveError.message || 'Could not save your post audience.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl space-y-8 pb-24">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-semibold uppercase text-slate-500">Your account</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Settings</h1>
        </header>

        <section aria-labelledby="appearance-heading" className="border-b border-slate-200 pb-8">
          <div className="mb-4">
            <h2 id="appearance-heading" className="text-lg font-semibold text-slate-900">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500">Choose how Social looks on this device.</p>
          </div>
          <div className="inline-flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Theme">
            <button
              type="button"
              aria-pressed={theme === 'light'}
              onClick={() => changeTheme('light')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              type="button"
              aria-pressed={theme === 'dark'}
              onClick={() => changeTheme('dark')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${theme === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600'}`}
            >
              <Moon size={16} /> Dark
            </button>
          </div>
        </section>

        <section aria-labelledby="audience-heading" className="border-b border-slate-200 pb-8">
          <div className="mb-4">
            <h2 id="audience-heading" className="text-lg font-semibold text-slate-900">Default post audience</h2>
            <p className="mt-1 text-sm text-slate-500">This applies to new posts. Existing posts keep their current audience.</p>
          </div>

          <fieldset disabled={loading || saving} className="space-y-3">
            <legend className="sr-only">Who can see your posts</legend>
            {visibilityOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-3 py-2">
                <input
                  type="radio"
                  name="postVisibility"
                  value={option.value}
                  checked={settings.postVisibility === option.value}
                  onChange={() => {
                    setSettings((current) => ({ ...current, postVisibility: option.value }));
                    setSaveMessage('');
                  }}
                  className="mt-1 accent-slate-900"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {settings.postVisibility === 'custom' ? (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Users size={16} />
                {settings.postAudience.length} selected
              </div>
              {loading ? <p className="text-sm text-slate-500">Loading followers...</p> : followers.length ? (
                <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {followers.map((follower) => (
                    <label key={follower._id} className="flex cursor-pointer items-center gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={settings.postAudience.includes(follower._id)}
                        onChange={() => toggleFollower(follower._id)}
                        className="accent-slate-900"
                      />
                      <UserAvatar user={follower} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{follower.name}</span>
                        <span className="block truncate text-xs text-slate-500">@{follower.username}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">You do not have any followers yet.</p>}
            </div>
          ) : null}

          {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
          {saveMessage ? <p role="status" className="mt-4 text-sm text-emerald-700">{saveMessage}</p> : null}
          <button
            type="button"
            onClick={saveSettings}
            disabled={loading || saving}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save audience'}
          </button>
        </section>

        <section aria-labelledby="account-heading">
          <div className="mb-4">
            <h2 id="account-heading" className="text-lg font-semibold text-slate-900">Account</h2>
            <p className="mt-1 text-sm text-slate-500">Signed in as @{user?.username}.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </section>
      </div>
    </AuthGuard>
  );
}