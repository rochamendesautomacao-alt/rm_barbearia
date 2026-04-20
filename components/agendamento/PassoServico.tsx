'use client'

import { useState } from 'react'
import { formatarPreco } from '@/lib/format'
import type { Servico } from './FluxoAgendamento'

interface Props {
  servicos:    Servico[]
  onSelecionar: (s: Servico) => void
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
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
           <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
           </svg>
        </div>
        <p className="text-zinc-500 text-sm font-black uppercase tracking-widest">Nenhum serviço disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-white text-xl font-bold italic tracking-tighter">O QUE VAMOS FAZER?</h2>
        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-black text-[10px]">Selecione um serviço profissional</p>
      </div>

      <div className="space-y-3">
        {servicos.map(s => {
          const selecionado = selecionadoId === s.id
          
          return (
            <button
              key={s.id}
              onClick={() => setSelecionadoId(s.id)}
              className={[
                'w-full text-left bg-zinc-900/50 backdrop-blur-sm border rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden',
                selecionado 
                  ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10 scale-[1.02]' 
                  : 'border-zinc-800/80 hover:border-amber-500/30'
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="min-w-0 flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selecionado ? 'border-amber-500 bg-amber-500' : 'border-zinc-700'}`}>
                    {selecionado && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`font-black uppercase italic tracking-tighter transition-colors ${selecionado ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                      {s.nome}
                    </p>
                    {s.descricao && (
                      <p className="text-zinc-500 text-[11px] mt-1 line-clamp-1 italic">{s.descricao}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                         {formatarDuracao(s.duracao_minutos)}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-black text-lg italic tracking-tighter ${selecionado ? 'text-amber-500 scale-110' : 'text-amber-500/80'}`}>{formatarPreco(s.preco)}</p>
                </div>
              </div>
              
              {/* Efeito de detalhe lateral */}
              {selecionado && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}
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
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-700
                     text-black font-black uppercase tracking-widest
                     rounded-2xl py-5 text-sm transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98]"
        >
          Avançar para escolha do profissional
        </button>
      </div>
    </div>
  )
}
