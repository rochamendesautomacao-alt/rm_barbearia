import type { StatusPlano } from '@/lib/planos'

interface Props {
  status: StatusPlano
}

function BarraProgresso({ pct, critico }: { pct: number; critico: boolean }) {
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={[
          'h-full rounded-full transition-all',
          pct >= 100 ? 'bg-red-500' : critico ? 'bg-amber-500' : 'bg-green-500',
        ].join(' ')}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

const RECURSOS_LABELS: Record<string, string> = {
  relatorios:          'Relatórios financeiros',
  whatsapp:            'Notificações WhatsApp',
  personalizar_cores:  'Personalizar cores',
  exportar_csv:        'Exportar dados CSV',
}

export default function PainelPlano({ status }: Props) {
  const ilimitado = status.max_agendamentos_mes >= 9999

  return (
    <div className="space-y-5">
      {/* Cabeçalho do plano */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-zinc-400 text-xs mb-1">Plano atual</p>
            <h2 className="text-white text-xl font-bold">{status.plano_nome}</h2>
          </div>
          <span className={[
            'px-2.5 py-1 rounded-full text-xs font-medium shrink-0',
            status.status_assinatura === 'trial'   ? 'bg-amber-500/20 text-amber-400' : '',
            status.status_assinatura === 'ativa'   ? 'bg-green-500/20 text-green-400' : '',
            status.status_assinatura === 'suspensa' ? 'bg-red-500/20 text-red-400' : '',
          ].join(' ')}>
            {status.status_assinatura === 'trial' ? 'Trial' : status.status_assinatura}
          </span>
        </div>

        {/* Uso de barbeiros */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Barbeiros</span>
            <span className={[
              'text-sm font-medium tabular-nums',
              status.barbeiros_no_limite ? 'text-red-400' : 'text-white',
            ].join(' ')}>
              {status.barbeiros_em_uso} / {status.max_barbeiros}
            </span>
          </div>
          <BarraProgresso pct={status.pct_barbeiros} critico={status.pct_barbeiros >= 80} />
          {status.barbeiros_no_limite && (
            <p className="text-red-400 text-xs">Limite atingido — faça upgrade para adicionar mais</p>
          )}
        </div>

        {/* Uso de agendamentos */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Agendamentos este mês</span>
            <span className={[
              'text-sm font-medium tabular-nums',
              status.agendamentos_no_limite ? 'text-red-400' : 'text-white',
            ].join(' ')}>
              {status.agendamentos_mes} / {ilimitado ? '∞' : status.max_agendamentos_mes}
            </span>
          </div>
          {!ilimitado && (
            <BarraProgresso pct={status.pct_agendamentos} critico={status.pct_agendamentos >= 80} />
          )}
          {status.agendamentos_no_limite && (
            <p className="text-red-400 text-xs">Limite atingido — clientes não conseguem agendar</p>
          )}
        </div>
      </div>

      {/* Recursos incluídos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
          Recursos do plano
        </h3>
        <ul className="space-y-2.5">
          {Object.entries(RECURSOS_LABELS).map(([key, label]) => {
            const incluso = status.recursos?.[key] === true
            return (
              <li key={key} className="flex items-center gap-2.5">
                <span className={incluso ? 'text-green-400' : 'text-zinc-700'}>
                  {incluso ? '✓' : '×'}
                </span>
                <span className={incluso ? 'text-white text-sm' : 'text-zinc-600 text-sm line-through'}>
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
