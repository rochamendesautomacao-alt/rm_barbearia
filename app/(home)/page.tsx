import Link from 'next/link'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function dataFormatada() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const CARDS = [
  {
    href: '/agenda',
    label: 'Agenda',
    descricao: 'Agendamentos do dia',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/agenda?filtro=pendentes',
    label: 'Pendentes',
    descricao: 'Aprovações aguardando',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    href: '/barbeiros',
    label: 'Barbeiros',
    descricao: 'Gerencie sua equipe',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
        <path d="M6 9c0 3.314 2.686 6 6 6s6-2.686 6-6"/>
        <line x1="12" y1="15" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    href: '/servicos',
    label: 'Serviços',
    descricao: 'Cortes e tratamentos',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
  {
    href: '/horarios',
    label: 'Horários',
    descricao: 'Funcionamento e folgas',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: '/clientes',
    label: 'Clientes',
    descricao: 'Histórico e cadastros',
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/relatorios',
    label: 'Relatórios',
    descricao: 'Faturamento e métricas',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    descricao: 'Plano e preferências',
    iconBg: 'bg-zinc-700/60',
    iconColor: 'text-zinc-300',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default async function DashboardHome() {
  const usuario  = await getUsuarioComEmpresa()
  const supabase = await createClient()

  const dataHoje  = hoje()
  const inicioHoje = `${dataHoje}T00:00:00`
  const fimHoje    = `${dataHoje}T23:59:59`

  const { data: agendamentosHoje } = await supabase
    .from('vw_agenda_dia')
    .select('status')
    .eq('empresa_id', (usuario as any)?.empresa_id)
    .gte('data_hora_inicio', inicioHoje)
    .lte('data_hora_inicio', fimHoje)
    .not('status', 'in', '(cancelado,no_show)')

  const totalHoje     = agendamentosHoje?.length ?? 0
  const pendentesHoje = agendamentosHoje?.filter((a: any) => a.status === 'pendente').length ?? 0

  const nomeEmpresa = (usuario as any)?.empresas?.nome ?? 'Minha Barbearia'
  const nomeUsuario = (usuario as any)?.nome ?? ''
  const inicial     = nomeEmpresa.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
          <span className="text-black font-black text-lg">{inicial}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-white text-2xl font-black tracking-tight truncate">{nomeEmpresa}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {saudacao()}, <span className="text-amber-400 font-semibold">{nomeUsuario}</span>
          </p>
          <p className="text-zinc-600 text-xs mt-0.5 capitalize">{capitalize(dataFormatada())}</p>
        </div>
      </div>

      {/* ── Card destaque: Agenda de Hoje ── */}
      <Link
        href="/agenda"
        className="block bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-zinc-900/80
                   border border-amber-500/20 rounded-2xl p-5
                   hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10
                   transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-semibold mb-1">Hoje</p>
            <p className="text-white text-3xl font-black leading-none">
              {totalHoje}
              <span className="text-zinc-500 text-base font-medium ml-2">
                {totalHoje === 1 ? 'agendamento' : 'agendamentos'}
              </span>
            </p>
            {pendentesHoje > 0 && (
              <p className="text-rose-400 text-sm font-medium mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" />
                {pendentesHoje} {pendentesHoje === 1 ? 'pendente' : 'pendentes'}
              </p>
            )}
            {pendentesHoje === 0 && totalHoje > 0 && (
              <p className="text-green-400 text-sm font-medium mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Tudo em dia
              </p>
            )}
            {totalHoje === 0 && (
              <p className="text-zinc-500 text-sm mt-2">Nenhum agendamento hoje</p>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center
                          group-hover:bg-amber-500/20 transition-colors duration-200 shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
      </Link>

      {/* ── Grid de cards de navegação ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">Painel</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CARDS.map(({ href, label, descricao, iconBg, iconColor, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4
                         hover:border-zinc-700 hover:bg-zinc-800/50
                         hover:shadow-lg hover:shadow-black/20
                         transition-all duration-200 group flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                  <span className={iconColor}>{icon}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                     className="text-zinc-600 group-hover:text-zinc-400 transition-colors duration-200 mt-1">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">{label}</p>
                <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{descricao}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
