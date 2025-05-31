// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Deklarasikan variabel global untuk menyimpan instance PrismaClient
// Ini penting untuk mencegah pembuatan instance baru setiap kali ada hot-reload di development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Inisialisasi PrismaClient.
// Di development, kita menggunakan variabel global agar instance yang sama digunakan kembali
// saat hot-reloading, menghindari kehabisan koneksi database.
// Di production, kita selalu membuat instance baru.
const prisma = global.prisma || new PrismaClient({
  // Anda bisa menambahkan konfigurasi log di sini jika diperlukan
  // log: ['query', 'info', 'warn', 'error'],
});

// Jika kita berada di environment development, simpan instance prisma ke variabel global.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
