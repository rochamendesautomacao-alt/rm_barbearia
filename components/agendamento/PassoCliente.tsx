'use client'

import { useState } from 'react'
import { formatarTelefone, formatarPreco, formatarData, formatarHora } from '@/lib/format'
import type { EstadoAgendamento, ClienteLogado } from './FluxoAgendamento'

interface Props {
  estado:         EstadoAgendamento
  enviando:       boolean
  erro:           string | null
  clienteLogado?: ClienteLogado
  onConfirmar:    (cliente: { nome: string; telefone: string; email?: string }) => void
  onVoltar:       () => void
}

export default function PassoCliente({ estado, enviando, erro, clienteLogado, onConfirmar, onVoltar }: Props) {
  const [nome,     setNome]     = useState('')
  const [telefone, setTelefone] = useState('')
  const [email,    setEmail]    = useState('')

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

  function confirmarLogado() {
    onConfirmar({
      nome:     clienteLogado!.nome,
      telefone: clienteLogado!.telefone,
      email:    clienteLogado!.email ?? undefined,
    })
  }

  const podeEnviar = nome.trim().length >= 2 && telefone.replace(/\D/g, '').length >= 10

  const inputCls = `w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3
    text-white placeholder-zinc-600 text-sm transition-all
    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500`

  const resumo = (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Seu Agendamento</h3>
        <span className="text-amber-500 text-[10px] font-bold bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
          Etapa Final
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-zinc-500 text-sm">Serviço</span>
          <div className="text-right">
            <p className="text-white text-sm font-semibold">{estado.servico?.nome}</p>
            <p className="text-zinc-600 text-[10px]">{estado.servico?.duracao_minutos} min</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-sm">Profissional</span>
          <span className="text-white text-sm font-medium">{estado.barbeiro?.nome}</span>
        </div>
        {estado.data && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Data</span>
            <span className="text-white text-sm font-medium capitalize">
              {formatarData(estado.data)}
            </span>
          </div>
        )}
        {estado.slot && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Horário</span>
            <span className="text-white text-sm font-medium">
              {formatarHora(estado.slot)}
              {estado.slot_fim ? ` – ${formatarHora(estado.slot_fim)}` : ''}
            </span>
          </div>
        )}
        <div className="border-t border-zinc-800/50 pt-4 flex justify-between items-center">
          <span className="text-zinc-300 font-medium">Valor Total</span>
          <span className="text-amber-500 text-xl font-black">
            {formatarPreco(estado.servico?.preco ?? 0)}
          </span>
        </div>
      </div>
    </div>
  )

  const botoes = (disabled: boolean) => (
    <div className="pt-2">
      {erro && (
        <p className="text-red-400 text-sm text-center mb-3">{erro}</p>
      )}
      <button
        type="submit"
        disabled={disabled || enviando}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
                   disabled:text-zinc-600 text-black font-black uppercase tracking-widest
                   rounded-xl py-4 text-sm transition-all active:scale-[0.98]
                   shadow-[0_0_20px_rgba(245,158,11,0.2)]"
      >
        {enviando ? 'Confirmando...' : 'Confirmar Agendamento'}
      </button>
      <button
        type="button"
        onClick={onVoltar}
        disabled={enviando}
        className="w-full py-3 mt-2 text-zinc-500 hover:text-white text-xs font-medium
                   transition-all disabled:opacity-50 tracking-widest uppercase"
      >
        ← Alterar Alguma Etapa
      </button>
    </div>
  )

  if (clienteLogado) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h2 className="text-white text-xl font-bold">Confirmar Agendamento</h2>
          <p className="text-zinc-400 text-sm mt-1">Confira os detalhes e confirme.</p>
        </div>

        {resumo}

        <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl border border-white/5 space-y-3">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Seus dados</p>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Nome</span>
            <span className="text-white text-sm font-medium">{clienteLogado.nome}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Telefone</span>
            <span className="text-white text-sm font-medium">
              {formatarTelefone(clienteLogado.telefone)}
            </span>
          </div>
          {clienteLogado.email && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-sm">E-mail</span>
              <span className="text-white text-sm font-medium">{clienteLogado.email}</span>
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); confirmarLogado() }}>
            {botoes(false)}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-white text-xl font-bold">Resumo e Dados</h2>
        <p className="text-zinc-400 text-sm mt-1">Confira os detalhes e preencha seus dados para agendar.</p>
      </div>

      {resumo}

      <form onSubmit={handleSubmit} className="space-y-4 backdrop-blur-sm bg-white/5 p-6 rounded-2xl border border-white/5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-widest">Nome completo *</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            minLength={2}
            placeholder="Ex: João da Silva"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-widest">WhatsApp / Telefone *</label>
          <input
            type="tel"
            value={telefone}
            onChange={e => handleTelefone(e.target.value)}
            required
            placeholder="(11) 99999-9999"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-widest">
            E-mail <span className="text-zinc-600 italic font-normal">(não obrigatório)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className={inputCls}
          />
        </div>

        {botoes(!podeEnviar)}
      </form>
    </div>
  )
}
