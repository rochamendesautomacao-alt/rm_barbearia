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

const inputCls = `w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5
  text-white placeholder-zinc-600 text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/50
  transition-all duration-200`

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
          className="w-full py-3.5 border border-dashed border-zinc-700/60 hover:border-amber-500/40
                     rounded-2xl text-zinc-500 hover:text-amber-400 text-sm font-medium
                     hover:bg-amber-500/5 transition-all duration-200"
        >
          + Adicionar serviço
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
          <h3 className="text-white font-bold text-sm tracking-tight">
            {editando ? 'Editar serviço' : 'Novo serviço'}
          </h3>

          {erro && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {erro}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Nome *</label>
              <input
                name="nome"
                required
                defaultValue={editando?.nome}
                placeholder="Ex: Corte masculino"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-medium">Duração (min) *</label>
                <input
                  name="duracao_minutos"
                  type="number"
                  required
                  min={10}
                  max={480}
                  step={5}
                  defaultValue={editando?.duracao_minutos ?? 30}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-medium">Preço (R$) *</label>
                <input
                  name="preco"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  defaultValue={editando?.preco ?? ''}
                  placeholder="0,00"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Descrição</label>
              <textarea
                name="descricao"
                rows={2}
                defaultValue={editando?.descricao ?? ''}
                placeholder="Descrição opcional..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditando(null) }}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                           text-black font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
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
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Nenhum serviço cadastrado ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">Adicione o primeiro serviço acima.</p>
          </div>
        )}

        {lista.map(s => (
          <div
            key={s.id}
            className={[
              'bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4',
              'transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/50',
              !s.ativo ? 'opacity-50' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm">{s.nome}</p>
                {s.descricao && (
                  <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{s.descricao}</p>
                )}
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="text-amber-400 font-black text-sm">{formatarPreco(s.preco)}</span>
                  <span className="bg-zinc-800 text-zinc-400 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    {formatarDuracao(s.duracao_minutos)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setEditando(s); setShowForm(true) }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                             hover:text-white rounded-xl text-xs font-medium transition-all duration-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggle(s.id, s.ativo)}
                  className={[
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200',
                    s.ativo
                      ? 'bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400'
                      : 'bg-green-900/30 hover:bg-green-900/50 text-green-500',
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
