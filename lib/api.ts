// File: lib/api.ts (atau @/lib/api.ts)

// Definisikan tipe data untuk respons registrasi
export interface RegisterResponse {
  success: boolean;
  message: string;
  karyawan?: { // Lebih baik definisikan juga tipe data karyawan jika memungkinkan
    id: number | string; // atau tipe ID yang sesuai
    nama: string;
    nip: string;
    foto_filename?: string | null;
    // ... field lain dari karyawan jika ada
  };
}

// Definisikan tipe data untuk respons absensi (INI YANG PERLU DITAMBAHKAN)
export interface AttendanceResponse {
  success: boolean;
  message: string;
  nama?: string;
  nip?: string;
  timestamp?: string;
  status?: string; // Status absensi yang dicatat (misal: "masuk")
  imagePath?: string; // Jika API mengembalikan path foto profil karyawan
  catatanId?: number | string; // ID dari catatan absensi yang baru dibuat
}

/**
 * Fungsi untuk mendaftarkan akun karyawan baru melalui API route Next.js.
 * @param nama Nama lengkap karyawan.
 * @param nip Nomor Induk Pegawai.
 * @param fotoWajah Gambar wajah dalam format base64 data URL.
 * @returns Promise<RegisterResponse>
 */
export async function registerAccount(nama: string, nip: string, fotoWajah: string): Promise<RegisterResponse> {
  try {
    const response = await fetch('/api/karyawan/register', { // URL ke API route Next.js
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, nip, fotoWajah }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Pendaftaran gagal. Status: ${response.status} - ${response.statusText}`);
    }

    return {
      success: true,
      message: data.message || 'Akun berhasil didaftarkan',
      karyawan: data.karyawan,
    };
  } catch (error: any) {
    console.error('Gagal daftar akun (fungsi registerAccount di lib/api.ts):', error);
    return {
      success: false,
      message: error.message.includes("Unexpected token '<'")
        ? "Terjadi kesalahan komunikasi dengan server (registrasi). Pastikan endpoint API sudah benar dan server tidak error."
        : error.message || 'Terjadi kesalahan yang tidak diketahui saat pendaftaran.',
    };
  }
}

/**
 * Fungsi untuk menandai absensi melalui API route Next.js.
 * @param imageData Gambar wajah dalam format base64 data URL.
 * @returns Promise<AttendanceResponse>
 */
export async function markAttendance(imageData: string): Promise<AttendanceResponse> {
  try {
    const response = await fetch('/api/absensi/tandai', { // URL API route Next.js untuk absensi
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }), // Sesuai dengan yang diharapkan API /api/absensi/tandai
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Gagal menandai absensi dari server. Status: ${response.status}`);
    }

    // Sesuaikan field ini dengan apa yang benar-benar dikembalikan oleh API /api/absensi/tandai Anda
    return {
      success: true,
      message: data.message || 'Absensi berhasil ditandai!',
      nama: data.nama,
      nip: data.nip,
      timestamp: data.timestamp,
      status: data.status,
      imagePath: data.imagePath, // Opsional, jika ada
      catatanId: data.catatanId, // Opsional, jika ada
    };
  } catch (error: any) {
    console.error('Error di fungsi markAttendance (lib/api.ts):', error);
    return {
      success: false,
      message: error.message.includes("Unexpected token '<'")
        ? "Terjadi kesalahan komunikasi dengan server (absensi). Pastikan endpoint API sudah benar dan server tidak error."
        : error.message || 'Terjadi kesalahan saat menghubungi server absensi.',
    };
  }
}