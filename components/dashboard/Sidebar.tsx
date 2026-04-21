'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

function IconAgenda() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconBarbeiros() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
      <path d="M6 9c0 3.314 2.686 6 6 6s6-2.686 6-6"/><line x1="12" y1="15" x2="12" y2="21"/>
    </svg>
  )
}

function IconServicos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

function IconHorarios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconClientes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconRelatorios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function IconConfiguracoes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
    </svg>
  )
}

function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

const NAV = [
  { href: '/agenda',        label: 'Agenda',    Icon: IconAgenda },
  { href: '/barbeiros',     label: 'Barbeiros', Icon: IconBarbeiros },
  { href: '/servicos',      label: 'Serviços',  Icon: IconServicos },
  { href: '/horarios',      label: 'Horários',  Icon: IconHorarios },
  { href: '/clientes',      label: 'Clientes',   Icon: IconClientes },
  { href: '/relatorios',    label: 'Relatórios', Icon: IconRelatorios },
  { href: '/configuracoes', label: 'Config.',    Icon: IconConfiguracoes },
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
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-zinc-900/95 backdrop-blur-sm border-r border-zinc-800/80 fixed left-0 top-0">
        {/* Logo / empresa */}
        <div className="px-4 py-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
              <span className="text-black font-black text-sm">
                {nomeEmpresa.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate leading-tight">{nomeEmpresa}</p>
              <p className="text-zinc-500 text-xs truncate">{nomeUsuario}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const ativo = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                  ativo
                    ? 'bg-amber-500/10 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
                ].join(' ')}
              >
                {ativo && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full" />
                )}
                <Icon />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-800/80">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                         text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-all duration-200"
            >
              <IconSair /> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── Bottom nav mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/80 z-50">
        <div className="flex">
          {NAV.map(({ href, label, Icon }) => {
            const ativo = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-all duration-200 relative',
                  ativo ? 'text-amber-400' : 'text-zinc-500',
                ].join(' ')}
              >
                {ativo && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 rounded-b-full" />
                )}
                <Icon />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
