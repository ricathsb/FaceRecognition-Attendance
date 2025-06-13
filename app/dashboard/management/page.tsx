"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Search,
  Save,
  X,
  Clock,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
} from "lucide-react"
import MonthSelector from "@/components/month-selector"
import { getManagementData } from "@/lib/api"

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

type Holiday = {
  id: number
  tanggal: string
  keterangan: string
}

const MONTHS = [
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

const DAY_OPTIONS = [
  { value: "monday", label: "Senin" },
  { value: "tuesday", label: "Selasa" },
  { value: "wednesday", label: "Rabu" },
  { value: "thursday", label: "Kamis" },
  { value: "friday", label: "Jumat" },
  { value: "saturday", label: "Sabtu" },
  { value: "sunday", label: "Minggu" },
]

const ATTENDANCE_STATUS = {
  PRESENT: ["hadir", "tepat waktu"] as const,
  LATE: "terlambat" as const,
  ABSENT: "absen" as const,
  SATURDAY: "sabtu" as const,
  SUNDAY: "minggu" as const,
  HOLIDAY: "libur" as const,
} as const

export default function ManagementPage() {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0"))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [employeeData, setEmployeeData] = useState<Employee[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings>({
    checkInStartTime: "07:00",
    onTimeBeforeHour: "09:00",
    lateBeforeHour: "14:00",
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  })

  // Tambahkan state untuk holiday management
  const [activeTab, setActiveTab] = useState<"schedule" | "holidays">("schedule")
  const [isAddingHoliday, setIsAddingHoliday] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [holidayForm, setHolidayForm] = useState({
    tanggal: "",
    keterangan: "",
  })

  // Scroll management
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(true)

  // Cache management
  const lastDataRef = useRef<{
    month: string
    year: string
    data: any
  } | null>(null)

  // Utility functions
  const getSelectedMonthName = () => {
    const month = MONTHS.find((m) => m.value === selectedMonth)
    return month?.label || "Januari"
  }

  // Ganti fungsi getAttendanceColor
  const getAttendanceColor = (status: string) => {
    const presentStatuses = ["hadir", "tepat waktu"]
    if (presentStatuses.includes(status)) return "bg-green-500"
    if (status === "terlambat") return "bg-yellow-500"
    if (status === "absen") return "bg-red-500"
    if (status === "sabtu") return "bg-green-600"
    if (status === "minggu") return "bg-purple-500"
    if (status === "libur") return "bg-orange-500"
    return "bg-gray-300"
  }

  // Ganti fungsi getAttendanceText
  const getAttendanceText = (status: string) => {
    const presentStatuses = ["hadir", "tepat waktu"]
    if (presentStatuses.includes(status)) return "H"
    if (status === "terlambat") return "T"
    if (status === "absen") return "A"
    if (status === "sabtu") return "S"
    if (status === "minggu") return "M"
    if (status === "libur") return "L"
    return "?"
  }

  // Ganti fungsi getAttendanceTooltip
  const getAttendanceTooltip = (status: string, dateStr?: string) => {
    if (status === "libur" && dateStr) {
      const holidayInfo = getHolidayInfo(dateStr)
      return holidayInfo ? `Hari Libur: ${holidayInfo.keterangan}` : "Hari Libur Khusus"
    }

    const presentStatuses = ["hadir", "tepat waktu"]
    if (presentStatuses.includes(status)) return "Hadir"
    if (status === "terlambat") return "Terlambat"
    if (status === "absen") return "Tidak Hadir"
    if (status === "sabtu") return "Hari Kerja Sabtu"
    if (status === "minggu") return "Minggu (Libur)"
    return "Belum Ada Data"
  }

  const isHoliday = (dateStr: string) => {
    return holidays.some((holiday) => {
      const holidayDate = new Date(holiday.tanggal).toISOString().split("T")[0]
      return holidayDate === dateStr
    })
  }

  const getDaysInSelectedMonth = () => {
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

  // Holiday management functions
  const resetHolidayForm = () => {
    setHolidayForm({ tanggal: "", keterangan: "" })
    setIsAddingHoliday(false)
    setEditingHoliday(null)
  }

  const handleAddHoliday = async () => {
    if (!holidayForm.tanggal || !holidayForm.keterangan.trim()) {
      alert("Tanggal dan keterangan harus diisi")
      return
    }

    try {
      const response = await fetch("/api/karyawan/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: holidayForm.tanggal,
          action: "add",
          keterangan: holidayForm.keterangan.trim(),
        }),
      })

      if (response.ok) {
        await fetchEmployeesAndSettings(true)
        resetHolidayForm()
        alert("Hari libur berhasil ditambahkan")
      } else {
        alert("Gagal menambahkan hari libur")
      }
    } catch (error) {
      console.error("Error adding holiday:", error)
      alert("Terjadi kesalahan saat menambahkan hari libur")
    }
  }

  const handleEditHoliday = async () => {
    if (!holidayForm.tanggal || !holidayForm.keterangan.trim()) {
      alert("Tanggal dan keterangan harus diisi")
      return
    }

    try {
      const response = await fetch("/api/karyawan/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: holidayForm.tanggal,
          action: "update",
          keterangan: holidayForm.keterangan.trim(),
          holidayId: editingHoliday?.id,
        }),
      })

      if (response.ok) {
        await fetchEmployeesAndSettings(true)
        resetHolidayForm()
        alert("Hari libur berhasil diperbarui")
      } else {
        alert("Gagal memperbarui hari libur")
      }
    } catch (error) {
      console.error("Error updating holiday:", error)
      alert("Terjadi kesalahan saat memperbarui hari libur")
    }
  }

  const handleDeleteHoliday = async (holiday: Holiday) => {
    if (
      !confirm(
        `Hapus hari libur "${holiday.keterangan}" pada tanggal ${new Date(holiday.tanggal).toLocaleDateString("id-ID")}?`,
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/karyawan/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: holiday.tanggal,
          action: "remove",
          holidayId: holiday.id,
        }),
      })

      if (response.ok) {
        await fetchEmployeesAndSettings(true)
        alert("Hari libur berhasil dihapus")
      } else {
        alert("Gagal menghapus hari libur")
      }
    } catch (error) {
      console.error("Error deleting holiday:", error)
      alert("Terjadi kesalahan saat menghapus hari libur")
    }
  }

  const startEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    setHolidayForm({
      tanggal: new Date(holiday.tanggal).toISOString().split("T")[0],
      keterangan: holiday.keterangan,
    })
    setIsAddingHoliday(true)
    setActiveTab("holidays")
  }

  const downloadPDF = async () => {
  try {
    const res = await fetch(`/api/rekap-absensi?month=${selectedMonth}&year=${selectedYear}`)
    if (!res.ok) throw new Error("Gagal mengunduh PDF")

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rekap-absensi-${selectedMonth}-${selectedYear}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Download gagal:", error)
    alert("Gagal mengunduh PDF rekap absensi.")
  }
}

  const getHolidayInfo = (dateStr: string) => {
    return holidays.find((holiday) => {
      const holidayDate = new Date(holiday.tanggal).toISOString().split("T")[0]
      return holidayDate === dateStr
    })
  }

  // Event handlers
  const handleHolidayToggle = async (dateStr: string) => {
    const existingHoliday = getHolidayInfo(dateStr)

    if (existingHoliday) {
      // Jika sudah ada, edit
      startEditHoliday(existingHoliday)
    } else {
      // Jika belum ada, tambah baru
      setHolidayForm({
        tanggal: dateStr,
        keterangan: "",
      })
      setIsAddingHoliday(true)
      setActiveTab("holidays")
      setIsSettingsModalOpen(true)
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
      !confirm(
        `Apakah Anda yakin ingin menghapus data karyawan "${employeeName}"?\n\nSemua data absensi karyawan ini akan ikut terhapus.`,
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/karyawan/management", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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

  const handleSaveSettings = async () => {
    // Validate time settings
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
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify(attendanceSettings),
      })

      if (response.ok) {
        setIsSettingsModalOpen(false)
        alert("Pengaturan absensi berhasil disimpan!")
        await fetchEmployeesAndSettings(true)
      } else {
        const errorData = await response.json().catch(() => ({ message: "Gagal menyimpan pengaturan" }))
        alert(errorData.message || "Gagal menyimpan pengaturan absensi")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Terjadi kesalahan saat menyimpan pengaturan")
    }
  }

  const handleManualRefresh = () => {
    fetchEmployeesAndSettings(true)
  }

  // Scroll functions
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftScroll(scrollLeft > 0)
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" })
  }

  // Data fetching
  const fetchEmployeesAndSettings = useCallback(
    async (forceRefresh = false) => {
      // Use cache if available and not forcing refresh
      if (
        !forceRefresh &&
        lastDataRef.current &&
        lastDataRef.current.month === selectedMonth &&
        lastDataRef.current.year === selectedYear
      ) {
        const cachedData = lastDataRef.current.data

        if (cachedData.attendanceSettings) {
          setAttendanceSettings({
            checkInStartTime: cachedData.attendanceSettings.waktuMulaiAbsen ?? "07:00",
            onTimeBeforeHour: cachedData.attendanceSettings.batasTepatWaktu ?? "09:00",
            lateBeforeHour: cachedData.attendanceSettings.batasTerlambat ?? "14:00",
            workDays: cachedData.attendanceSettings.hariKerja ?? [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ],
          })
        }

        if (Array.isArray(cachedData.employees)) {
          setEmployeeData(cachedData.employees)
          setLastFetchTime(cachedData.timestamp || new Date().toLocaleString())
        }

        if (Array.isArray(cachedData.holidays)) {
          setHolidays(cachedData.holidays)
        }

        return
      }

      setIsRefreshing(forceRefresh)
      setIsLoading(!forceRefresh)
      setErrorMessage(null)

      try {
        const data = await getManagementData(selectedMonth, selectedYear)

        // Cache the data
        lastDataRef.current = {
          month: selectedMonth,
          year: selectedYear,
          data: data,
        }

        // Update settings
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
            ],
          })
        }

        // Update employee data
        setEmployeeData(Array.isArray(data.employees) ? data.employees : [])
        setLastFetchTime(data.timestamp || new Date().toLocaleString())

        // Update holidays data
        setHolidays(Array.isArray(data.holidays) ? data.holidays : [])
      } catch (error: any) {
        console.error("Failed to load data:", error)
        setErrorMessage(error.message || "Gagal memuat data. Silakan coba lagi.")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [selectedMonth, selectedYear],
  )

  // Effects
  useEffect(() => {
    fetchEmployeesAndSettings()
  }, [fetchEmployeesAndSettings])

  useEffect(() => {
    const handleFocus = () => {
      if (employeeData.length === 0) {
        fetchEmployeesAndSettings(true)
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [employeeData.length, fetchEmployeesAndSettings])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      handleScroll()
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (errorMessage) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg mb-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Terjadi Kesalahan</h2>
              <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 inline-block mr-2 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 inline-block mr-2" />
                  Coba Lagi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Karyawan</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola data karyawan dan absensi</p>
          {lastFetchTime && (
            <p className="text-xs text-gray-500 dark:text-gray-500">Terakhir diperbarui: {lastFetchTime}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Memuat..." : "Refresh Data"}
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Clock className="h-4 w-4 mr-2" />
            Atur Jam Kerja
          </button>
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

              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                Minggu: Hari Minggu
              </div>
              <div>
                <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                Libur: Hari Libur Khusus
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Hari Kerja</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {attendanceSettings.workDays.map((day) => DAY_OPTIONS.find((d) => d.value === day)?.label).join(", ")}
            </div>
            {holidays.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Hari Libur Bulan Ini:</span> {holidays.length} hari
              </div>
            )}
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
        <button
        onClick={downloadPDF}
        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
      >
        Download Rekap PDF
      </button>
      </div>

      {/* Attendance Table */}
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
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, i) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="h-16 text-center text-sm border-b border-r bg-white dark:bg-gray-800">
                      Tidak ada data karyawan
                    </td>
                  </tr>
                )}
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
                    {getDaysInSelectedMonth().map((day) => {
                      const dayStr = day.toString().padStart(2, "0")
                      const dateKey = `${selectedYear}-${selectedMonth}-${dayStr}`
                      const isHolidayDay = isHoliday(dateKey)

                      return (
                        <th
                          key={day}
                          className={`h-10 w-12 px-2 text-center text-xs font-medium border-b border-r relative group cursor-pointer transition-colors ${isHolidayDay
                            ? "bg-orange-200 dark:bg-orange-900/50 hover:bg-orange-300 dark:hover:bg-orange-900/70"
                            : "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                            }`}
                          onClick={() => handleHolidayToggle(dateKey)}
                          title={
                            isHolidayDay
                              ? `${day} - Hari Libur (Klik untuk hapus)`
                              : `${day} - Klik untuk tandai sebagai hari libur`
                          }
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{day}</span>
                            {isHolidayDay && (
                              <div className="flex items-center justify-center">
                                <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">L</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity rounded pointer-events-none"></div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
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
                                title={getAttendanceTooltip(status, dateKey)}
                              >
                                {getAttendanceText(status)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={getDaysInSelectedMonth().length}
                        className="h-16 text-center text-sm border-b border-r bg-white dark:bg-gray-800"
                      >
                        Tidak ada data absensi
                      </td>
                    </tr>
                  )}
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
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                      <td className="h-16 w-24 px-3 text-center border-b border-l bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-center font-mono text-sm text-gray-700 dark:text-gray-200">
                          {emp.summary}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="h-16 w-24 px-3 text-center border-b border-l bg-white dark:bg-gray-800">-</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Actions */}
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
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
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
                  ))
                ) : (
                  <tr>
                    <td className="h-16 w-24 px-3 text-center border-b border-l bg-white dark:bg-gray-800">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pengaturan Sistem</h3>
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false)
                  resetHolidayForm()
                  setActiveTab("schedule")
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "schedule"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <Clock className="h-4 w-4 inline-block mr-2" />
                Jam Kerja
              </button>
              <button
                onClick={() => setActiveTab("holidays")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "holidays"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <Calendar className="h-4 w-4 inline-block mr-2" />
                Hari Libur
              </button>
            </div>

            {/* Schedule Tab Content */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                {/* Existing schedule content */}
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
                      <input
                        type="time"
                        value={attendanceSettings.checkInStartTime}
                        onChange={(e) =>
                          setAttendanceSettings((prev) => ({ ...prev, checkInStartTime: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Waktu mulai karyawan bisa melakukan absensi
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        2. Batas Waktu Tepat Waktu
                      </label>
                      <input
                        type="time"
                        value={attendanceSettings.onTimeBeforeHour}
                        onChange={(e) =>
                          setAttendanceSettings((prev) => ({ ...prev, onTimeBeforeHour: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Absen sebelum jam ini akan dianggap Hadir (tepat waktu)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        3. Batas Waktu Terlambat
                      </label>
                      <input
                        type="time"
                        value={attendanceSettings.lateBeforeHour}
                        onChange={(e) => setAttendanceSettings((prev) => ({ ...prev, lateBeforeHour: e.target.value }))}
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Absen setelah jam tepat waktu dan sebelum jam ini akan dianggap Terlambat. Absen setelah jam
                        ini atau tidak absen akan dianggap Tidak Hadir.
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

                {/* Work Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hari Kerja</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAY_OPTIONS.map((day) => (
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
                    <div>
                      <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                      Libur: Hari libur khusus (dapat diatur per tanggal)
                    </div>
                    <div className="mt-2">
                      <strong>Hari Kerja:</strong>{" "}
                      {attendanceSettings.workDays
                        .map((day) => DAY_OPTIONS.find((d) => d.value === day)?.label)
                        .join(", ")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveSettings}
                    disabled={attendanceSettings.workDays.length === 0}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            )}

            {/* Holidays Tab Content */}
            {activeTab === "holidays" && (
              <div className="space-y-6">
                {/* Add/Edit Holiday Form */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    {editingHoliday ? "Edit Hari Libur" : "Tambah Hari Libur"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal</label>
                      <input
                        type="date"
                        value={holidayForm.tanggal}
                        onChange={(e) => setHolidayForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        value={holidayForm.keterangan}
                        onChange={(e) => setHolidayForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                        placeholder="Contoh: Hari Raya Idul Fitri"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={editingHoliday ? handleEditHoliday : handleAddHoliday}
                      disabled={!holidayForm.tanggal || !holidayForm.keterangan.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {editingHoliday ? "Update" : "Tambah"} Hari Libur
                    </button>
                    {(isAddingHoliday || editingHoliday) && (
                      <button
                        onClick={resetHolidayForm}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {/* Holidays List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                      Daftar Hari Libur ({holidays.length})
                    </h4>
                    <button
                      onClick={() => {
                        setHolidayForm({ tanggal: "", keterangan: "" })
                        setIsAddingHoliday(true)
                        setEditingHoliday(null)
                      }}
                      className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      + Tambah Baru
                    </button>
                  </div>

                  {holidays.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {holidays
                        .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
                        .map((holiday) => (
                          <div
                            key={holiday.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{holiday.keterangan}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(holiday.tanggal).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditHoliday(holiday)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                title="Edit hari libur"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteHoliday(holiday)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                                title="Hapus hari libur"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada hari libur yang ditambahkan</p>
                      <p className="text-sm">Klik Tambah Baru untuk menambah hari libur</p>
                    </div>
                  )}
                </div>

                {/* Quick Add Common Holidays */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Hari Libur Umum</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Klik untuk menambah hari libur umum (tahun {selectedYear})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { date: `${selectedYear}-01-01`, name: "Tahun Baru" },
                      { date: `${selectedYear}-08-17`, name: "Hari Kemerdekaan" },
                      { date: `${selectedYear}-12-25`, name: "Hari Natal" },
                      { date: `${selectedYear}-05-01`, name: "Hari Buruh" },
                    ].map((commonHoliday) => {
                      const exists = holidays.some(
                        (h) => new Date(h.tanggal).toISOString().split("T")[0] === commonHoliday.date,
                      )
                      return (
                        <button
                          key={commonHoliday.date}
                          onClick={() => {
                            if (!exists) {
                              setHolidayForm({
                                tanggal: commonHoliday.date,
                                keterangan: commonHoliday.name,
                              })
                              setIsAddingHoliday(true)
                              setEditingHoliday(null)
                            }
                          }}
                          disabled={exists}
                          className={`p-2 text-xs rounded-lg transition-colors ${exists
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                            }`}
                        >
                          {commonHoliday.name}
                          {exists && " ✓"}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false)
                  resetHolidayForm()
                  setActiveTab("schedule")
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
