/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#070e1b',
          navy: '#0b1326',
          panel: '#0f172a',
          surface: '#171f33',
          card: '#131b2e',
          elevated: '#1e293b',
          border: '#1e293b',
          borderLight: '#334155',
        },
        primary: {
          DEFAULT: '#06b6d4',
          hover: '#0891b2',
          glow: 'rgba(6, 182, 212, 0.25)',
          dark: '#004759',
          light: '#e0f2fe',
        },
        secondary: {
          DEFAULT: '#0d9488',
          hover: '#0f766e',
          glow: 'rgba(13, 148, 136, 0.25)',
        },
        ctas: {
          1: '#ef4444', // Resuscitation (Emergency Red)
          2: '#f97316', // Emergent (Deep Orange)
          3: '#f59e0b', // Urgent (Amber)
          4: '#10b981', // Less Urgent (Emerald)
          5: '#64748b', // Non-Urgent (Slate)
        }
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'Hanken Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
