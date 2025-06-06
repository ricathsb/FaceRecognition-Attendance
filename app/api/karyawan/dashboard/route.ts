import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import "dayjs/locale/id";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = dayjs().tz("Asia/Jakarta");
    const todayStart = now.startOf("day").toDate();
    const todayEnd = now.endOf("day").toDate();

    // Ambil pengaturan absen
    const pengaturan = await prisma.pengaturanAbsensi.findFirst();
    if (!pengaturan) {
      return NextResponse.json({ error: "Pengaturan absen tidak ditemukan" }, { status: 404 });
    }

    // Ambil data karyawan dan absensi hari ini
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
    ]);

    const hadirSet = new Set<number>(); // Set karyawanId yang sudah absen
    let hadir = 0;
    let telat = 0;
    const aktivitasTerbaru: any[] = [];

    for (const absenData of semuaAbsensiHariIni) {
      const jam = dayjs(absenData.timestamp_absensi).tz("Asia/Jakarta");
      const nama = absenData.karyawan.nama;
      const id = absenData.id;
      const karyawanId = absenData.karyawanId;

      // Hanya hitung absen pertama per karyawan hari ini
      if (!hadirSet.has(karyawanId)) {
        hadirSet.add(karyawanId);

        if (absenData.status === "hadir" || absenData.status === "terlambat") {
          if (absenData.status === "hadir") {
            hadir++;
          } else if (absenData.status === "terlambat") {
            telat++;
          }

          aktivitasTerbaru.push({
            id,
            name: nama,
            action: `Check-in pada ${jam.format("HH:mm")}`,
            time: jam.format("HH:mm"),
            status: absenData.status,
          });
        }
      }
    }

    const absen = totalKaryawan - hadirSet.size;

    return NextResponse.json({
      totalKaryawan,
      hadir,
      telat,
      absen,
      aktivitasTerbaru,
    });
  } catch (error) {
    console.error("Gagal mengambil data dashboard:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
