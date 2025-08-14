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
    }
  }
  
  interface User {
    id: string;
    email: string;
    name?: string | null;
    isDeleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    isDeleted: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    encode: ({ secret, token }) => {
      // Simple encoding to avoid encryption issues
      return Buffer.from(JSON.stringify(token)).toString('base64');
    },
    decode: ({ secret, token }) => {
      try {
        // Simple decoding
        return JSON.parse(Buffer.from(token as string, 'base64').toString());
      } catch {
        return null;
      }
    },
  },
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
        return isValid ? user : null;
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
      } else {
        // Token refresh - check current status in database
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isDeleted: true }
          });
          
          if (currentUser) {
            token.isDeleted = currentUser.isDeleted;
          }
        } catch (error) {
          console.error('Error checking user deletion status:', error);
          token.isDeleted = true; // Assume deleted on error for security
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
