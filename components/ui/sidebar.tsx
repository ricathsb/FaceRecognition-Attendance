"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Users, UserPlus, LogOut, Menu, X, User, HomeIcon as HouseIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
    className?: string
}

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: HouseIcon,
    },
    {
        name: "Manajemen",
        href: "/dashboard/management",
        icon: Users,
    },
    {
        name: "Pendaftaran",
        href: "/dashboard/registration",
        icon: UserPlus,
    },
]

export function Sidebar({ className }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        localStorage.removeItem("role")
        localStorage.removeItem("nama")
        router.push("/login")
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button onClick={toggleMobileMenu} className="p-2 rounded-md bg-primary text-primary-foreground shadow-lg">
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMobileMenu} />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                    className,
                )}
            >
                <div className="flex flex-col h-full">
                    {/* User Profile Section */}
                    <div className="flex items-center justify-center p-6 border-b border-slate-700">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                                <User className="h-8 w-8 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-medium">Admin</p>
                                <p className="text-slate-400 text-sm">Administrator</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        router.push(item.href)
                                        setIsMobileMenuOpen(false)
                                    }}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 group",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 mr-3 transition-colors",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-white",
                                        )}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-slate-700">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 group"
                        >
                            <LogOut className="h-5 w-5 mr-3 text-slate-400 group-hover:text-white transition-colors" />
                            <span className="font-medium">Keluar</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
