"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Clock, User, BadgeIcon as IdCard, Camera, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { AttendanceCardProps } from "@/lib/types"
import { format } from "date-fns"

export function AttendanceCard({ data, onReset }: AttendanceCardProps) {
  const getStatusColor = (message: string) => {
    if (message.toLowerCase().includes("tepat waktu") || message.toLowerCase().includes("hadir")) {
      return {
        bg: "from-green-500 to-emerald-600",
        text: "text-green-700",
        bgLight: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-600",
      }
    } else if (message.toLowerCase().includes("terlambat")) {
      return {
        bg: "from-orange-500 to-amber-600",
        text: "text-orange-700",
        bgLight: "bg-orange-50",
        border: "border-orange-200",
        icon: "text-orange-600",
      }
    }
    return {
      bg: "from-blue-500 to-indigo-600",
      text: "text-blue-700",
      bgLight: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
    }
  }

  const statusColors = getStatusColor(data.message || "")

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="w-full max-w-lg mx-auto"
      >
        <Card className="overflow-hidden border-0 shadow-2xl bg-white dark:bg-gray-800">
          {/* Success Header with Gradient */}
          <CardHeader className="relative p-0">
            <div className={`bg-gradient-to-r ${statusColors.bg} p-8 text-white relative overflow-hidden`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="absolute bottom-4 left-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="h-12 w-12 opacity-50" />
                </div>
              </div>

              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4"
                >
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  Absensi Berhasil!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-sm"
                >
                  Kehadiran Anda telah tercatat dalam sistem
                </motion.p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Employee Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {/* Name */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Karyawan</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{data.nama || "-"}</p>
                </div>
              </div>

              {/* NIP */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IdCard className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NIP</p>
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{data.nip || "-"}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Waktu Absensi</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {data.timestamp
                      ? format(new Date(data.timestamp), "dd/MM/yyyy - HH:mm:ss")
                      : "Waktu tidak tersedia"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Captured Image */}
            {data.image && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Absensi</p>
                </div>
                <div className="relative group">
                  <img
                    src={data.image || "/placeholder.svg"}
                    alt="Attendance capture"
                    className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-xl transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-all duration-300"></div>
                </div>
              </motion.div>
            )}

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={`p-4 ${statusColors.bgLight} ${statusColors.border} border-2 rounded-2xl`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-6 w-6 ${statusColors.icon}`} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Status Kehadiran</p>
                  <p className={`${statusColors.text} font-medium text-sm`}>
                    {data.message || "Absensi berhasil dicatat"}
                  </p>
                </div>
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="p-8 pt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full"
            >
              <Button
                onClick={onReset}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >

                Tandai Absensi
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
