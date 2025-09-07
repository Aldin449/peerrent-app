'use client'
import React from 'react'
import TrustScore from './TrustScore'
import TrustBadge from './TrustBadge'
import { useTrustScore } from '../hooks/useTrustScore'

interface UserData {
  emailVerified: boolean
  phoneNumber?: string | null
  location?: string | null
  averageRating?: number | null
  ratingsCount?: number | null
  createdAt?: Date | string | null
  itemCount?: number
  bookingCount?: number
  messageCount?: number
}

interface TrustIndicatorsProps {
  userData: UserData
  showScore?: boolean
  showBadges?: boolean
  maxBadges?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  userData,
  showScore = true,
  showBadges = true,
  maxBadges = 4,
  size = 'md',
  className = ''
}) => {
  const { score, badges } = useTrustScore(userData)

  // Sort badges by importance/priority
  const sortedBadges = badges.sort((a, b) => {
    const priority = {
      'email_verified': 1,
      'phone_verified': 2,
      'location_verified': 3,
      'verified_seller': 4,
      'trusted_owner': 5,
      'high_rating': 6,
      'long_member': 7,
      'frequent_user': 8
    }
    return (priority[a.type] || 9) - (priority[b.type] || 9)
  })

  const displayBadges = sortedBadges.slice(0, maxBadges)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Trust Score */}
      {showScore && (
        <div className="flex items-center justify-center">
          <TrustScore 
            score={score} 
            size={size}
            showTrend={false}
          />
        </div>
      )}

      {/* Trust Badges */}
      {showBadges && displayBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {displayBadges.map((badge) => (
            <TrustBadge
              key={badge.type}
              type={badge.type}
              size={size}
              showLabel={true}
            />
          ))}
        </div>
      )}

      {/* Show more badges indicator */}
      {showBadges && badges.length > maxBadges && (
        <div className="text-center">
          <span className="text-xs text-gray-500">
            +{badges.length - maxBadges} više indikatora pouzdanosti
          </span>
        </div>
      )}
    </div>
  )
}

export default TrustIndicators
