import type { ReactNode } from "react"
import AuthGuard from "@/components/auth-guard"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <AuthGuard requiredRole="admin">
            <SidebarProvider>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    )
}
