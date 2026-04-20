'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const NAV = [
  { href: '/agenda',       label: 'Agenda',    icon: '📅' },
  { href: '/barbeiros',    label: 'Barbeiros',  icon: '✂️' },
  { href: '/servicos',     label: 'Serviços',   icon: '💈' },
  { href: '/horarios',     label: 'Horários',   icon: '🕐' },
  { href: '/clientes',     label: 'Clientes',   icon: '👥' },
  { href: '/configuracoes',label: 'Config.',    icon: '⚙️' },
]

interface Props {
  nomeEmpresa: string
  nomeUsuario: string
}

export default function Sidebar({ nomeEmpresa, nomeUsuario }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-zinc-900 border-r border-zinc-800 fixed left-0 top-0">
        {/* Logo / empresa */}
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-sm">
                {nomeEmpresa.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{nomeEmpresa}</p>
              <p className="text-zinc-500 text-xs truncate">{nomeUsuario}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
              ].join(' ')}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-800">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                         text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <span>🚪</span> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── Bottom nav mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="flex">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'text-amber-400'
                  : 'text-zinc-500',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
