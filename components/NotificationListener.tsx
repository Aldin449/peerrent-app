'use client';

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusherClient';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

const NotificationListener = () => {
  const { data: session } = useSession();

  useEffect(() => {
    console.log('📡 Pokušaj povezivanja na kanal:', session?.user?.email);

    if (!session?.user?.email) return;

    const channelName = `user-${session.user.email}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {});

    channel.bind('booking-request', (data: any) => {
        toast.info(`📩 Novi zahtjev za iznajmljivanje od ${data.senderName || 'korisnika'}!`);
    });

    channel.bind('booking-updated', (data: any) => {
      toast.success(`✅ Rezervacija ${data.bookingId} je ažurirana!`);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [session?.user?.email]);

  return null; // nije vizualna komponenta
};

export default NotificationListener;
