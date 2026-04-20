'use client'

import { useState } from 'react'

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
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  if (servicos.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Nenhum serviço disponível no momento.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="text-white text-lg font-semibold">Escolha o serviço</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Selecione o que você quer fazer hoje</p>
      </div>

      <div className="space-y-3">
        {servicos.map(s => {
          const selecionado = selecionadoId === s.id
          
          return (
            <button
              key={s.id}
              onClick={() => setSelecionadoId(s.id)}
              className={[
                'w-full text-left bg-zinc-900 border rounded-xl p-4 transition-all group',
                selecionado ? 'border-amber-500 ring-1 ring-amber-500' : 'border-zinc-800 hover:border-amber-500/50'
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selecionado ? 'border-amber-500' : 'border-zinc-600'}`}>
                    {selecionado && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                  </div>
                  <div>
                    <p className={`font-medium transition-colors truncate ${selecionado ? 'text-amber-400' : 'text-white group-hover:text-amber-400'}`}>
                      {s.nome}
                    </p>
                    {s.descricao && (
                      <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{s.descricao}</p>
                    )}
                    <p className="text-zinc-400 text-xs mt-1">{formatarDuracao(s.duracao_minutos)}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-amber-400 font-semibold text-base">{formatarPreco(s.preco)}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="pt-4">
        <button
          onClick={() => {
            const s = servicos.find(x => x.id === selecionadoId)
            if (s) onSelecionar(s)
          }}
          disabled={!selecionadoId}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold rounded-xl py-4 text-sm transition-all"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}
