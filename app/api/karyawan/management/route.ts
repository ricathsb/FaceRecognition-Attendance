import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

// Pastikan API route selalu dijalankan secara dinamis, tidak di-cache
export const dynamic = "force-dynamic"
export const revalidate = 0

// Fungsi untuk mendapatkan nama hari dalam bahasa Inggris yang konsisten
function getEnglishDayName(date: dayjs.Dayjs): string {
  // Gunakan getDay() yang mengembalikan angka 0-6 (0=Sunday, 1=Monday, dst)
  const dayNumber = date.day()
  const englishDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const englishDay = englishDays[dayNumber]

  console.log(`🗓️ Date: ${date.format("YYYY-MM-DD")}, Day number: ${dayNumber}, English day: ${englishDay}`)
  return englishDay
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API Management GET - Request received")

    // Ambil parameter bulan dan tahun dari query URL
    const url = new URL(request.url)
    const monthParam = url.searchParams.get("month")
    const yearParam = url.searchParams.get("year")

    console.log("📅 Query params:", { monthParam, yearParam })

    // Default ke bulan dan tahun saat ini jika tidak ada parameter
    const now = dayjs().tz("Asia/Jakarta")
    const selectedMonth = monthParam ? Number.parseInt(monthParam) - 1 : now.month() // 0-based index
    const selectedYear = yearParam ? Number.parseInt(yearParam) : now.year()

    console.log("🔍 API Management - Processing request:", {
      monthParam,
      yearParam,
      selectedMonth: selectedMonth + 1,
      selectedYear,
      currentTime: now.format("YYYY-MM-DD HH:mm:ss"),
    })

    // Test database connection
    try {
      await prisma.$connect()
      console.log("✅ Database connected successfully")
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError)
      return NextResponse.json({ message: "Database connection failed", detail: String(dbError) }, { status: 500 })
    }

    const karyawanList = await prisma.karyawan.findMany({
      select: {
        id: true,
        nama: true,
        nip: true,
        catatanAbsensi: {
          select: {
            timestamp_absensi: true,
            status: true,
          },
        },
      },
    })

    console.log("👥 Found employees:", karyawanList.length)

    const pengaturanAbsensi = await prisma.pengaturanAbsensi.findFirst({
      orderBy: { id: "desc" },
    })

    if (!pengaturanAbsensi) {
      console.log("⚠️ No attendance settings found, creating default")
      // Create default settings if none exist
      const defaultSettings = await prisma.pengaturanAbsensi.create({
        data: {
          waktuMulaiAbsen: "07:00",
          batasTepatWaktu: "09:00",
          batasTerlambat: "14:00",
          hariKerja: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
      })
      console.log("✅ Default settings created:", defaultSettings)
    }

    const finalSettings = pengaturanAbsensi || {
      waktuMulaiAbsen: "07:00",
      batasTepatWaktu: "09:00",
      batasTerlambat: "14:00",
      hariKerja: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    }

    // Ambil data hari libur khusus untuk PostgreSQL
    let hariLibur: any[] = []
    try {
      // Coba gunakan model Prisma jika tersedia
      hariLibur = await prisma.hariLibur.findMany({
        where: {
          tanggal: {
            gte: new Date(selectedYear, selectedMonth, 1),
            lt: new Date(selectedYear, selectedMonth + 1, 1),
          },
        },
      })
    } catch (error) {
      // Fallback ke raw SQL PostgreSQL jika model belum tersedia
      console.log("⚠️ Using raw SQL for holidays (model not available)")
      try {
        const startDate = new Date(selectedYear, selectedMonth, 1)
        const endDate = new Date(selectedYear, selectedMonth + 1, 1)
        hariLibur = (await prisma.$queryRaw`
          SELECT * FROM "HariLibur" 
          WHERE tanggal >= ${startDate} AND tanggal < ${endDate}
        `) as any[]
      } catch (sqlError) {
        console.log("⚠️ Holiday table not available yet")
        hariLibur = []
      }
    }

    console.log("🏖️ Found holiday records:", hariLibur.length)

    const startOfMonth = dayjs(new Date(selectedYear, selectedMonth, 1)).tz("Asia/Jakarta")
    const daysInMonth = startOfMonth.daysInMonth()

    // Pastikan workDays dalam format yang konsisten (bahasa Inggris lowercase)
    const workDays = (
      finalSettings.hariKerja ?? ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    ).map((day) => day.toLowerCase())

    console.log("📊 Processing data:", {
      totalEmployees: karyawanList.length,
      daysInMonth,
      workDays,
      holidayCount: hariLibur.length,
      settingsId: pengaturanAbsensi?.id || "default",
    })

    const hasil = karyawanList.map((karyawan) => {
      // Reset attendance object untuk setiap karyawan
      const attendance: { [tanggal: string]: string } = {}

      console.log(`👤 Processing employee: ${karyawan.nama} (${karyawan.nip})`)
      console.log(`📝 Total attendance records: ${karyawan.catatanAbsensi.length}`)

      // Proses catatan absensi yang ada terlebih dahulu
      karyawan.catatanAbsensi.forEach((absen) => {
        const timestampWIB = dayjs(absen.timestamp_absensi).tz("Asia/Jakarta")
        const absenMonth = timestampWIB.month()
        const absenYear = timestampWIB.year()

        // Hanya proses absensi untuk bulan dan tahun yang dipilih
        if (absenMonth === selectedMonth && absenYear === selectedYear) {
          const tanggal = timestampWIB.format("YYYY-MM-DD")
          const status = absen.status.toLowerCase()

          // Pastikan hanya mengambil record pertama untuk tanggal yang sama
          if (!(tanggal in attendance)) {
            attendance[tanggal] = status
            console.log(`✅ Added attendance: ${tanggal} = ${status}`)
          }
        }
      })

      // Inisialisasi counter
      let hadirCount = 0
      let terlambatCount = 0
      let totalWorkDays = 0
      let absenCount = 0

      // Proses setiap hari dalam bulan yang dipilih
      for (let d = 1; d <= daysInMonth; d++) {
        const date = dayjs(new Date(selectedYear, selectedMonth, d)).tz("Asia/Jakarta")
        const tanggalStr = date.format("YYYY-MM-DD")
        const dayOfWeek = getEnglishDayName(date) // Gunakan fungsi yang reliable

        // Cek apakah hari ini adalah hari libur khusus
        const isHoliday = hariLibur.some((holiday) => dayjs(holiday.tanggal).format("YYYY-MM-DD") === tanggalStr)

        // Cek apakah sudah ada record absensi untuk tanggal ini
        const existingStatus = attendance[tanggalStr]

        console.log(
          `📅 Processing day ${d}: ${tanggalStr} (${dayOfWeek}) - workDays includes: ${workDays.includes(dayOfWeek)}, isHoliday: ${isHoliday}`,
        )

        // Proses berdasarkan jenis hari
        if (isHoliday) {
          // Hari libur khusus - tidak dihitung sebagai hari kerja
          if (!existingStatus) {
            attendance[tanggalStr] = "libur"
          }
          console.log(`🏖️ Holiday: ${tanggalStr} = ${attendance[tanggalStr]}`)
        } else if (dayOfWeek === "sunday") {
          // Minggu - selalu beri status minggu jika belum ada record
          if (!existingStatus) {
            attendance[tanggalStr] = "minggu"
          }
          console.log(`🟣 Sunday: ${tanggalStr} = ${attendance[tanggalStr]}`)
        } else if (workDays.includes(dayOfWeek)) {
          // Hari kerja - hitung sebagai hari kerja
          totalWorkDays++
          console.log(`💼 Work day ${d} (${dayOfWeek}): Total work days so far: ${totalWorkDays}`)

          // Jika belum ada record dan hari sudah lewat, tandai sebagai absen
          const isBeforeToday = date.isBefore(now, "day")

          if (!existingStatus && isBeforeToday) {
            attendance[tanggalStr] = "absen"
            console.log(`❌ Marked as absent: ${tanggalStr}`)
          }

          // Hitung statistik berdasarkan status final
          const finalStatus = attendance[tanggalStr]

          if (finalStatus === "tepat waktu" || finalStatus === "hadir") {
            hadirCount++
            console.log(`✅ Present count: ${hadirCount}`)
          } else if (finalStatus === "terlambat") {
            hadirCount++
            terlambatCount++
            console.log(`⚠️ Late count: ${terlambatCount}, Present count: ${hadirCount}`)
          } else if (finalStatus === "absen") {
            absenCount++
            console.log(`❌ Absent count: ${absenCount}`)
          }
        } else {
          // Hari lain (jika ada pengaturan khusus) - tidak dihitung sebagai hari kerja
          console.log(`⚪ Non-work day: ${tanggalStr} (${dayOfWeek}) - not in workDays: [${workDays.join(", ")}]`)
        }
      }

      // Buat ringkasan dalam format: hadir(terlambat)/total_hari_kerja
      const summary = `${hadirCount}(${terlambatCount})/${totalWorkDays}`

      console.log(`📊 Final stats for ${karyawan.nama}:`, {
        hadirCount,
        terlambatCount,
        absenCount,
        totalWorkDays,
        summary,
        attendanceKeys: Object.keys(attendance).length,
      })

      return {
        id: karyawan.id,
        employeeId: karyawan.id.toString().padStart(6, "0"),
        name: karyawan.nama,
        nip: karyawan.nip,
        attendance,
        summary,
        stats: {
          hadir: hadirCount,
          terlambat: terlambatCount,
          absen: absenCount,
          totalWorkDays: totalWorkDays,
        },
      }
    })

    console.log("🎯 Final result:", {
      totalEmployees: hasil.length,
      timestamp: now.format("YYYY-MM-DD HH:mm:ss"),
    })

    const response = {
      employees: hasil,
      attendanceSettings: finalSettings,
      holidays: hariLibur,
      currentDate: now.format("YYYY-MM-DD"),
      selectedMonth: selectedMonth + 1,
      selectedYear: selectedYear,
      daysInMonth: daysInMonth,
      timestamp: now.format("YYYY-MM-DD HH:mm:ss"),
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("❌ Gagal mengambil data absensi:", error)
    console.error("❌ Error stack:", error.stack)

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat mengambil data.",
        detail: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    console.log("🔄 API Management PUT - Request received")

    const body = await req.json()
    const { checkInStartTime, onTimeBeforeHour, lateBeforeHour, workDays } = body

    console.log("📝 Updating settings:", { checkInStartTime, onTimeBeforeHour, lateBeforeHour, workDays })

    // Pastikan workDays dalam format bahasa Inggris yang konsisten
    const normalizedWorkDays = workDays.map((day: string) => day.toLowerCase())

    const existing = await prisma.pengaturanAbsensi.findFirst()

    if (existing) {
      await prisma.pengaturanAbsensi.update({
        where: { id: existing.id },
        data: {
          waktuMulaiAbsen: checkInStartTime,
          batasTepatWaktu: onTimeBeforeHour,
          batasTerlambat: lateBeforeHour,
          hariKerja: normalizedWorkDays,
        },
      })
      console.log("✅ Settings updated")
    } else {
      await prisma.pengaturanAbsensi.create({
        data: {
          waktuMulaiAbsen: checkInStartTime,
          batasTepatWaktu: onTimeBeforeHour,
          batasTerlambat: lateBeforeHour,
          hariKerja: normalizedWorkDays,
        },
      })
      console.log("✅ Settings created")
    }

    return NextResponse.json({ message: "Pengaturan berhasil disimpan" }, { status: 200 })
  } catch (error: any) {
    console.error("❌ Gagal menyimpan pengaturan absensi:", error)
    return NextResponse.json({ message: "Gagal menyimpan pengaturan", detail: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("🗑️ API Management DELETE - Request received")

    const body = await req.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ message: "employeeId harus disediakan" }, { status: 400 })
    }

    console.log("🗑️ Deleting employee:", employeeId)

    await prisma.catatanAbsensi.deleteMany({
      where: { karyawanId: Number(employeeId) },
    })

    await prisma.karyawan.delete({
      where: { id: Number(employeeId) },
    })

    console.log("✅ Employee deleted successfully")

    return NextResponse.json({ message: "Karyawan berhasil dihapus" })
  } catch (error: any) {
    console.error("❌ Error deleting employee:", error)
    return NextResponse.json({ message: "Gagal menghapus karyawan", detail: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    console.log("🏖️ API Management PATCH - Holiday management request received")

    const body = await req.json()
    const { date, action, keterangan, holidayId } = body

    if (!date || !action) {
      return NextResponse.json({ message: "Date dan action harus disediakan" }, { status: 400 })
    }

    console.log("🏖️ Holiday operation:", { date, action, keterangan, holidayId })

    const targetDate = new Date(date)

    if (action === "add") {
      // Tambah hari libur baru
      if (!keterangan?.trim()) {
        return NextResponse.json({ message: "Keterangan harus disediakan" }, { status: 400 })
      }

      try {
        const existing = (await prisma.$queryRaw`
          SELECT * FROM "HariLibur" WHERE DATE(tanggal) = DATE(${targetDate})
        `) as any[]

        if (existing.length === 0) {
          await prisma.$executeRaw`
            INSERT INTO "HariLibur" (tanggal, keterangan, "createdAt", "updatedAt") 
            VALUES (${targetDate}, ${keterangan.trim()}, ${new Date()}, ${new Date()})
          `
          console.log("✅ Holiday added for date:", date, "with description:", keterangan)
        } else {
          return NextResponse.json({ message: "Hari libur sudah ada untuk tanggal tersebut" }, { status: 400 })
        }
      } catch (error) {
        console.error("❌ Error adding holiday:", error)
        throw error
      }
    } else if (action === "update") {
      // Update hari libur yang sudah ada
      if (!keterangan?.trim()) {
        return NextResponse.json({ message: "Keterangan harus disediakan" }, { status: 400 })
      }

      try {
        if (holidayId) {
          // Update berdasarkan ID
          await prisma.$executeRaw`
            UPDATE "HariLibur" 
            SET tanggal = ${targetDate}, keterangan = ${keterangan.trim()}, "updatedAt" = ${new Date()}
            WHERE id = ${holidayId}
          `
        } else {
          // Update berdasarkan tanggal
          await prisma.$executeRaw`
            UPDATE "HariLibur" 
            SET keterangan = ${keterangan.trim()}, "updatedAt" = ${new Date()}
            WHERE DATE(tanggal) = DATE(${targetDate})
          `
        }
        console.log("✅ Holiday updated for date:", date, "with description:", keterangan)
      } catch (error) {
        console.error("❌ Error updating holiday:", error)
        throw error
      }
    } else if (action === "remove") {
      // Hapus hari libur
      try {
        if (holidayId) {
          // Hapus berdasarkan ID
          await prisma.$executeRaw`
            DELETE FROM "HariLibur" WHERE id = ${holidayId}
          `
        } else {
          // Hapus berdasarkan tanggal
          await prisma.$executeRaw`
            DELETE FROM "HariLibur" WHERE DATE(tanggal) = DATE(${targetDate})
          `
        }
        console.log("✅ Holiday removed for date:", date)
      } catch (error) {
        console.error("❌ Error removing holiday:", error)
        throw error
      }
    } else {
      return NextResponse.json({ message: "Action tidak valid" }, { status: 400 })
    }

    return NextResponse.json({ message: "Hari libur berhasil diperbarui" })
  } catch (error: any) {
    console.error("❌ Error managing holiday:", error)
    return NextResponse.json({ message: "Gagal mengubah hari libur", detail: error.message }, { status: 500 })
  }
}
