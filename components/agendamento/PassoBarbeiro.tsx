'use client'

import type { Barbeiro } from './FluxoAgendamento'

interface Props {
  barbeiros:   Barbeiro[]
  onSelecionar: (b: Barbeiro) => void
  onVoltar:    () => void
}

export default function PassoBarbeiro({ barbeiros, onSelecionar, onVoltar }: Props) {
  return (
    <div className="space-y-3">
      <div className="mb-5">
        <h2 className="text-white text-lg font-semibold">Escolha o barbeiro</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Quem vai te atender?</p>
      </div>

      {barbeiros.map(b => (
        <button
          key={b.id}
          onClick={() => onSelecionar(b)}
          className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800
                     hover:border-amber-500/50 rounded-xl p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {b.foto_url ? (
              <img
                src={b.foto_url}
                alt={b.nome}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                <span className="text-zinc-300 font-semibold text-lg">
                  {b.nome.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-white font-medium group-hover:text-amber-400 transition-colors">
                {b.nome}
              </p>
              {b.bio && (
                <p className="text-zinc-500 text-sm mt-0.5 line-clamp-2">{b.bio}</p>
              )}
            </div>

            <span className="text-zinc-600 shrink-0">›</span>
          </div>
        </button>
      ))}

      <BotaoVoltar onClick={onVoltar} />
    </div>
  )
}

function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-2 py-3 text-zinc-400 hover:text-white text-sm transition-colors"
    >
      ← Voltar
    </button>
  )
}
