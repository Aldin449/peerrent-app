import { type NextAuthOptions, getServerSession } from 'next-auth';
import { authOptions } from './src/app/api/auth/[...nextauth]/route';

export async function auth() {
  return await getServerSession(authOptions);
}
