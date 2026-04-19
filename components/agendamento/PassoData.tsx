'use client'

import { useState } from 'react'

interface Props {
  onSelecionar: (data: string) => void
  onVoltar:     () => void
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function PassoData({ onSelecionar, onVoltar }: Props) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [ano, setAno]   = useState(hoje.getFullYear())
  const [mes, setMes]   = useState(hoje.getMonth())

  const primeiroDia  = new Date(ano, mes, 1).getDay()   // 0=Dom
  const diasNoMes    = new Date(ano, mes + 1, 0).getDate()

  // limite máximo: 60 dias a partir de hoje
  const limite = new Date(hoje)
  limite.setDate(limite.getDate() + 60)

  function mesAnterior() {
    if (mes === 0) { setAno(a => a - 1); setMes(11) }
    else setMes(m => m - 1)
  }

  function proximoMes() {
    if (mes === 11) { setAno(a => a + 1); setMes(0) }
    else setMes(m => m + 1)
  }

  function isDiaPassado(dia: number) {
    const d = new Date(ano, mes, dia)
    return d < hoje
  }

  function isFuturoLonge(dia: number) {
    const d = new Date(ano, mes, dia)
    return d > limite
  }

  function isFimDeSemana(dia: number) {
    const dow = new Date(ano, mes, dia).getDay()
    return dow === 0 || dow === 6
  }

  function handleDia(dia: number) {
    if (isDiaPassado(dia) || isFuturoLonge(dia)) return
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    onSelecionar(dataStr)
  }

  // verifica se o mês anterior está totalmente no passado
  const podeIrAntes = (() => {
    const d = new Date(ano, mes, 1)
    const agora = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return d > agora
  })()

  const podeIrDepois = (() => {
    const d = new Date(ano, mes, 1)
    const max = new Date(limite.getFullYear(), limite.getMonth(), 1)
    return d < max
  })()

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="text-white text-lg font-semibold">Escolha a data</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Quando você quer ser atendido?</p>
      </div>

      {/* Cabeçalho do calendário */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={mesAnterior}
            disabled={!podeIrAntes}
            className="w-8 h-8 flex items-center justify-center text-zinc-400
                       hover:text-white disabled:text-zinc-700 disabled:cursor-not-allowed
                       rounded-lg hover:bg-zinc-800 transition-colors"
          >
            ‹
          </button>
          <span className="text-white font-medium text-sm">
            {MESES[mes]} {ano}
          </span>
          <button
            onClick={proximoMes}
            disabled={!podeIrDepois}
            className="w-8 h-8 flex items-center justify-center text-zinc-400
                       hover:text-white disabled:text-zinc-700 disabled:cursor-not-allowed
                       rounded-lg hover:bg-zinc-800 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-zinc-600 text-xs py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* células vazias antes do primeiro dia */}
          {Array.from({ length: primeiroDia }).map((_, i) => (
            <div key={`vazio-${i}`} />
          ))}

          {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
            const passado    = isDiaPassado(dia)
            const futuroLong = isFuturoLonge(dia)
            const fds        = isFimDeSemana(dia)
            const desabilitado = passado || futuroLong || fds

            return (
              <button
                key={dia}
                onClick={() => handleDia(dia)}
                disabled={desabilitado}
                className={[
                  'h-9 w-full rounded-lg text-sm font-medium transition-all',
                  desabilitado
                    ? 'text-zinc-700 cursor-not-allowed'
                    : 'text-white hover:bg-amber-500 hover:text-black active:scale-95',
                ].join(' ')}
              >
                {dia}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-zinc-600 text-xs text-center">
        Fins de semana e datas passadas indisponíveis
      </p>

      <button
        onClick={onVoltar}
        className="w-full py-3 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        ← Voltar
      </button>
    </div>
  )
}
