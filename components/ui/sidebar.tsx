"use client"

import type React from "react"
import { useState, useCallback, forwardRef, createContext, useContext } from "react"
import { cn } from "@/lib/utils"

interface SidebarContextProps {
    isOpen: boolean
    toggleOpen: () => void
    close: () => void
}

const SidebarContext = createContext<SidebarContextProps>({
    isOpen: false,
    toggleOpen: () => { },
    close: () => { },
})

export const useSidebar = () => useContext(SidebarContext)

interface SidebarProviderProps {
    children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleOpen = useCallback(() => {
        setIsOpen((open) => !open)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
    }, [])

    return <SidebarContext.Provider value={{ isOpen, toggleOpen, close }}>{children}</SidebarContext.Provider>
}

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

export const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(({ className, ...props }, ref) => {
    const { toggleOpen } = useSidebar()

    return (
        <button
            ref={ref}
            onClick={toggleOpen}
            className={cn(
                "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50",
                className,
            )}
            {...props}
        >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="sr-only">Toggle sidebar</span>
        </button>
    )
})
SidebarTrigger.displayName = "SidebarTrigger"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "inset"
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ className, variant = "default", ...props }, ref) => {
    const { isOpen, close } = useSidebar()

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={close} />}

            {/* Sidebar */}
            <div
                ref={ref}
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    variant === "inset" && "lg:rounded-lg lg:border lg:m-2",
                    className,
                )}
                {...props}
            />
        </>
    )
})
Sidebar.displayName = "Sidebar"

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700",
                className,
            )}
            {...props}
        />
    )
})
SidebarHeader.displayName = "SidebarHeader"

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex-1 overflow-y-auto py-2", className)} {...props} />
})
SidebarContent.displayName = "SidebarContent"

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-between h-16 px-4 border-t border-gray-200 dark:border-gray-700",
                className,
            )}
            {...props}
        />
    )
})
SidebarFooter.displayName = "SidebarFooter"

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("space-y-1 px-2", className)} {...props} />
})
SidebarGroup.displayName = "SidebarGroup"

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarGroupLabel = forwardRef<HTMLDivElement, SidebarGroupLabelProps>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400", className)}
            {...props}
        />
    )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarGroupContent = forwardRef<HTMLDivElement, SidebarGroupContentProps>(
    ({ className, ...props }, ref) => {
        return <div ref={ref} className={cn("space-y-1", className)} {...props} />
    },
)
SidebarGroupContent.displayName = "SidebarGroupContent"

interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarMenu = forwardRef<HTMLDivElement, SidebarMenuProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("space-y-1", className)} {...props} />
})
SidebarMenu.displayName = "SidebarMenu"

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarMenuItem = forwardRef<HTMLDivElement, SidebarMenuItemProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />
})
SidebarMenuItem.displayName = "SidebarMenuItem"

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isActive?: boolean
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
    ({ className, isActive, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive
                        ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-900 dark:hover:bg-blue-800"
                        : "text-gray-900 dark:text-gray-100",
                    className,
                )}
                {...props}
            />
        )
    },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

interface SidebarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> { }

export const SidebarSeparator = forwardRef<HTMLDivElement, SidebarSeparatorProps>(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("h-px bg-gray-200 dark:bg-gray-700 my-2 mx-2", className)} {...props} />
})
SidebarSeparator.displayName = "SidebarSeparator"
