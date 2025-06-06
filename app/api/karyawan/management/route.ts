import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const karyawanList = await prisma.karyawan.findMany({
      select: {
        id: true,
        nama: true,
        nip: true,
        catatanAbsensi: {
          select: {
            timestamp_absensi: true,
            status: true,
          },
        },
      },
    })

    const pengaturanAbsensi = await prisma.pengaturanAbsensi.findFirst({
      orderBy: { id: "desc" },
    })

    if (!pengaturanAbsensi) {
      return NextResponse.json({ message: "Pengaturan absensi belum diatur." }, { status: 400 })
    }

    // Konversi string waktu (HH:mm) menjadi menit
    const timeToMinutes = (time: string) => {
      const [jam, menit] = time.split(":").map(Number)
      return jam * 60 + menit
    }

    // Fungsi untuk mengecek apakah tanggal adalah hari kerja
    const isWorkDay = (date: Date, workDays: string[]) => {
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const dayName = dayNames[date.getDay()]
      return workDays.includes(dayName)
    }

    // Fungsi untuk mengecek apakah sudah melewati deadline absensi
    const isPastAttendanceDeadline = (dateStr: string, lateBeforeHour: string) => {
      const today = new Date()
      const checkDate = new Date(dateStr)

      // Jika tanggal di masa depan, return false
      if (checkDate > today) {
        return false
      }

      // Jika tanggal hari ini, cek apakah sudah melewati batas waktu
      if (checkDate.toDateString() === today.toDateString()) {
        const now = new Date()
        const [hours, minutes] = lateBeforeHour.split(":").map(Number)
        const deadline = new Date()
        deadline.setHours(hours, minutes, 0, 0)

        return now > deadline
      }

      // Jika tanggal di masa lalu, return true
      return true
    }

    // Ambil menit dari waktu pengaturan
    const waktuMulaiMenit = timeToMinutes(pengaturanAbsensi.waktuMulaiAbsen)
    const batasTepatMenit = timeToMinutes(pengaturanAbsensi.batasTepatWaktu)
    const batasTerlambatMenit = timeToMinutes(pengaturanAbsensi.batasTerlambat)

    const hasil = karyawanList.map((karyawan) => {
      const attendance: { [tanggal: string]: string } = {}

      // Proses data absensi yang sudah ada
      karyawan.catatanAbsensi.forEach((absen) => {
        const tanggal = dayjs(absen.timestamp_absensi).format("YYYY-MM-DD")
        const jamAbsen = dayjs(absen.timestamp_absensi).format("HH:mm")
        const absenMenit = timeToMinutes(jamAbsen)

        let status = "tidak"

        // Normalisasi status dari database
        const statusLower = absen.status.toLowerCase()
        if (statusLower === "hadir" || statusLower === "masuk") {
          // Logika penentuan status berdasarkan waktu absen
          if (absenMenit >= waktuMulaiMenit && absenMenit <= batasTepatMenit) {
            status = "hadir"
          } else if (absenMenit > batasTepatMenit && absenMenit <= batasTerlambatMenit) {
            status = "terlambat"
          } else {
            status = "tidak"
          }
        } else if (statusLower === "terlambat") {
          status = "terlambat"
        } else if (statusLower === "tidak hadir" || statusLower === "tidak") {
          status = "tidak"
        }

        // Hanya simpan jika belum ada data untuk tanggal tersebut
        if (!(tanggal in attendance)) {
          attendance[tanggal] = status
        }
      })

      // Proses tanggal yang belum ada data absensi
      // Hanya untuk hari kerja yang sudah melewati deadline
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      // Cek untuk bulan ini dan bulan sebelumnya saja
      for (let monthOffset = -1; monthOffset <= 0; monthOffset++) {
        const checkMonth = currentMonth + monthOffset
        const checkYear = checkMonth < 0 ? currentYear - 1 : currentYear
        const adjustedMonth = checkMonth < 0 ? 11 : checkMonth

        const daysInMonth = new Date(checkYear, adjustedMonth + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          const checkDate = new Date(checkYear, adjustedMonth, day)
          const dateStr = dayjs(checkDate).format("YYYY-MM-DD")

          // Skip jika sudah ada data absensi untuk tanggal ini
          if (attendance[dateStr]) {
            continue
          }

          // Skip jika bukan hari kerja
          if (!isWorkDay(checkDate, pengaturanAbsensi.hariKerja)) {
            continue
          }

          // Hanya tandai "tidak" jika sudah melewati deadline
          if (isPastAttendanceDeadline(dateStr, pengaturanAbsensi.batasTerlambat)) {
            attendance[dateStr] = "tidak"
          }
        }
      }

      return {
        id: karyawan.id,
        employeeId: karyawan.id.toString().padStart(6, "0"),
        name: karyawan.nama,
        nip: karyawan.nip,
        attendance,
      }
    })

    return NextResponse.json(
      {
        employees: hasil,
        attendanceSettings: pengaturanAbsensi,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("❌ Gagal mengambil data absensi:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengambil data.", detail: error.message },
      { status: 500 },
    )
  }
}

// PUT: Menyimpan pengaturan absensi
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { checkInStartTime, onTimeBeforeHour, lateBeforeHour, workDays } = body

    const existing = await prisma.pengaturanAbsensi.findFirst()

    if (existing) {
      await prisma.pengaturanAbsensi.update({
        where: { id: existing.id },
        data: {
          waktuMulaiAbsen: checkInStartTime,
          batasTepatWaktu: onTimeBeforeHour,
          batasTerlambat: lateBeforeHour,
          hariKerja: workDays,
        },
      })
    } else {
      await prisma.pengaturanAbsensi.create({
        data: {
          waktuMulaiAbsen: checkInStartTime,
          batasTepatWaktu: onTimeBeforeHour,
          batasTerlambat: lateBeforeHour,
          hariKerja: workDays,
        },
      })
    }

    return NextResponse.json({ message: "Pengaturan berhasil disimpan" }, { status: 200 })
  } catch (error: any) {
    console.error("❌ Gagal menyimpan pengaturan absensi:", error)
    return NextResponse.json({ message: "Gagal menyimpan pengaturan", detail: error.message }, { status: 500 })
  }
}

// DELETE: Hapus data karyawan dan absensinya
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ message: "employeeId harus disediakan" }, { status: 400 })
    }

    // Hapus semua data absensi karyawan dulu
    await prisma.catatanAbsensi.deleteMany({
      where: { karyawanId: Number(employeeId) },
    })

    // Lalu hapus data karyawannya
    await prisma.karyawan.delete({
      where: { id: Number(employeeId) },
    })

    return NextResponse.json({ message: "Karyawan berhasil dihapus" })
  } catch (error: any) {
    console.error("❌ Error deleting employee:", error)
    return NextResponse.json({ message: "Gagal menghapus karyawan", detail: error.message }, { status: 500 })
  }
}
