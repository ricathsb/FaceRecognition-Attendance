import { NextRequest,NextResponse } from "next/server"
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
      return NextResponse.json(
        { message: "Pengaturan absensi belum diatur." },
        { status: 400 }
      )
    }

    // Konversi waktu aturan ke menit
   // Konversi string waktu (HH:mm) menjadi menit
    const timeToMinutes = (time: string) => {
      const [jam, menit] = time.split(":").map(Number)
      return jam * 60 + menit
    }

    // Ambil menit dari waktu mulai absen
    const waktuMulaiMenit = timeToMinutes(pengaturanAbsensi.waktuMulaiAbsen)
    const batasTepatMenit = timeToMinutes(pengaturanAbsensi.batasTepatWaktu)
    const batasTerlambatMenit = timeToMinutes(pengaturanAbsensi.batasTerlambat)

    const hasil = karyawanList.map((karyawan) => {
      const attendance: { [tanggal: string]: string } = {}

      karyawan.catatanAbsensi.forEach((absen) => {
        const tanggal = dayjs(absen.timestamp_absensi).format("YYYY-MM-DD")
        const jamAbsen = dayjs(absen.timestamp_absensi).format("HH:mm")
        const absenMenit = timeToMinutes(jamAbsen)

        let status = "tidak hadir"

        if (
          absen.status.toLowerCase() === "hadir" ||
          absen.status.toLowerCase() === "masuk"
        ) {
          const selisihMenit = absenMenit - waktuMulaiMenit

          if (selisihMenit <= batasTepatMenit) {
            status = "hadir"
          } else if (selisihMenit <= batasTerlambatMenit) {
            status = "terlambat"
          }
        }

        if (!(tanggal in attendance)) {
          attendance[tanggal] = status
        }
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

// DELETE: Hapus data karyawan dan absensinya
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
