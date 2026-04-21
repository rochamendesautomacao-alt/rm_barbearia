'use client'

import { useState } from 'react'
import { atualizarStatus } from '@/app/actions/agendamentos'

type Status = 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'no_show'

interface Agendamento {
  id: string
  data_hora_inicio: string
  data_hora_fim:    string
  status:           Status
  preco_cobrado:    number
  cliente_nome:     string
  cliente_telefone: string
  barbeiro_nome:    string
  servico_nome:     string
  duracao_minutos:  number
  observacoes?:     string | null
}

interface Props {
  agendamento: Agendamento
}

const STATUS_CONFIG: Record<Status, { label: string; cor: string; borda: string }> = {
  pendente:     { label: 'Pendente',        cor: 'bg-zinc-700/60 text-zinc-300',        borda: 'border-l-zinc-600' },
  confirmado:   { label: 'Confirmado',      cor: 'bg-blue-500/15 text-blue-400',        borda: 'border-l-blue-500/50' },
  em_andamento: { label: 'Em andamento',    cor: 'bg-amber-500/15 text-amber-400',      borda: 'border-l-amber-500' },
  concluido:    { label: 'Concluído',       cor: 'bg-green-500/15 text-green-400',      borda: 'border-l-green-500/50' },
  cancelado:    { label: 'Cancelado',       cor: 'bg-red-500/15 text-red-400',          borda: 'border-l-red-500/30' },
  no_show:      { label: 'Não compareceu',  cor: 'bg-zinc-800/60 text-zinc-500',        borda: 'border-l-zinc-700' },
}

const PROXIMAS_ACOES: Record<Status, { label: string; valor: Status; cor: string }[]> = {
  pendente:     [
    { label: 'Confirmar',  valor: 'confirmado',   cor: 'bg-blue-600 hover:bg-blue-500 text-white' },
    { label: 'Cancelar',   valor: 'cancelado',    cor: 'bg-red-900/80 hover:bg-red-800 text-red-300' },
    { label: 'No-show',    valor: 'no_show',      cor: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' },
  ],
  confirmado:   [
    { label: 'Iniciar',    valor: 'em_andamento', cor: 'bg-amber-500 hover:bg-amber-400 text-black font-bold' },
    { label: 'Cancelar',   valor: 'cancelado',    cor: 'bg-red-900/80 hover:bg-red-800 text-red-300' },
    { label: 'No-show',    valor: 'no_show',      cor: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' },
  ],
  em_andamento: [
    { label: 'Concluir',   valor: 'concluido',    cor: 'bg-green-600 hover:bg-green-500 text-white font-bold' },
    { label: 'Cancelar',   valor: 'cancelado',    cor: 'bg-red-900/80 hover:bg-red-800 text-red-300' },
  ],
  concluido:    [],
  cancelado:    [],
  no_show:      [],
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ChevronIcon({ aberto }: { aberto: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

export default function CardAgendamento({ agendamento: ag }: Props) {
  const [status, setStatus]   = useState<Status>(ag.status)
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto]   = useState(false)

  const cfg   = STATUS_CONFIG[status]
  const acoes = PROXIMAS_ACOES[status]
  const inativo = status === 'cancelado' || status === 'no_show'

  async function handleAcao(novoStatus: Status) {
    setLoading(true)
    const motivo = novoStatus === 'cancelado'
      ? window.prompt('Motivo do cancelamento (opcional):') ?? undefined
      : undefined

    const res = await atualizarStatus(ag.id, novoStatus as any, motivo)
    if (!res.erro) setStatus(novoStatus)
    setLoading(false)
  }

  return (
    <div className={[
      'border-l-4 rounded-r-xl rounded-l-none overflow-hidden transition-all duration-200',
      'bg-zinc-900/80 border-t border-r border-b border-zinc-800',
      'hover:border-r-zinc-700 hover:border-t-zinc-700 hover:border-b-zinc-700',
      cfg.borda,
      inativo ? 'opacity-50' : '',
      status === 'em_andamento' ? 'shadow-md shadow-amber-500/5' : '',
    ].join(' ')}>
      {/* linha de horário + status */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setAberto(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-right shrink-0">
            <p className="text-white font-bold text-sm tabular-nums">{formatarHora(ag.data_hora_inicio)}</p>
            <p className="text-zinc-600 text-xs tabular-nums">{formatarHora(ag.data_hora_fim)}</p>
          </div>
          <div className="w-px h-8 bg-zinc-800 shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{ag.cliente_nome}</p>
            <p className="text-zinc-500 text-xs truncate">{ag.servico_nome} · {ag.barbeiro_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.cor}`}>
            {cfg.label}
          </span>
          <span className="text-zinc-600">
            <ChevronIcon aberto={aberto} />
          </span>
        </div>
      </div>

      {/* detalhe expansível */}
      {aberto && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">Telefone</p>
              <p className="text-white text-sm">{ag.cliente_telefone}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">Valor</p>
              <p className="text-amber-400 text-sm font-black">{formatarPreco(ag.preco_cobrado)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">Duração</p>
              <p className="text-white text-sm">{ag.duracao_minutos} min</p>
            </div>
            {ag.observacoes && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">Observações</p>
                <p className="text-zinc-300 text-sm">{ag.observacoes}</p>
              </div>
            )}
          </div>

          {/* ações de status */}
          {acoes.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {acoes.map(acao => (
                <button
                  key={acao.valor}
                  disabled={loading}
                  onClick={() => handleAcao(acao.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 active:scale-95 ${acao.cor}`}
                >
                  {loading ? '...' : acao.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
