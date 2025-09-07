import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      isDeleted: boolean;
      emailVerified: boolean;
    }
  }
  
  interface User {
    id: string;
    email: string;
    name?: string | null;
    isDeleted: boolean;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    isDeleted: boolean;
    emailVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  // Remove the insecure custom JWT configuration
  // NextAuth will use proper JWT signing by default
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email,
            isDeleted: false
          },
        });

        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        
        // Provjeri da li je email verifikovan prije dozvoljavanja prijave
        if (!isValid || !user.emailVerified) {
          return null;
        }
        
        return user;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // Initial login - user data is available
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isDeleted = false; // New users are never deleted
        token.emailVerified = Boolean(user.emailVerified);
      } else {
        // Token refresh - check current status in database
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isDeleted: true, emailVerified: true }
          });
          
          if (currentUser) {
            token.isDeleted = currentUser.isDeleted;
            token.emailVerified = Boolean(currentUser.emailVerified);
          }
        } catch (error) {
          console.error('Error checking user deletion status:', error);
          token.isDeleted = true; // Assume deleted on error for security
          token.emailVerified = false; // Assume not verified on error for security
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.isDeleted = token.isDeleted;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
