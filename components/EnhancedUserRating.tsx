'use client'
import React, { useState } from 'react'
import RatingModal from './Modals/RatingModal'
import { Star, Shield, Award, TrendingUp, Users, Calendar, MessageSquare } from 'lucide-react'
import { useGetRatingsReceived } from '../hooks/useRating'

interface Rating {
  id: string;
  fromUser: { 
    name: string | null;
    profilePicture?: string | null;
  };
  rating: number;
  comment: string | null;
  createdAt: Date | string;
}

interface User {
  id: string;
  ratingsCount: number;
  averageRating: number | null;
  createdAt: Date | string | null;
  emailVerified?: boolean;
}

interface EnhancedUserRatingProps {
  user: User;
  ratingsReceived?: Rating[]; // Make this optional since we'll fetch it client-side
}

const EnhancedUserRating = ({ user, ratingsReceived: initialRatings }: EnhancedUserRatingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllRatings, setShowAllRatings] = useState(false);
  
  // Use client-side data fetching for real-time updates
  const { data: ratingsData, isLoading: ratingsLoading } = useGetRatingsReceived({ userId: user.id });
  const ratingsReceived = ratingsData || initialRatings || [];

  // Consistent date formatting function to avoid hydration mismatches
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}.`;
  };

  const formatDateShort = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Calculate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    stars: star,
    count: ratingsReceived.filter((r: Rating) => r.rating === star).length,
    percentage: ratingsReceived.length > 0 
      ? (ratingsReceived.filter((r: Rating) => r.rating === star).length / ratingsReceived.length) * 100 
      : 0
  }));

  // Get recent ratings (last 3)
  const recentRatings = ratingsReceived
    .sort((a: Rating, b: Rating) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, showAllRatings ? ratingsReceived.length : 3);

  // Calculate trust score based on various factors
  const calculateTrustScore = () => {
    let score = 0;
    
    // Base score from ratings
    if (user.averageRating) {
      score += user.averageRating * 20; // Max 100 points
    }
    
    // Bonus for number of ratings
    if (user.ratingsCount >= 10) score += 20;
    else if (user.ratingsCount >= 5) score += 10;
    else if (user.ratingsCount >= 1) score += 5;
    
    // Bonus for email verification
    if (user.emailVerified) score += 10;
    
    // Bonus for account age (older accounts are more trusted)
    if (user.createdAt) {
      const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30); // months
      if (accountAge >= 12) score += 15;
      else if (accountAge >= 6) score += 10;
      else if (accountAge >= 3) score += 5;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const trustScore = calculateTrustScore();
  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 75) return { level: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { level: 'Fair', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'New User', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const trustLevel = getTrustLevel(trustScore);

  // Show loading state while fetching ratings
  if (ratingsLoading && !initialRatings) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RatingModal id={user.id} isOpen={isOpen} setIsOpen={setIsOpen} />
      
      {/* Rating Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {user.averageRating ? user.averageRating.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`${
                        user.averageRating && star <= Math.round(user.averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {user.ratingsCount} {user.ratingsCount === 1 ? 'ocjena' : 'ocjena'}
                </div>
              </div>
              
              <div className="space-y-2">
                {ratingBreakdown.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center space-x-2 text-sm">
                    <span className="w-3 text-gray-600">{stars}</span>
                    <Star size={12} className="text-yellow-400 fill-current" />
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-600 text-xs">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
            >
              <Star size={18} />
              <span>Ostavi recenziju</span>
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trust Score */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Trust Score</div>
                <div className={`text-lg font-bold ${trustLevel.color}`}>
                  {trustScore}/100
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${trustLevel.bg} ${trustLevel.color} inline-block`}>
                  {trustLevel.level}
                </div>
              </div>
            </div>

            {/* Account Age */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Član od</div>
                <div className="text-lg font-bold text-gray-900">
                  {user.createdAt 
                    ? formatDate(user.createdAt)
                    : 'Nepoznato'
                  }
                </div>
                <div className="text-xs text-gray-500">
                  {user.createdAt 
                    ? `${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} mjeseci`
                    : ''
                  }
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Award size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Verifikacija</div>
                <div className="text-lg font-bold text-gray-900">
                  {user.emailVerified ? 'Verificiran' : 'Nije verificiran'}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                  user.emailVerified 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {user.emailVerified ? '✓ Email' : '⏳ Čeka verifikaciju'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MessageSquare size={20} />
              <span>Recenzije</span>
            </h3>
            {ratingsReceived.length > 3 && (
              <button
                onClick={() => setShowAllRatings(!showAllRatings)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showAllRatings ? 'Prikaži manje' : `Prikaži sve (${ratingsReceived.length})`}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {recentRatings.length > 0 ? (
            <div className="space-y-6">
              {recentRatings.map((rating: Rating) => (
                <div key={rating.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {rating.fromUser.profilePicture ? (
                        <img
                          src={rating.fromUser.profilePicture}
                          alt={rating.fromUser.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        rating.fromUser.name?.charAt(0).toUpperCase() || 'A'
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {rating.fromUser.name || 'Anonimni korisnik'}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={`${
                                  star <= rating.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-500 ml-2">
                              {formatDateShort(rating.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {rating.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {rating.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Još nema recenzija
              </h3>
              <p className="text-gray-500 mb-6">
                Budite prvi koji će ostaviti recenziju za ovog korisnika
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Star size={18} />
                <span>Ostavi prvu recenziju</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserRating;
