// import { NextResponse } from "next/server"
// import { getToken } from "next-auth/jwt"
// import type { NextRequest } from "next/server"

// export async function middleware(request: NextRequest) {
//   const token = await getToken({ req: request })
//   const isAuthenticated = !!token
//   const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register")

//   // If the user is on an auth page and is already authenticated, redirect to dashboard
//   if (isAuthPage && isAuthenticated) {
//     return NextResponse.redirect(new URL("/dashboard", request.url))
//   }

//   // If the user is not authenticated and not on an auth page, redirect to login
//   if (
//     !isAuthenticated &&
//     !isAuthPage &&
//     !request.nextUrl.pathname.startsWith("/_next") &&
//     !request.nextUrl.pathname.startsWith("/api")
//   ) {
//     return NextResponse.redirect(new URL("/login", request.url))
//   }

//   // Role-based access control
//   if (isAuthenticated) {
//     const role = token.role as string

//     // Admin routes
//     if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
//       return NextResponse.redirect(new URL("/dashboard", request.url))
//     }

//     // Professor routes
//     if (request.nextUrl.pathname.startsWith("/professor") && role !== "professor" && role !== "admin") {
//       return NextResponse.redirect(new URL("/dashboard", request.url))
//     }
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     "/((?!_next/static|_next/image|favicon.ico).*)",
//   ],
// }



import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register")

  // If the user is on an auth page and is already authenticated, redirect to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If the user is not authenticated and not on an auth page, redirect to login
  if (
    !isAuthenticated &&
    !isAuthPage &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Role-based access control
  if (isAuthenticated) {
    const role = token.role as string

    // Admin routes
    if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Professor routes
    if (request.nextUrl.pathname.startsWith("/professor") && role !== "professor" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Ensure database operations only happen on the server
  if (request.nextUrl.pathname.startsWith("/api") && !request.nextUrl.pathname.startsWith("/api/auth")) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

