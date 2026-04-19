'use client'

import type { Servico } from './FluxoAgendamento'

interface Props {
  servicos:    Servico[]
  onSelecionar: (s: Servico) => void
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDuracao(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function PassoServico({ servicos, onSelecionar }: Props) {
  if (servicos.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Nenhum serviço disponível no momento.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="mb-5">
        <h2 className="text-white text-lg font-semibold">Escolha o serviço</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Selecione o que você quer fazer hoje</p>
      </div>

      {servicos.map(s => (
        <button
          key={s.id}
          onClick={() => onSelecionar(s)}
          className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800
                     hover:border-amber-500/50 rounded-xl p-4 transition-all group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white font-medium group-hover:text-amber-400 transition-colors truncate">
                {s.nome}
              </p>
              {s.descricao && (
                <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{s.descricao}</p>
              )}
              <p className="text-zinc-400 text-xs mt-1">{formatarDuracao(s.duracao_minutos)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-amber-400 font-semibold text-base">{formatarPreco(s.preco)}</p>
              <span className="text-zinc-600 text-xs">›</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
