"use client"

import { useRef, useState, useCallback } from "react"
import Webcam from "react-webcam"
import type { WebcamCaptureProps } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, RotateCcw, Focus, Zap } from "lucide-react"
import { motion } from "framer-motion"

export type WebcamCapturePropsExtended = WebcamCaptureProps & {
  someExtraProp?: string
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [isReady, setIsReady] = useState(false)

  const toggleCamera = useCallback(() => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"))
  }, [])

  const captureImage = useCallback(() => {
    setIsLoading(true)

    setTimeout(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot()
        onCapture(imageSrc)
      } else {
        onCapture(null)
      }
      setIsLoading(false)
    }, 800)
  }, [onCapture])

  const handleUserMedia = useCallback(() => {
    setIsReady(true)
  }, [])

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
  }

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto">


      {/* Enhanced Camera Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-gray-800 dark:to-gray-700 p-3 shadow-2xl border-2 border-emerald-200 dark:border-gray-600">
          {/* Camera Container */}
          <div className="relative rounded-xl overflow-hidden bg-black shadow-inner">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              className="w-full h-auto rounded-xl"
              height={720}
              width={1280}
            />



            {/* Camera Controls Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCamera}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 border-emerald-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                aria-label="Switch camera"
              >
                <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </Button>
            </div>


          </div>
        </div>
      </motion.div>

      {/* Enhanced Capture Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
        <Button
          onClick={captureImage}
          disabled={isLoading || !isReady}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white h-16 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none rounded-xl border-0 relative overflow-hidden group"
          aria-label="Capture image and mark attendance"
        >
          {/* Button Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

          {/* Button Content */}
          <div className="relative z-10 flex items-center justify-center">
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                <span>Mengambil Foto...</span>
                <div className="ml-3 flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </>
            ) : (
              <>
                <Camera className="mr-3 h-6 w-6" />
                <span>Ambil Foto Absensi</span>
              </>
            )}
          </div>
        </Button>
      </motion.div>

    </div>
  )
}
