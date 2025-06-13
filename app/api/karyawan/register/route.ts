import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcrypt"

const FLASK_REGISTER_FACE_URL = process.env.FLASK_BACKEND_URL
  ? `${process.env.FLASK_BACKEND_URL}/register-face`
  : "http://localhost:5000/register-face"

export const dynamic = "force-dynamic"

function sanitizeFilenameFromString(text: string): string {
  return text.replace(/[^a-zA-Z0-9_-]/g, "_")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const nama = body.nama?.toString().trim() || ""
    const nip = body.nip?.toString().trim() || ""
    const email = body.email?.toString().trim() || ""
    const password = body.password?.toString().trim() || ""
    const status = body.status?.toString().trim() || "Staff" // New status field
    const fotoWajah = body.fotoWajah || ""

    if (!nama || !nip || !email || !password || !fotoWajah) {
      const missingFields = { nama: !nama, nip: !nip, email: !email, password: !password, fotoWajah: !fotoWajah }
      return NextResponse.json({ message: "Semua field wajib diisi.", missingFields }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Format email tidak valid." }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password minimal 6 karakter." }, { status: 400 })
    }

    if (!/^\d{5,12}$/.test(nip)) {
      return NextResponse.json({ message: "Format NIP tidak valid. NIP harus berupa 5-12 digit angka." }, { status: 400 })
    }

    // Validate status
    if (!["Staff", "Teacher"].includes(status)) {
      return NextResponse.json({ message: "Status harus berupa 'Staff' atau 'Teacher'." }, { status: 400 })
    }

    const existingByNip = await prisma.karyawan.findUnique({ where: { nip } })
    if (existingByNip) {
      return NextResponse.json({ message: `NIP ${nip} sudah terdaftar.` }, { status: 409 })
    }

    const existingByEmail = await prisma.karyawan.findUnique({ where: { email } })
    if (existingByEmail) {
      return NextResponse.json({ message: `Email ${email} sudah terdaftar.` }, { status: 409 })
    }

    // === Call Flask API ===
    let flaskData
    try {
      const flaskResponse = await fetch(FLASK_REGISTER_FACE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nip, nama, fotoWajah }),
      })

      flaskData = await flaskResponse.json()

      if (!flaskResponse.ok) {
        return NextResponse.json({
          message: `Gagal memproses encoding wajah di server AI (Error: ${flaskData.message || flaskData.error || "Tidak ada detail error"}).`,
          success: false,
        }, { status: 502 })
      }
    } catch (flaskCallError: any) {
      return NextResponse.json({
        message: `Gagal menghubungi server AI untuk proses encoding wajah (${flaskCallError.message}).`,
        success: false,
      }, { status: 502 })
    }

    // === Save Image to Disk ===
    const base64Data = fotoWajah.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const timestamp = Date.now()

    const mimeTypeMatch = fotoWajah.match(/^data:(image\/\w+);base64,/)
    let extension = ".jpeg"
    if (mimeTypeMatch?.[1] === "image/png") extension = ".png"

    const sanitizedNip = sanitizeFilenameFromString(nip)
    const fotoFilename = `${sanitizedNip}_${timestamp}${extension}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "karyawan_photos")

    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, fotoFilename)
    await fs.writeFile(filePath, new Uint8Array(buffer))

    const fotoDbPath = `/uploads/karyawan_photos/${fotoFilename}`
    const encodedFaceString = JSON.stringify(flaskData.face_encoding)

    const hashedPassword = await bcrypt.hash(password, 10)

    const karyawanData = await prisma.karyawan.create({
      data: {
        nama,
        nip,
        email,
        password: hashedPassword,
        status, // Include status in the creation
        foto_filename: fotoDbPath,
        face_embedding: encodedFaceString,
      },
    })

    return NextResponse.json({
      message: flaskData.message || `Pendaftaran berhasil dan encoding wajah sukses.`,
      success: true,
      karyawan: {
        id: karyawanData.id,
        nama,
        nip,
        email,
        status,
        foto_filename: fotoDbPath,
        createdAt: karyawanData.createdAt,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Unhandled error:", error)

    if (error.code === "P2002") {
      if (error.meta?.target?.includes("nip")) {
        return NextResponse.json({ message: "NIP sudah terdaftar." }, { status: 409 })
      }
      if (error.meta?.target?.includes("email")) {
        return NextResponse.json({ message: "Email sudah terdaftar." }, { status: 409 })
      }
    }

    return NextResponse.json({
      message: "Terjadi kesalahan pada server.",
      errorDetail: error.message || error.toString(),
      success: false,
    }, { status: 500 })
  }
}