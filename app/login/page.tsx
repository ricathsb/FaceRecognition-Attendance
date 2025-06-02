"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        if (!email || !password) {
            setError("Email dan password wajib diisi.")
            setLoading(false)
            return
        }

        try {
            // Gunakan Flask backend API
            const res = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (res.ok) {
                // Simpan data user berdasarkan role
                localStorage.setItem("role", data.role)

                if (data.role === "admin") {
                    localStorage.setItem("userType", "admin")
                    router.push("/dashboard")
                } else if (data.role === "user") {
                    localStorage.setItem("nama", data.nama)
                    localStorage.setItem("userType", "karyawan")
                    router.push("/") // Halaman karyawan
                }
            } else {
                setError(data.message || data.error || "Login gagal")
            }
        } catch (err) {
            setError("Gagal terhubung ke server Flask.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex">
                    {/* Left side - Login Form */}
                    <div className="w-full lg:w-1/2 p-8 lg:p-12">
                        <div className="max-w-md mx-auto">
                            {/* Avatar and Welcome */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="h-8 w-8 text-amber-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h1>
                                <p className="text-gray-500 text-sm">Silakan masuk ke akun Anda</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Email Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            placeholder="Masukkan email Anda"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            placeholder="Masukkan password Anda"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>



                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Memproses...
                                        </div>
                                    ) : (
                                        "Masuk"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right side - Illustration */}
                    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                        <Image
                            src="/test.jpg"
                            fill
                            className="object-cover"
                            priority
                            alt="Illustration"
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}
