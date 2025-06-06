import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { AttendanceResponse } from "@/lib/api"

export const dynamic = "force-dynamic"

const FLASK_ATTENDANCE_URL = "http://localhost:5000/attendance"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image: imageData } = body

    if (!imageData) {
      return NextResponse.json({ success: false, message: "Data gambar diperlukan." }, { status: 400 })
    }

    // 1. Panggil Flask untuk face recognition
    let flaskResponse
    try {
      flaskResponse = await fetch(FLASK_ATTENDANCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      })
    } catch (e: any) {
      console.error("Error calling Flask attendance API:", e.message)
      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghubungi layanan pengenalan wajah.",
          errorDetail: e.message,
        },
        { status: 503 },
      )
    }

    const flaskData = await flaskResponse.json()

    if (!flaskResponse.ok || !flaskData.nip) {
      return NextResponse.json(
        {
          success: false,
          message: flaskData.message || flaskData.error || "Wajah tidak dikenali oleh server AI.",
        },
        { status: flaskResponse.status === 200 ? 404 : flaskResponse.status },
      )
    }

    const { nip, name: recognizedName } = flaskData

    // 2. Cari karyawan di DB berdasarkan NIP dari Flask
    const karyawan = await prisma.karyawan.findUnique({
      where: { nip: String(nip) },
    })

    if (!karyawan) {
      return NextResponse.json(
        {
          success: false,
          message: `Karyawan dengan NIP ${nip} tidak ditemukan di database.`,
        },
        { status: 404 },
      )
    }

    // 3. Ambil pengaturan absensi untuk menentukan status
    const pengaturanAbsensi = await prisma.pengaturanAbsensi.findFirst({
      orderBy: { id: "desc" },
    })

    if (!pengaturanAbsensi) {
      return NextResponse.json(
        {
          success: false,
          message: "Pengaturan absensi belum dikonfigurasi.",
        },
        { status: 400 },
      )
    }

    // 4. Cek apakah hari ini adalah hari kerja
    const today = new Date()
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const todayDayName = dayNames[today.getDay()]

    if (!pengaturanAbsensi.hariKerja.includes(todayDayName)) {
      return NextResponse.json(
        {
          success: false,
          message: "Hari ini bukan hari kerja.",
        },
        { status: 400 },
      )
    }

    // 5. Cek apakah masih dalam jam absensi
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    if (currentTime < pengaturanAbsensi.waktuMulaiAbsen) {
      return NextResponse.json(
        {
          success: false,
          message: `Belum waktunya absen. Jam absensi dimulai pada ${pengaturanAbsensi.waktuMulaiAbsen}.`,
        },
        { status: 400 },
      )
    }

    if (currentTime > pengaturanAbsensi.batasTerlambat) {
      return NextResponse.json(
        {
          success: false,
          message: `Waktu absensi sudah berakhir. Batas akhir absensi adalah ${pengaturanAbsensi.batasTerlambat}.`,
        },
        { status: 400 },
      )
    }

    // 6. Cek apakah sudah absen hari ini
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const existingAttendance = await prisma.catatanAbsensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        timestamp_absensi: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: `${karyawan.nama} sudah melakukan absensi hari ini pada ${existingAttendance.timestamp_absensi.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.`,
        },
        { status: 409 },
      )
    }

    // 7. Tentukan status absensi berdasarkan waktu
    const timeToMinutes = (time: string) => {
      const [jam, menit] = time.split(":").map(Number)
      return jam * 60 + menit
    }

    const currentMinutes = timeToMinutes(currentTime)
    const batasTepatMinutes = timeToMinutes(pengaturanAbsensi.batasTepatWaktu)
    const batasTerlambatMinutes = timeToMinutes(pengaturanAbsensi.batasTerlambat)

    let statusAbsensi = "Hadir"
    let statusDisplay = "hadir"

    if (currentMinutes > batasTepatMinutes && currentMinutes <= batasTerlambatMinutes) {
      statusAbsensi = "Terlambat"
      statusDisplay = "terlambat"
    }

    // 8. Catat absensi ke database
    const timestampAbsensi = new Date()
    const newAttendanceRecord = await prisma.catatanAbsensi.create({
      data: {
        karyawanId: karyawan.id,
        timestamp_absensi: timestampAbsensi,
        status: statusAbsensi,
      },
    })

    const responsePayload: AttendanceResponse = {
      success: true,
      message: `Absensi untuk ${karyawan.nama} berhasil dicatat! Status: ${statusAbsensi}`,
      nama: karyawan.nama,
      nip: karyawan.nip,
      timestamp: timestampAbsensi.toISOString(),
      status: statusDisplay,
      catatanId: newAttendanceRecord.id,
    }

    console.log("Next.js API (/api/absensi/tandai) mengirim ke frontend:", responsePayload)
    return NextResponse.json(responsePayload, { status: 200 })
  } catch (error: any) {
    console.error("Error di API /api/absensi/tandai:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server Next.js saat absensi.",
        errorDetail: error.message,
      },
      { status: 500 },
    )
  }
}
