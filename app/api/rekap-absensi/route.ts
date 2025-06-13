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

    const start = dayjs(`${year}-${month}-01`).startOf("month").tz("Asia/Jakarta").toDate();
    const end = dayjs(start).endOf("month").tz("Asia/Jakarta").toDate();

    const data = await prisma.catatanAbsensi.findMany({
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
      orderBy: {
        timestamp_absensi: "asc",
      },
    });

    const fontRegular = path.resolve(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
    const fontBold = path.resolve(process.cwd(), "public", "fonts", "Roboto-Bold.ttf");

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      font: fontRegular,
    });

    doc.registerFont("regular", fontRegular);
    doc.registerFont("bold", fontBold);

    const buffers: Uint8Array[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);
    });

    // ====== HEADER ======
    doc.font("bold").fontSize(20).text("REKAP ABSENSI AL ITTIHADIYAH", { align: "center" });
    doc.moveDown(0.5);
    doc.font("regular").fontSize(12).text(`Periode: ${dayjs(start).format("MMMM YYYY")}`, { align: "center" });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#444").lineWidth(1).stroke();
    doc.moveDown(1);

    // ====== TABLE ======
    const tableTop = doc.y;
    const colWidths = [30, 130, 100, 70, 115, 75];
    const headers = ["No", "Nama", "NIP", "Status", "Waktu", "Absensi"];

    // Header Row
    doc.rect(50, tableTop, 495, 20).fill("#f0f0f0").stroke();
    doc.fillColor("#000").font("bold").fontSize(10);

    let x = 50;
    headers.forEach((header, i) => {
      doc.text(header, x + 2, tableTop + 5, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });

    let y = tableTop + 20;

    // Data Rows
    data.forEach((item, i) => {
      const rowHeight = 20; // bisa dibuat dinamis kalau perlu
      const rowColor = i % 2 === 0 ? "#fff" : "#fafafa";
      doc.rect(50, y, 495, rowHeight).fill(rowColor).stroke();
      doc.font("regular").fontSize(9);

      let colX = 50;
      const waktu = dayjs(item.timestamp_absensi).tz("Asia/Jakarta").format("DD MMM YYYY HH:mm");
      const statusAbsensi = item.status;

      const values = [
        String(i + 1),
        item.karyawan.nama,
        item.karyawan.nip,
        item.karyawan.status,
        waktu,
        statusAbsensi,
      ];

      values.forEach((val, j) => {
        // Highlight khusus untuk kolom "Status Absensi"
        if (j === 5) {
          if (val.toLowerCase().includes("terlambat")) doc.fillColor("#e57373"); // merah soft
          else if (val.toLowerCase().includes("tepat")) doc.fillColor("#81c784"); // hijau soft
          else doc.fillColor("#000");
        } else {
          doc.fillColor("#000");
        }

        doc.text(val, colX + 2, y + 5, {
          width: colWidths[j] - 4,
          height: rowHeight,
        });
        colX += colWidths[j];
      });

      y += rowHeight;
    });

    // Footer (opsional)
    doc.moveDown(2);
    doc.fontSize(10).fillColor("#666").text(`Generated at ${dayjs().tz("Asia/Jakarta").format("DD MMM YYYY HH:mm")}`, 50, y + 20, {
      align: "right",
    });

    doc.end();
    const pdf = await done;

    return new Response(pdf, {
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
