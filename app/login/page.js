'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginUser } from '@/store/authSlice';
import AuthGuard from '@/components/AuthGuard';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await dispatch(loginUser(form));
      if (result.type === 'auth/loginUser/rejected') {
        throw new Error(result.payload || 'Invalid email or password');
      }
      router.push('/feed');
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
          <div className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-4 text-2xl font-black tracking-tight">Social Connect</div>
              <p className="max-w-sm text-sm text-slate-300">Stay close to the people and moments that matter most.</p>
            </div>
            <div className="space-y-2 text-sm text-slate-200">
              <div>• Follow friends and creators</div>
              <div>• Share everyday moments</div>
              <div>• Manage private requests</div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome back</div>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  placeholder="••••••••••••"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Don’t have an account?{' '}
              <Link href="/register" className="font-semibold text-slate-900">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
