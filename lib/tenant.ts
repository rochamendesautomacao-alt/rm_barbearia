import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface TenantPublico {
  id:          string
  nome:        string
  slug:        string
  logo_url:    string | null
  cor_primaria: string
  telefone:    string | null
  cidade:      string | null
  estado:      string | null
}

export interface TenantAutenticado {
  empresa_id:   string
  empresa_nome: string
  usuario_id:   string
  usuario_nome: string
  role:         'admin' | 'barbeiro'
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve tenant pelo slug (página pública de agendamento)
// cache() do React deduplicará chamadas repetidas na mesma requisição
// ─────────────────────────────────────────────────────────────────────────────
export const getTenantPorSlug = cache(async (slug: string): Promise<TenantPublico | null> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('empresas')
    .select('id, nome, slug, logo_url, cor_primaria, telefone, cidade, estado')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  return data
})

// ─────────────────────────────────────────────────────────────────────────────
// Resolve tenant do usuário autenticado (dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const getTenantAutenticado = cache(async (): Promise<TenantAutenticado | null> => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('id, nome, role, empresa_id, empresas(nome)')
    .eq('id', user.id)
    .single()

  if (!data) return null

  return {
    empresa_id:   data.empresa_id,
    empresa_nome: (data.empresas as any)?.nome ?? '',
    usuario_id:   data.id,
    usuario_nome: data.nome,
    role:         data.role,
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Valida que um recurso pertence ao tenant do usuário autenticado
// Lança erro se o empresa_id não bater — proteção extra além do RLS
// ─────────────────────────────────────────────────────────────────────────────
export async function assertTenant(empresaIdRecurso: string): Promise<void> {
  const tenant = await getTenantAutenticado()

  if (!tenant || tenant.empresa_id !== empresaIdRecurso) {
    throw new Error('Acesso negado: recurso não pertence à sua empresa')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Valida que o slug da URL corresponde ao empresa_id informado no body
// Usada nas API routes públicas para evitar IDs cruzados
// ─────────────────────────────────────────────────────────────────────────────
export async function validarEmpresaId(empresaId: string, slug: string): Promise<boolean> {
  const tenant = await getTenantPorSlug(slug)
  return tenant?.id === empresaId
}
