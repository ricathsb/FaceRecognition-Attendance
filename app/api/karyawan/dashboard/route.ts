import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import "dayjs/locale/id"

dayjs.locale("id")

export const dynamic = "force-dynamic"

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
      const statusDb = absenData.status.toLowerCase()
      const id = absenData.id

      if (!hadirSet.has(absenData.karyawanId)) {
        hadirSet.add(absenData.karyawanId)

        let kategori = "hadir"

        // Tentukan kategori berdasarkan status dari database atau waktu
        if (statusDb === "terlambat" || (jam.isAfter(batasTepat) && jam.isBefore(batasTelat))) {
          kategori = "terlambat"
          telat++
        } else if (statusDb === "tidak hadir" || statusDb === "tidak" || jam.isAfter(batasTelat)) {
          kategori = "tidak"
          absen++
        } else {
          kategori = "hadir"
          hadir++
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

    // Hitung yang belum absen
    const belumAbsen = totalKaryawan - hadirSet.size
    absen += belumAbsen

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
