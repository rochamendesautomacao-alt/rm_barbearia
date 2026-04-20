'use server'

import { revalidatePath } from 'next/cache'
import { getEmpresaId } from '@/lib/auth-utils'
import { z } from 'zod'

const Schema = z.object({
  nome:             z.string().min(2).max(100),
  descricao:        z.string().max(300).optional(),
  duracao_minutos:  z.coerce.number().min(10).max(480),
  preco:            z.coerce.number().min(0),
})

export async function criarServico(formData: FormData) {
  const parsed = Schema.safeParse({
    nome:            formData.get('nome'),
    descricao:       formData.get('descricao') || undefined,
    duracao_minutos: formData.get('duracao_minutos'),
    preco:           formData.get('preco'),
  })
  if (!parsed.success) return { erro: 'Dados inválidos', detalhes: parsed.error.flatten() }

  const { supabase, empresa_id } = await getEmpresaId()

  const { error } = await supabase
    .from('servicos')
    .insert({ ...parsed.data, empresa_id })

  if (error) return { erro: error.message }

  revalidatePath('/servicos')
  return { ok: true }
}

export async function editarServico(id: string, formData: FormData) {
  const parsed = Schema.safeParse({
    nome:            formData.get('nome'),
    descricao:       formData.get('descricao') || undefined,
    duracao_minutos: formData.get('duracao_minutos'),
    preco:           formData.get('preco'),
  })
  if (!parsed.success) return { erro: 'Dados inválidos' }

  const { supabase } = await getEmpresaId()

  const { error } = await supabase
    .from('servicos')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/servicos')
  return { ok: true }
}

export async function toggleServico(id: string, ativo: boolean) {
  const { supabase } = await getEmpresaId()

  const { error } = await supabase
    .from('servicos')
    .update({ ativo })
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/servicos')
  return { ok: true }
}
