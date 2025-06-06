import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import "dayjs/locale/id"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("id")

export async function GET() {
  try {
    const now = dayjs().tz("Asia/Jakarta")
    const todayStart = now.startOf("day").toDate()
    const todayEnd = now.endOf("day").toDate()

    const pengaturan = await prisma.pengaturanAbsensi.findFirst()
    if (!pengaturan) {
      return NextResponse.json({ error: "Pengaturan absen tidak ditemukan" }, { status: 404 })
    }

    const [totalKaryawan, semuaAbsensiHariIni] = await Promise.all([
      prisma.karyawan.count(),
      prisma.catatanAbsensi.findMany({
        where: {
          timestamp_absensi: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          karyawan: true,
        },
        orderBy: {
          timestamp_absensi: "desc",
        },
      }),
    ])

    const hadirSet = new Set()
    let hadir = 0
    let telat = 0
    let absen = 0
    const aktivitasTerbaru: any[] = []

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number)
      return h * 60 + m
    }

    const waktuMulai = toMinutes(pengaturan.waktuMulaiAbsen)
    const batasTepat = toMinutes(pengaturan.batasTepatWaktu)
    const batasTerlambat = toMinutes(pengaturan.batasTerlambat)

    for (const absenData of semuaAbsensiHariIni) {
      const jam = dayjs(absenData.timestamp_absensi).tz("Asia/Jakarta")
      const nama = absenData.karyawan.nama
      const id = absenData.id
      const karyawanId = absenData.karyawanId

      if (!hadirSet.has(karyawanId)) {
        hadirSet.add(karyawanId)

        const jamAbsenStr = jam.format("HH:mm")
        const menitAbsen = toMinutes(jamAbsenStr)
        const selisih = menitAbsen - waktuMulai

        let status: "ontime" | "late" | "absent" = "absent"

        if (selisih <= batasTepat) {
          status = "ontime"
          hadir++
        } else if (selisih <= batasTerlambat) {
          status = "late"
          hadir++
          telat++
        }

        if (status !== "absent") {
          aktivitasTerbaru.push({
            id,
            name: nama,
            action: `Check-in pada ${jam.format("HH:mm")}`,
            time: jam.format("HH:mm"),
            status,
          })
        }
      }
    }

    absen = totalKaryawan - hadir

    return NextResponse.json({
      totalKaryawan,
      hadir,
      absen,
      telat,
      aktivitasTerbaru,
    })
  } catch (error) {
    console.error("Gagal mengambil data dashboard:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
