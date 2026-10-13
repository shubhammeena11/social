'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Lock } from 'lucide-react';
import { api, extractApiData } from '@/lib/api/client';
import UserAvatar from './UserAvatar';
import PostMedia from './PostMedia';
import ConfirmDialog from './ConfirmDialog';

function formatRelativeDate(dateString) {
  if (!dateString) return 'just now';

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.max(1, Math.round(diffMs / 60000));

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(dateString).toLocaleDateString();
}

export default function PostCard({ post, currentUser, onDeleted, onChanged }) {
  const author = post?.author || {};
  const isOwner = currentUser && author && String(author._id || author.id) === String(currentUser.id || currentUser._id);
  const [liked, setLiked] = useState(Boolean(post?.liked));
  const [saved, setSaved] = useState(Boolean(post?.saved));
  const [likeCount, setLikeCount] = useState(Math.max(0, Number(post?.likesCount) || 0));
  const [commentCount, setCommentCount] = useState(post?.commentsCount || 0);
  const [liking, setLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const likeRequestInFlight = useRef(false);

  useEffect(() => {
    setLiked(Boolean(post?.liked));
    setLikeCount(Math.max(0, Number(post?.likesCount) || 0));
  }, [post?._id, post?.liked, post?.likesCount]);

  const handleToggleLike = async () => {
    if (!currentUser || likeRequestInFlight.current) return;
    likeRequestInFlight.current = true;
    setLiking(true);
    const previousLiked = liked;
    const previousCount = likeCount;
    const optimisticLiked = !previousLiked;
    setLiked(optimisticLiked);
    setLikeCount(Math.max(0, previousCount + (optimisticLiked ? 1 : -1)));

    try {
      const method = liked ? 'delete' : 'post';
      const response = await api[method](`/api/posts/${post._id}/like`);
      const payload = extractApiData(response);
      const nextLiked = payload?.liked ?? optimisticLiked;
      setLiked(nextLiked);
      const changed = payload?.changed ?? nextLiked !== previousLiked;
      if (changed && nextLiked !== previousLiked) {
        setLikeCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
      } else if (Number.isFinite(Number(payload?.likesCount))) {
        setLikeCount(Math.max(0, Number(payload.likesCount)));
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      console.error(error);
    } finally {
      likeRequestInFlight.current = false;
      setLiking(false);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (!currentUser) return;
      const method = saved ? 'delete' : 'post';
      const response = await api[method](`/api/posts/${post._id}/save`);
      const payload = extractApiData(response);
      const nextSaved = payload?.saved ?? !saved;
      setSaved(nextSaved);
      if (onChanged) onChanged();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/api/posts/${post._id}`);
      setConfirmingDelete(false);
      if (onDeleted) onDeleted(post._id);
    } catch (error) {
      console.error(error);
      setDeleteError(error.message || 'Could not delete this post.');
    } finally {
      setDeleting(false);
    }
  };

  const privateBadge = author?.isPrivate ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700"><Lock size={10} /> Private</span> : null;

  return (
    <>
    <article className="relative rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex items-center justify-between p-4">
        <Link href={author?.username ? `/profile/${author.username}` : '#'} className="flex items-center gap-3">
          <UserAvatar user={author} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{author?.name || 'Unknown'}</span>
              {privateBadge}
            </div>
            <div className="text-sm text-slate-500">@{author?.username || 'unknown'} • {formatRelativeDate(post?.createdAt)}</div>
          </div>
        </Link>

        {isOwner ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Post options"
              aria-expanded={menuOpen}
              title="Post options"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen ? (
              <div className="absolute right-4 top-14 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteError('');
                    setConfirmingDelete(true);
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete post
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {post?.caption ? <p className="px-4 pb-3 text-sm leading-6 text-slate-700">{post.caption}</p> : null}

      {Array.isArray(post?.media) && post.media.length ? (
        <div className={post.media.length > 1 ? 'grid grid-cols-2 gap-2 px-4 pb-4' : 'px-4 pb-4'}>
          {post.media.map((item, idx) => (
            <PostMedia
              key={`${item.publicId || idx}-${idx}`}
              media={item}
              className={`w-full rounded-2xl ${post.media.length > 1 ? 'aspect-[4/3]' : 'max-h-[min(75vh,720px)]'}`}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleLike}
            disabled={liking || !currentUser}
            aria-pressed={liked}
            className={`inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium transition ${liked ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>

          <Link href={`/post/${post._id}`} className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            <MessageCircle size={16} />
            {commentCount}
          </Link>
        </div>

        <button
          onClick={handleToggleSave}
          className={`inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium ${saved ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
    {confirmingDelete ? (
      <ConfirmDialog
        title="Delete this post?"
        description="This post and its associated comments will be removed. This action cannot be undone."
        error={deleteError}
        busy={deleting}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
      />
    ) : null}
    </>
  );
}
