'use client'

import { useEffect, useState } from 'react'

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

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function formatarDataExibicao(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function PassoHorario({ empresaId, barbeiroId, servicoId, data, onSelecionar, onVoltar }: Props) {
  const [slots, setSlots]       = useState<Slot[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]         = useState<string | null>(null)

  useEffect(() => {
    setCarregando(true)
    setErro(null)

    fetch(
      `/api/disponibilidade?empresa_id=${empresaId}&barbeiro_id=${barbeiroId}&servico_id=${servicoId}&data=${data}`
    )
      .then(r => r.json())
      .then(json => {
        setSlots(json.slots ?? [])
        setCarregando(false)
      })
      .catch(() => {
        setErro('Não foi possível carregar os horários.')
        setCarregando(false)
      })
  }, [empresaId, barbeiroId, servicoId, data])

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="text-white text-lg font-semibold">Escolha o horário</h2>
        <p className="text-zinc-400 text-sm mt-0.5 capitalize">{formatarDataExibicao(data)}</p>
      </div>

      {carregando && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!carregando && erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
          {erro}
        </div>
      )}

      {!carregando && !erro && slots.length === 0 && (
        <div className="text-center py-10">
          <p className="text-zinc-400 text-sm">Nenhum horário disponível nesta data.</p>
          <p className="text-zinc-600 text-xs mt-1">Tente outro dia ou barbeiro.</p>
        </div>
      )}

      {!carregando && !erro && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(slot => (
            <button
              key={slot.hora_inicio}
              onClick={() => onSelecionar(slot.hora_inicio, slot.hora_fim)}
              className="h-12 bg-zinc-900 hover:bg-amber-500 border border-zinc-800
                         hover:border-amber-500 rounded-xl text-white hover:text-black
                         text-sm font-medium transition-all active:scale-95"
            >
              {formatarHora(slot.hora_inicio)}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onVoltar}
        className="w-full py-3 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        ← Voltar
      </button>
    </div>
  )
}
