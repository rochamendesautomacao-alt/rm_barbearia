'use server'

import { revalidatePath } from 'next/cache'
import { verificarLimiteBarbeiro, tratarErroBanco } from '@/lib/planos'
import { getEmpresaId } from '@/lib/auth-utils'
import { z } from 'zod'

const Schema = z.object({
  nome:     z.string().min(2).max(100),
  bio:      z.string().max(300).optional(),
  telefone: z.string().max(20).optional(),
})

export async function criarBarbeiro(formData: FormData) {
  const parsed = Schema.safeParse({
    nome:     formData.get('nome'),
    bio:      formData.get('bio') || undefined,
    telefone: formData.get('telefone') || undefined,
  })
  if (!parsed.success) return { erro: 'Dados inválidos' }

  const { supabase, empresa_id } = await getEmpresaId()

  // verifica limite do plano antes de tentar inserir
  const limite = await verificarLimiteBarbeiro(empresa_id)
  if (!limite.permitido) return { erro: limite.motivo }

  const { error } = await supabase
    .from('barbeiros')
    .insert({ ...parsed.data, empresa_id })

  if (error) {
    const erroPlano = tratarErroBanco(error.message)
    return { erro: erroPlano ?? error.message }
  }

  revalidatePath('/barbeiros')
  return { ok: true }
}

export async function editarBarbeiro(id: string, formData: FormData) {
  const parsed = Schema.safeParse({
    nome:     formData.get('nome'),
    bio:      formData.get('bio') || undefined,
    telefone: formData.get('telefone') || undefined,
  })
  if (!parsed.success) return { erro: 'Dados inválidos' }

  const { supabase } = await getEmpresaId()

  const { error } = await supabase
    .from('barbeiros')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/barbeiros')
  return { ok: true }
}

export async function toggleBarbeiro(id: string, ativo: boolean) {
  const { supabase } = await getEmpresaId()

  const { error } = await supabase
    .from('barbeiros')
    .update({ ativo })
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/barbeiros')
  return { ok: true }
}
