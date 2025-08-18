/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem", 
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Mobile-first approach
      'mobile': {'max': '767px'},
      'tablet': {'min': '768px', 'max': '1023px'},
      'desktop': {'min': '1024px'},
      // Touch device optimization
      'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Enhanced color palette for premium design
        glass: {
          base: "rgba(255, 255, 255, 0.05)",
          elevated: "rgba(255, 255, 255, 0.1)",
          hover: "rgba(255, 255, 255, 0.15)",
        },
        surface: {
          primary: "#000000",
          secondary: "#0f0f0f",
          elevated: "#1a1a1a",
          hover: "#2a2a2a",
        },
        text: {
          primary: "#ffffff",
          secondary: "rgba(255, 255, 255, 0.9)",
          tertiary: "rgba(255, 255, 255, 0.7)",
          muted: "rgba(255, 255, 255, 0.5)",
          faded: "rgba(255, 255, 255, 0.35)",
        }
      },
      // Mobile-optimized spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Professional typography system
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol'
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Menlo',
          'Consolas',
          'monospace'
        ],
      },
      fontSize: {
        // Professional text scale following ChatGPT standards
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.65', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.55', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.45', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '1.75',
        prose: '1.65',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.65',
            fontSize: '1rem',
            
            // Headings with professional hierarchy
            'h1': {
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: '600',
              fontSize: '1.5em',
              lineHeight: '1.4',
              marginTop: '0',
              marginBottom: '0.75em',
              letterSpacing: '-0.025em',
            },
            'h2': {
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: '600',
              fontSize: '1.25em',
              lineHeight: '1.45',
              marginTop: '1.5em',
              marginBottom: '0.75em',
              letterSpacing: '-0.02em',
            },
            'h3': {
              color: 'rgba(255, 255, 255, 0.92)',
              fontWeight: '600',
              fontSize: '1.125em',
              lineHeight: '1.5',
              marginTop: '1.25em',
              marginBottom: '0.5em',
              letterSpacing: '-0.01em',
            },
            'h4, h5, h6': {
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '600',
              marginTop: '1em',
              marginBottom: '0.5em',
            },
            
            // Paragraphs with optimal spacing
            'p': {
              color: 'rgba(255, 255, 255, 0.9)',
              marginTop: '0',
              marginBottom: '1em',
              lineHeight: '1.65',
            },
            
            // Professional list styling
            'ul, ol': {
              paddingLeft: '1.25em',
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            'li': {
              color: 'rgba(255, 255, 255, 0.9)',
              marginTop: '0.25em',
              marginBottom: '0.25em',
              lineHeight: '1.6',
            },
            'li > p': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            
            // Enhanced emphasis and strong
            'strong': {
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: '600',
            },
            'em': {
              color: 'rgba(255, 255, 255, 0.92)',
              fontStyle: 'italic',
            },
            
            // Professional blockquotes
            'blockquote': {
              color: 'rgba(255, 255, 255, 0.8)',
              borderLeftColor: 'rgba(59, 130, 246, 0.5)',
              borderLeftWidth: '0.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              paddingLeft: '1em',
              paddingTop: '0.5em',
              paddingBottom: '0.5em',
              marginLeft: '0',
              marginRight: '0',
              fontStyle: 'normal',
              borderRadius: '0.375rem',
            },
            'blockquote p:first-of-type::before': {
              content: 'none',
            },
            'blockquote p:last-of-type::after': {
              content: 'none',
            },
            
            // Inline code styling
            'code': {
              color: 'rgba(255, 255, 255, 0.95)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
              fontWeight: '500',
              fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            
            // Pre and code blocks
            'pre': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.9)',
              overflow: 'auto',
              fontSize: '0.875em',
              lineHeight: '1.5',
              marginTop: '1em',
              marginBottom: '1em',
              borderRadius: '0.5rem',
              padding: '1rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
              borderRadius: '0',
              fontWeight: 'inherit',
            },
            
            // Professional links
            'a': {
              color: 'rgba(59, 130, 246, 0.9)',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.15s ease-in-out',
            },
            'a:hover': {
              color: 'rgba(59, 130, 246, 1)',
              textDecoration: 'underline',
            },
            
            // HR styling
            'hr': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderTopWidth: '1px',
              marginTop: '2em',
              marginBottom: '2em',
            },
            
            // Table styling
            'table': {
              fontSize: '0.875em',
              lineHeight: '1.5',
            },
            'thead': {
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: '600',
              borderBottomColor: 'rgba(255, 255, 255, 0.2)',
            },
            'tbody tr': {
              borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            },
            'td, th': {
              padding: '0.5em 0.75em',
            },
          },
        },
        sm: {
          css: {
            fontSize: '0.875rem',
            lineHeight: '1.6',
            h1: { fontSize: '1.375em' },
            h2: { fontSize: '1.25em' },
            h3: { fontSize: '1.125em' },
            'ul, ol': { paddingLeft: '1.125em' },
            li: { marginTop: '0.2em', marginBottom: '0.2em' },
            p: { marginBottom: '0.875em' },
            pre: { fontSize: '0.8125em' },
            code: { fontSize: '0.8125em' },
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" },
        },
        shine: {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" },
        },
        moveRight: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100vw)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { "box-shadow": "0 0 20px -10px rgba(59, 130, 246, 0.5)" },
          "100%": { "box-shadow": "0 0 20px -10px rgba(59, 130, 246, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 3s ease-in-out infinite",
        shine: "shine 3s ease-in-out infinite",
        moveRight: "moveRight 3s linear infinite",
        fadeIn: "fadeIn 0.3s ease-out",
        slideUp: "slideUp 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
}