import { createClient } from '@/lib/supabase/server'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import ListaClientes from '@/components/dashboard/ListaClientes'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q }    = await searchParams
  const usuario  = await getUsuarioComEmpresa()
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select(`
      id, nome, telefone, email, observacoes,
      agendamentos(count)
    `)
    .order('nome')

  if (q) {
    query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`)
  }

  const { data: raw } = await query

  const clientes = (raw ?? []).map((c: any) => ({
    id:         c.id,
    nome:       c.nome,
    telefone:   c.telefone,
    email:      c.email,
    observacoes: c.observacoes,
    visitas:    (c.agendamentos as any[])?.[0]?.count ?? 0,
  }))

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-xl font-bold">Clientes</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{clientes.length} clientes cadastrados</p>
      </div>

      {/* Busca */}
      <form method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3
                     text-white placeholder-zinc-600 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </form>

      <ListaClientes
        clientes={clientes}
        empresaId={usuario?.empresa_id ?? ''}
      />
    </div>
  )
}
