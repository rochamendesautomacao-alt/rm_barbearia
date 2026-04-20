'use client'

import { useState } from 'react'
import FormAgendamento from './FormAgendamento'

interface Barbeiro { id: string; nome: string }
interface Servico  { id: string; nome: string; duracao_minutos: number; preco: number }

interface Props {
  empresaId:  string
  barbeiros:  Barbeiro[]
  servicos:   Servico[]
  diasAtivos: number[]
}

export default function AgendaClientWrapper({ empresaId, barbeiros, servicos, diasAtivos }: Props) {
  const [showForm, setShowForm] = useState(false)

  function fecharForm() {
    setShowForm(false)
    window.location.reload()
  }

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold
                     rounded-xl text-sm transition-colors"
        >
          + Novo agendamento
        </button>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Novo agendamento</h3>
          <FormAgendamento
            empresaId={empresaId}
            barbeiros={barbeiros}
            servicos={servicos}
            diasAtivos={diasAtivos}
            onFinalizar={fecharForm}
          />
        </div>
      )}
    </div>
  )
}
