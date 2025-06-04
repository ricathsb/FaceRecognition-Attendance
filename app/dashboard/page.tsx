"use client"

import { useState, useEffect } from "react"
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Calendar,
    TrendingUp,
    Activity,
    Loader2,
} from "lucide-react"

export default function DashboardPage() {
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

    const fetchDashboardData = async () => {
        try {
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

    if (isLoading || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Memuat data dashboard...</p>
                </div>
            </div>
        )
    }

    const attendancePercentage = Math.round((data.hadir / data.totalKaryawan) * 100)

    const statsCards = [
        {
            title: "Total Karyawan",
            value: data.totalKaryawan,
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
            textColor: "text-blue-600",
            change: "+2.5%",
            changeType: "increase",
        },
        {
            title: "Hadir Hari Ini",
            value: data.hadir,
            icon: UserCheck,
            color: "from-green-500 to-green-600",
            bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
            textColor: "text-green-600",
            change: "+5.2%",
            changeType: "increase",
        },
        {
            title: "Tidak Masuk",
            value: data.absen,
            icon: UserX,
            color: "from-red-500 to-red-600",
            bgColor: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
            textColor: "text-red-600",
            change: "-1.8%",
            changeType: "decrease",
        },
        {
            title: "Terlambat",
            value: data.telat,
            icon: Clock,
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
            textColor: "text-orange-600",
            change: "+0.5%",
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="px-6 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Manajemen</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {data.date}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Activity className="h-4 w-4 text-green-500" />
                                <span>Live Update</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-xl">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Waktu Sekarang</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                {currentTime.toLocaleTimeString("id-ID")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>
                                <div
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        card.changeType === "increase"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    }`}
                                >
                                    {card.change}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                                Aktivitas Terbaru
                            </h3>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{activity.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.action}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{activity.time}</p>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(activity.status)}`}>
                                            {getStatusText(activity.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
