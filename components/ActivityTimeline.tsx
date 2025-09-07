'use client'
import React from 'react'
import { 
  Plus, 
  Calendar, 
  MessageSquare, 
  Star, 
  Heart,
  Clock,
  Package
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { hr } from 'date-fns/locale'

interface ActivityItem {
  id: string
  type: 'item_created' | 'booking_made' | 'message_sent' | 'rating_received' | 'wishlist_added'
  title: string
  description: string
  createdAt: Date | string
  metadata?: {
    itemTitle?: string
    itemId?: string
    bookingId?: string
    rating?: number
    recipientName?: string
  }
}

interface ActivityTimelineProps {
  activities: ActivityItem[]
  isLoading?: boolean
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  activities, 
  isLoading = false 
}) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'item_created':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'booking_made':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-purple-500" />
      case 'rating_received':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'wishlist_added':
        return <Heart className="w-4 h-4 text-red-500" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'item_created':
        return 'border-green-200 bg-green-50'
      case 'booking_made':
        return 'border-blue-200 bg-blue-50'
      case 'message_sent':
        return 'border-purple-200 bg-purple-50'
      case 'rating_received':
        return 'border-yellow-200 bg-yellow-50'
      case 'wishlist_added':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatActivityTime = (date: Date | string) => {
    const activityDate = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(activityDate, { 
      addSuffix: true, 
      locale: hr 
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nema aktivnosti
        </h3>
        <p className="text-gray-500">
          Vaša aktivnost će se prikazati ovdje kada počnete koristiti platformu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Nedavna aktivnost
        </h2>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`relative flex items-start space-x-3 p-4 rounded-lg border-l-4 ${getActivityColor(activity.type)}`}
          >
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
            )}

            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  {activity.title}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatActivityTime(activity.createdAt)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {activity.description}
              </p>

              {/* Metadata */}
              {activity.metadata && (
                <div className="mt-2 text-xs text-gray-500">
                  {activity.metadata.itemTitle && (
                    <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                      {activity.metadata.itemTitle}
                    </span>
                  )}
                  {activity.metadata.rating && (
                    <span className="inline-flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span>{activity.metadata.rating}/5</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActivityTimeline
