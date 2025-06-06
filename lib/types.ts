// Type definitions for the attendance system
// Ubah definisi AttendanceResponse untuk mencocokkan dengan yang digunakan di AttendanceForm
export interface AttendanceResponse {
  success: boolean
  nip: string
  nama: string
  timestamp: string
  message: string
  image?: string
}

// Jika masih perlu tipe data lama untuk kompatibilitas dengan bagian lain aplikasi,
// kita bisa membuat tipe baru dengan nama berbeda
export interface AttendanceResponseLegacy {
  id: string
  employeeName: string
  timestamp: string
  status: "ontime" | "late" | "early"
  photoUrl?: string
  message?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  status: "present" | "absent" | "late" | "early"
  notes?: string
}

export interface WebcamCaptureProps {
  onCapture: (imageSrc: string | null) => void
}

export interface AttendanceCardProps {
  data: {
    nama?: string
    nip?: string
    timestamp?: string
    message?: string
    image?: string
  }
  onReset: () => void
}

export interface AttendanceFormProps {
  onSuccess: (data: {
    success: boolean
    nip: string
    nama: string
    timestamp: string
    message: string
    image?: string
  }) => void
  onError: (error: string) => void
  onLoading: (loading: boolean) => void
}
