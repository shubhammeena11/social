'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import PostCard from '@/components/PostCard';
import CommentThread from '@/components/CommentThread';

export default function PostDetailPage() {
  const { postId } = useParams();
  const currentUser = useSelector((state) => state.auth.user);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    try {
      const response = await api.get(`/api/posts/${postId}`);
      const payload = extractApiData(response);
      setPost(payload.post || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId, fetchPost]);

  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-24">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading post...</div>
        ) : post ? (
          <>
            <PostCard post={post} currentUser={currentUser} onChanged={fetchPost} onDeleted={() => {}} />
            <CommentThread postId={postId} commentsEnabled={post.commentsEnabled !== false} currentUser={currentUser} />
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">This post could not be loaded.</div>
        )}
      </div>
    </AuthGuard>
  );
}
