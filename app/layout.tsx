import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import "./globals.css"

export const metadata: Metadata = {
  title: "Aplikasi Manajemen - MAS Al Ittihadiyah Medan",
  description: "Sistem manajemen absensi digital untuk Madrasah Aliyah Swasta Al Ittihadiyah Medan",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <ModeToggle />
        </ThemeProvider>
      </body>
    </html>
  )
}
