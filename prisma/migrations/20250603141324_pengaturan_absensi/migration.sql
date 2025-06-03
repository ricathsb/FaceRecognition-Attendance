/*
  Warnings:

  - You are about to drop the column `dibuatPada` on the `PengaturanAbsensi` table. All the data in the column will be lost.
  - You are about to drop the column `diubahTerakhir` on the `PengaturanAbsensi` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `PengaturanAbsensi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PengaturanAbsensi" DROP COLUMN "dibuatPada",
DROP COLUMN "diubahTerakhir",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
