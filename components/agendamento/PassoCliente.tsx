'use client'

import { useState } from 'react'
import type { EstadoAgendamento } from './FluxoAgendamento'

interface Props {
  estado:      EstadoAgendamento
  enviando:    boolean
  onConfirmar: (cliente: { nome: string; telefone: string; email?: string }) => void
  onVoltar:    () => void
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function formatarData(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PassoCliente({ estado, enviando, onConfirmar, onVoltar }: Props) {
  const [nome,     setNome]     = useState('')
  const [telefone, setTelefone] = useState('')
  const [email,    setEmail]    = useState('')

  function formatarTelefone(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2)  return `(${digits}`
    if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    return v
  }

  function handleTelefone(v: string) {
    setTelefone(formatarTelefone(v))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirmar({
      nome:     nome.trim(),
      telefone: telefone.replace(/\D/g, ''),
      email:    email.trim() || undefined,
    })
  }

  const podeEnviar = nome.trim().length >= 2 && telefone.replace(/\D/g, '').length >= 10

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-white text-lg font-semibold">Confirmar agendamento</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Seus dados para confirmação</p>
      </div>

      {/* Resumo do agendamento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Resumo</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Serviço</span>
            <span className="text-white text-sm font-medium">{estado.servico?.nome}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Barbeiro</span>
            <span className="text-white text-sm font-medium">{estado.barbeiro?.nome}</span>
          </div>
          {estado.data && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Data</span>
              <span className="text-white text-sm font-medium capitalize">
                {formatarData(estado.data)}
              </span>
            </div>
          )}
          {estado.slot && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Horário</span>
              <span className="text-white text-sm font-medium">
                {formatarHora(estado.slot)}
                {estado.slot_fim ? ` – ${formatarHora(estado.slot_fim)}` : ''}
              </span>
            </div>
          )}
          <div className="border-t border-zinc-800 pt-2 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Total</span>
            <span className="text-amber-400 font-bold">
              {formatarPreco(estado.servico?.preco ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Formulário do cliente */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Seu nome *</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            minLength={2}
            placeholder="João Silva"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
                       text-white placeholder-zinc-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-300">WhatsApp / Telefone *</label>
          <input
            type="tel"
            value={telefone}
            onChange={e => handleTelefone(e.target.value)}
            required
            placeholder="(11) 99999-9999"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
                       text-white placeholder-zinc-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-300">
            E-mail <span className="text-zinc-600">(opcional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
                       text-white placeholder-zinc-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={!podeEnviar || enviando}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                     disabled:text-zinc-600 text-black font-semibold
                     rounded-xl py-4 text-sm transition-all active:scale-[0.98]"
        >
          {enviando ? 'Agendando...' : 'Confirmar agendamento'}
        </button>
      </form>

      <button
        onClick={onVoltar}
        disabled={enviando}
        className="w-full py-2 text-zinc-400 hover:text-white text-sm transition-colors disabled:opacity-50"
      >
        ← Voltar
      </button>
    </div>
  )
}
