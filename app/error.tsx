'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Aqui você pode integrar Sentry: Sentry.captureException(error)
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-white text-xl font-bold">Algo deu errado</h1>
          <p className="text-zinc-400 text-sm">
            Ocorreu um erro inesperado. Nossa equipe foi notificada.
          </p>
          {error.digest && (
            <p className="text-zinc-600 text-xs font-mono">ID: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
