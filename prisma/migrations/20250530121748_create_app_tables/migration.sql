-- CreateTable
CREATE TABLE "Karyawan" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "foto_filename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatatanAbsensi" (
    "id" SERIAL NOT NULL,
    "timestamp_absensi" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "karyawanId" INTEGER NOT NULL,

    CONSTRAINT "CatatanAbsensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Karyawan_nip_key" ON "Karyawan"("nip");

-- AddForeignKey
ALTER TABLE "CatatanAbsensi" ADD CONSTRAINT "CatatanAbsensi_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
