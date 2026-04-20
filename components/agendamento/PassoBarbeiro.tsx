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
      <div className="space-y-6">
        <div className="mb-2">
          <h2 className="text-white text-xl font-bold italic tracking-tighter uppercase">Escolha o Profissional</h2>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-black text-[10px]">Quem vai cuidar do seu visual?</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
             <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
          </div>
          <p className="text-zinc-500 text-sm font-black uppercase tracking-widest">Nenhum barbeiro disponível</p>
        </div>
        <button onClick={onVoltar} className="w-full py-4 text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
          ← Voltar para Serviços
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-white text-xl font-bold italic tracking-tighter uppercase">Escolha o Profissional</h2>
        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-black text-[10px]">Quem vai cuidar do seu visual?</p>
      </div>

      <div className="space-y-3">
        {barbeiros.map(b => {
          const selecionado = selecionadoId === b.id
          return (
            <button
              key={b.id}
              onClick={() => setSelecionadoId(b.id)}
              className={[
                'w-full text-left bg-zinc-900/50 backdrop-blur-sm border rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden',
                selecionado
                  ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10 scale-[1.02]'
                  : 'border-zinc-800/80 hover:border-amber-500/30',
              ].join(' ')}
            >
              <div className="flex items-center gap-5 relative z-10">
                <div className="relative group/avatar">
                  <div className={[
                    'absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-0 transition duration-500',
                    selecionado ? 'opacity-30' : 'group-hover:opacity-20'
                  ].join(' ')}></div>
                  {b.foto_url ? (
                    <img src={b.foto_url} alt={b.nome} className="relative w-16 h-16 rounded-full object-cover border-2 border-zinc-700 shadow-xl" />
                  ) : (
                    <div className="relative w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 shadow-lg text-zinc-400 font-bold text-2xl uppercase italic">
                      {b.nome.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-lg font-black uppercase italic tracking-tighter transition-colors ${selecionado ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                    {b.nome}
                  </p>
                  {b.bio && <p className="text-zinc-500 text-[11px] mt-1 line-clamp-2 italic leading-relaxed">{b.bio}</p>}
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selecionado ? 'border-amber-500 bg-amber-500' : 'border-zinc-700'}`}>
                  {selecionado && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              {/* Efeito de detalhe lateral */}
              {selecionado && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}
            </button>
          )
        })}
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <button
          onClick={() => {
            const b = barbeiros.find(x => x.id === selecionadoId)
            if (b) onSelecionar(b)
          }}
          disabled={!selecionadoId}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-700
                     text-black font-black uppercase tracking-widest
                     rounded-2xl py-5 text-sm transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98]"
        >
          Avançar para escolha da data
        </button>
        
        <button
          onClick={onVoltar}
          className="w-full py-3 text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          ← Voltar para Serviços
        </button>
      </div>
    </div>
  )
}
