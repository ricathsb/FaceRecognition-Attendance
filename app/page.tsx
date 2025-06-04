"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AttendanceCard } from "@/components/attendance-card"
import { AttendanceForm } from "@/components/attendance-form"
import { LoadingSpinner } from "@/components/loading-spinner"
import { FaceDetectionGuide } from "@/components/face-detection-guide"
import { Navbar } from "@/components/navbar"
import type { AttendanceResponse } from "@/lib/types"
import { motion } from "framer-motion"
import { Camera, Clock, Activity } from "lucide-react"

export default function Home() {
  const router = useRouter()

  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const role = localStorage.getItem("role")
    if (!role) {
      router.push("/login")
    } else {
      setIsCheckingAuth(false)
    }

    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleSuccess = (data: AttendanceResponse) => {
    setAttendanceData(data)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setAttendanceData(null)
  }

  const handleReset = () => {
    setAttendanceData(null)
    setError(null)
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Activity className="h-4 w-4" />
                <span>Sistem Absensi Wajah</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Face Attendance
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                  System
                </span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Tandai kehadiran Anda dengan teknologi pengenalan wajah yang cepat dan akurat
              </p>

        
            </motion.div>

            {/* Guide Section - Moved to top */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <FaceDetectionGuide />
            </motion.div>

            {/* Main Attendance Card - Centered and Larger */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-2xl">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Camera className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Tandai Kehadiran</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Ambil foto wajah Anda untuk melakukan absensi
                    </p>
                  </div>

                  {isLoading && <LoadingSpinner />}

                  {!attendanceData && !isLoading && (
                    <AttendanceForm onSuccess={handleSuccess} onError={handleError} onLoading={setIsLoading} />
                  )}

                  {attendanceData && !isLoading && <AttendanceCard data={attendanceData} onReset={handleReset} />}

                  {error && !isLoading && !attendanceData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                          <Camera className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-800 dark:text-red-200">Terjadi Kesalahan</h3>
                          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* System Status - Below main card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mt-6"
                >

                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur mt-12">
          <div className="container mx-auto px-6 py-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Face Attendance System. Semua hak dilindungi.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
