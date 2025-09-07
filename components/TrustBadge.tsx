'use client'
import React from 'react'
import { 
  Shield, 
  CheckCircle, 
  Star, 
  Clock, 
  Mail,
  Phone,
  MapPin,
  Award,
  Zap
} from 'lucide-react'

interface TrustBadgeProps {
  type: 'email_verified' | 'phone_verified' | 'location_verified' | 'high_rating' | 'long_member' | 'frequent_user' | 'trusted_owner' | 'verified_seller'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ 
  type, 
  size = 'md', 
  showLabel = true,
  className = ''
}) => {
  const badgeConfig = {
    email_verified: {
      icon: Mail,
      label: 'Email potvrđen',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200'
    },
    phone_verified: {
      icon: Phone,
      label: 'Telefon potvrđen',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200'
    },
    location_verified: {
      icon: MapPin,
      label: 'Lokacija potvrđena',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200'
    },
    high_rating: {
      icon: Star,
      label: 'Visoka ocjena',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200'
    },
    long_member: {
      icon: Clock,
      label: 'Dugogodišnji član',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      borderColor: 'border-indigo-200'
    },
    frequent_user: {
      icon: Zap,
      label: 'Aktivan korisnik',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200'
    },
    trusted_owner: {
      icon: Shield,
      label: 'Pouzdan vlasnik',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      borderColor: 'border-emerald-200'
    },
    verified_seller: {
      icon: Award,
      label: 'Verificirani prodavač',
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      borderColor: 'border-rose-200'
    }
  }

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      label: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      label: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      label: 'text-base'
    }
  }

  const config = badgeConfig[type]
  const sizes = sizeClasses[size]
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center space-x-1.5 ${sizes.container} ${config.bgColor} ${config.borderColor} border rounded-full ${className}`}>
      <Icon className={`${sizes.icon} ${config.color}`} />
      {showLabel && (
        <span className={`${sizes.label} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

export default TrustBadge