/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Karyawan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Karyawan" ADD COLUMN     "email" TEXT,
ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_email_key" ON "Karyawan"("email");
