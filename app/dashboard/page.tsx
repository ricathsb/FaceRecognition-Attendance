"use client"

import { useState, useEffect } from "react"
import { Users, UserCheck, UserX, Clock, Calendar, TrendingUp, Activity, Loader2, AlertCircle } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

function DashboardContent() {
    const [data, setData] = useState<{
        date: string
        totalKaryawan: number
        hadir: number
        absen: number
        telat: number
        lastUpdated: string
    } | null>(null)

    const [activities, setActivities] = useState<
        {
            id: number
            name: string
            action: string
            time: string
            status: string
        }[]
    >([])

    const [currentTime, setCurrentTime] = useState(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboardData = async () => {
        try {
            setError(null)
            const response = await fetch("/api/karyawan/dashboard")
            if (!response.ok) throw new Error("Gagal memuat data")

            const result = await response.json()

            setData({
                date: new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                totalKaryawan: result.totalKaryawan,
                hadir: result.hadir,
                absen: result.absen,
                telat: result.telat,
                lastUpdated: new Date().toLocaleTimeString("id-ID"),
            })

            setActivities(result.aktivitasTerbaru || [])
            setIsLoading(false)
        } catch (error) {
            console.error("Error memuat data dashboard:", error)
            setError("Gagal memuat data dashboard. Silakan coba lagi.")
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()

        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        const dataTimer = setInterval(() => fetchDashboardData(), 60000)

        return () => {
            clearInterval(timer)
            clearInterval(dataTimer)
        }
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Memuat data dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Terjadi Kesalahan</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => {
                            setIsLoading(true)
                            fetchDashboardData()
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Tidak ada data tersedia</p>
                </div>
            </div>
        )
    }

    const attendancePercentage = data.totalKaryawan > 0 ? Math.round((data.hadir / data.totalKaryawan) * 100) : 0

    const statsCards = [
        {
            title: "Total Karyawan",
            value: data.totalKaryawan,
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
            textColor: "text-blue-600",
            changeType: "increase",
        },
        {
            title: "Hadir Hari Ini",
            value: data.hadir,
            icon: UserCheck,
            color: "from-green-500 to-green-600",
            bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
            textColor: "text-green-600",
            change: `${attendancePercentage}%`,
            changeType: "increase",
        },
        {
            title: "Tidak Masuk",
            value: data.absen,
            icon: UserX,
            color: "from-red-500 to-red-600",
            bgColor: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
            textColor: "text-red-600",
            changeType: "decrease",
            change: `${100 - attendancePercentage}%`,
        },
        {
            title: "Terlambat",
            value: data.telat,
            icon: Clock,
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
            textColor: "text-orange-600",
            change: data.totalKaryawan > 0 ? `${Math.round((data.telat / data.totalKaryawan) * 100)}%` : "0%",
            changeType: "increase",
        },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ontime":
                return "text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300"
            case "late":
                return "text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-300"
            case "permission":
                return "text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
            case "sick":
                return "text-purple-700 bg-purple-100 dark:bg-purple-900 dark:text-purple-300"
            default:
                return "text-gray-700 bg-gray-100 dark:bg-gray-900 dark:text-gray-300"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "ontime":
                return "Tepat Waktu"
            case "late":
                return "Terlambat"
            case "permission":
                return "Izin"
            case "sick":
                return "Sakit"
            default:
                return "Unknown"
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-emerald-100 dark:border-gray-700 pb-4">
                <SidebarTrigger className="-ml-1 lg:hidden" />
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-1">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard Manajemen</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">{data.date}</span>
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Activity className="h-4 w-4 text-green-500" />
                                <span>Live Update</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right bg-white dark:bg-gray-700 px-4 py-3 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Waktu Sekarang</p>
                            <p className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white font-mono">
                                {currentTime.toLocaleTimeString("id-ID")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {statsCards.map((card, index) => (
                    <div
                        key={index}
                        className={`${card.bgColor} rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center shadow-lg`}
                            >
                                <card.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                            </div>
                            {card.change && (
                                <div
                                    className={`text-xs px-2 py-1 rounded-full ${card.changeType === "increase"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                        }`}
                                >
                                    {card.change}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                            <p className={`text-2xl lg:text-3xl font-bold ${card.textColor}`}>{card.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Activities */}
            <div className="max-w-4xl mx-auto w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            Aktivitas Terbaru
                        </h3>
                    </div>

                    {activities.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{activity.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.action}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{activity.time}</p>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(activity.status)}`}>
                                            {getStatusText(activity.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Belum ada aktivitas hari ini</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return <DashboardContent />
}
