import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title:       { default: 'RM Barbearia', template: '%s | RM Barbearia' },
  description: 'Sistema de agendamento para barbearias',
  robots:      { index: false, follow: false }, // SaaS — não indexar dashboard
}

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,      // evita zoom acidental em inputs no iOS
  themeColor:         '#09090b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-white antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <Toaster position="top-center" richColors theme="dark" closeButton />
        {children}
      </body>
    </html>
  )
}
