import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import "dayjs/locale/id"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { Workbook } from "exceljs"

dayjs.extend(isSameOrBefore)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("id")

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get("month") || "")
    const year = parseInt(searchParams.get("year") || "")

    if (!month || !year) {
      return NextResponse.json({ error: "Parameter bulan dan tahun diperlukan." }, { status: 400 })
    }

    const start = dayjs(`${year}-${month}-01`).tz("Asia/Jakarta").startOf("month")
    const end = dayjs(start).endOf("month")
    const today = dayjs().tz("Asia/Jakarta")
    const endDate = end.isAfter(today) ? today : end

    // Buat daftar tanggal dari awal sampai akhir bulan
    const allDates: string[] = []
    let current = start
    while (current.isSameOrBefore(endDate)) {
      allDates.push(current.format("DD MMM YYYY"))
      current = current.add(1, "day")
    }

    // Ambil semua karyawan beserta status-nya
    const allKaryawan = await prisma.karyawan.findMany({
      orderBy: { id: "asc" },
      select: { id: true, nama: true, status: true },
    })

    // Kelompokkan karyawan berdasarkan status
    const karyawanByStatus: Record<string, { id: number; nama: string }[]> = {}
    for (const karyawan of allKaryawan) {
      if (!karyawanByStatus[karyawan.status]) {
        karyawanByStatus[karyawan.status] = []
      }
      karyawanByStatus[karyawan.status].push({ id: karyawan.id, nama: karyawan.nama })
    }

    // Ambil data absensi pada rentang tanggal tersebut
    const absensi = await prisma.catatanAbsensi.findMany({
      where: {
        timestamp_absensi: {
          gte: start.toDate(),
          lte: endDate.toDate(),
        },
      },
      include: {
        karyawan: { select: { id: true } },
      },
    })

    // Buat peta absensi: key = `${karyawanId}-${tanggal}`
    const absensiMap = new Map<string, { masuk?: string; pulang?: string }>()
    for (const a of absensi) {
      const tanggal = dayjs(a.timestamp_absensi).tz("Asia/Jakarta").format("DD MMM YYYY")
      const waktu = dayjs(a.timestamp_absensi).tz("Asia/Jakarta").format("HH:mm")
      const key = `${a.karyawan.id}-${tanggal}`
      const item = absensiMap.get(key) || {}

      if (["tepat waktu", "terlambat"].includes(a.status.toLowerCase())) {
        item.masuk = item.masuk || waktu
      } else if (a.status.toLowerCase().includes("pulang")) {
        item.pulang = waktu
      }

      absensiMap.set(key, item)
    }

    // === Generate Excel ===
    const workbook = new Workbook()

    for (const [status, karyawanList] of Object.entries(karyawanByStatus)) {
      const sheet = workbook.addWorksheet(status)

      sheet.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Nama", key: "nama", width: 25 },
        { header: "Masuk", key: "masuk", width: 10 },
        { header: "Pulang", key: "pulang", width: 10 },
      ]

      let nomor = 1
      for (const tanggal of allDates) {
        for (const karyawan of karyawanList) {
          const key = `${karyawan.id}-${tanggal}`
          const abs = absensiMap.get(key) || {}

          sheet.addRow({
            no: nomor++,
            tanggal,
            nama: karyawan.nama,
            masuk: abs.masuk || "-",
            pulang: abs.pulang || "-",
          })
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `rekap-absensi-${String(month).padStart(2, "0")}-${year}.xlsx`

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    })
  } catch (error) {
    console.error("❌ Gagal membuat file Excel:", error)
    return NextResponse.json({ error: "Gagal membuat file Excel" }, { status: 500 })
  }
}
