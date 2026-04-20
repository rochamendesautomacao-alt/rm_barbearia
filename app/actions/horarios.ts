'use server'

import { revalidatePath } from 'next/cache'
import { getEmpresaId } from '@/lib/auth-utils'
import { z } from 'zod'

const DIAS_VALIDOS = ['0', '1', '2', '3', '4', '5', '6'] as const

const SchemaHorario = z.object({
  dia_semana:  z.enum(DIAS_VALIDOS),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fim:    z.string().regex(/^\d{2}:\d{2}$/),
})

export async function listarHorarios() {
  const { supabase, empresa_id } = await getEmpresaId()
  const { data } = await supabase
    .from('horarios_funcionamento')
    .select('id, dia_semana, hora_inicio, hora_fim, ativo')
    .eq('empresa_id', empresa_id)
    .is('barbeiro_id', null)
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

  const { error: deleteErr } = await supabase
    .from('horarios_funcionamento')
    .delete()
    .eq('empresa_id', empresa_id)
    .eq('dia_semana', parsed.data.dia_semana)
    .is('barbeiro_id', null)

  if (deleteErr) return { erro: deleteErr.message }

  const { error: insertErr } = await supabase
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

  const { error } = await supabase
    .from('horarios_funcionamento')
    .update({ ativo })
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/horarios')
  return { ok: true }
}

export async function excluirHorario(id: string) {
  const { supabase } = await getEmpresaId()

  const { error } = await supabase
    .from('horarios_funcionamento')
    .delete()
    .eq('id', id)

  if (error) return { erro: error.message }

  revalidatePath('/horarios')
  return { ok: true }
}
