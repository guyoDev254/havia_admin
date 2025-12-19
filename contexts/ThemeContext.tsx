'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('admin_theme') as Theme | null
      if (savedTheme) {
        setThemeState(savedTheme)
      }
    }
  }, [])

  useEffect(() => {
    updateDarkMode()

    // Listen for system theme changes when in 'auto' mode
    if (theme === 'auto' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        const prefersDark = e.matches
        setIsDark(prefersDark)
        document.documentElement.classList.toggle('dark', prefersDark)
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        const legacyHandler = (e: MediaQueryList) => {
          const prefersDark = e.matches
          setIsDark(prefersDark)
          document.documentElement.classList.toggle('dark', prefersDark)
        }
        mediaQuery.addListener(legacyHandler)
        return () => mediaQuery.removeListener(legacyHandler)
      }
    }
  }, [theme])

  const updateDarkMode = () => {
    if (typeof window === 'undefined') return

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      const dark = theme === 'dark'
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_theme', newTheme)
    }
    updateDarkMode()
  }

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

