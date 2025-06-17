import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import PDFDocument from "pdfkit"
import path from "path"
import dayjs from "dayjs"
import "dayjs/locale/id"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

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

    const start = dayjs(`${year}-${month}-01`).tz("Asia/Jakarta").startOf("month").toDate()
    const end = dayjs(start).tz("Asia/Jakarta").endOf("month").toDate()

    const records = await prisma.catatanAbsensi.findMany({
      where: {
        timestamp_absensi: {
          gte: start,
          lte: end,
        },
      },
      include: {
        karyawan: {
          select: { nama: true, nip: true, status: true },
        },
      },
      orderBy: { timestamp_absensi: "asc" },
    })

    // Kelompokkan berdasarkan status/role
    const groupedByRole: Record<string, typeof records> = {}
    for (const record of records) {
      const role = record.karyawan.status || "Lainnya"
      if (!groupedByRole[role]) groupedByRole[role] = []
      groupedByRole[role].push(record)
    }

    const fontRegularPath = path.resolve(process.cwd(), "public/fonts/Roboto-Regular.ttf")
    const fontBoldPath = path.resolve(process.cwd(), "public/fonts/Roboto-Bold.ttf")

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      font: fontRegularPath,
    })

    doc.registerFont("regular", fontRegularPath)
    doc.registerFont("bold", fontBoldPath)
    doc.font("regular")

    const buffers: Uint8Array[] = []
    doc.on("data", chunk => buffers.push(chunk))
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)))
      doc.on("error", reject)
    })

    let isFirstPage = true
    for (const [role, data] of Object.entries(groupedByRole)) {
      if (!isFirstPage) doc.addPage()
      isFirstPage = false

      doc.font("bold").fontSize(18).text("REKAP ABSENSI AL ITTIHADIYAH", { align: "center" })
      doc.moveDown(0.2)
      doc.font("regular").fontSize(12).text(`Periode: ${dayjs(start).format("MMMM YYYY")}`, { align: "center" })
      doc.font("regular").fontSize(12).text(`Role: ${role.toUpperCase()}`, { align: "center" })
      doc.moveDown(1)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

      const tableTop = doc.y + 10
      const colWidths = [30, 120, 100, 120, 120]
      const headers = ["No", "Tanggal", "Nama", "Masuk", "Pulang"]

      doc.font("bold").fontSize(10).fillColor("#000")
      let x = 50
      headers.forEach((h, i) => {
        doc.text(h, x + 2, tableTop, { width: colWidths[i] - 4 })
        x += colWidths[i]
      })

      const groupedKaryawan: Record<string, {
        nama: string
        nip: string
        tanggal: string
        masuk?: string
        pulang?: string
      }[]> = {}

      for (const d of data) {
        const nip = d.karyawan.nip
        const nama = d.karyawan.nama
        const tanggal = dayjs(d.timestamp_absensi).tz("Asia/Jakarta").format("DD MMM YYYY")
        const waktuLengkap = dayjs(d.timestamp_absensi).tz("Asia/Jakarta").format("HH:mm")
        const status = d.status.toLowerCase()

        if (!groupedKaryawan[nip]) groupedKaryawan[nip] = []

        let record = groupedKaryawan[nip].find(r => r.tanggal === tanggal)
        if (!record) {
          record = { nama, nip, tanggal }
          groupedKaryawan[nip].push(record)
        }

        if (["tepat waktu", "terlambat"].includes(status)) {
          if (!record.masuk) record.masuk = waktuLengkap
        } else if (status.includes("pulang")) {
          record.pulang = waktuLengkap
        }
      }

      let y = tableTop + 20
      let index = 1
      for (const rows of Object.values(groupedKaryawan)) {
        for (const item of rows) {
          if (y > 750) {
            doc.addPage()
            doc.font("regular")
            y = 50
          }

          let colX = 50
          const values = [
            String(index++),
            item.tanggal,
            item.nama,
            item.masuk || "-",
            item.pulang || "-",
          ]
          doc.font("regular").fontSize(9).fillColor("#000")
          values.forEach((val, i) => {
            doc.text(val, colX + 2, y, { width: colWidths[i] - 4 })
            colX += colWidths[i]
          })
          y += 18
        }
      }
    }

    doc.end()
    const pdf = await done

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rekap-absensi-${month}-${year}.pdf`,
      },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui"
    console.error("Gagal membuat PDF:", err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
