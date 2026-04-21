'use client'

import { useRouter } from 'next/navigation'

interface Props {
  dataAtual: string
  filtroAtivo?: boolean
  pendentesCount?: number
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

export default function NavegacaoDia({ dataAtual, filtroAtivo = false, pendentesCount = 0 }: Props) {
  const router = useRouter()
  const hoje   = isHoje(dataAtual)

  function navegar(data: string) {
    router.push(`/agenda?data=${data}`)
  }

  if (filtroAtivo) {
    return (
      <button
        onClick={() => navegar(new Date().toISOString().split('T')[0])}
        className="flex items-center gap-2 h-9 px-4 bg-zinc-900 border border-zinc-800 rounded-xl
                   text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700
                   text-sm font-medium transition-all duration-200 active:scale-95"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar à agenda
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navegar(moverDia(dataAtual, -1))}
          className="w-9 h-9 flex items-center justify-center bg-zinc-900 border border-zinc-800
                     rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700
                     transition-all duration-200 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <button
          onClick={() => navegar(new Date().toISOString().split('T')[0])}
          disabled={hoje}
          className={[
            'flex-1 h-9 border rounded-xl text-sm font-medium transition-all duration-200',
            hoje
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-default'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700',
          ].join(' ')}
        >
          {hoje ? 'Hoje' : 'Ir para hoje'}
        </button>

        <button
          onClick={() => navegar(moverDia(dataAtual, 1))}
          className="w-9 h-9 flex items-center justify-center bg-zinc-900 border border-zinc-800
                     rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700
                     transition-all duration-200 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {pendentesCount > 0 && (
        <button
          onClick={() => router.push('/agenda?filtro=pendentes')}
          className="w-full h-9 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20
                     rounded-xl text-red-400 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300
                     text-sm font-medium transition-all duration-200 active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Pendentes do mês
          <span className="bg-red-500/20 text-red-400 text-xs font-black px-1.5 py-0.5 rounded-md">
            {pendentesCount}
          </span>
        </button>
      )}
    </div>
  )
}
