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

  const slotEscolhido = slots.find(s => s.hora_inicio === slotSelecionado)

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
          {slots.map(slot => {
            const selecionado = slotSelecionado === slot.hora_inicio
            return (
              <button
                key={slot.hora_inicio}
                onClick={() => setSlotSelecionado(slot.hora_inicio)}
                className={[
                  'h-12 border rounded-xl text-sm font-medium transition-all active:scale-95',
                  selecionado
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : 'bg-zinc-900 border-zinc-800 text-white hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-400',
                ].join(' ')}
              >
                {formatarHora(slot.hora_inicio)}
              </button>
            )
          })}
        </div>
      )}

      {!carregando && !erro && slots.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => {
              if (slotEscolhido) onSelecionar(slotEscolhido.hora_inicio, slotEscolhido.hora_fim)
            }}
            disabled={!slotSelecionado}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600
                       text-black font-semibold rounded-xl py-4 text-sm transition-all"
          >
            {slotSelecionado ? `Confirmar ${formatarHora(slotSelecionado)}` : 'Selecione um horário'}
          </button>
        </div>
      )}

      <button
        onClick={onVoltar}
        className="w-full py-2 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        ← Voltar
      </button>
    </div>
  )
}
