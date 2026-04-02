import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00B4C6',
          dark: '#007A87',
          light: '#E0F7FA',
        },
        ink: {
          DEFAULT: '#0D1B1E',
          mid: '#3A4F52',
          light: '#8AA0A3',
        },
        cream: '#F7F5F0',
      },
      fontFamily: {
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        pill: '100px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
