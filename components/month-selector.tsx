"use client"

import type React from "react"

interface MonthSelectorProps {
    selectedMonth: string
    setSelectedMonth: (month: string) => void
    selectedYear: string
    setSelectedYear: (year: string) => void
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
}) => {
    const allMonths = [
        { value: "01", label: "Januari" },
        { value: "02", label: "Februari" },
        { value: "03", label: "Maret" },
        { value: "04", label: "April" },
        { value: "05", label: "Mei" },
        { value: "06", label: "Juni" },
        { value: "07", label: "Juli" },
        { value: "08", label: "Agustus" },
        { value: "09", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
    ]

    // FUNGSI GENERATE TAHUN YANG BARU
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear()
        const startYear = 2025
        const endYear = currentYear + 2
        const years = []
        for (let year = startYear; year <= endYear; year++) {
            years.push(year.toString())
        }
        return years
    }

    const years = generateYearOptions()

    console.log("🗓️ Generated years:", years) // Debug log
    console.log("📅 Current year:", new Date().getFullYear())

    return (
        <div className="flex items-center gap-2">
            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-3 border border-emerald-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
                {allMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>
            <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-3 border border-emerald-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
                {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default MonthSelector
