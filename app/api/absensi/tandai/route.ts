// app/api/absensi/tandai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AttendanceResponse } from '@/lib/api'; // atau @/lib/types

export const dynamic = 'force-dynamic';

const FLASK_ATTENDANCE_URL = 'http://localhost:5000/attendance'; // Sesuaikan jika port Flask beda

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image: imageData } = body;

    if (!imageData) {
      return NextResponse.json({ success: false, message: 'Data gambar diperlukan.' }, { status: 400 });
    }

    // 1. Panggil Flask untuk face recognition
    let flaskResponse;
    try {
      flaskResponse = await fetch(FLASK_ATTENDANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
    } catch (e: any) {
      console.error("Error calling Flask attendance API:", e.message);
      return NextResponse.json({ success: false, message: 'Gagal menghubungi layanan pengenalan wajah.', errorDetail: e.message }, { status: 503 });
    }

    const flaskData = await flaskResponse.json();

    if (!flaskResponse.ok || !flaskData.nip) {
      // Jika Flask tidak mengenali atau ada error dari Flask
      return NextResponse.json({ success: false, message: flaskData.message || flaskData.error || 'Wajah tidak dikenali oleh server AI.' }, { status: flaskResponse.status === 200 ? 404 : flaskResponse.status });
    }

    const { nip, name: recognizedName } = flaskData;

    // 2. Cari karyawan di DB berdasarkan NIP dari Flask
    const karyawan = await prisma.karyawan.findUnique({
      where: { nip: String(nip) },
    });

    if (!karyawan) {
      return NextResponse.json({ success: false, message: `Karyawan dengan NIP ${nip} tidak ditemukan di database.` }, { status: 404 });
    }

    // 3. Catat absensi ke tabel CatatanAbsensi
    const timestampAbsensi = new Date();
    const statusAbsensi = "masuk";  

    const newAttendanceRecord = await prisma.catatanAbsensi.create({
      data: {
        karyawanId: karyawan.id,
        timestamp_absensi: timestampAbsensi,
        status: statusAbsensi,
      },
    });

    // ... di dalam fungsi POST ...
    const responsePayload: AttendanceResponse = {
      success: true,
      message: `Absensi untuk ${karyawan.nama} berhasil dicatat!`,
      nama: karyawan.nama,
      nip: karyawan.nip, // NIP dari data karyawan di DB
      timestamp: timestampAbsensi.toISOString(),
      status: statusAbsensi,
      catatanId: newAttendanceRecord.id,
    };
    console.log("Next.js API (/api/absensi/tandai) mengirim ke frontend:", responsePayload); // <--- TAMBAHKAN INI
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error("Error di API /api/absensi/tandai:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server Next.js saat absensi.', errorDetail: error.message }, { status: 500 });
  }
}