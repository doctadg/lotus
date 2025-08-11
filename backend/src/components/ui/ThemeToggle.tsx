'use client'

import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' }
  ]

  return (
    <div className="theme-toggle relative">
      <div className="flex items-center bg-surface-elevated border border-border rounded-lg p-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
              ${theme === value 
                ? 'bg-accent-primary text-white shadow-md' 
                : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
              }
            `}
            title={label}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}