import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE RADI!', request.nextUrl.pathname);

  const protectedRoutes = ['/my-profile', '/my-items', '/my-bookings', '/conversations', '/add-item'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if(isProtectedRoute){
    try{
        const sessionToken = request.cookies.get('next-auth.session-token')?.value;
        const secureSessionToken = request.cookies.get('__Secure-next-auth.session-token')?.value;

        console.log(sessionToken,'token');
        const hasSessionToken = sessionToken || secureSessionToken;
        if(!hasSessionToken){
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const token = await getToken({req:request});
        if(token?.isDeleted){
            return NextResponse.redirect(new URL('/', request.url))
        }

    } catch(error){
        console.error('MIDDLEWARE ERROR:', error);
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  return NextResponse.next();
}

export const config = {
    matcher: [
      '/my-profile/:path*',
      '/my-items/:path*', 
      '/my-bookings/:path*',
      '/conversations/:path*',
      '/add-item/:path*'
    ]
  };