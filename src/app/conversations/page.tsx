import ConversationList from '../../../components/ConversationList';

export default function ConversationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Moji Razgovori</h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Upravljajte svim svojim razgovorima i porukama
            </p>
          </div>
        </div>
      </div>

      {/* Conversations Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ConversationList />
      </div>
    </div>
  );
}
