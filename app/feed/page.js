'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import PostComposer from '@/components/PostComposer';

export default function FeedPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts?page=1&limit=20');
      const payload = extractApiData(response);
      setPosts(payload.posts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-24">
        <PostComposer onPosted={fetchPosts} />

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading your feed...</div>
        ) : posts.length ? (
          posts.map((post) => (
            <PostCard key={post._id} post={post} currentUser={currentUser} onChanged={fetchPosts} onDeleted={() => fetchPosts()} />
          ))
        ) : (
          <EmptyState title="Your feed is empty" description="Follow people or create your first post to get started." />
        )}
      </div>
    </AuthGuard>
  );
}
