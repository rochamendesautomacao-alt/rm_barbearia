import { createClient } from '@/lib/supabase/server'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import FiltroRelatorio from '@/components/dashboard/FiltroRelatorio'
import type { AgendamentoDia } from '@/types/database'

interface Props {
  searchParams: Promise<{ de?: string; ate?: string }>
}

function primeiroDoMes() {
  const h = new Date()
  return new Date(h.getFullYear(), h.getMonth(), 1).toISOString().split('T')[0]
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(iso: string) {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function pct(part: number, total: number) {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

interface BarbeiroRow { nome: string; atendimentos: number; receita: number }
interface ServicoRow  { nome: string; atendimentos: number; receita: number }

function computar(lista: AgendamentoDia[]) {
  const concluidos  = lista.filter(a => a.status === 'concluido')
  const cancelados  = lista.filter(a => a.status === 'cancelado' || a.status === 'no_show')
  const emAberto    = lista.filter(a => ['pendente', 'confirmado', 'em_andamento'].includes(a.status))

  const receita       = concluidos.reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  const receitaPerdida = cancelados.reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  const ticketMedio   = concluidos.length > 0 ? receita / concluidos.length : 0
  const taxaConclusao = lista.length > 0 ? pct(concluidos.length, lista.length) : 0

  // Agrupamentos (apenas concluídos)
  const bMap = new Map<string, BarbeiroRow>()
  const sMap = new Map<string, ServicoRow>()
  for (const a of concluidos) {
    const bn = a.barbeiro_nome ?? 'Desconhecido'
    const sn = a.servico_nome  ?? 'Desconhecido'
    const bRow = bMap.get(bn) ?? { nome: bn, atendimentos: 0, receita: 0 }
    bRow.atendimentos++; bRow.receita += a.preco_cobrado ?? 0
    bMap.set(bn, bRow)

    const sRow = sMap.get(sn) ?? { nome: sn, atendimentos: 0, receita: 0 }
    sRow.atendimentos++; sRow.receita += a.preco_cobrado ?? 0
    sMap.set(sn, sRow)
  }

  const porBarbeiro = [...bMap.values()].sort((a, b) => b.receita - a.receita)
  const porServico  = [...sMap.values()].sort((a, b) => b.receita - a.receita)

  return {
    total: lista.length,
    concluidos: concluidos.length,
    cancelados: cancelados.length,
    emAberto: emAberto.length,
    receita, receitaPerdida, ticketMedio, taxaConclusao,
    porBarbeiro, porServico,
  }
}

export default async function RelatoriosPage({ searchParams }: Props) {
  const params  = await searchParams
  const de      = params.de  ?? primeiroDoMes()
  const ate     = params.ate ?? hoje()
  const usuario = await getUsuarioComEmpresa()

  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('vw_agenda_dia')
    .select('*')
    .eq('empresa_id', usuario?.empresa_id)
    .gte('data_hora_inicio', `${de}T00:00:00+00:00`)
    .lte('data_hora_inicio', `${ate}T23:59:59+00:00`)

  const lista = (raw ?? []) as AgendamentoDia[]
  const dados = computar(lista)

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-black tracking-tight">Relatórios</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {fmtData(de)} — {fmtData(ate)}
        </p>
      </div>

      {/* Filtro */}
      <FiltroRelatorio de={de} ate={ate} />

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-amber-500/10 rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Faturamento</p>
          <p className="text-amber-400 text-2xl font-black mt-1.5 tabular-nums">{fmt(dados.receita)}</p>
        </div>
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Atendimentos</p>
          <p className="text-white text-2xl font-black mt-1.5">{dados.concluidos}</p>
          <p className="text-zinc-600 text-xs mt-0.5">{dados.taxaConclusao}% de conclusão</p>
        </div>
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Ticket médio</p>
          <p className="text-white text-xl font-black mt-1.5 tabular-nums">{fmt(dados.ticketMedio)}</p>
        </div>
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-red-500/5 rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Cancelamentos</p>
          <p className="text-white text-2xl font-black mt-1.5">{dados.cancelados}</p>
          <p className="text-zinc-600 text-xs mt-0.5 tabular-nums">
            {dados.receitaPerdida > 0 ? `${fmt(dados.receitaPerdida)} perdidos` : 'Sem perdas'}
          </p>
        </div>
      </div>

      {/* Status overview */}
      {dados.total > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Visão geral</h2>
          <div className="space-y-2">
            {([
              { label: 'Concluídos',   valor: dados.concluidos,          cor: 'bg-green-500' },
              { label: 'Em aberto',    valor: dados.emAberto,            cor: 'bg-blue-500' },
              { label: 'Cancelados',   valor: dados.cancelados,          cor: 'bg-red-500' },
            ] as { label: string; valor: number; cor: string }[]).map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 text-xs">{item.label}</span>
                  <span className="text-white text-xs font-bold tabular-nums">
                    {item.valor} <span className="text-zinc-600 font-normal">({pct(item.valor, dados.total)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.cor}`}
                    style={{ width: `${pct(item.valor, dados.total)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por barbeiro */}
      {dados.porBarbeiro.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
          <div className="px-4 py-3 border-b border-zinc-800/60">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Por barbeiro</h2>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {dados.porBarbeiro.map((b, i) => (
              <div key={b.nome} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors duration-150">
                <span className="text-[11px] font-black text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{b.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{b.nome}</p>
                  <p className="text-zinc-500 text-xs">{b.atendimentos} atendimento{b.atendimentos !== 1 ? 's' : ''}</p>
                </div>
                <p className="text-amber-400 font-black text-sm tabular-nums shrink-0">{fmt(b.receita)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por serviço */}
      {dados.porServico.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
          <div className="px-4 py-3 border-b border-zinc-800/60">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Por serviço</h2>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {dados.porServico.map((s, i) => (
              <div key={s.nome} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors duration-150">
                <span className="text-[11px] font-black text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{s.nome}</p>
                  <p className="text-zinc-500 text-xs">{s.atendimentos} atendimento{s.atendimentos !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-amber-400 font-black text-sm tabular-nums">{fmt(s.receita)}</p>
                  <p className="text-zinc-600 text-xs tabular-nums">{fmt(s.atendimentos > 0 ? s.receita / s.atendimentos : 0)}/atend.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {dados.total === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">Nenhum agendamento neste período.</p>
          <p className="text-zinc-600 text-xs mt-1">Tente selecionar outro intervalo de datas.</p>
        </div>
      )}
    </div>
  )
}
