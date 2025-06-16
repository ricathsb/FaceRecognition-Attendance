import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        // Test database connection
        const testConnection = await prisma.$queryRaw`SELECT 1 as test`

        // Test if we can query the Karyawan table
        const karyawanCount = await prisma.karyawan.count()

        // Test Flask connection
        let flaskStatus = "disconnected"
        let flaskError = null
        try {
            const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
            const flaskResponse = await fetch(`${BASE_URL}/Health`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
            flaskStatus = flaskResponse.ok ? "connected" : "error"
        } catch (e: any) {
            flaskStatus = "disconnected"
            flaskError = e.message
        }

        return NextResponse.json({
            status: "ok",
            database: {
                status: "connected",
                karyawanCount: karyawanCount,
                testQuery: testConnection,
            },
            flask: {
                status: flaskStatus,
                error: flaskError,
            },
            env: {
                DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
                FLASK_BACKEND_URL: process.env.FLASK_BACKEND_URL || "not set",
                NODE_ENV: process.env.NODE_ENV,
            },
        })
    } catch (error: any) {
        console.error("Debug API error:", error)
        return NextResponse.json(
            {
                status: "error",
                error: error.message,
                database: "disconnected",
                errorCode: error.code,
                errorMeta: error.meta,
            },
            { status: 500 },
        )
    }
}
