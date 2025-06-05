// Type definitions for the attendance system
export interface AttendanceResponse {
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
