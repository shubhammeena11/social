'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';

export default function SavedPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const response = await api.get('/api/posts/saved-posts');
      const payload = extractApiData(response);
      setPosts(payload.posts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6 pb-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Saved posts</h1>
          <p className="mt-1 text-sm text-slate-500">Your saved ideas, moments, and inspiration.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading saved posts...</div>
        ) : posts.length ? (
          posts.map((post) => <PostCard key={post._id} post={post} currentUser={currentUser} onChanged={fetchSaved} onDeleted={() => fetchSaved()} />)
        ) : (
          <EmptyState title="Nothing saved yet" description="Save posts you want to come back to later." />
        )}
      </div>
    </AuthGuard>
  );
}
