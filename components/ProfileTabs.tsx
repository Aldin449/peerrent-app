'use client';
import { History, Heart, Activity, Package } from "lucide-react";
import { FunctionComponent, useState } from "react";
import RentalHistory from "./RentalHistory";
import ActivityTimeline from "./ActivityTimeline";
import UserRentals from "./UserRentals";
import { useWishlist, useUserActivity } from "../hooks";
import ItemCard from "./ItemCard";

interface Item {
  id: string;
  title: string;
  location: string;
  pricePerDay: number;
  phoneNumber: string | null;
  isRented: boolean;
  images: string[];
  description: string;
  ownerId: string;
  createdAt: string;
}

interface ProfileTabsProps {
  items: Item[];
}

const ProfileTabs: FunctionComponent<ProfileTabsProps> = ({ items }) => {
  const [activeTab, setActiveTab] = useState('wishlist');
  const { wishlist, isLoading: wishlistLoading } = useWishlist();
  const { data: activityData, isLoading: activityLoading } = useUserActivity(10);


  return (
    <div>
      {/* Tab-ovi */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'wishlist'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              LISTA ŽELJA
            </button>
          {/*  <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              HISTORIJA
            </button>*/}
            <button
              onClick={() => setActiveTab('rentals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rentals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              MOJA IZNAJMLJIVANJA
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              AKTIVNOST
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab sadržaj */}
          {activeTab === 'wishlist' && (
            <div>
              {wishlistLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Učitavanje liste želja...</p>
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💝</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Vaša lista želja je prazna
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Dodajte stavke koje vas zanimaju klikom na srce
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Pretraži stavke
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map((wishlistItem) => (
                    <ItemCard key={wishlistItem.id} item={wishlistItem.item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <RentalHistory />
            </div>
          )}

          {activeTab === 'rentals' && (
            <div>
              <UserRentals />
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <ActivityTimeline 
                activities={activityData?.activities || []} 
                isLoading={activityLoading}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ProfileTabs;