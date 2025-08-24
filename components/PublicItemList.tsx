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
  }>;
}

// Function to fetch items from the database with pagination and search
// This is an async function because database operations take time
async function getItems(page: number, search: string) {
  // AUTOMATIC CLEANUP: Delete expired items before showing the list
  // This ensures users only see items that are actually available
  // Items are considered expired if their booking end date has passed
  try {
    // Find all items that have approved bookings that ended in the past
    const itemsToDelete = await prisma.item.findMany({
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

    // If there are expired items, delete them and all related data
    if (itemsToDelete.length > 0) {
      // Delete in correct order due to foreign key constraints
      // We must delete related records first before deleting the main item
      await prisma.booking.deleteMany({
        where: { itemId: { in: itemsToDelete.map(item => item.id) } }
      });
      await prisma.notification.deleteMany({
        where: { itemId: { in: itemsToDelete.map(item => item.id) } }
      });
      await prisma.message.deleteMany({
        where: { itemId: { in: itemsToDelete.map(item => item.id) } }
      });
      await prisma.item.deleteMany({
        where: { id: { in: itemsToDelete.map(item => item.id) } }
      });
      
      console.log(`Auto-deleted ${itemsToDelete.length} expired items from PublicItemList`);
    }
  } catch (error) {
    console.error('Error in automatic cleanup:', error);
  }

  // Pagination settings: how many items to show per page
  const limit = 6;
  // Calculate how many items to skip (for pagination)
  const skip = (page - 1) * limit;

  // Build the database query conditions based on search term
  // This creates a complex WHERE clause for filtering items
  const whereClause = search.toLocaleLowerCase().trim()
    ? {
        // If there's a search term, combine search with availability filter
        AND: [
          {
            // Search in title, location, or description
            OR: [
              { title: { contains: search } },
              { location: { contains: search } },
              { description: { contains: search } },
            ],
          },
          {
            // Exclude items that have active bookings (not available)
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
          }
        ]
      }
    : {
        // If no search term, only filter by availability
        NOT: {
          Booking: {
            some: {
              status: BookingStatus.APPROVED,
              AND: [
                { startDate: { lte: new Date() } },
                { endDate: { gte: new Date() } }
              ]
            }
          }
        }
      };

  // Fetch items and total count simultaneously for better performance
  // Promise.all runs both queries in parallel instead of one after another
  const [items, total] = await Promise.all([
    // Get the actual items with pagination
    prisma.item.findMany({
      where: {
        ...whereClause,        // Apply our search and availability filters
        user: {
          isDeleted: false     // Exclude items from deleted users
        }
      },
      skip,                      // Skip items for pagination
      take: limit,               // Take only 6 items per page
      orderBy: { createdAt: 'desc' }, // Show newest items first
      include: {                 // Include related user data
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    // Count total items for pagination calculation
    prisma.item.count({
      where: {
        ...whereClause,
        user: {
          isDeleted: false     // Exclude items from deleted users
        }
      },
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
  const page = parseInt(params?.page || '1');
  // Get search term from URL, default to empty string if not specified
  const search = params?.search || '';

  // Fetch items data using our helper function
  const { items, total, totalPages } = await getItems(page, search);
  console.log(items)
  return (
    <div className="p-4 space-y-6">
      {/* Search Form */}
      {/* This form allows users to search for items by title, location, or description */}
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="search"
          placeholder="Pretraži po nazivu ili lokaciji..."
          defaultValue={search} // Show current search term in the input
          className="flex-1 border px-4 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Pretraži
        </button>
      </form>
      
      {/* Items Grid */}
      {/* Display items in a responsive grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: Item) => {
          return(
          // Each item is a clickable link that goes to the item detail page
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="border rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition block"
          >
            {/* Item Image */}
            {/* Show the first image if available */}
            {item.images && item.images.length > 0 && (
              <div className="mb-3">
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
            {/* Item Details */}
            <h2 className="font-semibold text-lg">{item.title}</h2>
            {/* Show description with line clamp to prevent long descriptions from breaking layout */}
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
            {/* Location with emoji for visual appeal */}
            <p className="text-sm mt-2">📍 {item.location}</p>
            {/* Price with emoji and color coding */}
            <p className="text-sm font-semibold text-green-600">💰 {item.pricePerDay} KM/dan</p>

            <p className='text-sm font-semibold mt-5'>👤 Vlasnik: {item.user.name}</p>
          </Link>
        )})}
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
