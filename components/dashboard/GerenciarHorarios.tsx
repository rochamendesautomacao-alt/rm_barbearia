'use client'

import { useState, useTransition } from 'react'
import { salvarHorario, toggleHorario, excluirHorario } from '@/app/actions/horarios'

const DIAS = [
  { value: '1', label: 'Segunda-feira',  abrev: 'Seg' },
  { value: '2', label: 'Terça-feira',    abrev: 'Ter' },
  { value: '3', label: 'Quarta-feira',   abrev: 'Qua' },
  { value: '4', label: 'Quinta-feira',   abrev: 'Qui' },
  { value: '5', label: 'Sexta-feira',    abrev: 'Sex' },
  { value: '6', label: 'Sábado',         abrev: 'Sáb' },
  { value: '0', label: 'Domingo',        abrev: 'Dom' },
]

interface Horario {
  id: string
  dia_semana: string
  hora_inicio: string
  hora_fim:    string
  ativo:       boolean
}

interface Props {
  horarios: Horario[]
}

function nomeDia(val: string) {
  return DIAS.find(d => d.value === val)?.label ?? val
}

function formatarHora(h: string) {
  // postgres retorna "HH:MM:SS" — removemos os segundos
  return h.slice(0, 5)
}

export default function GerenciarHorarios({ horarios: inicial }: Props) {
  const [horarios, setHorarios] = useState<Horario[]>(inicial)
  const [diaForm, setDiaForm]   = useState('1')
  const [inicio, setInicio]     = useState('08:00')
  const [fim, setFim]           = useState('18:00')
  const [erro, setErro]         = useState<string | null>(null)
  const [sucesso, setSucesso]   = useState(false)
  const [isPending, startTransition] = useTransition()

  // dias que ainda não foram cadastrados
  const diasCadastrados = new Set(horarios.map(h => h.dia_semana))
  const diasDisponiveis = DIAS.filter(d => !diasCadastrados.has(d.value))

  // ao montar o formulário, pré-selecionar primeiro dia disponível
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setSucesso(false)

    const fd = new FormData()
    fd.set('dia_semana', diaForm)
    fd.set('hora_inicio', inicio)
    fd.set('hora_fim', fim)

    startTransition(async () => {
      const res = await salvarHorario(fd)
      if ('erro' in res && res.erro) { setErro(res.erro); return }

      // atualiza a lista localmente (substitui ou adiciona)
      const novo: Horario = {
        id: Date.now().toString(), // temporário; o servidor vai recarregar
        dia_semana: diaForm,
        hora_inicio: inicio,
        hora_fim: fim,
        ativo: true,
      }
      setHorarios(prev => {
        const filtrado = prev.filter(h => h.dia_semana !== diaForm)
        return [...filtrado, novo].sort((a, b) =>
          Number(a.dia_semana === '0' ? 7 : a.dia_semana) -
          Number(b.dia_semana === '0' ? 7 : b.dia_semana)
        )
      })
      setSucesso(true)
      // avança pra próximo dia disponível
      const prox = DIAS.find(d => !diasCadastrados.has(d.value) && d.value !== diaForm)
      if (prox) setDiaForm(prox.value)
      setTimeout(() => setSucesso(false), 3000)
    })
  }

  function handleToggle(id: string, ativo: boolean) {
    setHorarios(prev => prev.map(h => h.id === id ? { ...h, ativo } : h))
    startTransition(async () => {
      await toggleHorario(id, ativo)
    })
  }

  function handleExcluir(id: string) {
    setHorarios(prev => prev.filter(h => h.id !== id))
    startTransition(async () => {
      await excluirHorario(id)
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Formulário de adição ── */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">Adicionar / Editar dia</h2>

        {/* Seletor visual de dias */}
        <div>
          <label className="text-xs text-zinc-400 block mb-2">Dia da semana</label>
          <div className="grid grid-cols-7 gap-1">
            {DIAS.map(d => {
              const jaExiste = diasCadastrados.has(d.value)
              const ativo    = diaForm === d.value
              return (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setDiaForm(d.value)}
                  className={[
                    'rounded-lg py-2 text-xs font-semibold transition-all border',
                    ativo
                      ? 'bg-amber-500 border-amber-500 text-black'
                      : jaExiste
                      ? 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-amber-500/50 hover:text-zinc-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-amber-500/50 hover:text-white',
                  ].join(' ')}
                >
                  {d.abrev}
                  {jaExiste && !ativo && (
                    <span className="block text-[8px] text-amber-600 leading-none mt-0.5">✓</span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-zinc-600 text-xs mt-1.5">
            {diasCadastrados.has(diaForm) ? '⚠️ Este dia já possui horário — salvar irá atualizá-lo.' : ''}
          </p>
        </div>

        {/* Horários */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="hora_inicio" className="text-xs text-zinc-400">Abertura</label>
            <input
              id="hora_inicio"
              type="time"
              value={inicio}
              onChange={e => setInicio(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5
                         text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="hora_fim" className="text-xs text-zinc-400">Fechamento</label>
            <input
              id="hora_fim"
              type="time"
              value={fim}
              onChange={e => setFim(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5
                         text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {erro && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>
        )}
        {sucesso && (
          <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            ✓ Horário salvo com sucesso!
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500
                     text-black font-semibold rounded-xl py-3 text-sm transition-all"
        >
          {isPending ? 'Salvando...' : diasCadastrados.has(diaForm) ? 'Atualizar horário' : 'Adicionar horário'}
        </button>
      </form>

      {/* ── Lista de horários cadastrados ── */}
      <div className="space-y-2">
        <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
          Horários cadastrados ({horarios.length}/7)
        </h2>

        {horarios.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm">Nenhum horário cadastrado.</p>
            <p className="text-zinc-600 text-xs mt-1">Use o formulário acima para adicionar os dias de funcionamento.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...horarios]
              .sort((a, b) =>
                Number(a.dia_semana === '0' ? 7 : a.dia_semana) -
                Number(b.dia_semana === '0' ? 7 : b.dia_semana)
              )
              .map(h => (
                <div
                  key={h.id}
                  className={[
                    'bg-zinc-900 border rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all',
                    h.ativo ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* badge dia */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                      ${h.ativo ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {DIAS.find(d => d.value === h.dia_semana)?.abrev ?? h.dia_semana}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{nomeDia(h.dia_semana)}</p>
                      <p className="text-zinc-400 text-xs">
                        {formatarHora(h.hora_inicio)} – {formatarHora(h.hora_fim)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle ativo */}
                    <button
                      onClick={() => handleToggle(h.id, !h.ativo)}
                      title={h.ativo ? 'Desativar' : 'Ativar'}
                      className={[
                        'w-10 h-6 rounded-full transition-all relative',
                        h.ativo ? 'bg-amber-500' : 'bg-zinc-700',
                      ].join(' ')}
                    >
                      <span className={[
                        'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
                        h.ativo ? 'left-5' : 'left-1',
                      ].join(' ')} />
                    </button>

                    {/* Editar (seleciona o dia no form) */}
                    <button
                      onClick={() => {
                        setDiaForm(h.dia_semana)
                        setInicio(formatarHora(h.hora_inicio))
                        setFim(formatarHora(h.hora_fim))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      title="Editar"
                      className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-amber-400
                                 rounded-lg hover:bg-zinc-800 transition-colors text-base"
                    >
                      ✏️
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${nomeDia(h.dia_semana)} do funcionamento?`)) {
                          handleExcluir(h.id)
                        }
                      }}
                      title="Excluir"
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-red-400
                                 rounded-lg hover:bg-zinc-800 transition-colors text-base"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">ℹ️ Como funciona</p>
        <p>Os horários cadastrados aqui definem quando os clientes podem agendar online.</p>
        <p>Você pode configurar horários individuais por barbeiro na página de Barbeiros.</p>
      </div>
    </div>
  )
}
