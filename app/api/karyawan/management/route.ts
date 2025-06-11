import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

export const dynamic = "force-dynamic"

// Perbaiki fungsi GET untuk menghitung hari kerja berdasarkan bulan yang dipilih
// Tambahkan parameter query untuk bulan dan tahun

export async function GET(request: NextRequest) {
  try {
    // Ambil parameter bulan dan tahun dari query URL
    const url = new URL(request.url)
    const monthParam = url.searchParams.get("month")
    const yearParam = url.searchParams.get("year")

    // Default ke bulan dan tahun saat ini jika tidak ada parameter
    const now = dayjs().tz("Asia/Jakarta")
    const selectedMonth = monthParam ? Number.parseInt(monthParam) - 1 : now.month() // 0-based index
    const selectedYear = yearParam ? Number.parseInt(yearParam) : now.year()

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

    // Buat objek dayjs untuk tanggal pertama bulan yang dipilih
    const startOfMonth = dayjs(new Date(selectedYear, selectedMonth, 1)).tz("Asia/Jakarta")
    // Hitung jumlah hari dalam bulan yang dipilih
    const daysInMonth = startOfMonth.daysInMonth()

    const workDays = pengaturanAbsensi.hariKerja ?? [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]

    const hasil = karyawanList.map((karyawan) => {
      const attendance: { [tanggal: string]: string } = {}

      // Proses catatan absensi yang ada
      karyawan.catatanAbsensi.forEach((absen) => {
        const timestampWIB = dayjs(absen.timestamp_absensi).tz("Asia/Jakarta")
        const absenMonth = timestampWIB.month()
        const absenYear = timestampWIB.year()

        // Hanya proses absensi untuk bulan dan tahun yang dipilih
        if (absenMonth === selectedMonth && absenYear === selectedYear) {
          const tanggal = timestampWIB.format("YYYY-MM-DD")
          const status = absen.status.toLowerCase()

          if (!(tanggal in attendance)) {
            attendance[tanggal] = status
          }
        }
      })

      let hadirCount = 0
      let terlambatCount = 0
      let totalWorkDays = 0
      let absenCount = 0

      // Proses setiap hari dalam bulan yang dipilih
      for (let d = 1; d <= daysInMonth; d++) {
        const date = dayjs(new Date(selectedYear, selectedMonth, d)).tz("Asia/Jakarta")
        const tanggalStr = date.format("YYYY-MM-DD")
        const dayOfWeek = date.format("dddd").toLowerCase()

        // Lewati hari yang bukan hari kerja
        if (!workDays.includes(dayOfWeek)) continue

        totalWorkDays++

        // Tandai sebagai absen jika hari sudah lewat dan tidak ada catatan absensi
        if (!attendance[tanggalStr] && date.isBefore(now, "day")) {
          attendance[tanggalStr] = "absen"
        }

        const status = attendance[tanggalStr]

        // Hitung statistik absensi
        if (status === "tepat waktu") {
          hadirCount++
        } else if (status === "terlambat") {
          hadirCount++
          terlambatCount++
        } else if (status === "absen") {
          absenCount++
        }
      }

      // Buat ringkasan dalam format: hadir(terlambat)/total_hari_kerja
      const summary = `${hadirCount}(${terlambatCount})/${totalWorkDays}`

      return {
        id: karyawan.id,
        employeeId: karyawan.id.toString().padStart(6, "0"),
        name: karyawan.nama,
        nip: karyawan.nip,
        attendance,
        summary,
        stats: {
          hadir: hadirCount,
          terlambat: terlambatCount,
          absen: absenCount,
          totalWorkDays: totalWorkDays,
        },
      }
    })

    return NextResponse.json(
      {
        employees: hasil,
        attendanceSettings: pengaturanAbsensi,
        currentDate: now.format("YYYY-MM-DD"),
        selectedMonth: selectedMonth + 1,
        selectedYear: selectedYear,
        daysInMonth: daysInMonth,
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

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ message: "employeeId harus disediakan" }, { status: 400 })
    }

    await prisma.catatanAbsensi.deleteMany({
      where: { karyawanId: Number(employeeId) },
    })

    await prisma.karyawan.delete({
      where: { id: Number(employeeId) },
    })

    return NextResponse.json({ message: "Karyawan berhasil dihapus" })
  } catch (error: any) {
    console.error("❌ Error deleting employee:", error)
    return NextResponse.json({ message: "Gagal menghapus karyawan", detail: error.message }, { status: 500 })
  }
}
