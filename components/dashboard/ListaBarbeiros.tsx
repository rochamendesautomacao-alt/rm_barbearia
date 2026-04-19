'use client'

import { useState } from 'react'
import { toggleBarbeiro } from '@/app/actions/barbeiros'
import FormBarbeiro from './FormBarbeiro'

interface Barbeiro {
  id:         string
  nome:       string
  bio:        string | null
  telefone:   string | null
  ativo:      boolean
  usuario_id: string | null
}

export default function ListaBarbeiros({ barbeiros }: { barbeiros: Barbeiro[] }) {
  const [showForm, setShowForm]   = useState(false)
  const [editando, setEditando]   = useState<Barbeiro | null>(null)
  const [lista, setLista]         = useState(barbeiros)

  function abrirEdicao(b: Barbeiro) {
    setEditando(b)
    setShowForm(true)
  }

  function fecharForm() {
    setShowForm(false)
    setEditando(null)
    // recarrega a página para atualizar a lista (o revalidatePath faz isso no next reload)
    window.location.reload()
  }

  async function handleToggle(id: string, ativo: boolean) {
    await toggleBarbeiro(id, !ativo)
    setLista(l => l.map(b => b.id === id ? { ...b, ativo: !ativo } : b))
  }

  return (
    <div className="space-y-4">
      {/* Botão adicionar */}
      {!showForm && (
        <button
          onClick={() => { setEditando(null); setShowForm(true) }}
          className="w-full py-3 border border-dashed border-zinc-700 hover:border-amber-500/50
                     rounded-xl text-zinc-400 hover:text-amber-400 text-sm transition-colors"
        >
          + Adicionar barbeiro
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-medium text-sm mb-4">
            {editando ? 'Editar barbeiro' : 'Novo barbeiro'}
          </h3>
          <FormBarbeiro barbeiro={editando ?? undefined} onFinalizar={fecharForm} />
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {lista.length === 0 && !showForm && (
          <p className="text-zinc-600 text-sm text-center py-8">
            Nenhum barbeiro cadastrado ainda.
          </p>
        )}

        {lista.map(b => (
          <div
            key={b.id}
            className={[
              'bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4',
              !b.ativo ? 'opacity-50' : '',
            ].join(' ')}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-zinc-300 font-semibold">
                {b.nome.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{b.nome}</p>
              {b.bio && <p className="text-zinc-500 text-xs truncate">{b.bio}</p>}
              {b.telefone && <p className="text-zinc-600 text-xs">{b.telefone}</p>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => abrirEdicao(b)}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400
                           hover:text-white rounded-lg text-xs transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => handleToggle(b.id, b.ativo)}
                className={[
                  'px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                  b.ativo
                    ? 'bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400'
                    : 'bg-green-900/30 hover:bg-green-900/50 text-green-500',
                ].join(' ')}
              >
                {b.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
