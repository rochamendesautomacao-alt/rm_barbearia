'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DIAS_VALIDOS = ['0', '1', '2', '3', '4', '5', '6'] as const

const SchemaHorario = z.object({
  dia_semana:  z.enum(DIAS_VALIDOS),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fim:    z.string().regex(/^\d{2}:\d{2}$/),
})

async function getEmpresaId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data }: { data: any } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!data) throw new Error('Empresa não encontrada')
  return { supabase, empresa_id: data.empresa_id as string }
}

export async function listarHorarios() {
  const { supabase, empresa_id } = await getEmpresaId()
  const { data } = await (supabase as any)
    .from('horarios_funcionamento')
    .select('id, dia_semana, hora_inicio, hora_fim, ativo')
    .eq('empresa_id', empresa_id)
    .is('barbeiro_id', null)   // apenas regras da empresa toda
    .order('dia_semana')

  return data ?? []
}

export async function salvarHorario(formData: FormData) {
  const parsed = SchemaHorario.safeParse({
    dia_semana:  formData.get('dia_semana'),
    hora_inicio: formData.get('hora_inicio'),
    hora_fim:    formData.get('hora_fim'),
  })
  if (!parsed.success) return { erro: 'Dados inválidos' }

  const { hora_inicio, hora_fim } = parsed.data
  if (hora_fim <= hora_inicio) return { erro: 'Hora fim deve ser após hora início' }

  const { supabase, empresa_id } = await getEmpresaId()

  // Remove qualquer horário existente para este dia (empresa sem barbeiro específico)
  const { error: deleteErr } = await (supabase as any)
    .from('horarios_funcionamento')
    .delete()
    .eq('empresa_id', empresa_id)
    .eq('dia_semana', parsed.data.dia_semana)
    .is('barbeiro_id', null)

  if (deleteErr) return { erro: deleteErr.message }

  // Insere o novo horário
  const { error: insertErr } = await (supabase as any)
    .from('horarios_funcionamento')
    .insert({
      empresa_id,
      barbeiro_id: null,
      dia_semana:  parsed.data.dia_semana,
      hora_inicio,
      hora_fim,
      ativo: true,
    })

  if (insertErr) return { erro: insertErr.message }

  revalidatePath('/horarios')
  return { ok: true }
}

export async function toggleHorario(id: string, ativo: boolean) {
  const { supabase } = await getEmpresaId()

  const { error } = await (supabase as any)
    .from('horarios_funcionamento')
    .update({ ativo })
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/horarios')
  return { ok: true }
}

export async function excluirHorario(id: string) {
  const { supabase } = await getEmpresaId()

  const { error } = await (supabase as any)
    .from('horarios_funcionamento')
    .delete()
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/horarios')
  return { ok: true }
}
