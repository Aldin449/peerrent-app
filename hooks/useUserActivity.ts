'use client'
import { useQuery } from '@tanstack/react-query'

interface ActivityItem {
  id: string
  type: 'item_created' | 'booking_made' | 'message_sent' | 'rating_received' | 'wishlist_added'
  title: string
  description: string
  createdAt: string
  metadata?: {
    itemTitle?: string
    itemId?: string
    bookingId?: string
    rating?: number
    recipientName?: string
  }
}

interface UserActivityResponse {
  activities: ActivityItem[]
}

const fetchUserActivity = async (limit: number = 10): Promise<UserActivityResponse> => {
  const response = await fetch(`/api/profile/activity?limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch user activity')
  }
  
  return response.json()
}

export const useUserActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ['userActivity', limit],
    queryFn: () => fetchUserActivity(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export type { ActivityItem }
