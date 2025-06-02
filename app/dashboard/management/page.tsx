"use client"

import { useState } from "react"
import { Edit, Trash2, Search, Download } from "lucide-react"

// Sample data - in real app, this would come from database
const employeeData = [
    {
        id: 1,
        employeeId: "000001",
        name: "Asep Samudin",
        nip: "343",
        attendance: {
            1: "hadir",
            2: "hadir",
            3: "tidak",
            4: "hadir",
            5: "hadir",
            6: "tidak",
            7: "hadir",
            8: "hadir",
            9: "hadir",
            10: "tidak",
            11: "hadir",
            12: "hadir",
            13: "tidak",
            14: "hadir",
            15: "hadir",
            16: "hadir",
            17: "tidak",
            18: "hadir",
            19: "hadir",
            20: "hadir",
            21: "tidak",
            22: "hadir",
            23: "hadir",
            24: "hadir",
            25: "tidak",
            26: "hadir",
            27: "hadir",
            28: "hadir",
            29: "tidak",
            30: "hadir",
            31: "hadir",
        },
    },
    {
        id: 2,
        employeeId: "000002",
        name: "Nurlela Cantika Dewi",
        nip: "082108330865",
        attendance: {
            1: "hadir",
            2: "tidak",
            3: "hadir",
            4: "hadir",
            5: "tidak",
            6: "hadir",
            7: "hadir",
            8: "tidak",
            9: "hadir",
            10: "hadir",
            11: "tidak",
            12: "hadir",
            13: "hadir",
            14: "tidak",
            15: "hadir",
            16: "tidak",
            17: "hadir",
            18: "hadir",
            19: "tidak",
            20: "hadir",
            21: "hadir",
            22: "tidak",
            23: "hadir",
            24: "hadir",
            25: "hadir",
            26: "tidak",
            27: "hadir",
            28: "tidak",
            29: "hadir",
            30: "hadir",
            31: "tidak",
        },
    },
    {
        id: 3,
        employeeId: "000003",
        name: "Budi Santoso",
        nip: "123456789",
        attendance: {
            1: "hadir",
            2: "hadir",
            3: "hadir",
            4: "tidak",
            5: "hadir",
            6: "hadir",
            7: "tidak",
            8: "hadir",
            9: "hadir",
            10: "hadir",
            11: "hadir",
            12: "tidak",
            13: "hadir",
            14: "hadir",
            15: "tidak",
            16: "hadir",
            17: "hadir",
            18: "tidak",
            19: "hadir",
            20: "hadir",
            21: "hadir",
            22: "hadir",
            23: "tidak",
            24: "hadir",
            25: "hadir",
            26: "hadir",
            27: "tidak",
            28: "hadir",
            29: "hadir",
            30: "tidak",
            31: "hadir",
        },
    },
]

export default function ManagementPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedMonth, setSelectedMonth] = useState("Februari 2024")

    const getDaysInMonth = () => {
        return Array.from({ length: 31 }, (_, i) => i + 1)
    }

    const getAttendanceColor = (status: string) => {
        return status === "hadir" ? "bg-green-500" : "bg-red-500"
    }

    const getAttendanceText = (status: string) => {
        return status === "hadir" ? "H" : "T"
    }

    const filteredEmployees = employeeData.filter(
        (employee) => employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || employee.nip.includes(searchTerm),
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header positioned near sidebar */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Karyawan</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola data karyawan dan absensi</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Search Bar */}
                <div className="flex flex-col lg:flex-row gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama karyawan atau NIP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[160px]"
                    >
                        <option>Januari 2024</option>
                        <option>Februari 2024</option>
                        <option>Maret 2024</option>
                        <option>April 2024</option>
                        <option>Mei 2024</option>
                        <option>Juni 2024</option>
                    </select>
                </div>

                {/* Table Container */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="flex">
                        {/* Fixed Left Section - Employee Info */}
                        <div className="flex-shrink-0">
                            <table className="border-collapse">
                                <thead>
                                    <tr>
                                        <th
                                            colSpan={4}
                                            className="h-12 bg-gray-100 dark:bg-gray-700 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-600"
                                        >
                                            Informasi Karyawan
                                        </th>
                                    </tr>
                                    <tr>
                                        <th className="h-10 w-16 px-3 bg-gray-50 dark:bg-gray-600 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                                            No
                                        </th>
                                        <th className="h-10 w-32 px-3 bg-gray-50 dark:bg-gray-600 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                                            ID Karyawan
                                        </th>
                                        <th className="h-10 w-48 px-3 bg-gray-50 dark:bg-gray-600 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                                            Nama Karyawan
                                        </th>
                                        <th className="h-10 w-36 px-3 bg-gray-50 dark:bg-gray-600 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600">
                                            NIP
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((employee, index) => (
                                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="h-16 w-16 px-3 text-center text-sm text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="h-16 w-32 px-3 text-center text-sm text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-600">
                                                {employee.employeeId}
                                            </td>
                                            <td className="h-16 w-48 px-3 text-center text-sm text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-600">
                                                {employee.name}
                                            </td>
                                            <td className="h-16 w-36 px-3 text-center text-sm text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-600">
                                                {employee.nip}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Scrollable Middle Section - Attendance */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="border-collapse w-full">
                                <thead>
                                    <tr>
                                        <th
                                            className="h-12 bg-gray-100 dark:bg-gray-700 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-600"
                                            colSpan={31}
                                        >
                                            Absensi - {selectedMonth}
                                        </th>
                                    </tr>
                                    <tr>
                                        {getDaysInMonth().map((day) => (
                                            <th
                                                key={day}
                                                className="h-10 w-12 px-2 bg-gray-50 dark:bg-gray-600 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600"
                                            >
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            {getDaysInMonth().map((day) => (
                                                <td
                                                    key={day}
                                                    className="h-16 w-12 px-2 text-center border-b border-r border-gray-200 dark:border-gray-600"
                                                >
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto shadow-sm ${getAttendanceColor(
                                                            employee.attendance[day] || "tidak",
                                                        )}`}
                                                    >
                                                        {getAttendanceText(employee.attendance[day] || "tidak")}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Fixed Right Section - Actions */}
                        <div className="flex-shrink-0">
                            <table className="border-collapse">
                                <thead>
                                    <tr>
                                        <th className="h-12 w-32 bg-gray-100 dark:bg-gray-700 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">
                                            Aksi
                                        </th>
                                    </tr>
                                    <tr>
                                        <th className="h-10 w-32 px-3 bg-gray-50 dark:bg-gray-600 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                                            &nbsp;
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="h-16 w-32 px-3 text-center border-b border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
