import { createClient } from '@/lib/supabase/server'
import CardAgendamento from '@/components/dashboard/CardAgendamento'
import NavegacaoDia from '@/components/dashboard/NavegacaoDia'
import AgendaClientWrapper from '@/components/dashboard/AgendaClientWrapper'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import type { AgendamentoDia } from '@/types/database'

interface Props {
  searchParams: Promise<{ data?: string }>
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function formatarDataExibicao(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function calcularTotais(agendamentos: AgendamentoDia[]) {
  const ativos  = agendamentos.filter(a => !['cancelado', 'no_show'].includes(a.status))
  const receita = agendamentos
    .filter(a => a.status === 'concluido')
    .reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  return { total: ativos.length, receita }
}

export default async function AgendaPage({ searchParams }: Props) {
  const params  = await searchParams
  const data    = params.data ?? hoje()
  const usuario = await getUsuarioComEmpresa()

  const supabase = await createClient()

  const [{ data: raw }, { data: barbeiros }, { data: servicos }, { data: horarios }] = await Promise.all([
    supabase
      .from('vw_agenda_dia')
      .select('*')
      .eq('empresa_id', usuario?.empresa_id)
      .gte('data_hora_inicio', `${data}T00:00:00+00:00`)
      .lte('data_hora_inicio', `${data}T23:59:59+00:00`),
    supabase
      .from('barbeiros')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('servicos')
      .select('id, nome, duracao_minutos, preco')
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('horarios_funcionamento')
      .select('dia_semana')
      .is('barbeiro_id', null)
      .eq('ativo', true),
  ])

  const diasAtivos = (horarios ?? []).map((h: any) => Number(h.dia_semana))

  const lista = ((raw ?? []) as AgendamentoDia[]).sort((a, b) =>
    new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime()
  )

  const totais  = calcularTotais(lista)
  const receita = totais.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const pendentes   = lista.filter(a => a.status === 'pendente')
  const confirmados = lista.filter(a => a.status === 'confirmado')
  const andamento   = lista.filter(a => a.status === 'em_andamento')
  const concluidos  = lista.filter(a => a.status === 'concluido')
  const cancelados  = lista.filter(a => ['cancelado', 'no_show'].includes(a.status))

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-xl font-bold">Agenda</h1>
        <p className="text-zinc-400 text-sm capitalize">{formatarDataExibicao(data)}</p>
      </div>

      <NavegacaoDia dataAtual={data} />

      <AgendaClientWrapper
        empresaId={usuario?.empresa_id ?? ''}
        barbeiros={barbeiros ?? []}
        servicos={servicos ?? []}
        diasAtivos={diasAtivos}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs">Agendamentos</p>
          <p className="text-white text-2xl font-bold mt-1">{totais.total}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs">Receita do dia</p>
          <p className="text-amber-400 text-xl font-bold mt-1">{receita}</p>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">Nenhum agendamento para este dia.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {andamento.length > 0  && <Grupo titulo="Em andamento"        items={andamento} />}
          {pendentes.length > 0  && <Grupo titulo="Pendentes"           items={pendentes} />}
          {confirmados.length > 0 && <Grupo titulo="Confirmados"        items={confirmados} />}
          {concluidos.length > 0 && <Grupo titulo="Concluídos"          items={concluidos} />}
          {cancelados.length > 0 && <Grupo titulo="Cancelados / No-show" items={cancelados} />}
        </div>
      )}
    </div>
  )
}

function Grupo({ titulo, items }: { titulo: string; items: AgendamentoDia[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-zinc-500 text-xs font-medium uppercase tracking-wide px-1">
        {titulo} <span className="text-zinc-600">({items.length})</span>
      </h2>
      {items.map(ag => (
        <CardAgendamento key={ag.id} agendamento={ag as any} />
      ))}
    </div>
  )
}
