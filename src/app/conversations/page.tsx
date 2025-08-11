import ConversationList from '../../../components/ConversationList';

export default function ConversationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Moji razgovori</h1>
        <ConversationList />
      </div>
    </div>
  );
}
