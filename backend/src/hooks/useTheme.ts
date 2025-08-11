import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('lotus-theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const updateResolvedTheme = () => {
      let newResolvedTheme: 'light' | 'dark'
      
      if (theme === 'system') {
        newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        newResolvedTheme = theme
      }
      
      setResolvedTheme(newResolvedTheme)
      
      // Update document class
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newResolvedTheme)
      
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newResolvedTheme === 'dark' ? '#1a1a1a' : '#ffffff')
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setThemeAndSave = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('lotus-theme', newTheme)
  }

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeAndSave,
    isDark: resolvedTheme === 'dark'
  }
}