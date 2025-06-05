"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getUserRole, clearUserRole } from "@/lib/auth"
import { LogOut, User } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

export function Navbar() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const storedRole = getUserRole()
    const storedName = localStorage.getItem("nama") || ""
    setRole(storedRole)
    setUserName(storedName)
    setIsCheckingAuth(false)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.log("Logout API call failed, but continuing with local logout")
    }

    clearUserRole()
    router.push("/login")
  }

  if (isCheckingAuth) {
    return null
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-emerald-100 dark:border-gray-700 py-4 sticky top-0 z-50">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Left Side - Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Face Attendance</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">MAS Al Ittihadiyah</p>
          </div>
        </Link>

        {/* Right Side - User Info + Logout */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <Avatar className="h-8 w-8 bg-gradient-to-r from-emerald-500 to-teal-600">
              <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userName || "User"}</p>

            </div>
          </div>





          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </div>
    </nav >
  )
}
