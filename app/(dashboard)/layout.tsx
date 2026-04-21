import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUsuarioComEmpresa } from '@/app/actions/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const u = await getUsuarioComEmpresa()
  if (!u) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Barra de topo com retorno ao dashboard */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/80">
        <div className="px-4 h-12 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-amber-400 transition-colors duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="pb-6">
        {children}
      </main>
    </div>
  )
}
