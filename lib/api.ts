// File: lib/api.ts (atau @/lib/api.ts)

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
export async function markAttendance(imageData: string): Promise<AttendanceResponse> {
  try {
    const response = await fetch("/api/absensi/tandai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Gagal menandai absensi dari server. Status: ${response.status}`)
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
      message: error.message.includes("Unexpected token '<'")
        ? "Terjadi kesalahan komunikasi dengan server (absensi). Pastikan endpoint API sudah benar dan server tidak error."
        : error.message || "Terjadi kesalahan saat menghubungi server absensi.",
    }
  }
}

/**
 * Fungsi untuk mendapatkan data dashboard
 */
export async function getDashboardData() {
  try {
    const response = await fetch("/api/dashboard")
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
