// Script untuk menambahkan data hari libur contoh setelah schema di-push manual
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type HolidayData = {
    tanggal: Date
    keterangan: string
}

async function addSampleHolidays(): Promise<void> {
    try {
        console.log("🏖️ Adding sample holidays to PostgreSQL database...")

        // Contoh data hari libur
        const currentYear = new Date().getFullYear()
        const sampleHolidays: HolidayData[] = [
            { tanggal: new Date(`${currentYear}-01-01`), keterangan: "Tahun Baru" },
            { tanggal: new Date(`${currentYear}-08-17`), keterangan: "Hari Kemerdekaan" },
            { tanggal: new Date(`${currentYear}-12-25`), keterangan: "Hari Natal" },
            { tanggal: new Date(`${currentYear}-05-01`), keterangan: "Hari Buruh" },
        ]

        console.log("📅 Processing holidays...")

        // Cek dan tambah hari libur contoh
        for (const holiday of sampleHolidays) {
            try {
                // Cek apakah sudah ada menggunakan raw SQL PostgreSQL
                const existing = (await prisma.$queryRaw`
          SELECT * FROM "HariLibur" WHERE DATE(tanggal) = DATE(${holiday.tanggal})
        `) as any[]

                if (existing.length === 0) {
                    await prisma.$executeRaw`
            INSERT INTO "HariLibur" (tanggal, keterangan, "createdAt", "updatedAt") 
            VALUES (${holiday.tanggal}, ${holiday.keterangan}, ${new Date()}, ${new Date()})
          `
                    console.log(`✅ Added holiday: ${holiday.keterangan} (${holiday.tanggal.toDateString()})`)
                } else {
                    console.log(`⚠️ Holiday already exists: ${holiday.keterangan}`)
                }
            } catch (error) {
                console.log(`⚠️ Failed to add holiday ${holiday.keterangan}:`, error)
            }
        }

        // Test query untuk memastikan tabel berfungsi
        console.log("🧪 Testing holiday table...")
        const holidays = (await prisma.$queryRaw`SELECT * FROM "HariLibur" LIMIT 5`) as any[]
        console.log(`✅ Found ${holidays.length} holidays in database`)

        // Test menggunakan Prisma model jika sudah tersedia
        try {
            const holidaysWithModel = await prisma.hariLibur.findMany({
                take: 3,
            })
            console.log(`✅ Prisma model working! Found ${holidaysWithModel.length} holidays using model`)
        } catch (error) {
            console.log("⚠️ Prisma model not ready yet, but raw SQL works")
        }

        console.log("🎉 Sample holidays added successfully!")
        console.log("\n📋 Next steps:")
        console.log("1. Restart your development server if needed")
        console.log("2. Test the holiday feature by clicking on date headers")
        console.log("3. Holidays will appear with orange background and 'L' status")
    } catch (error) {
        console.error("❌ Error adding sample holidays:", error)
        console.log("\n🔧 If you see table errors, make sure you ran:")
        console.log("1. npx prisma generate")
        console.log("2. npx prisma db push")
    } finally {
        await prisma.$disconnect()
    }
}

addSampleHolidays()
