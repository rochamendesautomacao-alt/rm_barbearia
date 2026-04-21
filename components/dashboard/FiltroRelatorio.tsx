'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  de:  string
  ate: string
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

const PRESETS = [
  {
    label: 'Hoje',
    fn: () => {
      const h = fmt(new Date())
      return { de: h, ate: h }
    },
  },
  {
    label: 'Esta semana',
    fn: () => {
      const hoje = new Date()
      const inicio = new Date(hoje)
      inicio.setDate(hoje.getDate() - hoje.getDay())
      return { de: fmt(inicio), ate: fmt(hoje) }
    },
  },
  {
    label: 'Este mês',
    fn: () => {
      const hoje = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return { de: fmt(inicio), ate: fmt(hoje) }
    },
  },
  {
    label: 'Mês anterior',
    fn: () => {
      const hoje = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const fim    = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      return { de: fmt(inicio), ate: fmt(fim) }
    },
  },
]

export default function FiltroRelatorio({ de, ate }: Props) {
  const router    = useRouter()
  const [local, setLocal] = useState({ de, ate })

  function aplicar(novoDe: string, novoAte: string) {
    router.push(`/relatorios?de=${novoDe}&ate=${novoAte}`)
  }

  function handlePreset(preset: typeof PRESETS[number]) {
    const vals = preset.fn()
    setLocal(vals)
    aplicar(vals.de, vals.ate)
  }

  function handleCustom() {
    if (local.de && local.ate && local.de <= local.ate) {
      aplicar(local.de, local.ate)
    }
  }

  const ativoPreset = PRESETS.find(p => {
    const v = p.fn()
    return v.de === de && v.ate === ate
  })?.label ?? null

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className={[
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
              ativoPreset === p.label
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Datas customizadas */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">De</label>
          <input
            type="date"
            value={local.de}
            onChange={e => setLocal(v => ({ ...v, de: e.target.value }))}
            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/50
                       transition-all duration-200"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Até</label>
          <input
            type="date"
            value={local.ate}
            onChange={e => setLocal(v => ({ ...v, ate: e.target.value }))}
            className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/50
                       transition-all duration-200"
          />
        </div>
        <button
          onClick={handleCustom}
          disabled={!local.de || !local.ate || local.de > local.ate}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40
                     text-black font-bold rounded-xl text-sm transition-all duration-200 active:scale-95
                     shadow-md shadow-amber-500/10"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}
