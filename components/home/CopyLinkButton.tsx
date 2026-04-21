'use client'

import { useState } from 'react'

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    const url = `${window.location.origin}/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      onClick={copiar}
      title="Copiar link de agendamento"
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
        'border transition-all duration-200 shrink-0',
        copiado
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white',
      ].join(' ')}
    >
      {copiado ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copiado!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Link agendamento
        </>
      )}
    </button>
  )
}
