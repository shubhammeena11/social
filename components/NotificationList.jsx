'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api/client';

function formatRelativeDate(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.max(1, Math.round(diffMs / 60000));

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function NotificationList({ notifications, onRefresh }) {
  const [marking, setMarking] = useState(false);

  const markRead = async (notificationId, isRead) => {
    setMarking(true);
    try {
      await api.patch(`/api/notifications/${notificationId}`, { isRead });
      onRefresh?.();
    } catch (error) {
      console.error(error);
    } finally {
      setMarking(false);
    }
  };

  if (!notifications.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">No notifications yet.</div>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const actor = notification.actor || {};
        const link = notification.post ? `/post/${notification.post}` : actor.username ? `/profile/${actor.username}` : '#';

        return (
          <div key={notification._id} className={`rounded-2xl border p-4 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-slate-900 bg-slate-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link href={link} className="block text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{actor.name || 'Someone'}</span>{' '}
                  <span>
                    {notification.type === 'like' && 'liked your post.'}
                    {notification.type === 'comment' && 'commented on your post.'}
                    {notification.type === 'comment_reply' && 'replied to a comment on your post.'}
                    {notification.type === 'follow_request' && 'sent you a follow request.'}
                    {notification.type === 'new_follower' && 'started following you.'}
                    {notification.type === 'follow_accepted' && 'accepted your follow request.'}
                  </span>
                </Link>
                <div className="mt-1 text-xs text-slate-500">{formatRelativeDate(notification.createdAt)}</div>
              </div>

              <button
                onClick={() => markRead(notification._id, !notification.isRead)}
                disabled={marking}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] uppercase tracking-wide text-slate-600"
              >
                {notification.isRead ? 'Unread' : 'Mark read'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
