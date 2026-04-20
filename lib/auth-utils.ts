import { createClient } from '@/lib/supabase/server'

/**
 * Retorna o supabase client e o empresa_id do usuário autenticado.
 * Lança erro se não autenticado ou sem empresa associada.
 * Centralizado aqui para evitar duplicação em actions/barbeiros, actions/servicos, actions/horarios.
 */
export async function getEmpresaId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!data?.empresa_id) throw new Error('Empresa não encontrada')
  return { supabase, empresa_id: data.empresa_id as string }
}
