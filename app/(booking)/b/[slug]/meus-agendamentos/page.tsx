import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTenantPorSlug } from '@/lib/tenant'
import { getClienteAutenticado, getAgendamentosCliente } from '@/app/actions/clientes'
import { logoutClienteB } from '@/app/actions/booking-publico'
import BotoesAgendamentoCliente from '@/components/agendamento/BotoesAgendamentoCliente'

interface Props {
  params: Promise<{ slug: string }>
}

const STATUS_LABEL: Record<string, string> = {
  pendente:     'Pendente',
  confirmado:   'Confirmado',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
  no_show:      'Não compareceu',
}

const STATUS_COR: Record<string, string> = {
  pendente:     'bg-yellow-900/40 text-yellow-400',
  confirmado:   'bg-blue-900/40 text-blue-400',
  em_andamento: 'bg-amber-900/40 text-amber-400',
  concluido:    'bg-green-900/40 text-green-400',
  cancelado:    'bg-red-900/40 text-red-400',
  no_show:      'bg-zinc-800 text-zinc-500',
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export default async function MeusAgendamentosBPage({ params }: Props) {
  const { slug } = await params
  const base     = `/b/${slug}`
  const empresa  = await getTenantPorSlug(slug)
  if (!empresa) notFound()

  const cliente = await getClienteAutenticado(empresa.id)
  if (!cliente) redirect(`${base}/entrar`)

  const agendamentos = await getAgendamentosCliente(cliente.id)
  const futuros      = agendamentos.filter(a => !['cancelado', 'no_show', 'concluido'].includes(a.status))
  const historico    = agendamentos.filter(a => ['cancelado', 'no_show', 'concluido'].includes(a.status))

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {empresa.logo_url ? (
              <img src={empresa.logo_url} alt={empresa.nome} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-black font-bold text-lg">{empresa.nome.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <h1 className="text-white font-semibold text-base leading-tight">{empresa.nome}</h1>
              <p className="text-zinc-400 text-xs">{cliente.nome}</p>
            </div>
          </div>
          <form action={logoutClienteB.bind(null, slug)}>
            <button type="submit" className="text-zinc-500 hover:text-red-400 text-xs transition-colors">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">Meus agendamentos</h2>
          <Link
            href={`${base}/agendar`}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black
                       font-semibold rounded-xl text-sm transition-colors"
          >
            + Novo
          </Link>
        </div>

        {futuros.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-zinc-500 text-xs font-medium uppercase tracking-wide">
              Próximos ({futuros.length})
            </h3>
            {futuros.map(a => (
              <CardAgendamento key={a.id} agendamento={a} slug={slug} base={base} isFuturo />
            ))}
          </div>
        )}

        {futuros.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-zinc-500 text-sm">Você não tem agendamentos futuros.</p>
            <Link
              href={`${base}/agendar`}
              className="inline-block mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400
                         text-black font-semibold rounded-xl text-sm transition-colors"
            >
              Agendar agora
            </Link>
          </div>
        )}

        {historico.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-zinc-500 text-xs font-medium uppercase tracking-wide">
              Histórico ({historico.length})
            </h3>
            {historico.map(a => (
              <CardAgendamento key={a.id} agendamento={a} slug={slug} base={base} isFuturo={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function CardAgendamento({
  agendamento: a, slug, base, isFuturo,
}: { agendamento: any; slug: string; base: string; isFuturo: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-medium text-sm">{a.servicos?.nome ?? '—'}</p>
          <p className="text-zinc-400 text-xs">{a.barbeiros?.nome ?? '—'}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${STATUS_COR[a.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
          {STATUS_LABEL[a.status] ?? a.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-xs capitalize">{formatarDataHora(a.data_hora_inicio)}</p>
        {a.preco_cobrado != null && (
          <p className="text-amber-400 text-sm font-semibold">
            {Number(a.preco_cobrado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        )}
      </div>
      {isFuturo && (
        <BotoesAgendamentoCliente
          agendamentoId={a.id}
          status={a.status}
          slug={slug}
          basePath={base}
        />
      )}
    </div>
  )
}
