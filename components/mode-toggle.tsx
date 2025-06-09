"use client"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            className="h-12 w-12 rounded-full bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:border-emerald-300 dark:hover:border-gray-500"
          >
            <Sun className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-emerald-600 dark:text-emerald-400" />
            <Moon className="absolute h-[1.4rem] w-[1.4rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-emerald-600 dark:text-emerald-400" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="mb-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 shadow-xl"
        >
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
          >
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
