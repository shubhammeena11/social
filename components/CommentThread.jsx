'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, extractApiData } from '@/lib/api/client';
import UserAvatar from './UserAvatar';
import { MoreHorizontal, Send } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

function formatCommentDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CommentThread({ postId, commentsEnabled, currentUser }) {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments?page=1&limit=20`);
      const payload = extractApiData(response);
      setComments(payload.comments || []);
      setTotal(payload.total || 0);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Could not load comments.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) loadComments();
  }, [postId, loadComments]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || !commentsEnabled || !currentUser) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/posts/${postId}/comments`, { text: message.trim() });
      setMessage('');
      await loadComments();
    } catch (error) {
      console.error(error);
      setError(error.message || 'Could not post your comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingComment(true);
    try {
      await api.delete(`/api/comment/${commentId}`);
      setError('');
      setPendingDelete(null);
      await loadComments();
    } catch (error) {
      console.error(error);
      setError(error.message || 'Could not delete the comment.');
    } finally {
      setDeletingComment(false);
    }
  };

  return (
    <section className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-base font-semibold text-slate-900">Comments</h3>
        <span className="text-sm tabular-nums text-slate-500">{total}</span>
      </div>

      {commentsEnabled ? (
        <form onSubmit={handleSubmit} className="flex items-end gap-3 border-b border-slate-100 py-4">
          <UserAvatar user={currentUser} size="sm" />
          <div className="flex min-w-0 flex-1 items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={1000}
              enterKeyHint="send"
              aria-label="Write a comment"
              placeholder="Add a comment..."
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-y rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
            {message.length > 900 ? (
              <span className="pb-2 text-[11px] tabular-nums text-slate-400">{1000 - message.length}</span>
            ) : null}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              aria-label="Post comment"
              title="Post comment"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : (
        <p className="border-b border-slate-100 py-4 text-sm text-slate-500">Comments are turned off for this post.</p>
      )}

      {error ? <p role="alert" className="py-3 text-sm text-red-700">{error}</p> : null}

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="py-4 text-sm text-slate-500">Loading comments...</div>
        ) : comments.length ? (
          comments.map((comment) => (
            <article key={comment._id} className="relative flex gap-3 py-4">
              <UserAvatar user={comment.author} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="truncate text-sm font-semibold text-slate-900">{comment.author?.username ? `@${comment.author.username}` : comment.author?.name || 'User'}</div>
                  <time dateTime={comment.createdAt} className="shrink-0 text-xs text-slate-400">{formatCommentDate(comment.createdAt)}</time>
                  {currentUser && (String(comment.author?._id || comment.author?.id) === String(currentUser.id || currentUser._id)) ? (
                    <div className="relative ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenu((current) => current === comment._id ? null : comment._id)}
                        aria-label="Comment options"
                        aria-expanded={openMenu === comment._id}
                        title="Comment options"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
                      >
                        <MoreHorizontal size={17} />
                      </button>
                      {openMenu === comment._id ? (
                        <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);
                              setError('');
                              setPendingDelete(comment._id);
                            }}
                            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete comment
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.text}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="py-5 text-sm text-slate-500">No comments yet. Start the conversation.</p>
        )}
      </div>
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this comment?"
          description="This comment and its direct replies will be removed. This action cannot be undone."
          error={error}
          busy={deletingComment}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => handleDelete(pendingDelete)}
        />
      ) : null}
    </section>
  );
}
