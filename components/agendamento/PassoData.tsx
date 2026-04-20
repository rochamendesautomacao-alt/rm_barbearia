import { useState } from 'react'

interface Props {
  diasAtivos:   number[]   // dias da semana abertos (0=Dom..6=Sáb)
  onSelecionar: (data: string) => void
  onVoltar:     () => void
}

const DIAS_SEMANA_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function PassoData({ diasAtivos, onSelecionar, onVoltar }: Props) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [ano, setAno]   = useState(hoje.getFullYear())
  const [mes, setMes]   = useState(hoje.getMonth())
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null)

  const primeiroDia  = new Date(ano, mes, 1).getDay()   // 0=Dom
  const diasNoMes    = new Date(ano, mes + 1, 0).getDate()

  // limite máximo: 60 dias a partir de hoje
  const limite = new Date(hoje)
  limite.setDate(limite.getDate() + 60)

  function mesAnterior() {
    if (mes === 0) { setAno(a => a - 1); setMes(11) }
    else setMes(m => m - 1)
    setDataSelecionada(null)
  }

  function proximoMes() {
    if (mes === 11) { setAno(a => a + 1); setMes(0) }
    else setMes(m => m + 1)
    setDataSelecionada(null)
  }

  function isDiaPassado(dia: number) {
    const d = new Date(ano, mes, dia)
    return d < hoje
  }

  function isFuturoLonge(dia: number) {
    const d = new Date(ano, mes, dia)
    return d > limite
  }

  function isDiaFechado(dia: number) {
    const dow = new Date(ano, mes, dia).getDay()
    return diasAtivos.length > 0 ? !diasAtivos.includes(dow) : dow === 0
  }

  function toDataStr(dia: number) {
    return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function handleDia(dia: number) {
    if (isDiaPassado(dia) || isFuturoLonge(dia) || isDiaFechado(dia)) return
    setDataSelecionada(toDataStr(dia))
  }

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
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-white text-xl font-bold italic tracking-tighter uppercase">Qual o melhor dia?</h2>
        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-black text-[10px]">Agendamento disponível para próximos 60 dias</p>
      </div>

      {/* Cabeçalho do calendário */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={mesAnterior}
            disabled={!podeIrAntes}
            className="w-10 h-10 flex items-center justify-center text-zinc-400
                       hover:text-white disabled:text-zinc-800 disabled:cursor-not-allowed
                       rounded-2xl hover:bg-zinc-800 transition-all active:scale-90 border border-zinc-800/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <span className="text-white font-black text-sm uppercase tracking-widest italic">
              {MESES[mes]}
            </span>
            <span className="text-zinc-600 font-bold text-[10px] ml-2">
              {ano}
            </span>
          </div>

          <button
            onClick={proximoMes}
            disabled={!podeIrDepois}
            className="w-10 h-10 flex items-center justify-center text-zinc-400
                       hover:text-white disabled:text-zinc-800 disabled:cursor-not-allowed
                       rounded-2xl hover:bg-zinc-800 transition-all active:scale-90 border border-zinc-800/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-4">
          {DIAS_SEMANA_ABBR.map((d, i) => (
            <div key={d} className={`text-center text-[10px] py-1 font-black uppercase tracking-tighter ${i === 0 ? 'text-red-500/50' : 'text-zinc-600'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primeiroDia }).map((_, i) => (
            <div key={`vazio-${i}`} />
          ))}

          {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
            const passado    = isDiaPassado(dia)
            const futuroLong = isFuturoLonge(dia)
            const fechado     = isDiaFechado(dia)
            const desabilitado = passado || futuroLong || fechado
            const dataStr = toDataStr(dia)
            const selecionado = dataSelecionada === dataStr

            return (
              <button
                key={dia}
                onClick={() => handleDia(dia)}
                disabled={desabilitado}
                className={[
                  'h-11 w-full rounded-xl text-xs font-black transition-all duration-300 relative group',
                  desabilitado
                    ? 'text-zinc-800 cursor-not-allowed'
                    : selecionado
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-110 z-10'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white hover:scale-105 active:scale-90',
                ].join(' ')}
              >
                {dia}
                {!desabilitado && !selecionado && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <button
          onClick={() => { if (dataSelecionada) onSelecionar(dataSelecionada) }}
          disabled={!dataSelecionada}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-700
                     text-black font-black uppercase tracking-widest
                     rounded-2xl py-5 text-sm transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98]"
        >
          {dataSelecionada ? 'Avançar para horários' : 'Selecione uma data'}
        </button>
        
        <button
          onClick={onVoltar}
          className="w-full py-3 text-zinc-600 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          ← Voltar para Profissionais
        </button>
      </div>
    </div>
  )
}
