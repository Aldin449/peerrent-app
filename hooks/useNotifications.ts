'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { pusherClient } from '@/lib/pusher';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  message: string;
  isSeen: boolean;
  bookingId: string;
  itemId: string;
  startDate: string;
  endDate: string;
}

export const useNotifications = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchNotifications = async () => {
      const res = await axios.get('/api/notification');
      setNotifications(res.data);
    };

    fetchNotifications();

    const channel = pusherClient.subscribe(`user-${session.user.email}`);

    const handleNotification = (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
    };

    channel.bind('booking-request', handleNotification);

    return () => {
      channel.unbind('booking-request', handleNotification);
      pusherClient.unsubscribe(`user-${session.user.email}`);
    };
  }, [session?.user?.email]);

  const markAllAsSeen = async () => {
    await axios.patch('/api/notification/mark-as-seen');
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isSeen: true }))
    );
  };

  return {
    notifications,
    unseenCount: notifications.filter((n) => !n.isSeen).length,
    markAllAsSeen,
  };
};
