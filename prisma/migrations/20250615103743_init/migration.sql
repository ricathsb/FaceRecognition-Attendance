-- AlterTable
ALTER TABLE "PengaturanAbsensi" ADD COLUMN     "batasWaktuPulang" TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN     "waktuMulaiPulang" TEXT NOT NULL DEFAULT '16:00';
