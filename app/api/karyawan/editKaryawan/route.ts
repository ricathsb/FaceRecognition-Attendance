import { NextRequest, NextResponse } from "next/server";
import prisma  from "@/lib/prisma"; // Pastikan path ini benar sesuai struktur project kamu

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, nip, email, password } = body;

    if (!id || !name?.trim() || !nip?.trim()) {
      return NextResponse.json(
        { message: "Nama, NIP, dan ID harus diisi" },
        { status: 400 }
      );
    }

    const updatedData: any = {
      nama: name.trim(),
      nip: nip.trim(),
    };

    if (email?.trim()) updatedData.email = email.trim();
    if (password) updatedData.password = password;

    const updatedKaryawan = await prisma.karyawan.update({
      where: { id: Number(id) }, // pastikan id dikonversi ke number karena di Prisma id = Int
      data: updatedData,
    });

    return NextResponse.json({
      message: "Karyawan berhasil diperbarui",
      data: updatedKaryawan,
    });
  } catch (error: any) {
    console.error("PUT /api/karyawan error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memperbarui data karyawan" },
      { status: 500 }
    );
  }
}
