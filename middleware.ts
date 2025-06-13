import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Get role from cookies or headers (since we can't access localStorage in middleware)
    // We'll use a cookie to store the role
    const role = request.cookies.get("user-role")?.value

    // Protected admin routes
    const adminRoutes = ["/dashboard", "/management", "/registration"]

    // Protected user routes
    const userRoutes = ["/"]

    // Public routes that don't need authentication
    const publicRoutes = ["/login", "/register"]

    // Check if current path is an admin route
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

    // Check if current path is a user route
    const isUserRoute = userRoutes.includes(pathname)

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    // If no role is set and trying to access protected routes, redirect to login
    if (!role && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url)
        const response = NextResponse.redirect(loginUrl)

        // Add cache control headers to prevent caching
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        response.headers.set("Pragma", "no-cache")
        response.headers.set("Expires", "0")

        return response
    }

    // If user has role but trying to access login, redirect based on role
    if (role && pathname === "/login") {
        if (role === "admin") {
            const dashboardUrl = new URL("/dashboard", request.url)
            return NextResponse.redirect(dashboardUrl)
        } else if (role === "user") {
            const homeUrl = new URL("/", request.url)
            return NextResponse.redirect(homeUrl)
        }
    }

    // If non-admin trying to access admin routes, redirect to home
    if (isAdminRoute && role !== "admin") {
        if (role === "user") {
            const homeUrl = new URL("/", request.url)
            const response = NextResponse.redirect(homeUrl)

            // Add cache control headers
            response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
            response.headers.set("Pragma", "no-cache")
            response.headers.set("Expires", "0")

            return response
        } else {
            const loginUrl = new URL("/login", request.url)
            const response = NextResponse.redirect(loginUrl)

            // Add cache control headers
            response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
            response.headers.set("Pragma", "no-cache")
            response.headers.set("Expires", "0")

            return response
        }
    }

    // If admin trying to access user-only routes, redirect to dashboard
    if (role === "admin" && pathname === "/") {
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    // Add cache control headers to all responses
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    ],
}
