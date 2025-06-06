"use client"

import { LogOut } from "lucide-react"
import { logout } from "@/lib/auth"

interface LogoutButtonProps {
    className?: string
    showText?: boolean
}

export default function LogoutButton({ className = "", showText = true }: LogoutButtonProps) {
    const handleLogout = () => {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            logout()
        }
    }

    return (
        <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ${className}`}
        >
            <LogOut className="h-4 w-4" />
            {showText && <span>Keluar</span>}
        </button>
    )
}
