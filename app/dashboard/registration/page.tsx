"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Camera, Save, X, Loader2, RotateCcw, User, Mail, Lock, BadgeIcon, CheckCircle, UserPlus, Users } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface FormData {
    nama: string
    nip: string
    email: string
    password: string
    status: string
}

export default function RegistrationPage() {
    const [formData, setFormData] = useState<FormData>({
        nama: "",
        nip: "",
        email: "",
        password: "",
        status: "Staff",
    })

    const [currentStep, setCurrentStep] = useState(1)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState<string | null>(null)
    const [isNipValid, setIsNipValid] = useState(true)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isCameraActive, setIsCameraActive] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: value,
            }
            return newData
        })

        // Reset error message when user types
        if (submitMessage) {
            setSubmitMessage(null)
        }

        // Validasi NIP secara real-time
        if (name === "nip") {
            const isValidFormat = /^\d{5,12}$/.test(value.trim())
            setIsNipValid(value === "" || isValidFormat)
        }
    }

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setIsCameraActive(true)
            }
        } catch (error) {
            console.error("Error accessing camera:", error)
            setSubmitMessage("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.")
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach((track) => track.stop())
            videoRef.current.srcObject = null
            setIsCameraActive(false)
        }
    }, [])

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const video = videoRef.current
            const context = canvas.getContext("2d")

            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0)

                const dataURL = canvas.toDataURL("image/jpeg", 0.8)
                setImageSrc(dataURL)
                stopCamera()
                setSubmitMessage("Foto berhasil diambil!")
            }
        }
    }, [stopCamera])

    const retakePhoto = () => {
        setImageSrc(null)
        setSubmitMessage(null)
        startCamera()
    }

    const validateStep1 = () => {
        const trimmedData = {
            nama: formData.nama?.trim() || "",
            nip: formData.nip?.trim() || "",
            email: formData.email?.trim() || "",
            password: formData.password?.trim() || "",
            status: formData.status?.trim() || "",
        }

        if (!trimmedData.nama || !trimmedData.nip || !trimmedData.email || !trimmedData.password || !trimmedData.status) {
            setSubmitMessage("Semua field wajib diisi")
            return false
        }

        if (trimmedData.password.length < 6) {
            setSubmitMessage("Password minimal 6 karakter")
            return false
        }

        // Validasi NIP format
        if (!/^\d{5,12}$/.test(trimmedData.nip)) {
            setSubmitMessage("Format NIP tidak valid. NIP harus berupa 5-12 digit angka.")
            setIsNipValid(false)
            return false
        }

        // Validasi email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedData.email)) {
            setSubmitMessage("Format email tidak valid")
            return false
        }

        // Validasi status
        if (!["Staff", "Teacher"].includes(trimmedData.status)) {
            setSubmitMessage("Status harus berupa 'Staff' atau 'Teacher'")
            return false
        }

        setIsNipValid(true)
        return true
    }

    // Fungsi untuk mengecek apakah form valid
    const isFormValid = () => {
        const trimmedData = {
            nama: formData.nama?.trim() || "",
            nip: formData.nip?.trim() || "",
            email: formData.email?.trim() || "",
            password: formData.password?.trim() || "",
            status: formData.status?.trim() || "",
        }

        const isValid =
            trimmedData.nama &&
            trimmedData.nip &&
            trimmedData.email &&
            trimmedData.password &&
            trimmedData.status &&
            trimmedData.password.length >= 6 &&
            /^\d{5,12}$/.test(trimmedData.nip) &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedData.email) &&
            ["Staff", "Teacher"].includes(trimmedData.status)

        return isValid
    }

    const handleNextStep = () => {
        if (validateStep1()) {
            setCurrentStep(2)
            setSubmitMessage(null)
        }
    }

    const handleSubmit = async () => {
        if (!imageSrc) {
            setSubmitMessage("Foto wajah wajib diambil")
            return
        }

        setIsSubmitting(true)
        setSubmitMessage("Mendaftarkan karyawan...")

        try {
            const requestData = {
                nama: formData.nama || "",
                nip: formData.nip || "",
                email: formData.email || "",
                password: formData.password || "",
                status: formData.status || "Staff",
                fotoWajah: imageSrc || "",
            }

            const response = await fetch("/api/karyawan/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            })

            const data = await response.json()

            if (!response.ok) {
                // Tangani error dari backend, termasuk error dari Flask
                if (data.error?.includes("wajah")) {
                    setSubmitMessage("Gagal: Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.")
                } else {
                    setSubmitMessage(data.error || data.message || `HTTP Error: ${response.status}`)
                }
                return
            }

            // Kalau sukses:
            setSubmitMessage(data.message || `Pendaftaran ${formData.nama} berhasil!`)

            // Reset form setelah beberapa detik
            setTimeout(() => {
                setFormData({
                    nama: "",
                    nip: "",
                    email: "",
                    password: "",
                    status: "Staff",
                })
                setImageSrc(null)
                setCurrentStep(1)
                setSubmitMessage(null)
                setIsNipValid(true)
            }, 4000)
        } catch (error: any) {
            console.error("Registration error:", error)
            setSubmitMessage(`Error: ${error.message || "Terjadi kesalahan saat pendaftaran"}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusIcon = (status: string) => {
        return status === "Teacher" ? "👨‍🏫" : "👨‍💼"
    }

    const getStatusColor = (status: string) => {
        return status === "Teacher" 
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
            {/* Header with Sidebar Trigger */}
            <div className="flex items-center gap-4 border-b border-emerald-100 dark:border-gray-700 pb-4">
                <SidebarTrigger className="-ml-1 lg:hidden" />
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-1">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Pendaftaran Karyawan</h1>
                        <p className="text-gray-600 dark:text-gray-400">Tambah karyawan baru ke sistem</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <UserPlus className="h-5 w-5" />
                            <span className="font-medium">Langkah {currentStep} dari 2</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto w-full">
                {/* Step Indicator */}
                <div className="flex items-center mb-10">
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium ${currentStep >= 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                                }`}
                        >
                            1
                        </div>
                        <span className={`mt-2 text-sm font-medium ${currentStep >= 1 ? "text-emerald-600" : "text-gray-500"}`}>
                            Data Karyawan
                        </span>
                    </div>

                    <div className="flex-1 mx-4">
                        <div className={`h-1.5 rounded-full ${currentStep >= 2 ? "bg-emerald-600" : "bg-gray-300"}`}></div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium ${currentStep >= 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                                }`}
                        >
                            2
                        </div>
                        <span className={`mt-2 text-sm font-medium ${currentStep >= 2 ? "text-emerald-600" : "text-gray-500"}`}>
                            Foto Wajah
                        </span>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-lg overflow-hidden">
                    {currentStep === 1 && (
                        <div className="p-8 lg:p-10">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Informasi Karyawan</h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="nama"
                                            value={formData.nama || ""}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3.5 border border-emerald-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Masukkan nama lengkap"
                                            required
                                        />
                                        {formData.nama && (
                                            <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        NIP (Nomor Induk Pegawai)
                                    </label>
                                    <div className="relative">
                                        <BadgeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="nip"
                                            value={formData.nip || ""}
                                            onChange={handleInputChange}
                                            className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${!isNipValid && formData.nip
                                                    ? "border-red-500 ring-red-200"
                                                    : "border-emerald-200 dark:border-gray-600"
                                                }`}
                                            placeholder="Masukkan NIP (5-12 digit)"
                                            required
                                        />
                                        {isNipValid && formData.nip && (
                                            <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                    {!isNipValid && formData.nip && (
                                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                                            <X className="h-4 w-4 mr-1" />
                                            Format NIP tidak valid. Gunakan 5-12 digit angka.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email || ""}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3.5 border border-emerald-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Masukkan email"
                                            required
                                        />
                                        {formData.email && (
                                            <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password || ""}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3.5 border border-emerald-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Masukkan password (min. 6 karakter)"
                                            required
                                        />
                                        {formData.password && formData.password.length >= 6 && (
                                            <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                    {formData.password && formData.password.length < 6 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center mt-1">
                                            <span className="inline-block w-4 h-4 mr-1 rounded-full border border-amber-600 dark:border-amber-400 text-center text-amber-600 dark:text-amber-400 font-bold">
                                                !
                                            </span>
                                            Password minimal 6 karakter
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            name="status"
                                            value={formData.status || "Staff"}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3.5 border border-emerald-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 appearance-none"
                                            required
                                        >
                                            <option value="Staff">Staff</option>
                                            <option value="Teacher">Teacher</option>
                                        </select>
                                        {formData.status && (
                                            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                                                    <span className="mr-1">{getStatusIcon(formData.status)}</span>
                                                    {formData.status}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Pilih status karyawan: Staff untuk pegawai administrasi, Teacher untuk tenaga pengajar
                                    </p>
                                </div>
                            </div>

                            {submitMessage && currentStep === 1 && (
                                <div
                                    className={`mt-8 p-4 rounded-xl text-sm ${submitMessage.includes("berhasil")
                                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                        }`}
                                >
                                    {submitMessage}
                                </div>
                            )}

                            <div className="flex justify-end mt-10">
                                <button
                                    onClick={handleNextStep}
                                    disabled={!isFormValid()}
                                    className="px-8 py-3.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="p-8 lg:p-10">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Pengambilan Foto Wajah</h2>

                            <div className="space-y-8">
                                {/* Employee Info Summary */}
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
                                    <h3 className="font-medium text-emerald-900 dark:text-emerald-300 mb-3 flex items-center">
                                        <User className="h-5 w-5 mr-2" />
                                        Ringkasan Data Karyawan
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Nama:</span>
                                            <span className="ml-2 text-emerald-800 dark:text-emerald-200">{formData.nama}</span>
                                        </div>
                                        <div>
                                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">NIP:</span>
                                            <span className="ml-2 text-emerald-800 dark:text-emerald-200">{formData.nip}</span>
                                        </div>
                                        <div>
                                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Email:</span>
                                            <span className="ml-2 text-emerald-800 dark:text-emerald-200">{formData.email}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Status:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                                                <span className="mr-1">{getStatusIcon(formData.status)}</span>
                                                {formData.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Camera Instructions */}
                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                                    <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                                        <Camera className="h-5 w-5 mr-2" />
                                        Panduan Pengambilan Foto
                                    </h3>
                                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 pl-2">
                                        <li className="flex items-start">
                                            <span className="inline-block w-4 h-4 mr-2 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">
                                                •
                                            </span>
                                            Pastikan wajah terlihat jelas dan tidak tertutup
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-4 h-4 mr-2 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">
                                                •
                                            </span>
                                            Posisikan wajah di tengah frame
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-4 h-4 mr-2 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">
                                                •
                                            </span>
                                            Pastikan pencahayaan cukup terang
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-4 h-4 mr-2 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">
                                                •
                                            </span>
                                            Hindari bayangan pada wajah
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-4 h-4 mr-2 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">
                                                •
                                            </span>
                                            Lepas kacamata atau masker jika memungkinkan
                                        </li>
                                    </ul>
                                </div>

                                {/* Camera Section */}
                                <div className="flex flex-col items-center space-y-6">
                                    {!imageSrc && (
                                        <div className="relative">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className={`w-96 h-72 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-emerald-300 dark:border-gray-600 shadow-inner ${!isCameraActive ? "hidden" : ""
                                                    }`}
                                            />
                                            {!isCameraActive && (
                                                <div className="w-96 h-72 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-emerald-300 dark:border-gray-600 flex items-center justify-center shadow-inner">
                                                    <div className="text-center p-6">
                                                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Camera className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                                                        </div>
                                                        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Kamera belum aktif</p>
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                            Klik tombol di bawah untuk mengaktifkan kamera
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <canvas ref={canvasRef} className="hidden" />
                                        </div>
                                    )}

                                    {imageSrc && (
                                        <div className="text-center">
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700 inline-block">
                                                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3 font-medium">Preview Foto:</p>
                                                <img
                                                    src={imageSrc || "/placeholder.svg"}
                                                    alt="Preview"
                                                    className="w-80 h-auto rounded-xl border border-emerald-300 dark:border-gray-600 mx-auto shadow-md"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Camera Controls */}
                                    <div className="flex gap-4 justify-center">
                                        {!isCameraActive && !imageSrc && (
                                            <button
                                                onClick={startCamera}
                                                className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                                            >
                                                <Camera className="h-5 w-5 mr-2" />
                                                Aktifkan Kamera
                                            </button>
                                        )}

                                        {isCameraActive && !imageSrc && (
                                            <>
                                                <button
                                                    onClick={capturePhoto}
                                                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                                                >
                                                    <Camera className="h-5 w-5 mr-2" />
                                                    Ambil Foto
                                                </button>
                                                <button
                                                    onClick={stopCamera}
                                                    className="flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                                                >
                                                    <X className="h-5 w-5 mr-2" />
                                                    Batal
                                                </button>
                                            </>
                                        )}

                                        {imageSrc && (
                                            <button
                                                onClick={retakePhoto}
                                                className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                                            >
                                                <RotateCcw className="h-5 w-5 mr-2" />
                                                Ambil Ulang
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {submitMessage && currentStep === 2 && (
                                    <div
                                        className={`p-4 rounded-xl text-sm ${submitMessage.includes("berhasil")
                                                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                            }`}
                                    >
                                        {submitMessage}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-between pt-6 border-t border-emerald-200 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            setCurrentStep(1)
                                            setSubmitMessage(null)
                                            stopCamera()
                                            setImageSrc(null)
                                        }}
                                        className="px-6 py-3 border border-emerald-300 dark:border-gray-600 text-emerald-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!imageSrc || isSubmitting}
                                        className="flex items-center px-8 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Mendaftarkan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5 mr-2" />
                                                Daftar Karyawan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}