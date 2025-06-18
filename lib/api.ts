// Definisikan tipe data untuk respons registrasi
export interface RegisterResponse {
  success: boolean
  message: string
  karyawan?: {
    id: number | string
    nama: string
    nip: string
    email: string
    foto_filename?: string | null
    createdAt?: string
  }
}

// Definisikan tipe data untuk respons absensi
export interface AttendanceResponse {
  success: boolean
  message: string
  nama?: string
  nip?: string
  timestamp?: string
  status?: string // "hadir", "terlambat", "tidak"
  imagePath?: string
  catatanId?: number | string
}

/**
 * Fungsi untuk mendaftarkan akun karyawan baru melalui API route Next.js.
 */
export async function registerAccount(
  nama: string,
  nip: string,
  email: string,
  password: string,
  fotoWajah: string,
): Promise<RegisterResponse> {
  try {
    const response = await fetch("/api/karyawan/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, nip, email, password, fotoWajah }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Pendaftaran gagal. Status: ${response.status} - ${response.statusText}`)
    }

    return {
      success: true,
      message: data.message || "Akun berhasil didaftarkan",
      karyawan: data.karyawan,
    }
  } catch (error: any) {
    console.error("Gagal daftar akun (fungsi registerAccount di lib/api.ts):", error)
    return {
      success: false,
      message: error.message.includes("Unexpected token '<'")
        ? "Terjadi kesalahan komunikasi dengan server (registrasi). Pastikan endpoint API sudah benar dan server tidak error."
        : error.message || "Terjadi kesalahan yang tidak diketahui saat pendaftaran.",
    }
  }
}

/**
 * Fungsi untuk menandai absensi melalui API route Next.js.
 */
export async function markAttendance(
  imageData: string,
  latitude?: number,
  longitude?: number
): Promise<AttendanceResponse> {
  try {
    const token = localStorage.getItem("token")

    // Gunakan base URL dari env
    const baseUrl = typeof window === "undefined"
    ? process.env.INTERNAL_API_URL
    : "";    const url = `${baseUrl}/api/absensi/tandai`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ image: imageData, latitude, longitude }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Gagal menandai absensi. Status: ${response.status}`)
    }

    return {
      success: true,
      message: data.message || "Absensi berhasil ditandai!",
      nama: data.nama,
      nip: data.nip,
      timestamp: data.timestamp,
      status: data.status,
      imagePath: data.imagePath,
      catatanId: data.catatanId,
    }
  } catch (error: any) {
    console.error("Error di fungsi markAttendance (lib/api.ts):", error)

    return {
      success: false,
      message: error.message?.includes("Unexpected token '<'")
        ? "Terjadi kesalahan komunikasi dengan server absensi. Periksa apakah endpoint salah atau server error."
        : error.message || "Terjadi kesalahan saat menghubungi server absensi.",
    }
  }
}


/**
 * Fungsi untuk mendapatkan data dashboard
 */
export async function getDashboardData() {
  try {
    // Tambahkan timestamp untuk mencegah caching
    const timestamp = new Date().getTime()
    const response = await fetch(`/api/dashboard?t=${timestamp}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengambil data dashboard")
    }

    return data
  } catch (error: any) {
    console.error("Error getting dashboard data:", error)
    throw error
  }
}

/**
 * Fungsi untuk mendapatkan data management dengan cache busting
 */
export async function getManagementData(month: string, year: string) {
  try {
    const timestamp = new Date().getTime()
    const response = await fetch(`/api/karyawan/management?month=${month}&year=${year}&t=${timestamp}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      next: { revalidate: 0 }, // Pastikan tidak di-cache oleh Next.js
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Try to parse JSON
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError)
      throw new Error("Respons server tidak valid. Silakan coba lagi.")
    }

    // Validasi data yang diterima
    if (!data || !Array.isArray(data.employees)) {
      console.error("Invalid data structure:", data)
      throw new Error("Format data tidak valid")
    }

    return data
  } catch (error: any) {
    console.error("Error getting management data:", error)
    throw error
  }
}