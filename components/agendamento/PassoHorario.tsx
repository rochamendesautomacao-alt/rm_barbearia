'use client'

import { useEffect, useState } from 'react'
import { formatarHora, formatarDataHora } from '@/lib/format'

interface Slot {
  hora_inicio: string
  hora_fim:    string
  disponivel:  boolean
}

interface Props {
  empresaId:   string
  barbeiroId:  string
  servicoId:   string
  data:        string
  onSelecionar: (inicio: string, fim: string) => void
  onVoltar:    () => void
}

export default function PassoHorario({ empresaId, barbeiroId, servicoId, data, onSelecionar, onVoltar }: Props) {
  const [slots, setSlots]             = useState<Slot[]>([])
  const [carregando, setCarregando]   = useState(true)
  const [erro, setErro]               = useState<string | null>(null)
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    setSlotSelecionado(null)

    fetch(
      `/api/disponibilidade?empresa_id=${empresaId}&barbeiro_id=${barbeiroId}&servico_id=${servicoId}&data=${data}`
    )
      .then(async r => {
        const json = await r.json()
        if (!r.ok) return { erro: json.erro || 'Erro ao carregar horários' }
        return json
      })
      .then(json => {
        if (json.erro) {
          setErro(json.erro)
          setSlots([])
        } else {
          setSlots(json.slots ?? [])
        }
        setCarregando(false)
      })
      .catch(() => {
        setErro('Não foi possível carregar os horários.')
        setCarregando(false)
      })
  }, [empresaId, barbeiroId, servicoId, data])

  const slotEscolhido = slots.find(s => s.hora_inicio === slotSelecionado)

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-white text-xl font-bold">Qual o melhor horário?</h2>
        <p className="text-zinc-500 text-sm mt-1 capitalize font-medium">{formatarDataHora(data, false).split(' às ')[0]}</p>
      </div>

      <div className="min-h-[300px]">
        {carregando && (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-14 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!carregando && erro && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm font-bold uppercase tracking-wider">{erro}</p>
          </div>
        )}

        {!carregando && !erro && slots.length === 0 && (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-10 text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800 mb-2">
                <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <div>
               <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Sem horários</p>
               <p className="text-zinc-600 text-xs mt-2">Infelizmente não há vagas para este dia.</p>
             </div>
             <button
               onClick={onVoltar}
               className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
             >
               Escolher outra data
             </button>
          </div>
        )}

        {!carregando && !erro && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {slots.map(slot => {
              const selecionado = slotSelecionado === slot.hora_inicio
              return (
                <button
                  key={slot.hora_inicio}
                  onClick={() => setSlotSelecionado(slot.hora_inicio)}
                  className={[
                    'h-14 border rounded-2xl text-xs font-black transition-all active:scale-[0.9] duration-300',
                    selecionado
                      ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white',
                  ].join(' ')}
                >
                  {formatarHora(slot.hora_inicio)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!carregando && !erro && slots.length > 0 && (
        <div className="pt-4 flex flex-col gap-3">
          <button
            onClick={() => {
              if (slotEscolhido) onSelecionar(slotEscolhido.hora_inicio, slotEscolhido.hora_fim)
            }}
            disabled={!slotSelecionado}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-700
                       text-black font-black uppercase tracking-widest rounded-2xl py-5 text-sm transition-all
                       shadow-xl shadow-amber-500/10 active:scale-[0.98]"
          >
            {slotSelecionado ? `Confirmar ${formatarHora(slotSelecionado)}` : 'Selecione o Horário'}
          </button>
          
          <button
            onClick={onVoltar}
            className="w-full py-3 text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            ← Voltar para Datas
          </button>
        </div>
      )}
    </div>
  )
}
