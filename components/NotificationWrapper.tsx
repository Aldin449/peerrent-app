'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusherClient';

interface Notification {
  id: string;
  message: string;
  isSeen: boolean;
  bookingId: string;
  itemId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function NotificationWrapper() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unseen count on mount and periodically
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchUnseenCount = async () => {
      try {
        const response = await axios.get('/api/notification');
        const unseen = response.data.filter((n: Notification) => !n.isSeen).length;
        setUnseenCount(unseen);
        console.log('Unseen notifications:', unseen); // Debug log
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    // Fetch immediately
    fetchUnseenCount();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchUnseenCount, 30000);

    return () => clearInterval(interval);
  }, [session?.user?.email]);

  // Real-time notification updates
  useEffect(() => {
    if (!session?.user?.email) return;

    const channelName = `user-${session.user.email}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('booking-request', (data: any) => {
      // Increment unseen count when new notification arrives
      setUnseenCount(prev => prev + 1);
      console.log('New booking request received, count updated');
    });

    channel.bind('booking-status-update', (data: any) => {
      // Increment unseen count when booking status update arrives
      setUnseenCount(prev => prev + 1);
      console.log('Booking status update received, count updated');
    });

    return () => { 
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [session?.user?.email]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/notification');
      setNotifications(response.data);
      // Update unseen count after fetching notifications
      const unseen = response.data.filter((n: Notification) => !n.isSeen).length;
      setUnseenCount(unseen);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = async () => {
    const next = !showDropdown;
    setShowDropdown(next);

    if (next) {
      await fetchNotifications();
      if (unseenCount > 0) {
        // Mark all as seen when dropdown opens
        try {
          await axios.patch('/api/notification/mark-as-seen');
          setUnseenCount(0);
        } catch (error) {
          console.error('Failed to mark notifications as seen:', error);
        }
      }
    }
  };

  if (!session?.user) {
    return null;
  }

  console.log(notifications);

  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="relative">
        <Bell className="w-6 h-6 text-gray-700" />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 p-3 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500">Učitavanje...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500">Nema notifikacija</p>
          ) : (
            <>
              {notifications.map((notification) => (
                <div key={notification.id} className="text-sm border-b pb-2">
                  <p className="text-gray-800 font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {notification.startDate && notification.endDate && (
                      <>
                        {format(new Date(notification.startDate), 'dd.MM.yyyy')} -{' '}
                        {format(new Date(notification.endDate), 'dd.MM.yyyy')}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
} 