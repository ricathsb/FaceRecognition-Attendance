"use client"

import { useEffect } from "react"

interface MonthSelectorProps {
    selectedMonth: string
    setSelectedMonth: (month: string) => void
    selectedYear: string
    setSelectedYear: (year: string) => void
}

export default function MonthSelector({
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
}: MonthSelectorProps) {
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

    const getAvailableMonths = () => {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1

        if (Number.parseInt(selectedYear) === currentYear) {
            // Untuk tahun saat ini, hanya tampilkan bulan sampai bulan saat ini
            return allMonths.filter((month) => Number.parseInt(month.value) <= currentMonth)
        } else if (Number.parseInt(selectedYear) < currentYear) {
            // Untuk tahun lalu, tampilkan semua bulan
            return allMonths
        } else {
            // Untuk tahun masa depan, tampilkan semua bulan (biarkan user memilih)
            return allMonths
        }
    }

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

    useEffect(() => {
        const availableMonths = getAvailableMonths()
        const isSelectedMonthAvailable = availableMonths.some((month) => month.value === selectedMonth)

        if (!isSelectedMonthAvailable && availableMonths.length > 0) {
            setSelectedMonth(availableMonths[availableMonths.length - 1].value)
        }
    }, [selectedYear, selectedMonth])

    return (
        <div className="flex gap-3">
            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-3 border border-emerald-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-w-[140px]"
            >
                {getAvailableMonths().map((month) => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>
            <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-3 border border-emerald-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-w-[100px]"
            >
                {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    )
}
