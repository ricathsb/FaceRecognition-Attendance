import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET: Mengambil data karyawan & absensi
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

    const hasil = karyawanList.map((karyawan) => {
      const attendance: { [tanggal: string]: string } = {}

      karyawan.catatanAbsensi.forEach((absen) => {
        const tanggal = absen.timestamp_absensi.toISOString().split("T")[0]
        const status = absen.status.toLowerCase()
        attendance[tanggal] =
          status === "hadir" || status === "masuk" ? "hadir" : "tidak"
      })

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
        attendanceSettings: pengaturanAbsensi ?? null,
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

// PUT: Menyimpan pengaturan absensi
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
    return NextResponse.json(
      { message: "Gagal menghapus karyawan", detail: error.message },
      { status: 500 }
    )
  }
}
