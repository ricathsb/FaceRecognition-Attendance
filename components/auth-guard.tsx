"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { validateAuth, getUserRole, clearUserRole } from "@/lib/auth"

interface AuthGuardProps {
    children: React.ReactNode
    requiredRole?: "admin" | "user"
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isValidating, setIsValidating] = useState(true)

    useEffect(() => {
        const checkAuth = () => {
            // Validate authentication
            if (!validateAuth()) {
                // Clear any remaining data and redirect to login
                clearUserRole()
                router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
                return
            }

            // Check role if required
            if (requiredRole) {
                const userRole = getUserRole()
                if (userRole !== requiredRole) {
                    // Redirect based on actual role
                    if (userRole === "admin") {
                        router.replace("/dashboard")
                    } else if (userRole === "user") {
                        router.replace("/")
                    } else {
                        router.replace("/login")
                    }
                    return
                }
            }

            setIsValidating(false)
        }

        checkAuth()

        // Listen for storage changes (logout in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "role" && e.newValue === null) {
                clearUserRole()
                router.replace("/login")
            }
        }

        // Listen for focus events to revalidate auth
        const handleFocus = () => {
            if (!validateAuth()) {
                clearUserRole()
                router.replace("/login")
            }
        }

        window.addEventListener("storage", handleStorageChange)
        window.addEventListener("focus", handleFocus)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("focus", handleFocus)
        }
    }, [pathname, router, requiredRole])

    // Show loading or nothing while validating
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return <>{children}</>
}
