import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Skeleton za kartice predmeta
export const ItemCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
    <Skeleton className="w-full h-48 mb-4 rounded-lg" />
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-3" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

// Skeleton za grid kartica
export const ItemGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <ItemCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton za profile
export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-6">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton za forme
export const FormSkeleton: React.FC = () => (
  <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border animate-pulse">
    <Skeleton className="h-8 w-48 mx-auto mb-6" />
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded mt-6" />
    </div>
  </div>
);

// Skeleton za navbar
export const NavbarSkeleton: React.FC = () => (
  <nav className="bg-white border-b shadow-sm px-6 py-4 animate-pulse">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4 items-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
    </div>
  </nav>
);

// Default export
const LoadingSkeleton: React.FC = () => <ItemGridSkeleton />;

export default LoadingSkeleton;
