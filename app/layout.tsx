import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['200', '300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | H2 Revive',
    default: 'H2 Revive — Hydrogen Inhalation Technology',
  },
  description:
    "The UK's dedicated hydrogen inhalation wellness brand. Research-backed molecular hydrogen technology for energy, recovery, and longevity.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${dmSans.variable} ${dmMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
