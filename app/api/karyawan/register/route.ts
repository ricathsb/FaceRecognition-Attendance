// app/api/karyawan/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Pastikan path ke prisma client Anda benar
import fs from 'fs/promises'; // Untuk operasi file system (asynchronous)
import path from 'path'; // Untuk memanipulasi path file

// URL ke endpoint Flask untuk registrasi wajah
// Sebaiknya gunakan environment variable untuk URL Flask di production
const FLASK_REGISTER_FACE_URL = process.env.FLASK_BACKEND_URL 
    ? `${process.env.FLASK_BACKEND_URL}/register-face` 
    : 'http://localhost:5000/register-face';

export const dynamic = 'force-dynamic'; // Penting agar Next.js tidak mencoba membuat ini statis

// Fungsi utilitas kecil untuk membersihkan NIP jika dipakai sebagai bagian dari nama file
function sanitizeFilenameFromString(text: string): string {
  return text.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, nip, fotoWajah } = body; // fotoWajah adalah base64 data URL

    if (!nama || !nip || !fotoWajah) {
      return NextResponse.json({ message: 'Nama, NIP, dan fotoWajah wajib diisi.' }, { status: 400 });
    }

    // 1. Cek apakah NIP sudah ada
    const existingKaryawan = await prisma.karyawan.findUnique({
      where: { nip },
    });

    if (existingKaryawan) {
      return NextResponse.json({ message: `NIP ${nip} sudah terdaftar.` }, { status: 409 }); // 409 Conflict
    }

    // 2. Proses dan simpan gambar di server Next.js
    const base64Data = fotoWajah.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const timestamp = Date.now();
    
    // Ekstrak ekstensi dari data URL (lebih aman)
    const mimeTypeMatch = fotoWajah.match(/^data:(image\/\w+);base64,/);
    let extension = '.jpeg'; // Default ke jpeg
    if (mimeTypeMatch) {
        const mimeType = mimeTypeMatch[1];
        if (mimeType === 'image/png') {
            extension = '.png';
        } else if (mimeType === 'image/jpeg') {
            extension = '.jpeg';
        }
        // Tambahkan tipe lain jika perlu
    }
    
    const sanitizedNip = sanitizeFilenameFromString(nip); // Sanitasi NIP untuk nama file
    const fotoFilename = `${sanitizedNip}_${timestamp}${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'karyawan_photos');
    
    await fs.mkdir(uploadDir, { recursive: true }); // Buat direktori jika belum ada
    const filePath = path.join(uploadDir, fotoFilename);
    await fs.writeFile(filePath, buffer);

    const fotoDbPath = `/uploads/karyawan_photos/${fotoFilename}`; // Path relatif untuk disimpan ke DB

    // 3. Simpan data karyawan awal ke database PostgreSQL (face_embedding masih kosong)
    const karyawanBaru = await prisma.karyawan.create({
      data: {
        nama,
        nip,
        foto_filename: fotoDbPath,
        // Kolom face_embedding akan diisi oleh Flask
      },
    });

    // ---> INI BAGIAN YANG DITAMBAHKAN: Panggil Flask untuk memproses wajah <---
    let flaskProcessingMessage = 'Data karyawan berhasil disimpan.';
    let overallStatus = 201; // Status awal sukses

    try {
      console.log(`Next.js: Memanggil Flask di ${FLASK_REGISTER_FACE_URL} untuk NIP: ${karyawanBaru.nip}`);
      const flaskResponse = await fetch(FLASK_REGISTER_FACE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: karyawanBaru.nip,
          nama: karyawanBaru.nama, // Mengirim nama juga bisa berguna untuk logging di Flask
          fotoWajah: fotoWajah     // Kirim data gambar base64 asli yang diterima dari frontend
        }),
        // Tambahkan timeout jika perlu, misal 30 detik
        // signal: AbortSignal.timeout(30000) 
      });

      const flaskData = await flaskResponse.json();

      if (!flaskResponse.ok) {
        console.error(`Next.js: Error dari Flask /register-face (NIP: ${karyawanBaru.nip}). Status: ${flaskResponse.status}, Pesan: ${flaskData.message || flaskData.error}`);
        // Meskipun Flask error, data karyawan utama sudah masuk.
        // Pesan ini akan dikirim ke frontend.
        flaskProcessingMessage = `Data karyawan disimpan. PERHATIAN: Gagal memproses encoding wajah di server AI (Error: ${flaskData.message || flaskData.error || 'Tidak ada detail error dari server AI'}). Harap coba daftarkan ulang wajah melalui menu edit profil (jika ada).`;
        // Kamu bisa memutuskan apakah status keseluruhan tetap 201 atau diubah, misal 207 (Multi-Status)
        // atau tetap 201 tapi dengan pesan peringatan.
      } else {
        console.log(`Next.js: Sukses dari Flask /register-face (NIP: ${karyawanBaru.nip}): ${flaskData.message}`);
        flaskProcessingMessage = flaskData.message || `Pendaftaran untuk ${karyawanBaru.nama} berhasil! Encoding wajah juga sudah diproses.`;
      }
    } catch (flaskCallError: any) {
      console.error(`Next.js: Gagal memanggil Flask /register-face (NIP: ${karyawanBaru.nip}): ${flaskCallError.message}`);
      flaskProcessingMessage = `Data karyawan disimpan. PERHATIAN: Gagal menghubungi server AI untuk proses encoding wajah (${flaskCallError.message}). Harap coba daftarkan ulang wajah nanti.`;
      // Sama seperti di atas, pertimbangkan status code
    }

    return NextResponse.json({ message: flaskProcessingMessage, karyawan: karyawanBaru }, { status: overallStatus });

  } catch (error: any) {
    console.error("Error saat registrasi karyawan di Next.js API:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nip')) {
      return NextResponse.json({ message: 'NIP sudah terdaftar (dicek lagi oleh database).' }, { status: 409 });
    }
    // Tangani error jika Prisma Client tidak terinisialisasi (misalnya, DB down saat startup)
    if (error.message.includes("PrismaClientInitializationError")) {
        return NextResponse.json({ message: 'Tidak dapat terhubung ke database.' }, { status: 503 });
    }
    return NextResponse.json({ message: error.message || 'Terjadi kesalahan pada server Next.js.', errorDetail: error.toString() }, { status: 500 });
  }
}
