"use client"

import { useEffect, useState, useRef } from "react"
import { Search, Save, X, Clock, Trash2, AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import MonthSelector from "@/components/month-selector"

type Employee = {
  id: string
  name: string
  nip: string
  attendance: {
    [tanggal: string]: string
  }
  summary: string
  stats?: {
    hadir: number
    terlambat: number
    absen: number
    totalWorkDays: number
  }
}

type AttendanceSettings = {
  checkInStartTime: string
  onTimeBeforeHour: string
  lateBeforeHour: string
  workDays: string[]
}

export default function ManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0"))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [employeeData, setEmployeeData] = useState<Employee[]>([])
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings>({
    checkInStartTime: "07:00",
    onTimeBeforeHour: "09:00",
    lateBeforeHour: "14:00",
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  })

  // Refs untuk scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(true)

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

  const dayOptions = [
    { value: "monday", label: "Senin" },
    { value: "tuesday", label: "Selasa" },
    { value: "wednesday", label: "Rabu" },
    { value: "thursday", label: "Kamis" },
    { value: "friday", label: "Jumat" },
    { value: "saturday", label: "Sabtu" },
    { value: "sunday", label: "Minggu" },
  ]

  const getSelectedMonthName = () => {
    const month = allMonths.find((m) => m.value === selectedMonth)
    return month ? month.label : "Januari"
  }

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "hadir":``
      case "tepat waktu":
        return "bg-green-500"
      case "terlambat":
        return "bg-yellow-500"
      case "absen":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getAttendanceText = (status: string) => {
    switch (status) {
      case "hadir":
      case "tepat waktu":
        return "H"
      case "terlambat":
        return "T"
      case "absen":
        return "A"
      default:
        return "?"
    }
  }

  const handleWorkDayToggle = (day: string) => {
    setAttendanceSettings((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day) ? prev.workDays.filter((d) => d !== day) : [...prev.workDays, day],
    }))
  }

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus data karyawan "${employeeName}"?\n\nSemua data absensi karyawan ini akan ikut terhapus.`,
      )
    ) {
      try {
        const response = await fetch(`/api/karyawan/management`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employeeId }),
        })

        if (response.ok) {
          setEmployeeData((prev) => prev.filter((emp) => emp.id !== employeeId))
          alert(`Data karyawan "${employeeName}" berhasil dihapus!`)
        } else {
          alert("Gagal menghapus data karyawan")
        }
      } catch (error) {
        console.error("Error deleting employee:", error)
        alert("Terjadi kesalahan saat menghapus data karyawan")
      }
    }
  }

  const handleSaveSettings = async () => {
    // Validasi waktu
    const checkInStart = new Date(`2000-01-01T${attendanceSettings.checkInStartTime}:00`)
    const onTimeBefore = new Date(`2000-01-01T${attendanceSettings.onTimeBeforeHour}:00`)
    const lateBefore = new Date(`2000-01-01T${attendanceSettings.lateBeforeHour}:00`)

    if (onTimeBefore <= checkInStart) {
      alert("Batas waktu tepat waktu harus lebih besar dari waktu mulai absen")
      return
    }

    if (lateBefore <= onTimeBefore) {
      alert("Batas waktu terlambat harus lebih besar dari batas waktu tepat waktu")
      return
    }

    try {
      const response = await fetch("/api/karyawan/management", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceSettings),
      })

      if (response.ok) {
        setIsSettingsModalOpen(false)
        alert("Pengaturan absensi berhasil disimpan!")
        // Refresh data after settings change
        fetchEmployeesAndSettings()
      } else {
        alert("Gagal menyimpan pengaturan absensi")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Terjadi kesalahan saat menyimpan pengaturan")
    }
  }

  const fetchEmployeesAndSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/karyawan/management?month=${selectedMonth}&year=${selectedYear}`)
      const data = await res.json()

      console.log(" Data API Management:", data)

      if (data.attendanceSettings) {
        setAttendanceSettings({
          checkInStartTime: data.attendanceSettings.waktuMulaiAbsen ?? "07:00",
          onTimeBeforeHour: data.attendanceSettings.batasTepatWaktu ?? "09:00",
          lateBeforeHour: data.attendanceSettings.batasTerlambat ?? "14:00",
          workDays: data.attendanceSettings.hariKerja ?? [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        })
      }

      if (Array.isArray(data.employees)) {
        setEmployeeData(data.employees)
      }
    } catch (error) {
      console.error("Gagal memuat data karyawan dan pengaturan absensi:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployeesAndSettings()
  }, [selectedMonth, selectedYear])

  // Fungsi untuk mendapatkan jumlah hari dalam bulan yang benar
  const getDaysInSelectedMonth = () => {
    // Gunakan perhitungan yang benar untuk jumlah hari dalam bulan
    const lastDay = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth), 0).getDate()
    return Array.from({ length: lastDay }, (_, i) => i + 1)
  }

  const filteredEmployees = employeeData.filter(
    (employee) => employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || employee.nip.includes(searchTerm),
  )

  const isWithinCheckInTime = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    return currentTime >= attendanceSettings.checkInStartTime && currentTime <= attendanceSettings.lateBeforeHour
  }

  // Fungsi untuk scroll tabel
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftScroll(scrollLeft > 0)
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5) // 5px buffer
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  // Tambahkan event listener untuk scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      // Check initial scroll state
      handleScroll()
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header with Sidebar Trigger */}
      <div className="flex items-center gap-4 border-b border-emerald-100 dark:border-gray-700 pb-4">
        <SidebarTrigger className="-ml-1 lg:hidden" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-1">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Karyawan</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola data karyawan dan absensi</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Clock className="h-4 w-4 mr-2" />
              Atur Jam Kerja
            </button>
          </div>
        </div>
      </div>

      {/* Status Absensi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-gray-700 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status Absensi:</h3>
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full ${isWithinCheckInTime() ? "bg-green-500 animate-pulse" : "bg-red-500"
                } mr-2`}
            ></div>
            <span className="text-sm font-medium">
              {isWithinCheckInTime() ? "Sistem Absensi Aktif" : "Sistem Absensi Tidak Aktif"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Jam Absensi</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                <span className="font-medium">Mulai:</span> {attendanceSettings.checkInStartTime}
              </div>
              <div>
                <span className="font-medium">Selesai:</span> {attendanceSettings.lateBeforeHour}
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Status Kehadiran</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                Hadir: Absen {attendanceSettings.checkInStartTime} - {attendanceSettings.onTimeBeforeHour}
              </div>
              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                Terlambat: Absen {attendanceSettings.onTimeBeforeHour} - {attendanceSettings.lateBeforeHour}
              </div>
              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                Tidak Hadir: Tidak absen atau absen setelah {attendanceSettings.lateBeforeHour}
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Hari Kerja</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {attendanceSettings.workDays.map((day) => dayOptions.find((d) => d.value === day)?.label).join(", ")}
            </div>
          </div>
        </div>
      </div>



      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-gray-700 shadow-sm mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-emerald-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
        <MonthSelector
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
      </div>

      {/* Attendance Table with Fixed Columns and Scrollable Middle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex relative">
          {/* Fixed Left Column - Employee Info */}
          <div className="sticky left-0 z-10">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th
                    colSpan={3}
                    className="h-12 bg-emerald-100 dark:bg-emerald-900/30 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-r border-emerald-200 dark:border-gray-600"
                  >
                    Informasi Karyawan
                  </th>
                </tr>
                <tr>
                  <th className="h-10 w-16 px-3 bg-emerald-50 dark:bg-emerald-900/20 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r">
                    No
                  </th>
                  <th className="h-10 w-48 px-3 bg-emerald-50 dark:bg-emerald-900/20 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r">
                    Nama
                  </th>
                  <th className="h-10 w-36 px-3 bg-emerald-50 dark:bg-emerald-900/20 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-r">
                    NIP
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, i) => (
                  <tr key={emp.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="h-16 w-16 px-3 text-center text-sm border-b border-r bg-white dark:bg-gray-800">
                      {i + 1}
                    </td>
                    <td className="h-16 w-48 px-3 text-center text-sm border-b border-r bg-white dark:bg-gray-800">
                      {emp.name}
                    </td>
                    <td className="h-16 w-36 px-3 text-center text-sm border-b border-r bg-white dark:bg-gray-800">
                      {emp.nip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scrollable Middle Column - Attendance Data */}
          <div className="relative flex-1 overflow-hidden">
            {/* Scroll buttons */}
            {showLeftScroll && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-emerald-600 text-white rounded-r-lg p-2 shadow-lg hover:bg-emerald-700 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {showRightScroll && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-emerald-600 text-white rounded-l-lg p-2 shadow-lg hover:bg-emerald-700 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-500 scrollbar-track-emerald-100"
              style={{ maxWidth: "calc(100vw - 400px)" }}
              onScroll={handleScroll}
            >
              <table className="border-collapse w-max">
                <thead>
                  <tr>
                    <th
                      colSpan={getDaysInSelectedMonth().length}
                      className="h-12 bg-emerald-100 dark:bg-emerald-900/30 px-4 text-center text-sm font-semibold border-b border-r sticky top-0"
                    >
                      Absensi - {getSelectedMonthName()} {selectedYear}
                    </th>
                  </tr>
                  <tr className="sticky top-12">
                    {getDaysInSelectedMonth().map((day) => (
                      <th
                        key={day}
                        className="h-10 w-12 px-2 bg-emerald-50 dark:bg-emerald-900/20 text-center text-xs font-medium border-b border-r"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                      {getDaysInSelectedMonth().map((day) => {
                        const dayStr = day.toString().padStart(2, "0")
                        const dateKey = `${selectedYear}-${selectedMonth}-${dayStr}`
                        const status = emp.attendance?.[dateKey] || "tidak"

                        return (
                          <td key={day} className="h-16 w-12 px-2 text-center border-b border-r">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto ${getAttendanceColor(
                                status,
                              )}`}
                              title={
                                status === "hadir" || status === "tepat waktu"
                                  ? "Hadir"
                                  : status === "terlambat"
                                    ? "Terlambat"
                                    : status === "absen"
                                      ? "Tidak Hadir"
                                      : "Belum Ada Data"
                              }
                            >
                              {getAttendanceText(status)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fixed Right Columns - Summary and Actions */}
          <div className="sticky right-0 z-10 flex">
            {/* Summary */}
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="h-12 w-24 bg-emerald-100 dark:bg-emerald-900/30 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-b">
                    Total
                  </th>
                </tr>
                <tr>
                  <th className="h-10 w-24 bg-emerald-50 dark:bg-emerald-900/20 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-l">
                    H(T)/Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="h-16 w-24 px-3 text-center border-b border-l bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-center font-mono text-sm text-gray-700 dark:text-gray-200">
                        {emp.summary}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Aksi */}
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="h-12 w-24 bg-emerald-100 dark:bg-emerald-900/30 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-b">
                    Aksi
                  </th>
                </tr>
                <tr>
                  <th className="h-10 w-24 bg-emerald-50 dark:bg-emerald-900/20 text-center text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-l">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="h-16 w-24 px-3 text-center border-b border-l bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title={`Hapus data ${emp.name}`}
                        >
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

      {/* Modal Pengaturan Jam Kerja */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pengaturan Jam Kerja</h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Jam Absensi */}
              <div className="border-b border-emerald-200 dark:border-gray-700 pb-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pengaturan Waktu Absensi
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      1. Waktu Mulai Absen
                    </label>
                    <div className="flex items-center">
                      <input
                        type="time"
                        value={attendanceSettings.checkInStartTime}
                        onChange={(e) =>
                          setAttendanceSettings((prev) => ({ ...prev, checkInStartTime: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Waktu mulai karyawan bisa melakukan absensi
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      2. Batas Waktu Tepat Waktu
                    </label>
                    <div className="flex items-center">
                      <input
                        type="time"
                        value={attendanceSettings.onTimeBeforeHour}
                        onChange={(e) =>
                          setAttendanceSettings((prev) => ({ ...prev, onTimeBeforeHour: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Absen sebelum jam ini akan dianggap &quot;Hadir&quot; (tepat waktu)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      3. Batas Waktu Terlambat
                    </label>
                    <div className="flex items-center">
                      <input
                        type="time"
                        value={attendanceSettings.lateBeforeHour}
                        onChange={(e) => setAttendanceSettings((prev) => ({ ...prev, lateBeforeHour: e.target.value }))}
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Absen setelah jam tepat waktu dan sebelum jam ini akan dianggap &quot;Terlambat&quot;. Absen
                      setelah jam ini atau tidak absen akan dianggap &quot;Tidak Hadir&quot;.
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mr-2 flex-shrink-0" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-300">
                      Sistem absensi hanya akan aktif dari Waktu Mulai Absen sampai Batas Waktu Terlambat. Karyawan
                      hanya bisa melakukan absensi selama sistem aktif.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hari Kerja */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hari Kerja</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dayOptions.map((day) => (
                    <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendanceSettings.workDays.includes(day.value)}
                        onChange={() => handleWorkDayToggle(day.value)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Preview Pengaturan:</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    <strong>Jam Absensi:</strong> {attendanceSettings.checkInStartTime} -{" "}
                    {attendanceSettings.lateBeforeHour}
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    Hadir: Absen {attendanceSettings.checkInStartTime} - {attendanceSettings.onTimeBeforeHour}
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    Terlambat: Absen {attendanceSettings.onTimeBeforeHour} - {attendanceSettings.lateBeforeHour}
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                    Tidak Hadir: Tidak absen atau absen setelah {attendanceSettings.lateBeforeHour}
                  </div>
                  <div className="mt-2">
                    <strong>Hari Kerja:</strong>{" "}
                    {attendanceSettings.workDays
                      .map((day) => dayOptions.find((d) => d.value === day)?.label)
                      .join(", ")}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveSettings}
                disabled={attendanceSettings.workDays.length === 0}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
