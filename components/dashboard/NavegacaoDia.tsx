'use client'

import { useRouter } from 'next/navigation'

interface Props {
  dataAtual: string
}

function moverDia(dataStr: string, dias: number) {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

function isHoje(dataStr: string) {
  return dataStr === new Date().toISOString().split('T')[0]
}

export default function NavegacaoDia({ dataAtual }: Props) {
  const router = useRouter()

  function navegar(data: string) {
    router.push(`/agenda?data=${data}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navegar(moverDia(dataAtual, -1))}
        className="w-9 h-9 flex items-center justify-center bg-zinc-900 border border-zinc-800
                   rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        ‹
      </button>

      <button
        onClick={() => navegar(new Date().toISOString().split('T')[0])}
        disabled={isHoje(dataAtual)}
        className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-lg
                   text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors
                   text-sm disabled:text-zinc-700 disabled:cursor-default"
      >
        {isHoje(dataAtual) ? 'Hoje' : 'Ir para hoje'}
      </button>

      <button
        onClick={() => navegar(moverDia(dataAtual, 1))}
        className="w-9 h-9 flex items-center justify-center bg-zinc-900 border border-zinc-800
                   rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        ›
      </button>
    </div>
  )
}
