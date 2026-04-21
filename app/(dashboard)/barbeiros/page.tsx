import { createClient } from '@/lib/supabase/server'
import ListaBarbeiros from '@/components/dashboard/ListaBarbeiros'

export default async function BarbeirosPage() {
  const supabase = await createClient()

  const { data: barbeiros } = await supabase
    .from('barbeiros')
    .select('id, nome, bio, telefone, ativo, usuario_id')
    .order('nome')

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-2xl font-black tracking-tight">Barbeiros</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Gerencie a equipe da barbearia</p>
      </div>

      <ListaBarbeiros barbeiros={barbeiros ?? []} />
    </div>
  )
}
