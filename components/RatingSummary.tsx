'use client'
import React from 'react'
import { Star, TrendingUp, Users } from 'lucide-react'

interface RatingSummaryProps {
  averageRating: number | null;
  ratingsCount: number | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showTrend?: boolean;
}

const RatingSummary = ({ 
  averageRating, 
  ratingsCount, 
  size = 'md', 
  showCount = true,
  showTrend = false 
}: RatingSummaryProps) => {
  const rating = averageRating || 0;
  const count = ratingsCount || 0;

  const sizeClasses = {
    xs: {
      container: 'text-xs',
      stars: 'w-3 h-3',
      rating: 'text-xs',
      count: 'text-xs'
    },
    sm: {
      container: 'text-sm',
      stars: 'w-3 h-3',
      rating: 'text-sm',
      count: 'text-xs'
    },
    md: {
      container: 'text-base',
      stars: 'w-4 h-4',
      rating: 'text-base',
      count: 'text-sm'
    },
    lg: {
      container: 'text-lg',
      stars: 'w-5 h-5',
      rating: 'text-lg',
      count: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 4.0) return 'text-blue-500';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 3.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`flex items-center space-x-2 ${classes.container}`}>
      {/* Star Rating */}
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={parseInt(classes.stars.split(' ')[0])}
            className={`${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-current drop-shadow-sm'
                : 'text-gray-400'
            } transition-colors duration-200`}
          />
        ))}
      </div>

      {/* Rating Number */}
      <span className={`font-bold ${getRatingColor(rating)} ${classes.rating}`}>
        {rating.toFixed(1)}
      </span>

      {/* Rating Count */}
      {showCount && count > 0 && (
        <span className={`text-gray-500 ${classes.count}`}>
          ({count} {count === 1 ? 'rating' : 'ratings'})
        </span>
      )}

      {/* Rating Text Badge - Smaller for xs size */}
      {rating > 0 && (
        <span className={`${size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'} font-semibold rounded-full ${getRatingColor(rating)} bg-opacity-15 border border-current border-opacity-30 shadow-sm`}>
          {getRatingText(rating)}
        </span>
      )}

      {/* Trend Indicator */}
      {showTrend && count >= 5 && (
        <div className="flex items-center space-x-1 text-green-600">
          <TrendingUp size={12} />
          <span className="text-xs font-medium">Trending</span>
        </div>
      )}
    </div>
  );
};

export default RatingSummary;
