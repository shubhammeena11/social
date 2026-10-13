'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, extractApiData } from '@/lib/api/client';

export default function FollowButton({ targetUser, currentUser, onChange }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(targetUser?.relationship || 'not_following');
  const requestInFlight = useRef(false);

  useEffect(() => {
    setStatus(targetUser?.relationship || 'not_following');
  }, [targetUser?.relationship]);

  const isOwnProfile = useMemo(() => {
    if (!currentUser || !targetUser) return false;
    const cId = String(currentUser.id || currentUser._id || '');
    const tId = String(targetUser._id || targetUser.id || '');
    return cId && tId && cId === tId;
  }, [currentUser, targetUser]);

  const handleClick = async () => {
    if (!currentUser || isOwnProfile || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    try {
      if (status === 'accepted' || status === 'pending') {
        await api.delete(`/api/users/${targetUser._id}/follow`);
        setStatus('not_following');
      } else {
        const response = await api.post(`/api/users/${targetUser._id}/follow`);
        const payload = extractApiData(response);
        setStatus(payload?.status || 'pending');
      }
      if (onChange) onChange();
    } catch (error) {
      console.error(error);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  const label =
    status === 'accepted'
      ? 'Unfollow'
      : status === 'pending'
        ? 'Requested'
        : 'Follow';

  return (
    <button
      disabled={loading || isOwnProfile || !currentUser}
      onClick={handleClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        status === 'accepted'
          ? 'bg-slate-900 text-white'
          : status === 'pending'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-900 text-white'
      } ${loading ? 'opacity-70' : ''}`}
    >
      {loading ? 'Working...' : label}
    </button>
  );
}
