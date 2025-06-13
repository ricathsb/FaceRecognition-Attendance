"use client"

import { useState } from "react"
import { markAttendance } from "@/lib/api"
import { WebcamCapture } from "@/components/webcam-capture"
import type { AttendanceFormProps } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle, Loader2, Camera, Zap } from "lucide-react"

// Pastikan AttendanceFormProps menggunakan tipe yang benar
export function AttendanceForm({ onSuccess, onError, onLoading }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "processing">("idle")
  const { toast } = useToast()

  const handleCapture = async (imageSrc: string | null) => {
    if (!imageSrc) {
      toast({
        title: "Gagal Mengambil Foto",
        description: "Tidak dapat mengambil gambar. Silakan coba lagi.",
        variant: "destructive",
      })
      onError("Gagal mengambil foto. Silakan coba lagi.")
      return
    }

    try {
      setIsSubmitting(true)
      setCaptureStatus("processing")
      onLoading(true)

      // Show processing toast
      toast({
        title: "Memproses Absensi",
        description: "Sedang memverifikasi identitas karyawan dan mencatat kehadiran...",
        duration: 2000,
      })

      // imageSrc sudah berformat data URL: 'data:image/jpeg;base64,...'
      // Jadi kita bisa langsung kirim imageSrc sebagai string lengkap
      const response = await markAttendance(imageSrc)

      if (response.success) {
        // Success toast
        toast({
          title: "Absensi Berhasil! ✨",
          description: `Selamat datang, ${response.nama || "Karyawan"}!`,
          variant: "default",
          duration: 5000,
        })

        onSuccess({
          success: true,
          nip: response.nip || "",
          nama: response.nama || "",
          timestamp: response.timestamp || new Date().toISOString(),
          message: response.message || "Absensi berhasil dicatat!",
          image: imageSrc, // Include the captured image
        })

        setCaptureStatus("idle")
      } else {
        throw new Error(response.message || "Gagal mencatat absensi")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga"

      // Error toast with more specific messaging
      let toastTitle = "Gagal Mencatat Absensi"
      let toastDescription = errorMessage

      if (errorMessage.toLowerCase().includes("wajah")) {
        toastTitle = "Wajah Tidak Terdeteksi"
        toastDescription = "Pastikan wajah Anda terlihat jelas dan coba lagi."
      } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("connection")) {
        toastTitle = "Masalah Koneksi"
        toastDescription = "Periksa koneksi internet Anda dan coba lagi."
      } else if (errorMessage.toLowerCase().includes("server")) {
        toastTitle = "Server Error"
        toastDescription = "Terjadi masalah pada server. Silakan coba beberapa saat lagi."
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
        duration: 6000,
      })

      onError(errorMessage)
      setCaptureStatus("idle")
    } finally {
      setIsSubmitting(false)
      onLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Status Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-6 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
          {captureStatus === "idle" && (
            <>
              <Camera className="h-5 w-5" />
              <span className="font-medium">Siap untuk Absensi</span>
            </>
          )}
          {captureStatus === "capturing" && (
            <>
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Mengambil Foto...</span>
            </>
          )}
          {captureStatus === "processing" && (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">Memproses Absensi...</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Processing Overlay */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-emerald-200 dark:border-gray-700 max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Memproses Absensi</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sedang memverifikasi wajah dan mencatat kehadiran karyawan...
                </p>
              </div>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Webcam Component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <WebcamCapture onCapture={handleCapture} />
      </motion.div>



    </div>
  )
}
