// Import React's Suspense for loading states and Next.js components for navigation and images
// Suspense allows us to show loading states while data is being fetched
import { Suspense } from 'react';
// Import our custom Pagination component for navigating between pages
import Pagination from './Pagination';
// Import loading component to show while data is loading
import LoadingComponent from './Loader';
// Next.js Image component for optimized image loading
import Image from 'next/image';
// Next.js Link component for client-side navigation
import Link from 'next/link';
// Import Prisma database client to query the database
import prisma from '../src/lib/prisma';
// Import BookingStatus enum from Prisma for type safety
import { BookingStatus } from '@prisma/client';

import ItemCard from './ItemCard';

// Define the structure of an item object
// This ensures TypeScript knows what properties each item has
interface Item {
  id: string;                    // Unique identifier for the item
  title: string;                 // Name/title of the item
  description: string;           // Detailed description
  location: string;              // Where the item is located
  pricePerDay: number;           // Cost per day to rent
  ownerId: string;               // ID of the user who owns this item
  images: string[];              // Array of image URLs
  user: {                        // Information about the owner
    name: string | null;         // Owner's display name
    email: string;               // Owner's email
  };
  createdAt: string | null;      // When the item was created
}

// Define the props that this component expects
// searchParams is a Promise because Next.js 15 makes it async
interface PublicItemListProps {
  searchParams?: Promise<{
    page?: string;               // Current page number from URL
    search?: string;             // Search term from URL
    minPrice?: string;           // Minimum price from URL
    maxPrice?: string;           // Maximum price from URL
    category?: string;           // Category filter from URL
    sortBy?: string;             // Sort by field (price, date, title)
    sortOrder?: string;          // Sort order (asc, desc)
  }>;
}

// Function to fetch items from the database with pagination and search
// This is an async function because database operations take time
async function getItems(page: number, search: string, minPrice?: string, maxPrice?: string, category?: string, sortBy?: string, sortOrder?: string) {
  // AUTOMATIC CLEANUP: Return expired items to available status
  // This ensures items can be re-rented after their rental period ends
  // Items are considered expired if their booking end date has passed
  try {
    // Find all items that have approved bookings that ended in the past
    const expiredItems = await prisma.item.findMany({
      where: {
        Booking: {
          some: {
            status: 'APPROVED',
            endDate: { lt: new Date() } // End date is in the past
          }
        }
      },
      select: { id: true } // Only get the IDs, we don't need other data
    });

    // If there are expired items, return them to available status
    if (expiredItems.length > 0) {
      // Mark items as available again (not rented)
      await prisma.item.updateMany({
        where: { id: { in: expiredItems.map(item => item.id) } },
        data: { isRented: false }
      });

      // Mark expired bookings as completed
      await prisma.booking.updateMany({
        where: {
          itemId: { in: expiredItems.map(item => item.id) },
          status: 'APPROVED',
          endDate: { lt: new Date() }
        },
        data: {
          status: 'COMPLETED',
          isCompleted: true,
          completedAt: new Date()
        }
      });

      console.log(`Auto-returned ${expiredItems.length} expired items to available status from PublicItemList`);
    }
  } catch (error) {
    console.error('Error in automatic cleanup:', error);
  }

  // Pagination settings: how many items to show per page
  const limit = 6;
  // Calculate how many items to skip (for pagination)
  const skip = (page - 1) * limit;

  // Build the database query conditions based on search term and filters
  const whereConditions: any[] = [];
  
  // Add search condition
  if (search.trim()) {
    whereConditions.push({
      OR: [
        { title: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }
  
  // Add price range conditions
  if (minPrice || maxPrice) {
    const priceCondition: any = {};
    if (minPrice) priceCondition.gte = parseFloat(minPrice);
    if (maxPrice) priceCondition.lte = parseFloat(maxPrice);
    whereConditions.push({ pricePerDay: priceCondition });
  }
  
  // Add category condition
  if (category) {
    whereConditions.push({ category });
  }
  
  // Always exclude items that have active bookings (not available)
  whereConditions.push({
    NOT: {
      Booking: {
        some: {
          status: BookingStatus.APPROVED,
          AND: [
            { startDate: { lte: new Date() } }, // Booking started before or on today
            { endDate: { gte: new Date() } }    // Booking ends after or on today
          ]
        }
      }
    }
  });
  
  // Always exclude items from deleted users
  whereConditions.push({
    user: { isDeleted: false }
  });

  const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Build sorting options
  const orderBy: any = {};
  switch (sortBy) {
    case 'price':
      orderBy.pricePerDay = sortOrder || 'asc';
      break;
    case 'date':
      orderBy.createdAt = sortOrder || 'desc';
      break;
    case 'title':
      orderBy.title = sortOrder || 'asc';
      break;
    default:
      orderBy.createdAt = 'desc';
  }

  // Fetch items and total count simultaneously for better performance
  // Promise.all runs both queries in parallel instead of one after another
  const [items, total] = await Promise.all([
    // Get the actual items with pagination
    prisma.item.findMany({
      where: whereClause,        // Apply our search and availability filters
      skip,                      // Skip items for pagination
      take: limit,               // Take only 6 items per page
      orderBy,                   // Use dynamic sorting
      include: {                 // Include related user data
        user: {
          select: { name: true, email: true, _count: { select: { item: true, Booking: true, messagesSent: true } } },
        },
      },
    }),
    // Count total items for pagination calculation
    prisma.item.count({
      where: whereClause,
    }),
  ]);

  // Return processed data
  return {
    items: items.map(item => ({
      ...item,
      // Parse the JSON string of images back into an array
      images: item.images ? JSON.parse(item.images) : [],
      // Convert date to ISO string for consistent formatting
      createdAt: item.createdAt?.toISOString() || null,
      user: item.user, // Ensure user property is included
    })),
    total,                      // Total number of items (for pagination)
    totalPages: Math.ceil(total / limit), // Calculate total pages needed
  };
}

// Main component that displays the list of available items
// This is an async component because it fetches data from the database
export default async function PublicItemList({ searchParams }: PublicItemListProps) {
  // Wait for searchParams to resolve (Next.js 15 makes this async)
  const params = await searchParams;
  // Get current page from URL, default to page 1 if not specified
  const page = parseInt(params?.page || '1', 10) || 1;
  // Get search term from URL, default to empty string if not specified
  const search = params?.search || '';
  // Get filter parameters from URL
  const minPrice = params?.minPrice;
  const maxPrice = params?.maxPrice;
  const category = params?.category;
  const sortBy = params?.sortBy;
  const sortOrder = params?.sortOrder;

  // Fetch items data using our helper function
  const { items, total, totalPages } = await getItems(page, search, minPrice, maxPrice, category, sortBy, sortOrder);
  return (
    <div className="p-4 space-y-6">
      {/* Search Form */}
      <div className="relative overflow-hidden">
        {/* Clean subtle background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
        
        {/* Main container */}
        <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <form method="GET" className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Pronađi savršeno
              </h2>
              <p className="text-gray-600">Pretraži i filtriraj prema svojim potrebama</p>
            </div>

            {/* Search Section */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                placeholder="Pretraži po nazivu, lokaciji ili opisu..."
                defaultValue={search}
                className="w-full bg-white/80 backdrop-blur-sm border-0 px-16 py-5 rounded-2xl text-lg focus:ring-4 focus:ring-blue-500/30 focus:bg-white transition-all duration-300 placeholder-gray-500 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Pretraži
              </button>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  💰 Cijena (KM/dan)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Min cijena"
                    defaultValue={minPrice}
                    className="w-24 bg-white/80 backdrop-blur-sm border-0 px-3 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300 shadow-md"
                  />
                  <span className="text-gray-400 font-bold text-lg">—</span>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max cijena"
                    defaultValue={maxPrice}
                    className="w-24 bg-white/80 backdrop-blur-sm border-0 px-3 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300 shadow-md"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  📂 Kategorija
                </label>
                <select
                  name="category"
                  defaultValue={category || ''}
                  className="w-full bg-white/80 backdrop-blur-sm border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300 shadow-md"
                >
                  <option value="">Sve kategorije</option>
                  <option value="electronics">📱 Elektronika</option>
                  <option value="tools">🔧 Alati</option>
                  <option value="vehicles">🚗 Vozila</option>
                  <option value="furniture">🪑 Namještaj</option>
                  <option value="sports">⚽ Sport</option>
                  <option value="clothing">👕 Odjeća</option>
                  <option value="books">📚 Knjige</option>
                  <option value="home">🏠 Kuća i vrt</option>
                  <option value="other">📦 Ostalo</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  🔄 Sortiraj po
                </label>
                <select
                  name="sortBy"
                  defaultValue={sortBy || 'date'}
                  className="w-full bg-white/80 backdrop-blur-sm border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300 shadow-md"
                >
                  <option value="date">📅 Datumu</option>
                  <option value="price">💰 Cijeni</option>
                  <option value="title">🔤 Nazivu</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="group">
                <label className="block text-sm font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  📊 Redoslijed
                </label>
                <select
                  name="sortOrder"
                  defaultValue={sortOrder || 'desc'}
                  className="w-full bg-white/80 backdrop-blur-sm border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-300 shadow-md"
                >
                  <option value="desc">⬇️ Opadajući</option>
                  <option value="asc">⬆️ Rastući</option>
                </select>
              </div>
            </div>

            {/* Clear Filters - Only show when there are active filters */}
            {(search || minPrice || maxPrice || category || (sortBy && sortBy !== 'date') || (sortOrder && sortOrder !== 'desc')) && (
              <div className="flex justify-center pt-4">
                <a
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Obriši sve filtere
                </a>
              </div>
            )}
          </form>
        </div>
      </div>


      {/* Items Grid */}
      {/* Display items in a responsive grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: Item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Pagination Component */}
      {/* Show pagination controls at the bottom */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={params}
      />
    </div>
  );
}
