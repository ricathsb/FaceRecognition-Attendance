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
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
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
                            clearUserRole()
                            router.replace("/login")
                        }
                        return
                    }
                }

                setIsValidating(false)
            } catch (err) {
                console.error("Auth validation error:", err)
                setError("Terjadi kesalahan saat validasi autentikasi")
                clearUserRole()
                router.replace("/login")
            }
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
            try {
                if (!validateAuth()) {
                    clearUserRole()
                    router.replace("/login")
                }
            } catch (err) {
                console.error("Focus auth validation error:", err)
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

    // Show error if any
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button
                        onClick={() => {
                            setError(null)
                            clearUserRole()
                            router.replace("/login")
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Kembali ke Login
                    </button>
                </div>
            </div>
        )
    }

    // Show loading while validating
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memvalidasi autentikasi...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
