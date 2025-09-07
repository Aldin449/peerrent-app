import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import prisma from '@/lib/prisma'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')

    // Fetch recent activities from different sources
    const [
      recentItems,
      recentBookings,
      recentMessages,
      recentRatings,
      recentWishlist
    ] = await Promise.all([
      // Items created by user
      prisma.item.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      }),

      // Bookings made by user
      prisma.booking.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          status: true,
          item: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),

      // Messages sent by user
      prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          recipient: {
            select: {
              name: true
            }
          },
          item: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),

      // Ratings received by user
      prisma.userRating.findMany({
        where: { toUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          rating: true,
          createdAt: true,
          fromUser: {
            select: {
              name: true
            }
          }
        }
      }),

      // Items added to wishlist
      prisma.wishlist.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          item: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    ])

    // Transform data into unified activity format
    const activities: Array<{
      id: string
      type: 'item_created' | 'booking_made' | 'message_sent' | 'rating_received' | 'wishlist_added'
      title: string
      description: string
      createdAt: Date | null
      metadata?: {
        itemTitle?: string
        itemId?: string
        bookingId?: string
        rating?: number
        recipientName?: string | null
      }
    }> = []

    // Add item creation activities
    recentItems.forEach(item => {
      activities.push({
        id: `item_${item.id}`,
        type: 'item_created',
        title: 'Dodali ste novi predmet',
        description: `Predmet "${item.title}" je uspješno dodan`,
        createdAt: item.createdAt,
        metadata: {
          itemTitle: item.title,
          itemId: item.id
        }
      })
    })

    // Add booking activities
    recentBookings.forEach(booking => {
      const statusText = {
        PENDING: 'na čekanju',
        APPROVED: 'odobrena',
        REJECTED: 'odbijena',
        CANCELLED: 'otkazana',
        COMPLETED: 'završena'
      }[booking.status] || 'nepoznat'

      activities.push({
        id: `booking_${booking.id}`,
        type: 'booking_made',
        title: 'Napravili ste rezervaciju',
        description: `Rezervacija za "${booking.item.title}" je ${statusText}`,
        createdAt: booking.createdAt,
        metadata: {
          itemTitle: booking.item.title,
          itemId: booking.item.id,
          bookingId: booking.id
        }
      })
    })

    // Add message activities
    recentMessages.forEach(message => {
      activities.push({
        id: `message_${message.id}`,
        type: 'message_sent',
        title: 'Poslali ste poruku',
        description: `Poruka poslana korisniku ${message.recipient.name || 'Anonimni korisnik'} o predmetu "${message.item.title}"`,
        createdAt: message.createdAt,
        metadata: {
          itemTitle: message.item.title,
          itemId: message.item.id,
          recipientName: message.recipient.name
        }
      })
    })

    // Add rating activities
    recentRatings.forEach(rating => {
      activities.push({
        id: `rating_${rating.id}`,
        type: 'rating_received',
        title: 'Dobili ste ocjenu',
        description: `Korisnik ${rating.fromUser.name || 'Anonimni korisnik'} vam je dao ocjenu`,
        createdAt: rating.createdAt,
        metadata: {
          rating: rating.rating
        }
      })
    })

    // Add wishlist activities
    recentWishlist.forEach(wishlist => {
      activities.push({
        id: `wishlist_${wishlist.id}`,
        type: 'wishlist_added',
        title: 'Dodali ste u listu želja',
        description: `Predmet "${wishlist.item.title}" je dodan u vašu listu želja`,
        createdAt: wishlist.createdAt,
        metadata: {
          itemTitle: wishlist.item.title,
          itemId: wishlist.item.id
        }
      })
    })

    // Sort all activities by creation date (most recent first)
    activities.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )

    // Return only the requested number of activities
    return NextResponse.json({
      activities: activities.slice(0, limit)
    })

  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    )
  }
}
