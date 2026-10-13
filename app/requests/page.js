'use client';

import { useEffect, useState } from 'react';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';
import EmptyState from '@/components/EmptyState';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/follow-request?page=1&limit=20');
      const payload = extractApiData(response);
      setRequests(payload.requests || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (requestId, action) => {
    try {
      await api.patch(`/api/follow-request/${requestId}`, { action });
      fetchRequests();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6 pb-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Follow requests</h1>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading requests...</div>
        ) : requests.length ? (
          <div className="space-y-3">
            {requests.map((request) => {
              const follower = request.follower || {};
              return (
                <div key={request._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={follower} size="md" />
                    <div>
                      <div className="font-semibold text-slate-900">{follower.name || 'Unknown user'}</div>
                      <div className="text-sm text-slate-500">@{follower.username}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(request._id, 'accept')} className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">Accept</button>
                    <button onClick={() => handleDecision(request._id, 'reject')} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No pending requests" description="When someone requests to follow you, they’ll appear here." />
        )}
      </div>
    </AuthGuard>
  );
}
