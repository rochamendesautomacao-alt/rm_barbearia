import { createClient } from '@/lib/supabase/server'
import CardAgendamento from '@/components/dashboard/CardAgendamento'
import NavegacaoDia from '@/components/dashboard/NavegacaoDia'
import AgendaClientWrapper from '@/components/dashboard/AgendaClientWrapper'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import type { AgendamentoDia } from '@/types/database'

interface Props {
  searchParams: Promise<{ data?: string; filtro?: string }>
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

function rangeDoMes() {
  const agora = new Date()
  const ano   = agora.getFullYear()
  const mes   = agora.getMonth()
  const inicio = new Date(ano, mes, 1)
  const fim    = new Date(ano, mes + 1, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    inicio: `${ano}-${pad(mes + 1)}-01T00:00:00+00:00`,
    fim:    `${ano}-${pad(mes + 1)}-${pad(fim.getDate())}T23:59:59+00:00`,
    label:  inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}

export default async function AgendaPage({ searchParams }: Props) {
  const params  = await searchParams
  const data    = params.data ?? hoje()
  const filtro  = params.filtro
  const usuario = await getUsuarioComEmpresa()

  const supabase  = await createClient()
  const { inicio: inicioMes, fim: fimMes, label: labelMes } = rangeDoMes()

  if (filtro === 'pendentes') {
    const [{ data: raw }, { data: barbeiros }, { data: servicos }, { data: horarios }] = await Promise.all([
      supabase
        .from('vw_agenda_dia')
        .select('*')
        .eq('empresa_id', usuario?.empresa_id)
        .eq('status', 'pendente')
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .order('data_hora_inicio', { ascending: true }),
      supabase.from('barbeiros').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('servicos').select('id, nome, duracao_minutos, preco').eq('ativo', true).order('nome'),
      supabase.from('horarios_funcionamento').select('dia_semana').is('barbeiro_id', null).eq('ativo', true),
    ])

    const diasAtivos = (horarios ?? []).map((h: any) => Number(h.dia_semana))
    const lista = (raw ?? []) as AgendamentoDia[]

    const porBarbeiro = lista.reduce<Record<string, AgendamentoDia[]>>((acc, ag) => {
      const nome = (ag as any).barbeiro_nome ?? 'Sem barbeiro'
      ;(acc[nome] ??= []).push(ag)
      return acc
    }, {})

    return (
      <div className="px-4 py-6 space-y-5 max-w-2xl">
        <div>
          <h1 className="text-white text-2xl font-black tracking-tight">Pendentes do mês</h1>
          <p className="text-zinc-500 text-sm capitalize mt-0.5">
            {labelMes}
            {lista.length > 0 && (
              <span className="text-zinc-600"> · {lista.length} agendamento{lista.length !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        <NavegacaoDia dataAtual={data} filtroAtivo={true} />

        <AgendaClientWrapper
          empresaId={usuario?.empresa_id ?? ''}
          barbeiros={barbeiros ?? []}
          servicos={servicos ?? []}
          diasAtivos={diasAtivos}
        />

        {lista.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm">Nenhum agendamento pendente este mês.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(porBarbeiro).map(([barbeiro, ags]) => (
              <GrupoPendentes key={barbeiro} titulo={barbeiro} items={ags} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const [{ data: raw }, { data: barbeiros }, { data: servicos }, { data: horarios }, { count: pendentesCount }] = await Promise.all([
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
    supabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', usuario?.empresa_id)
      .eq('status', 'pendente')
      .gte('data_hora_inicio', inicioMes)
      .lte('data_hora_inicio', fimMes),
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
        <h1 className="text-white text-2xl font-black tracking-tight">Agenda</h1>
        <p className="text-zinc-500 text-sm capitalize mt-0.5">{formatarDataExibicao(data)}</p>
      </div>

      <NavegacaoDia dataAtual={data} pendentesCount={pendentesCount ?? 0} />

      <AgendaClientWrapper
        empresaId={usuario?.empresa_id ?? ''}
        barbeiros={barbeiros ?? []}
        servicos={servicos ?? []}
        diasAtivos={diasAtivos}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Agendamentos</p>
          <p className="text-white text-2xl font-black mt-1.5">{totais.total}</p>
        </div>
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-amber-500/10 rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Receita do dia</p>
          <p className="text-amber-400 text-xl font-black mt-1.5">{receita}</p>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">Nenhum agendamento para este dia.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {andamento.length > 0   && <Grupo titulo="Em andamento"         items={andamento} />}
          {pendentes.length > 0   && <Grupo titulo="Pendentes"            items={pendentes} />}
          {confirmados.length > 0 && <Grupo titulo="Confirmados"          items={confirmados} />}
          {concluidos.length > 0  && <Grupo titulo="Concluídos"           items={concluidos} />}
          {cancelados.length > 0  && <Grupo titulo="Cancelados / No-show" items={cancelados} />}
        </div>
      )}
    </div>
  )
}

function Grupo({ titulo, items }: { titulo: string; items: AgendamentoDia[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">
        {titulo} <span className="text-zinc-700 font-medium">({items.length})</span>
      </h2>
      {items.map(ag => (
        <CardAgendamento key={ag.id} agendamento={ag as any} />
      ))}
    </div>
  )
}

function GrupoPendentes({ titulo, items }: { titulo: string; items: AgendamentoDia[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">
        {titulo} <span className="text-zinc-700 font-medium">({items.length})</span>
      </h2>
      {items.map(ag => {
        const [ano, mes, dia] = ag.data_hora_inicio.split('T')[0].split('-').map(Number)
        const dataLabel = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
          weekday: 'short', day: 'numeric', month: 'short',
        })
        return (
          <div key={ag.id} className="space-y-1">
            <p className="text-[10px] text-zinc-600 font-medium capitalize px-1">{dataLabel}</p>
            <CardAgendamento agendamento={ag as any} />
          </div>
        )
      })}
    </div>
  )
}
