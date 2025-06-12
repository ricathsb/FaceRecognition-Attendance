// Script TypeScript untuk memastikan Saturday termasuk hari kerja
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function ensureSaturdayWorkday(): Promise<void> {
    try {
        console.log("🔧 Ensuring Saturday is included in work days...")

        // Ambil pengaturan yang ada
        const settings = await prisma.pengaturanAbsensi.findFirst({
            orderBy: { id: "desc" },
        })

        if (!settings) {
            // Buat pengaturan baru dengan Saturday
            const newSettings = await prisma.pengaturanAbsensi.create({
                data: {
                    waktuMulaiAbsen: "07:00",
                    batasTepatWaktu: "09:00",
                    batasTerlambat: "14:00",
                    hariKerja: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
                },
            })
            console.log("✅ Created new settings with Saturday included:", newSettings.hariKerja)
        } else {
            // Update jika Saturday belum ada
            const currentWorkDays = settings.hariKerja.map((day: string) => day.toLowerCase())
            const shouldIncludeSaturday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

            if (!currentWorkDays.includes("saturday")) {
                await prisma.pengaturanAbsensi.update({
                    where: { id: settings.id },
                    data: { hariKerja: shouldIncludeSaturday },
                })
                console.log("✅ Updated settings to include Saturday")
                console.log("   Old:", currentWorkDays)
                console.log("   New:", shouldIncludeSaturday)
            } else {
                console.log("✅ Saturday already included in work days:", currentWorkDays)
            }
        }

        // Tampilkan status final
        const finalSettings = await prisma.pengaturanAbsensi.findFirst({
            orderBy: { id: "desc" },
        })

        console.log("\n📋 Final work days configuration:")
        console.log("   Work days:", finalSettings?.hariKerja)
        console.log("   Work schedule: Monday to Saturday")
        console.log("   Weekend: Sunday only")
    } catch (error) {
        console.error("❌ Error ensuring Saturday workday:", error)
    } finally {
        await prisma.$disconnect()
    }
}

ensureSaturdayWorkday()
