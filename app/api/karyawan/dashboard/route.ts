// app/api/karyawan/management/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import "dayjs/locale/id"

dayjs.locale("id")

export async function GET() {
  try {
    const now = dayjs()
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

    const batasTepat = dayjs(`${now.format("YYYY-MM-DD")}T${pengaturan.batasTepatWaktu}`)
    const batasTelat = dayjs(`${now.format("YYYY-MM-DD")}T${pengaturan.batasTerlambat}`)

    for (const absenData of semuaAbsensiHariIni) {
      const jam = dayjs(absenData.timestamp_absensi)
      const nama = absenData.karyawan.nama
      const status = absenData.status.toLowerCase()
      const id = absenData.id

      if (!hadirSet.has(absenData.karyawanId)) {
      hadirSet.add(absenData.karyawanId)
      hadir++

      let kategori = "hadir"

      if (jam.isAfter(batasTepat) && jam.isBefore(batasTelat)) {
        kategori = "terlambat"
        telat++
      } else if (jam.isAfter(batasTelat)) {
        kategori = "tidak"
      }

      aktivitasTerbaru.push({
        id,
        name: nama,
        action: `Check-in pada ${jam.format("HH:mm")}`,
        time: jam.format("HH:mm"),
        status: kategori,
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