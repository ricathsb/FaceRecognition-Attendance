import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

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
      return NextResponse.json(
        { message: "Pengaturan absensi belum diatur." },
        { status: 400 }
      )
    }

    const now = dayjs().tz("Asia/Jakarta")
    const selectedYear = now.year()
    const selectedMonth = now.month() // 0-based index
    const daysInMonth = now.daysInMonth()

    const workDays = pengaturanAbsensi.hariKerja ?? [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]

    const hasil = karyawanList.map((karyawan) => {
      const attendance: { [tanggal: string]: string } = {}

      karyawan.catatanAbsensi.forEach((absen) => {
        const timestampWIB = dayjs(absen.timestamp_absensi).tz("Asia/Jakarta")
        const tanggal = timestampWIB.format("YYYY-MM-DD")
        const today = now.format("YYYY-MM-DD")

        if (tanggal > today) return

        const status = absen.status.toLowerCase()

        if (!(tanggal in attendance)) {
          attendance[tanggal] = status
        }
      })

      let hadirCount = 0
      let terlambatCount = 0
      let totalWorkDays = 0

      for (let d = 1; d <= daysInMonth; d++) {
        const date = dayjs(`${selectedYear}-${selectedMonth + 1}-${d}`, "YYYY-M-D").tz("Asia/Jakarta")
        const tanggalStr = date.format("YYYY-MM-DD")
        const dayOfWeek = date.format("dddd").toLowerCase()

        if (!workDays.includes(dayOfWeek)) continue

        totalWorkDays++

        if (!attendance[tanggalStr] && date.isBefore(now, "day")) {
          attendance[tanggalStr] = "absen"
        }

        const status = attendance[tanggalStr]

        if (status === "tepat waktu") {
          hadirCount++
        } else if (status === "terlambat") {
          hadirCount++
          terlambatCount++
        }
      }

      const summary = `${hadirCount}(${terlambatCount})/${totalWorkDays}`

      return {
        id: karyawan.id,
        employeeId: karyawan.id.toString().padStart(6, "0"),
        name: karyawan.nama,
        nip: karyawan.nip,
        attendance,
        summary,
      }
    })

    return NextResponse.json(
      {
        employees: hasil,
        attendanceSettings: pengaturanAbsensi,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ Gagal mengambil data absensi:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengambil data.", detail: error.message },
      { status: 500 }
    )
  }
}


export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      checkInStartTime,
      onTimeBeforeHour,
      lateBeforeHour,
      workDays,
    } = body

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
    return NextResponse.json(
      { message: "Gagal menyimpan pengaturan", detail: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json(
        { message: "employeeId harus disediakan" },
        { status: 400 }
      )
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
    return NextResponse.json(
      { message: "Gagal menghapus karyawan", detail: error.message },
      { status: 500 }
    )
  }
}
