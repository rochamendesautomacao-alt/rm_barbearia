'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cancelarAgendamentoCliente } from '@/app/actions/clientes'

interface Props {
  agendamentoId: string
  status: string
  slug: string
  basePath?: string  // ex: '/b/rm-barbearia' — padrão: '/{slug}'
}

export default function BotoesAgendamentoCliente({
  agendamentoId, status, slug, basePath,
}: Props) {
  const base = basePath ?? `/${slug}`
  const [confirmando, setConfirmando] = useState(false)
  const [erro,        setErro]        = useState('')
  const [isPending,   startTransition] = useTransition()

  if (!['pendente', 'confirmado'].includes(status)) return null

  function cancelar() {
    startTransition(async () => {
      const resultado = await cancelarAgendamentoCliente(agendamentoId, slug, base)
      if (resultado?.erro) {
        setErro(resultado.erro)
        setConfirmando(false)
      }
    })
  }

  return (
    <div className="space-y-1 pt-1 border-t border-zinc-800">
      <div className="flex gap-2">
        <Link
          href={`${base}/agendar?reagendar=${agendamentoId}`}
          className="flex-1 text-center text-xs px-3 py-2 rounded-lg bg-zinc-800
                     hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          Reagendar
        </Link>

        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-zinc-800
                       hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
          >
            Cancelar
          </button>
        ) : (
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => setConfirmando(false)}
              className="flex-1 text-xs px-2 py-2 rounded-lg bg-zinc-800 text-zinc-400 transition-colors"
            >
              Não
            </button>
            <button
              onClick={cancelar}
              disabled={isPending}
              className="flex-1 text-xs px-2 py-2 rounded-lg bg-red-900/60
                         hover:bg-red-800 text-red-400 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}
    </div>
  )
}
