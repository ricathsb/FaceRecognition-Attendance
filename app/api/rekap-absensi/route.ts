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

    // === Embed font langsung ===
    const fontRegularPath = path.resolve(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
    const fontBoldPath = path.resolve(process.cwd(), "public", "fonts", "Roboto-Bold.ttf");

    if (!fs.existsSync(fontRegularPath) || !fs.existsSync(fontBoldPath)) {
      console.error("[ERROR] Font tidak ditemukan di direktori public/fonts/");
      return NextResponse.json({ error: "Font PDF tidak ditemukan." }, { status: 500 });
    }

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      font: fontRegularPath, // hindari default Helvetica
    });

    // Register bold font
    doc.registerFont("regular", fontRegularPath);
    doc.registerFont("bold", fontBoldPath);

    const bufferChunks: Uint8Array[] = [];
    doc.on("data", (chunk) => bufferChunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(bufferChunks)));
      doc.on("error", reject);
    });

    // === PDF UI ===
    doc.font("bold").fontSize(16).text(`Rekap Absensi MAS AI Ittihadiyah Bulan ${dayjs(start).format("MMMM YYYY")}`, { align: "center" });
    doc.moveDown();

    // Header Tabel
    const tableTop = doc.y + 10;
    const colWidths = [30, 140, 100, 100, 150]; // no, nama, nip, status, waktu

    const drawRow = (y: number, columns: string[], isHeader = false) => {
      const font = isHeader ? "bold" : "regular";
      const fontSize = isHeader ? 10 : 9;

      doc.font(font).fontSize(fontSize);
      let x = doc.page.margins.left;

      columns.forEach((text, i) => {
        doc.text(text, x, y, {
          width: colWidths[i],
          align: "left",
        });
        x += colWidths[i];
      });
    };

    // Tabel Header
    drawRow(tableTop, ["No", "Nama", "NIP", "Status", "Waktu & Status"], true);

    let rowY = tableTop + 20;

    data.forEach((item, index) => {
      const waktu = dayjs(item.timestamp_absensi).tz("Asia/Jakarta").format("DD MMM YYYY HH:mm");
      drawRow(rowY, [
        String(index + 1),
        item.karyawan.nama,
        item.karyawan.nip,
        item.karyawan.status,
        `${waktu} | ${item.status}`,
      ]);
      rowY += 20;
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
    return NextResponse.json({ error: "Gagal membuat PDF." }, { status: 500 });
  }
}
