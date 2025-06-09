// Helper functions for managing authentication cookies

export function setUserRole(role: "admin" | "user") {
    // Set cookie that expires in 7 days
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    document.cookie = `user-role=${role}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`

    // Also keep localStorage for backward compatibility
    localStorage.setItem("role", role)
}

export function getUserRole(): string | null {
    // Try to get from localStorage first (client-side)
    if (typeof window !== "undefined") {
        return localStorage.getItem("role")
    }
    return null
}

export function clearUserRole() {
    // Clear cookie
    document.cookie = "user-role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Clear localStorage
    if (typeof window !== "undefined") {
        localStorage.removeItem("role")
        localStorage.removeItem("nama")
        localStorage.removeItem("userType")
    }
}

// Enhanced logout function to prevent back button access
export function logout() {
    // Clear all authentication data
    clearUserRole()

    // Add timestamp to prevent caching
    const noCache = new Date().getTime()

    // Force page reload and redirect to login
    window.location.replace(`/login?nocache=${noCache}`)
}

// Check if user is authenticated (works in both client and server)
export function isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
        // Client-side check
        const cookies = document.cookie.split(";")
        const authCookie = cookies.find((c) => c.trim().startsWith("user-role="))
        const localRole = localStorage.getItem("role")

        return !!(authCookie && localRole)
    }
    return false
}

export function isAdmin(): boolean {
    const role = getUserRole()
    return role === "admin"
}

export function isUser(): boolean {
    const role = getUserRole()
    return role === "user"
}

// Function to get user data from localStorage
export function getUserData() {
    if (typeof window !== "undefined") {
        return {
            role: localStorage.getItem("role"),
            nama: localStorage.getItem("nama"),
            userType: localStorage.getItem("userType"),
        }
    }
    return {
        role: null,
        nama: null,
        userType: null,
    }
}

// Function to validate authentication on page load
export function validateAuth(): boolean {
    if (typeof window === "undefined") return false

    const cookies = document.cookie.split(";")
    const authCookie = cookies.find((c) => c.trim().startsWith("user-role="))
    const localRole = localStorage.getItem("role")

    // If cookie exists but localStorage doesn't, or vice versa, clear both
    if ((authCookie && !localRole) || (!authCookie && localRole)) {
        clearUserRole()
        return false
    }

    return !!(authCookie && localRole)
}
