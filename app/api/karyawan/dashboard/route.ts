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

    for (const absenData of semuaAbsensiHariIni) {
      const { id, karyawan, karyawanId, timestamp_absensi, status } = absenData

      if (!hadirSet.has(karyawanId)) {
        hadirSet.add(karyawanId)
        hadir++

        if (status === "terlambat") {
          telat++
        }

        aktivitasTerbaru.push({
          id,
          name: karyawan.nama,
          action: `Check-in pada ${dayjs(timestamp_absensi).tz("Asia/Jakarta").format("HH:mm")}`,
          time: dayjs(timestamp_absensi).tz("Asia/Jakarta").format("HH:mm"),
          status: status === "terlambat" ? "late" : "ontime",
        })
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