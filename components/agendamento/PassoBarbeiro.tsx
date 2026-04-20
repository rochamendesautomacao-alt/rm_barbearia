'use client'

import { useState } from 'react'
import type { Barbeiro } from './FluxoAgendamento'

interface Props {
  barbeiros:   Barbeiro[]
  onSelecionar: (b: Barbeiro) => void
  onVoltar:    () => void
}

export default function PassoBarbeiro({ barbeiros, onSelecionar, onVoltar }: Props) {
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  if (barbeiros.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-5">
          <h2 className="text-white text-lg font-semibold">Escolha o barbeiro</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Quem vai te atender?</p>
        </div>
        <div className="text-center py-12 text-zinc-500">Nenhum barbeiro disponível no momento.</div>
        <button onClick={onVoltar} className="w-full py-3 text-zinc-400 hover:text-white text-sm transition-colors">
          ← Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="text-white text-lg font-semibold">Escolha o barbeiro</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Quem vai te atender?</p>
      </div>

      <div className="space-y-3">
        {barbeiros.map(b => {
          const selecionado = selecionadoId === b.id
          return (
            <button
              key={b.id}
              onClick={() => setSelecionadoId(b.id)}
              className={[
                'w-full text-left bg-zinc-900 border rounded-xl p-4 transition-all group',
                selecionado
                  ? 'border-amber-500 ring-1 ring-amber-500'
                  : 'border-zinc-800 hover:border-amber-500/50',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                {b.foto_url ? (
                  <img src={b.foto_url} alt={b.nome} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-zinc-300 font-semibold text-lg">{b.nome.charAt(0).toUpperCase()}</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className={`font-medium transition-colors ${selecionado ? 'text-amber-400' : 'text-white group-hover:text-amber-400'}`}>
                    {b.nome}
                  </p>
                  {b.bio && <p className="text-zinc-500 text-sm mt-0.5 line-clamp-2">{b.bio}</p>}
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selecionado ? 'border-amber-500' : 'border-zinc-600'}`}>
                  {selecionado && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        <button
          onClick={() => {
            const b = barbeiros.find(x => x.id === selecionadoId)
            if (b) onSelecionar(b)
          }}
          disabled={!selecionadoId}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600
                     text-black font-semibold rounded-xl py-4 text-sm transition-all"
        >
          Avançar
        </button>
      </div>

      <button onClick={onVoltar} className="w-full py-2 text-zinc-400 hover:text-white text-sm transition-colors">
        ← Voltar
      </button>
    </div>
  )
}
