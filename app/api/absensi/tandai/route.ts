import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AttendanceResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

const FLASK_ATTENDANCE_URL = 'http://localhost:5000/attendance';
const OFFICE_LAT = 3.54161111
const OFFICE_LNG = 98.67988889
const MAX_DISTANCE_METERS = 100

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metode tidak diizinkan" })
  }

  const { image, latitude, longitude } = req.body

  if (!image || typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ message: "Data tidak lengkap: foto dan lokasi wajib diisi" })
  }

  const distance = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG)

  if (distance > MAX_DISTANCE_METERS) {
    return res.status(403).json({
      message: `Lokasi di luar jangkauan absensi (${Math.round(distance)} meter dari kantor)`,
    })
  }
}


    // 1. Panggil Flask
    let flaskResponse;
    try {
      flaskResponse = await fetch(FLASK_ATTENDANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
    } catch (e: any) {
      console.error("Gagal menghubungi Flask:", e.message);
      return NextResponse.json({ success: false, message: 'Gagal menghubungi layanan pengenalan wajah.', errorDetail: e.message }, { status: 503 });
    }

    const flaskData = await flaskResponse.json();
    if (!flaskResponse.ok || !flaskData.nip) {
      return NextResponse.json({ success: false, message: flaskData.message || flaskData.error || 'Wajah tidak dikenali.' }, { status: flaskResponse.status === 200 ? 404 : flaskResponse.status });
    }

    const { nip } = flaskData;

    // 2. Cari karyawan
    const karyawan = await prisma.karyawan.findUnique({
      where: { nip: String(nip) },
    });

    if (!karyawan) {
      return NextResponse.json({ success: false, message: `Karyawan dengan NIP ${nip} tidak ditemukan.` }, { status: 404 });
    }

    // 3. Ambil pengaturan absensi
    const pengaturan = await prisma.pengaturanAbsensi.findFirst();
    if (!pengaturan) {
      return NextResponse.json({ success: false, message: 'Pengaturan absensi tidak ditemukan.' }, { status: 500 });
    }

    // 4. Cek apakah hari ini termasuk hari kerja
    const now = new Date();
    const hariInggris = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const hariIni = hariInggris[now.getDay()];

    if (!pengaturan.hariKerja.includes(hariIni)) {
      return NextResponse.json({ success: false, message: `Hari ${hariIni} bukan hari kerja.` }, { status: 403 });
    }

    // 5. Cek apakah sudah absen hari ini
    const awalHari = new Date(now);
    awalHari.setHours(0, 0, 0, 0);
    const akhirHari = new Date(now);
    akhirHari.setHours(23, 59, 59, 999);

    const absensiHariIni = await prisma.catatanAbsensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        timestamp_absensi: {
          gte: awalHari,
          lte: akhirHari,
        },
      },
    });

    if (absensiHariIni) {
      return NextResponse.json({ success: false, message: 'Karyawan sudah melakukan absensi hari ini.' }, { status: 403 });
    }

    // 6. Hitung status absensi berdasarkan waktu
    const formatJam = (jamStr: string) => {
      const [h, m] = jamStr.split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const waktuMulai = formatJam(pengaturan.waktuMulaiAbsen);
    const batasTepat = formatJam(pengaturan.batasTepatWaktu);
    const batasTerlambat = formatJam(pengaturan.batasTerlambat);

    let statusAbsensi: string;

    if (now >= waktuMulai && now <= batasTepat) {
      statusAbsensi = 'tepat waktu';
    } else if (now > batasTepat && now <= batasTerlambat) {
      statusAbsensi = 'terlambat';
    } else {
      return NextResponse.json({ success: false, message: 'Waktu absensi di luar rentang yang diizinkan.' }, { status: 403 });
    }

    // 7. Catat absensi
    const newAttendanceRecord = await prisma.catatanAbsensi.create({
      data: {
        karyawanId: karyawan.id,
        timestamp_absensi: now,
        status: statusAbsensi,
      },
    });

    const responsePayload: AttendanceResponse = {
      success: true,
      message: `Absensi ${statusAbsensi} untuk ${karyawan.nama} berhasil dicatat!`,
      nama: karyawan.nama,
      nip: karyawan.nip,
      timestamp: now.toISOString(),
      status: statusAbsensi,
      catatanId: newAttendanceRecord.id,
    };

    console.log("Absensi berhasil dicatat:", responsePayload);

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error("Error di API /api/absensi/tandai:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.', errorDetail: error.message }, { status: 500 });
  }
}