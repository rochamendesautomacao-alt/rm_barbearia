'use client'

interface Plano {
  id:                   string
  nome:                 string
  preco_mensal:         number
  max_barbeiros:        number
  max_agendamentos_mes: number
  recursos:             Record<string, boolean>
}

interface Props {
  planos:        Plano[]
  planoAtual:    string
}

const RECURSOS_LABELS: Record<string, string> = {
  relatorios:         'Relatórios financeiros',
  personalizar_cores: 'Personalizar cores',
  exportar_csv:       'Exportar dados CSV',
}

export default function CardsPlanos({ planos, planoAtual }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {planos.map(plano => {
        const atual     = plano.nome === planoAtual
        const ilimitado = plano.max_agendamentos_mes >= 9999

        return (
          <div
            key={plano.id}
            className={[
              'rounded-2xl border p-5 flex flex-col gap-4',
              atual
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-zinc-800 bg-zinc-900',
            ].join(' ')}
          >
            {/* Nome e preço */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-semibold">{plano.nome}</h3>
                {atual && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                <span className="text-sm font-normal text-zinc-400">R$</span>
                {' '}{plano.preco_mensal.toFixed(2).replace('.', ',')}
                <span className="text-sm font-normal text-zinc-400">/mês</span>
              </p>
            </div>

            {/* Limites */}
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2 text-zinc-300">
                <span className="text-amber-400">✓</span>
                Até {plano.max_barbeiros} barbeiro{plano.max_barbeiros > 1 ? 's' : ''}
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <span className="text-amber-400">✓</span>
                {ilimitado
                  ? 'Agendamentos ilimitados'
                  : `${plano.max_agendamentos_mes} agendamentos/mês`
                }
              </li>
              {Object.entries(RECURSOS_LABELS).map(([key, label]) => {
                const incluso = plano.recursos?.[key] === true
                return (
                  <li
                    key={key}
                    className={[
                      'flex items-center gap-2 text-sm',
                      incluso ? 'text-zinc-300' : 'text-zinc-600',
                    ].join(' ')}
                  >
                    <span className={incluso ? 'text-amber-400' : 'text-zinc-700'}>
                      {incluso ? '✓' : '×'}
                    </span>
                    {label}
                  </li>
                )
              })}
            </ul>

            {/* CTA */}
            {!atual && (
              <button
                className="mt-auto w-full py-2.5 bg-amber-500 hover:bg-amber-400
                           text-black font-semibold rounded-xl text-sm transition-colors"
                onClick={() => alert('Integração de pagamento em breve (Stripe)')}
              >
                Fazer upgrade
              </button>
            )}
            {atual && (
              <div className="mt-auto w-full py-2.5 bg-zinc-800 text-zinc-500
                              rounded-xl text-sm text-center">
                Plano atual
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
