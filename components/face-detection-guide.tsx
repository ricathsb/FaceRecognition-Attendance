"use client"

import { Camera, CheckCircle, AlertTriangle, Info, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

export function FaceDetectionGuide() {
  const guidelines = [
    {
      icon: Camera,
      title: "Posisi Wajah",
      description: "Pastikan wajah berada di tengah frame",
      type: "info",
    },
    {
      icon: Lightbulb,
      title: "Pencahayaan",
      description: "Gunakan pencahayaan yang cukup terang",
      type: "success",
    },
    {
      icon: AlertTriangle,
      title: "Hindari Bayangan",
      description: "Pastikan tidak ada bayangan pada wajah",
      type: "warning",
    },
    {
      icon: CheckCircle,
      title: "Lepas Aksesoris",
      description: "Lepas kacamata atau masker jika memungkinkan",
      type: "info",
    },
  ]

  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-100 dark:bg-green-900/40"
      case "warning":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/40"
      default:
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/40"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Panduan Pengambilan Foto</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tips untuk hasil terbaik</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guidelines.map((guide, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconColor(guide.type)}`}>
              <guide.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">{guide.title}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs">{guide.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Tips Tambahan</span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Pastikan koneksi internet stabil dan izinkan akses kamera pada browser Anda untuk hasil terbaik.
        </p>
      </div>
    </motion.div>
  )
}
