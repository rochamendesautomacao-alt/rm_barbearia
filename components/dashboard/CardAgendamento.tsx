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

const STATUS_CONFIG: Record<Status, { label: string; cor: string }> = {
  pendente:     { label: 'Pendente',     cor: 'bg-zinc-700 text-zinc-300' },
  confirmado:   { label: 'Confirmado',   cor: 'bg-blue-500/20 text-blue-400' },
  em_andamento: { label: 'Em andamento', cor: 'bg-amber-500/20 text-amber-400' },
  concluido:    { label: 'Concluído',    cor: 'bg-green-500/20 text-green-400' },
  cancelado:    { label: 'Cancelado',    cor: 'bg-red-500/20 text-red-400' },
  no_show:      { label: 'Não compareceu', cor: 'bg-zinc-700 text-zinc-500' },
}

const PROXIMAS_ACOES: Record<Status, { label: string; valor: Status; cor: string }[]> = {
  pendente:     [
    { label: 'Confirmar',  valor: 'confirmado',   cor: 'bg-blue-600 hover:bg-blue-500 text-white' },
    { label: 'Cancelar',   valor: 'cancelado',    cor: 'bg-red-900 hover:bg-red-800 text-red-300' },
    { label: 'No-show',    valor: 'no_show',      cor: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' },
  ],
  confirmado:   [
    { label: 'Iniciar',    valor: 'em_andamento', cor: 'bg-amber-600 hover:bg-amber-500 text-black' },
    { label: 'Cancelar',   valor: 'cancelado',    cor: 'bg-red-900 hover:bg-red-800 text-red-300' },
    { label: 'No-show',    valor: 'no_show',      cor: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' },
  ],
  em_andamento: [
    { label: 'Concluir',   valor: 'concluido',    cor: 'bg-green-700 hover:bg-green-600 text-white' },
    { label: 'Cancelar',   valor: 'cancelado',    cor: 'bg-red-900 hover:bg-red-800 text-red-300' },
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

export default function CardAgendamento({ agendamento: ag }: Props) {
  const [status, setStatus]   = useState<Status>(ag.status)
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto]   = useState(false)

  const cfg    = STATUS_CONFIG[status]
  const acoes  = PROXIMAS_ACOES[status]

  async function handleAcao(novoStatus: Status) {
    setLoading(true)
    const motivo = novoStatus === 'cancelado'
      ? window.prompt('Motivo do cancelamento (opcional):') ?? undefined
      : undefined

    const res = await atualizarStatus(ag.id, novoStatus, motivo)
    if (!res.erro) setStatus(novoStatus)
    setLoading(false)
  }

  return (
    <div className={[
      'bg-zinc-900 border rounded-xl overflow-hidden transition-all',
      status === 'cancelado' || status === 'no_show' ? 'border-zinc-800 opacity-60' : 'border-zinc-800',
      status === 'em_andamento' ? 'border-amber-500/30' : '',
    ].join(' ')}>
      {/* linha de horário + status */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setAberto(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-right shrink-0">
            <p className="text-white font-bold text-sm tabular-nums">{formatarHora(ag.data_hora_inicio)}</p>
            <p className="text-zinc-600 text-xs tabular-nums">{formatarHora(ag.data_hora_fim)}</p>
          </div>
          <div className="w-px h-8 bg-zinc-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{ag.cliente_nome}</p>
            <p className="text-zinc-400 text-xs truncate">{ag.servico_nome} · {ag.barbeiro_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cor}`}>
            {cfg.label}
          </span>
          <span className={`text-zinc-600 text-sm transition-transform ${aberto ? 'rotate-180' : ''}`}>
            ›
          </span>
        </div>
      </div>

      {/* detalhe expansível */}
      {aberto && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <p className="text-zinc-500 text-xs">Telefone</p>
              <p className="text-white text-sm">{ag.cliente_telefone}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Valor</p>
              <p className="text-amber-400 text-sm font-semibold">{formatarPreco(ag.preco_cobrado)}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Duração</p>
              <p className="text-white text-sm">{ag.duracao_minutos} min</p>
            </div>
            {ag.observacoes && (
              <div className="col-span-2">
                <p className="text-zinc-500 text-xs">Observações</p>
                <p className="text-white text-sm">{ag.observacoes}</p>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${acao.cor}`}
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
