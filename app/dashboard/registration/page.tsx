"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Camera, Save, X, Loader2, RotateCcw, User, Mail, Lock, BadgeIcon, CheckCircle, UserPlus } from "lucide-react"

interface FormData {
    nama: string
    nip: string
    email: string
    password: string
}

export default function RegistrationPage() {
    const [formData, setFormData] = useState<FormData>({
        nama: "",
        nip: "",
        email: "",
        password: "",
    })

    const [currentStep, setCurrentStep] = useState(1)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState<string | null>(null)
    const [isNipValid, setIsNipValid] = useState(true)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isCameraActive, setIsCameraActive] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        }

        if (!trimmedData.nama || !trimmedData.nip || !trimmedData.email || !trimmedData.password) {
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
        }

        const isValid =
            trimmedData.nama &&
            trimmedData.nip &&
            trimmedData.email &&
            trimmedData.password &&
            trimmedData.password.length >= 6 &&
            /^\d{5,12}$/.test(trimmedData.nip) &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedData.email)

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
        setSubmitMessage("Foto wajah wajib diambil");
        return;
    }

    setIsSubmitting(true);
    setSubmitMessage("Mendaftarkan karyawan...");

    try {
        const requestData = {
            nama: formData.nama || "",
            nip: formData.nip || "",
            email: formData.email || "",
            password: formData.password || "",
            fotoWajah: imageSrc || "",
        };

        const response = await fetch("/api/karyawan/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();

        if (!response.ok) {
            // Tangani error dari backend, termasuk error dari Flask
            if (data.error?.includes("wajah")) {
                setSubmitMessage("Gagal: Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.");
            } else {
                setSubmitMessage(data.error || data.message || `HTTP Error: ${response.status}`);
            }
            return;
        }

        // Kalau sukses:
        setSubmitMessage(data.message || `Pendaftaran ${formData.nama} berhasil!`);

        // Reset form setelah beberapa detik
        setTimeout(() => {
            setFormData({
                nama: "",
                nip: "",
                email: "",
                password: "",
            });
            setImageSrc(null);
            setCurrentStep(1);
            setSubmitMessage(null);
            setIsNipValid(true);
        }, 4000);

    } catch (error: any) {
        console.error("Registration error:", error);
        setSubmitMessage(`Error: ${error.message || "Terjadi kesalahan saat pendaftaran"}`);
    } finally {
        setIsSubmitting(false);
    }
};

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header positioned near sidebar - consistent with other pages */}
            <div className="px-6 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pendaftaran Karyawan</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Tambah karyawan baru ke sistem</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg">
                            <UserPlus className="h-5 w-5" />
                            <span className="font-medium">Langkah {currentStep} dari 2</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                <div className="max-w-3xl mx-auto">
                    {/* Step Indicator */}
                    <div className="flex items-center mb-10">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium ${currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                1
                            </div>
                            <span className={`mt-2 text-sm font-medium ${currentStep >= 1 ? "text-blue-600" : "text-gray-500"}`}>
                                Data Karyawan
                            </span>
                        </div>

                        <div className="flex-1 mx-4">
                            <div className={`h-1.5 rounded-full ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"}`}></div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium ${currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                2
                            </div>
                            <span className={`mt-2 text-sm font-medium ${currentStep >= 2 ? "text-blue-600" : "text-gray-500"}`}>
                                Foto Wajah
                            </span>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
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
                                                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${!isNipValid && formData.nip
                                                        ? "border-red-500 ring-red-200"
                                                        : "border-gray-300 dark:border-gray-600"
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
                                                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                        className="px-8 py-3.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
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
                                                    className={`w-96 h-72 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-inner ${!isCameraActive ? "hidden" : ""
                                                        }`}
                                                />
                                                {!isCameraActive && (
                                                    <div className="w-96 h-72 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shadow-inner">
                                                        <div className="text-center p-6">
                                                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <Camera className="h-10 w-10 text-gray-500 dark:text-gray-400" />
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
                                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 inline-block">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Preview Foto:</p>
                                                    <img
                                                        src={imageSrc || "/placeholder.svg"}
                                                        alt="Preview"
                                                        className="w-80 h-auto rounded-xl border border-gray-300 dark:border-gray-600 mx-auto shadow-md"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Camera Controls */}
                                        <div className="flex gap-4 justify-center">
                                            {!isCameraActive && !imageSrc && (
                                                <button
                                                    onClick={startCamera}
                                                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
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
                                    <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => {
                                                setCurrentStep(1)
                                                setSubmitMessage(null)
                                                stopCamera()
                                                setImageSrc(null)
                                            }}
                                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Kembali
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!imageSrc || isSubmitting}
                                            className="flex items-center px-8 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
        </div>
    )
}
