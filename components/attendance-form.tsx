"use client"

import { useState } from "react"
import { markAttendance } from "@/lib/api"
import { WebcamCapture } from "@/components/webcam-capture"
import type { AttendanceFormProps } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Loader2, Camera } from "lucide-react"

export function AttendanceForm({ onSuccess, onError, onLoading }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "processing">("idle")
  const { toast } = useToast()

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

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

    setIsSubmitting(true)
    setCaptureStatus("processing")
    onLoading(true)

    toast({
      title: "Memproses Absensi",
      description: "Sedang memverifikasi identitas dan lokasi...",
      duration: 2000,
    })

    const officeLat = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || "0");
    const officeLng = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || "0");
    const maxDistanceMeters = parseInt(process.env.NEXT_PUBLIC_MAX_DISTANCE_METERS || "1200000000");


    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords
            const distance = calculateDistance(latitude, longitude, officeLat, officeLng)

            if ( distance > maxDistanceMeters) {
              toast({
                title: "Di Luar Area Kantor",
                description: `Absensi hanya bisa dilakukan dalam radius ${maxDistanceMeters} meter dari kantor.`,
                variant: "destructive",
              })
              onError("Lokasi di luar radius kantor.")
              return
            }

            const response = await markAttendance(imageSrc, latitude, longitude)

            if (response.success) {
              console.log("✅ Respons Berhasil:", response)

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
                image: imageSrc,
              })
            } else {
              throw new Error(response.message || "Gagal mencatat absensi")
            }
          } catch (err: any) {
            toast({
              title: "Gagal Absensi",
              description: err.message,
              variant: "destructive",
            })
            onError(err.message)
          } finally {
            setIsSubmitting(false)
            setCaptureStatus("idle")
            onLoading(false)
          }
        },
        (err) => {
          toast({
            title: "Gagal Mengakses Lokasi",
            description: "Izinkan akses lokasi untuk melakukan absensi.",
            variant: "destructive",
          })
          onError("Gagal mendapatkan lokasi.")
          setIsSubmitting(false)
          setCaptureStatus("idle")
          onLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } catch (error: any) {
      toast({
        title: "Kesalahan Umum",
        description: "Terjadi kesalahan saat memproses absensi.",
        variant: "destructive",
      })
      onError("Terjadi kesalahan saat absensi.")
      setIsSubmitting(false)
      setCaptureStatus("idle")
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

      {/* Overlay Loading */}
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Memproses Absensi</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sedang memverifikasi wajah dan mencatat kehadiran karyawan...
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Webcam */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <WebcamCapture onCapture={handleCapture} />
      </motion.div>
    </div>
  )
}
