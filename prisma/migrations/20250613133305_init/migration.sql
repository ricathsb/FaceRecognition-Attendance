-- AlterTable
ALTER TABLE "Karyawan" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Guru';

-- CreateTable
CREATE TABLE "HariLibur" (
    "id" SERIAL NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT NOT NULL DEFAULT 'Hari Libur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HariLibur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HariLibur_tanggal_idx" ON "HariLibur"("tanggal");
