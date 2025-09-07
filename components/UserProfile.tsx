import { auth } from '../auth';
import Link from 'next/link';

async function getUserProfile() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  return {
    name: session.user.name,
    email: session.user.email,
  };
}

export default async function UserProfile() {
  const user = await getUserProfile();

  if (!user) {
    return (
      <Link href="/login" className="text-blue-600 hover:underline">
        Prijava
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm hidden sm:inline">
        Zdravo, {user.name || user.email}
      </span>
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <span className="text-gray-600 font-semibold text-sm">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="text-red-600 hover:underline"
        >
          Odjava
        </button>
      </form>
    </div>
  );
} 