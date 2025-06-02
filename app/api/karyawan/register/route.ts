import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

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

    // Ekstrak data dengan explicit destructuring
    const nama = body.nama?.toString().trim() || ""
    const nip = body.nip?.toString().trim() || ""
    const email = body.email?.toString().trim() || ""
    const password = body.password?.toString().trim() || ""
    const fotoWajah = body.fotoWajah || ""

    console.log("=== REGISTRATION DEBUG ===")
    console.log("Raw body received:", JSON.stringify(body, null, 2))
    console.log("Extracted data:")
    console.log("- nama:", `"${nama}"`, nama ? "✓" : "✗")
    console.log("- nip:", `"${nip}"`, nip ? "✓" : "✗")
    console.log("- email:", `"${email}"`, email ? "✓" : "✗")
    console.log(
      "- password:",
      password ? `"${password}" (length: ${password.length})` : "MISSING",
      password ? "✓" : "✗",
    )
    console.log("- fotoWajah:", fotoWajah ? "PROVIDED" : "MISSING", fotoWajah ? "✓" : "✗")

    // Validasi input yang lebih ketat
    if (!nama || !nip || !email || !password || !fotoWajah) {
      const missingFields = {
        nama: !nama,
        nip: !nip,
        email: !email,
        password: !password,
        fotoWajah: !fotoWajah,
      }

      console.error("❌ Missing required fields:", missingFields)
      return NextResponse.json(
        {
          message: "Semua field wajib diisi.",
          debug: {
            received: {
              nama,
              nip,
              email,
              password: password ? "PROVIDED" : "MISSING",
              fotoWajah: fotoWajah ? "PROVIDED" : "MISSING",
            },
            missingFields,
          },
        },
        { status: 400 },
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email)
      return NextResponse.json({ message: "Format email tidak valid." }, { status: 400 })
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      console.error("❌ Password too short:", password.length)
      return NextResponse.json({ message: "Password minimal 6 karakter." }, { status: 400 })
    }

    // Validasi NIP format
    if (!/^\d{5,12}$/.test(nip)) {
      console.error("❌ Invalid NIP format:", nip)
      return NextResponse.json(
        { message: "Format NIP tidak valid. NIP harus berupa 5-12 digit angka." },
        { status: 400 },
      )
    }

    console.log("✅ All validations passed")

    // 1. Cek apakah NIP sudah ada
    console.log("🔍 Checking if NIP exists...")
    const existingKaryawanByNip = await prisma.karyawan.findUnique({
      where: { nip },
    })

    if (existingKaryawanByNip) {
      console.error("❌ NIP already exists:", nip)
      return NextResponse.json({ message: `NIP ${nip} sudah terdaftar.` }, { status: 409 })
    }

    // 2. Cek apakah email sudah ada
    console.log("🔍 Checking if email exists...")
    const existingKaryawanByEmail = await prisma.karyawan.findUnique({
      where: { email },
    })

    if (existingKaryawanByEmail) {
      console.error("❌ Email already exists:", email)
      return NextResponse.json({ message: `Email ${email} sudah terdaftar.` }, { status: 409 })
    }

    console.log("✅ NIP and email are unique")

    // 3. Password disimpan tanpa enkripsi (plain text)
    console.log("📝 Password will be stored as plain text")

    // 4. Proses dan simpan gambar di server Next.js
    console.log("📷 Processing image...")
    const base64Data = fotoWajah.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const timestamp = Date.now()

    const mimeTypeMatch = fotoWajah.match(/^data:(image\/\w+);base64,/)
    let extension = ".jpeg"
    if (mimeTypeMatch) {
      const mimeType = mimeTypeMatch[1]
      if (mimeType === "image/png") {
        extension = ".png"
      } else if (mimeType === "image/jpeg") {
        extension = ".jpeg"
      }
    }

    const sanitizedNip = sanitizeFilenameFromString(nip)
    const fotoFilename = `${sanitizedNip}_${timestamp}${extension}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "karyawan_photos")

    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, fotoFilename)
    await fs.writeFile(filePath, buffer)

    const fotoDbPath = `/uploads/karyawan_photos/${fotoFilename}`
    console.log("✅ Image saved to:", fotoDbPath)

    // 5. Simpan data karyawan ke database PostgreSQL
    console.log("💾 Saving to database...")
    console.log("Data to be saved:")
    console.log("- nama:", nama)
    console.log("- nip:", nip)
    console.log("- email:", email)
    console.log("- password:", "PLAIN TEXT (NOT HASHED)")
    console.log("- foto_filename:", fotoDbPath)

    // Simpan data karyawan ke database dengan password plain text
    const karyawanData = await prisma.karyawan.create({
      data: {
        nama: nama,
        nip: nip,
        email: email,
        password: password, // Password disimpan sebagai plain text
        foto_filename: fotoDbPath,
      },
    })

    console.log("✅ Karyawan created in database:", karyawanData.id)

    // 6. Panggil Flask untuk memproses wajah
    let flaskProcessingMessage = "Data karyawan berhasil disimpan."
    const overallStatus = 201

    try {
      console.log(`🤖 Calling Flask at ${FLASK_REGISTER_FACE_URL} for NIP: ${nip}`)
      const flaskResponse = await fetch(FLASK_REGISTER_FACE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip: nip,
          nama: nama,
          fotoWajah: fotoWajah,
        }),
      })

      const flaskData = await flaskResponse.json()

      if (!flaskResponse.ok) {
        console.error(`❌ Flask error for NIP ${nip}:`, flaskData)
        flaskProcessingMessage = `Data karyawan disimpan. PERHATIAN: Gagal memproses encoding wajah di server AI (Error: ${flaskData.message || flaskData.error || "Tidak ada detail error dari server AI"}). Harap coba daftarkan ulang wajah melalui menu edit profil.`
      } else {
        console.log(`✅ Flask success for NIP ${nip}:`, flaskData)
        flaskProcessingMessage =
          flaskData.message || `Pendaftaran untuk ${nama} berhasil! Encoding wajah juga sudah diproses.`
      }
    } catch (flaskCallError: any) {
      console.error(`❌ Failed to call Flask for NIP ${nip}:`, flaskCallError)
      flaskProcessingMessage = `Data karyawan disimpan. PERHATIAN: Gagal menghubungi server AI untuk proses encoding wajah (${flaskCallError.message}). Harap coba daftarkan ulang wajah nanti.`
    }

    console.log("=== REGISTRATION COMPLETED ===")

    // Buat response object secara manual tanpa mengakses property yang tidak ada
    return NextResponse.json(
      {
        message: flaskProcessingMessage,
        success: true,
        karyawan: {
          id: karyawanData.id,
          nama: nama,
          nip: nip,
          email: email,
          foto_filename: fotoDbPath,
          createdAt: karyawanData.createdAt,
        },
      },
      { status: overallStatus },
    )
  } catch (error: any) {
    console.error("❌ Error in karyawan registration:", error)
    console.error("Error stack:", error.stack)

    if (error.code === "P2002") {
      if (error.meta?.target?.includes("nip")) {
        return NextResponse.json({ message: "NIP sudah terdaftar." }, { status: 409 })
      }
      if (error.meta?.target?.includes("email")) {
        return NextResponse.json({ message: "Email sudah terdaftar." }, { status: 409 })
      }
    }

    if (error.message.includes("PrismaClientInitializationError")) {
      return NextResponse.json({ message: "Tidak dapat terhubung ke database." }, { status: 503 })
    }

    return NextResponse.json(
      {
        message: error.message || "Terjadi kesalahan pada server Next.js.",
        errorDetail: error.toString(),
        success: false,
      },
      { status: 500 },
    )
  }
}
