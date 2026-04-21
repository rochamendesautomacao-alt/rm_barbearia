import { redirect } from 'next/navigation'
import { getTenantAutenticado } from '@/lib/tenant'
import { getStatusPlano, getPlanos } from '@/lib/planos'
import PainelPlano from '@/components/dashboard/planos/PainelPlano'
import CardsPlanos from '@/components/dashboard/planos/CardsPlanos'

export default async function ConfiguracoesPage() {
  const tenant = await getTenantAutenticado()
  if (!tenant) redirect('/login')

  const [status, planos] = await Promise.all([
    getStatusPlano(tenant.empresa_id),
    getPlanos(),
  ])

  return (
    <div className="px-4 py-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-white text-2xl font-black tracking-tight">Configurações</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Plano, assinatura e conta</p>
      </div>

      {/* Uso atual do plano */}
      {status ? (
        <section className="space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Uso atual
          </h2>
          <PainelPlano status={status} />
        </section>
      ) : (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          Nenhuma assinatura ativa encontrada. Entre em contato com o suporte.
        </div>
      )}

      {/* Comparativo de planos */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Planos disponíveis
        </h2>
        <CardsPlanos
          planos={planos as any}
          planoAtual={status?.plano_nome ?? ''}
        />
      </section>

      {/* Info da empresa */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Sua empresa
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div>
            <p className="text-zinc-500 text-xs">Nome</p>
            <p className="text-white text-sm font-medium">{tenant.empresa_nome}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Usuário</p>
            <p className="text-white text-sm">{tenant.usuario_nome}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Perfil</p>
            <p className="text-white text-sm capitalize">{tenant.role}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
