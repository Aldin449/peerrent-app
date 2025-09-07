'use client'
import { useMemo } from 'react'

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

interface TrustBadge {
  type: 'email_verified' | 'phone_verified' | 'location_verified' | 'high_rating' | 'long_member' | 'frequent_user' | 'trusted_owner' | 'verified_seller'
  label: string
  description: string
}

interface TrustScoreData {
  score: number
  badges: TrustBadge[]
  factors: {
    emailVerification: number
    phoneVerification: number
    locationVerification: number
    ratingQuality: number
    membershipDuration: number
    activityLevel: number
    itemOwnership: number
  }
}

export const useTrustScore = (userData: UserData): TrustScoreData => {
  return useMemo(() => {
    const {
      emailVerified,
      phoneNumber,
      location,
      averageRating,
      ratingsCount,
      createdAt,
      itemCount = 0,
      bookingCount = 0,
      messageCount = 0
    } = userData

    // Calculate individual factors (0-100 each)
    const emailVerification = emailVerified ? 100 : 0
    const phoneVerification = phoneNumber ? 100 : 0
    const locationVerification = location ? 100 : 0
    
    // Rating quality (based on average rating and number of ratings)
    const ratingQuality = (() => {
      if (!averageRating || ratingsCount === 0) return 0
      if (ratingsCount < 3) return Math.round(averageRating * 20) // Max 100 for 5 stars
      if (ratingsCount < 10) return Math.round(averageRating * 18) // Slightly lower for fewer ratings
      return Math.round(averageRating * 20) // Full score for 10+ ratings
    })()

    // Membership duration (months since joining)
    const membershipDuration = (() => {
      if (!createdAt) return 0
      const joinDate = new Date(createdAt)
      const now = new Date()
      const monthsDiff = (now.getFullYear() - joinDate.getFullYear()) * 12 + 
                        (now.getMonth() - joinDate.getMonth())
      
      if (monthsDiff >= 24) return 100 // 2+ years
      if (monthsDiff >= 12) return 80  // 1+ year
      if (monthsDiff >= 6) return 60   // 6+ months
      if (monthsDiff >= 3) return 40   // 3+ months
      return 20 // Less than 3 months
    })()

    // Activity level (based on total interactions)
    const totalActivity = itemCount + bookingCount + messageCount
    const activityLevel = (() => {
      if (totalActivity >= 50) return 100
      if (totalActivity >= 25) return 80
      if (totalActivity >= 10) return 60
      if (totalActivity >= 5) return 40
      if (totalActivity >= 1) return 20
      return 0
    })()

    // Item ownership (based on number of items listed)
    const itemOwnership = (() => {
      if (itemCount >= 10) return 100
      if (itemCount >= 5) return 80
      if (itemCount >= 3) return 60
      if (itemCount >= 1) return 40
      return 0
    })()

    // Calculate overall trust score (weighted average)
    const weights = {
      emailVerification: 0.20,
      phoneVerification: 0.15,
      locationVerification: 0.10,
      ratingQuality: 0.25,
      membershipDuration: 0.15,
      activityLevel: 0.10,
      itemOwnership: 0.05
    }

    const score = Math.round(
      emailVerification * weights.emailVerification +
      phoneVerification * weights.phoneVerification +
      locationVerification * weights.locationVerification +
      ratingQuality * weights.ratingQuality +
      membershipDuration * weights.membershipDuration +
      activityLevel * weights.activityLevel +
      itemOwnership * weights.itemOwnership
    )

    // Determine badges based on criteria
    const badges: TrustBadge[] = []

    if (emailVerified) {
      badges.push({
        type: 'email_verified',
        label: 'Email potvrđen',
        description: 'Email adresa je verificirana'
      })
    }

    if (phoneNumber) {
      badges.push({
        type: 'phone_verified',
        label: 'Telefon potvrđen',
        description: 'Broj telefona je dostupan'
      })
    }

    if (location) {
      badges.push({
        type: 'location_verified',
        label: 'Lokacija potvrđena',
        description: 'Lokacija je navedena'
      })
    }

    if (averageRating && averageRating >= 4.0 && ratingsCount >= 3) {
      badges.push({
        type: 'high_rating',
        label: 'Visoka ocjena',
        description: `Prosječna ocjena ${averageRating.toFixed(1)}/5`
      })
    }

    if (createdAt) {
      const joinDate = new Date(createdAt)
      const now = new Date()
      const monthsDiff = (now.getFullYear() - joinDate.getFullYear()) * 12 + 
                        (now.getMonth() - joinDate.getMonth())
      
      if (monthsDiff >= 12) {
        badges.push({
          type: 'long_member',
          label: 'Dugogodišnji član',
          description: `Član ${monthsDiff >= 24 ? 'više od 2 godine' : 'više od 1 godine'}`
        })
      }
    }

    if (totalActivity >= 10) {
      badges.push({
        type: 'frequent_user',
        label: 'Aktivan korisnik',
        description: `${totalActivity} aktivnosti na platformi`
      })
    }

    if (itemCount >= 3 && averageRating && averageRating >= 3.5) {
      badges.push({
        type: 'trusted_owner',
        label: 'Pouzdan vlasnik',
        description: `${itemCount} predmeta, ocjena ${averageRating.toFixed(1)}/5`
      })
    }

    if (itemCount >= 5 && averageRating && averageRating >= 4.0 && ratingsCount >= 5) {
      badges.push({
        type: 'verified_seller',
        label: 'Verificirani prodavač',
        description: 'Visokokvalitetni prodavač'
      })
    }

    return {
      score,
      badges,
      factors: {
        emailVerification,
        phoneVerification,
        locationVerification,
        ratingQuality,
        membershipDuration,
        activityLevel,
        itemOwnership
      }
    }
  }, [userData])
}
