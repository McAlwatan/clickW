"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "light") {
      setIsDark(false)
      document.documentElement.classList.remove("dark")
    } else {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      setIsDark(false)
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      setIsDark(true)
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="border-gray-700 text-gray-300 hover:bg-gray-800"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
