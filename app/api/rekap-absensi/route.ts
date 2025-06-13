import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import dayjs from "dayjs";
import "dayjs/locale/id";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import fs from "fs";
import path from "path";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    if (!month || !year) {
      return NextResponse.json({ error: "Parameter bulan dan tahun diperlukan." }, { status: 400 });
    }

    console.log("[INFO] Params:", { month, year });

    const start = dayjs(`${year}-${month}-01`).startOf("month").tz("Asia/Jakarta").toDate();
    const end = dayjs(start).endOf("month").tz("Asia/Jakarta").toDate();

    console.log("[INFO] Date Range:", start, "to", end);

    const data = await prisma.catatanAbsensi.findMany({
      where: {
        timestamp_absensi: {
          gte: start,
          lte: end,
        },
      },
      include: {
        karyawan: {
          select: {
            nama: true,
            nip: true,
            status: true,
          },
        },
      },
      orderBy: {
        timestamp_absensi: "asc",
      },
    });

    console.log("[INFO] Absensi ditemukan:", data.length);

    // Path ke font
    const fontPath = path.resolve(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");

    if (!fs.existsSync(fontPath)) {
      console.error("[ERROR] Font tidak ditemukan:", fontPath);
      return NextResponse.json({ error: "Font PDF tidak ditemukan di server." }, { status: 500 });
    }

    // Buat dokumen PDF dengan font default langsung di-override
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      font: fontPath, // <<< Ini mencegah error Helvetica.afm
    });

    const bufferChunks: Uint8Array[] = [];

    doc.on("data", (chunk) => bufferChunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(bufferChunks)));
      doc.on("error", (err) => reject(err));
    });

    // Mulai isi konten PDF
    doc.fontSize(18).text("Rekap Absensi", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    data.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.karyawan.nama} (${item.karyawan.nip}) - ${item.karyawan.status}`);
      doc.text(`   Waktu: ${dayjs(item.timestamp_absensi).tz("Asia/Jakarta").format("DD MMM YYYY HH:mm")} | Status: ${item.status}`);
      doc.moveDown(0.5);
    });

    doc.end();

    const pdfBuffer = await done;

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rekap-absensi-${month}-${year}.pdf`,
      },
    });
  } catch (err) {
    console.error("[ERROR] Gagal generate PDF:", err);
    return NextResponse.json({ error: "Gagal membuat PDF" }, { status: 500 });
  }
}
