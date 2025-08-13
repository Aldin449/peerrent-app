'use client';
import { Bell } from "lucide-react";
import { FunctionComponent, useState } from "react";

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

const ProfileTabs:FunctionComponent<ProfileTabsProps> = ({items}) => {
    const [activeTab, setActiveTab] = useState('items');

    const mockData = {
        items: [
            {
                id: 1,
                title: 'Item 1',
                location: 'Location 1',
                price: 100,
                status: 'Available' 
            },
            {
                id: 2,
                title: 'Item 2',
                location: 'Location 2',
                price: 200,
                status: 'Rented'
            }
        ],
        bookings: [
            {
                id: 1,
                itemTitle: 'Item 1',
                startDate: '2024-01-01',
                endDate: '2024-01-05',
                status: 'Confirmed'
            },
            {
                id: 2,
                itemTitle: 'Item 2',    
                startDate: '2024-01-06',
                endDate: '2024-01-10',
                status: 'Cancelled'
            }
        ],
        notifications: [
            {
                id: 1,
                message: 'Notification 1',
                time: '2024-01-01 12:00:00',
                isRead: false
            },
        ]
    }

    return (
        <div>
            {/* Tab-ovi */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              MOJE STVARI
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              REZERVACIJE
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              NOTIFIKACIJE
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab sadržaj */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              {items.map((item:Item) => (
                <div key={item.id} className="border rounded-lg p-4 flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    🔗
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-gray-600">{item.location} • {item.pricePerDay}KM/dan</p>
                   
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                      Uredi
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                      Obriši
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {mockData.bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{booking.itemTitle}</h3>
                      <p className="text-gray-600">
                        🗓️ {booking.startDate} - {booking.endDate}
                      </p>
                      <p className="text-sm text-gray-500">Status: {booking.status}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        Detalji
                      </button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                        Otkaži
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {mockData.notifications.map((notification) => (
                <div key={notification.id} className={`border rounded-lg p-4 ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell size={20} className="text-blue-600" />
                      <div>
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-gray-500">{notification.time}</p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        Označi kao pročitano
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </div>
    )
}

export default ProfileTabs;