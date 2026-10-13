'use client';

import { useEffect, useState } from 'react';
import { api, extractApiData } from '@/lib/api/client';
import AuthGuard from '@/components/AuthGuard';
import NotificationList from '@/components/NotificationList';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications?page=1&limit=20');
      const payload = extractApiData(response);
      setNotifications(payload.notifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6 pb-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading notifications...</div>
        ) : (
          <NotificationList notifications={notifications} onRefresh={fetchNotifications} />
        )}
      </div>
    </AuthGuard>
  );
}
