'use client'

import { useState } from 'react'
import { criarServico, editarServico, toggleServico } from '@/app/actions/servicos'

interface Servico {
  id:              string
  nome:            string
  descricao:       string | null
  duracao_minutos: number
  preco:           number
  ativo:           boolean
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDuracao(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function ListaServicos({ servicos }: { servicos: Servico[] }) {
  const [lista, setLista]       = useState(servicos)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro]         = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    const fd  = new FormData(e.currentTarget)
    const res = editando
      ? await editarServico(editando.id, fd)
      : await criarServico(fd)
    setLoading(false)
    if (res?.erro) { setErro(res.erro); return }
    window.location.reload()
  }

  async function handleToggle(id: string, ativo: boolean) {
    await toggleServico(id, !ativo)
    setLista(l => l.map(s => s.id === id ? { ...s, ativo: !ativo } : s))
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => { setEditando(null); setShowForm(true) }}
          className="w-full py-3 border border-dashed border-zinc-700 hover:border-amber-500/50
                     rounded-xl text-zinc-400 hover:text-amber-400 text-sm transition-colors"
        >
          + Adicionar serviço
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h3 className="text-white font-medium text-sm">
            {editando ? 'Editar serviço' : 'Novo serviço'}
          </h3>

          {erro && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-zinc-300">Nome *</label>
              <input
                name="nome"
                required
                defaultValue={editando?.nome}
                placeholder="Ex: Corte masculino"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5
                           text-white placeholder-zinc-600 text-sm
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-zinc-300">Duração (min) *</label>
                <input
                  name="duracao_minutos"
                  type="number"
                  required
                  min={10}
                  max={480}
                  step={5}
                  defaultValue={editando?.duracao_minutos ?? 30}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5
                             text-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-zinc-300">Preço (R$) *</label>
                <input
                  name="preco"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  defaultValue={editando?.preco ?? ''}
                  placeholder="0,00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5
                             text-white placeholder-zinc-600 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-zinc-300">Descrição</label>
              <textarea
                name="descricao"
                rows={2}
                defaultValue={editando?.descricao ?? ''}
                placeholder="Descrição opcional..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5
                           text-white placeholder-zinc-600 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditando(null) }}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-black font-semibold rounded-lg text-sm transition-colors"
              >
                {loading ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {lista.length === 0 && !showForm && (
          <p className="text-zinc-600 text-sm text-center py-8">
            Nenhum serviço cadastrado ainda.
          </p>
        )}

        {lista.map(s => (
          <div
            key={s.id}
            className={[
              'bg-zinc-900 border border-zinc-800 rounded-xl p-4',
              !s.ativo ? 'opacity-50' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-sm">{s.nome}</p>
                {s.descricao && (
                  <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{s.descricao}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-amber-400 font-semibold text-sm">{formatarPreco(s.preco)}</span>
                  <span className="text-zinc-500 text-xs">{formatarDuracao(s.duracao_minutos)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setEditando(s); setShowForm(true) }}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                             hover:text-white rounded-lg text-xs transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggle(s.id, s.ativo)}
                  className={[
                    'px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                    s.ativo
                      ? 'bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400'
                      : 'bg-green-900/30 text-green-500',
                  ].join(' ')}
                >
                  {s.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
