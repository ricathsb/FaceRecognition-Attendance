-- CreateTable
CREATE TABLE "PengaturanAbsensi" (
    "id" SERIAL NOT NULL,
    "waktuMulaiAbsen" TEXT NOT NULL,
    "batasTepatWaktu" TEXT NOT NULL,
    "batasTerlambat" TEXT NOT NULL,
    "hariKerja" TEXT[],
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahTerakhir" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengaturanAbsensi_pkey" PRIMARY KEY ("id")
);
