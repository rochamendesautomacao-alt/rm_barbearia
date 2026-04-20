'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
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
  const [isPending,   startTransition] = useTransition()

  if (!['pendente', 'confirmado'].includes(status)) return null

  function cancelar() {
    startTransition(async () => {
      try {
        const resultado = await cancelarAgendamentoCliente(agendamentoId, slug, base)
        if (resultado?.erro) {
          toast.error(resultado.erro)
          setConfirmando(false)
        } else {
          toast.success('Agendamento cancelado com sucesso')
        }
      } catch (err) {
        toast.error('Erro ao cancelar agendamento')
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
                     hover:bg-zinc-700 text-zinc-300 transition-all active:scale-[0.98]"
        >
          Reagendar
        </Link>

        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-zinc-800
                       hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
        ) : (
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => setConfirmando(false)}
              className="flex-1 text-xs px-2 py-2 rounded-lg bg-zinc-800 text-zinc-400 transition-all active:scale-[0.98]"
            >
              Não
            </button>
            <button
              onClick={cancelar}
              disabled={isPending}
              className="flex-1 text-xs px-2 py-2 rounded-lg bg-red-900/60
                         hover:bg-red-800 text-red-400 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isPending ? '...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
