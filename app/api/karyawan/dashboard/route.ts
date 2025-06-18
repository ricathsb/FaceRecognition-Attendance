import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import "dayjs/locale/id"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"

dayjs.extend(isSameOrAfter)
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

    const waktuMulaiPulang = dayjs(`${now.format("YYYY-MM-DD")}T${pengaturan.waktuMulaiPulang}:00`).tz("Asia/Jakarta")

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
          karyawan: {
            select: {
              nama: true,
              status: true,
            },
          },
        },
        orderBy: {
          timestamp_absensi: "desc",
        },
      }),
    ])

    const hadirSet = new Set()
    const pulangSet = new Set()
    let hadir = 0
    let telat = 0
    let pulang = 0
    const aktivitasTerbaru: any[] = []

      for (const absenData of semuaAbsensiHariIni) {
    const { id, karyawan, karyawanId, timestamp_absensi, status } = absenData
    const absensiTime = dayjs(timestamp_absensi).tz("Asia/Jakarta")

    if (!hadirSet.has(karyawanId) && (status === "tepat waktu" || status === "terlambat")) {
      hadirSet.add(karyawanId)
      hadir++

      aktivitasTerbaru.push({
        id,
        name: karyawan.nama,
        role: karyawan.status,
        action: `Check-in pada ${absensiTime.format("HH:mm")}`,
        time: absensiTime.format("HH:mm"),
        status: status === "terlambat" ? "terlambat" : "tepat waktu",
      })

      if (status === "terlambat") {
        telat++
      }
    }

    if (!pulangSet.has(karyawanId) && status === "pulang") {
      pulangSet.add(karyawanId)
      pulang++

      aktivitasTerbaru.push({
        id,
        name: karyawan.nama,
        role: karyawan.status,
        action: `Checkout pada ${absensiTime.format("HH:mm")}`,
        time: absensiTime.format("HH:mm"),
        status: "pulang",
      })
    }
  }


    const absen = totalKaryawan - hadir

    return NextResponse.json({
      totalKaryawan,
      hadir,
      absen,
      telat,
      pulang,
      aktivitasTerbaru,
    })
  } catch (error) {
    console.error("Gagal mengambil data dashboard:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
