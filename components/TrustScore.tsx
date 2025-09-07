'use client'
import React from 'react'
import { Shield, TrendingUp, TrendingDown } from 'lucide-react'

interface TrustScoreProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  trendDirection?: 'up' | 'down' | 'stable'
  className?: string
}

const TrustScore: React.FC<TrustScoreProps> = ({ 
  score, 
  size = 'md', 
  showTrend = false,
  trendDirection = 'stable',
  className = ''
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Izvrsno'
    if (score >= 80) return 'Vrlo dobro'
    if (score >= 70) return 'Dobro'
    if (score >= 60) return 'Zadovoljavajuće'
    if (score >= 40) return 'Osnovno'
    return 'Nedovoljno'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200'
    if (score >= 60) return 'bg-yellow-100 border-yellow-200'
    if (score >= 40) return 'bg-orange-100 border-orange-200'
    return 'bg-red-100 border-red-200'
  }

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      score: 'text-sm font-bold',
      label: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      score: 'text-base font-bold',
      label: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      score: 'text-lg font-bold',
      label: 'text-base'
    }
  }

  const sizes = sizeClasses[size]
  const color = getScoreColor(score)
  const bgColor = getScoreBgColor(score)
  const label = getScoreLabel(score)

  return (
    <div className={`inline-flex items-center space-x-2 ${sizes.container} ${bgColor} border rounded-full ${className}`}>
      <Shield className={`${sizes.icon} ${color}`} />
      
      <div className="flex items-center space-x-1">
        <span className={`${sizes.score} ${color}`}>
          {score}
        </span>
        <span className={`${sizes.label} ${color} opacity-75`}>
          /100
        </span>
      </div>

      {showTrend && (
        <div className="flex items-center">
          {trendDirection === 'up' && (
            <TrendingUp className={`${sizes.icon} text-green-600`} />
          )}
          {trendDirection === 'down' && (
            <TrendingDown className={`${sizes.icon} text-red-600`} />
          )}
        </div>
      )}

      <span className={`${sizes.label} ${color} font-medium`}>
        {label}
      </span>
    </div>
  )
}

export default TrustScore
