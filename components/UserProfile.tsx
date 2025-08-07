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
    image: session.user.image,
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
      {user.image && (
        <img
          src={user.image}
          alt={user.name || 'User'}
          className="w-8 h-8 rounded-full"
        />
      )}
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