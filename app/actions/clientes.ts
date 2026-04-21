'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioComEmpresa } from '@/app/actions/auth'

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: CRUD de clientes
// ─────────────────────────────────────────────────────────────────────────────

export async function criarCliente(formData: FormData) {
  const usuario = await getUsuarioComEmpresa()
  if (!usuario) return { erro: 'Não autenticado' }

  const nome       = (formData.get('nome') as string)?.trim()
  const telefone   = (formData.get('telefone') as string)?.replace(/\D/g, '')
  const email      = (formData.get('email') as string)?.trim() || null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null

  if (!nome || nome.length < 2) return { erro: 'Nome inválido' }
  if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .insert({ nome, telefone, email, observacoes, empresa_id: usuario.empresa_id })

  if (error) {
    if (error.code === '23505') return { erro: 'Já existe um cliente com este telefone' }
    return { erro: error.message }
  }

  revalidatePath('/clientes')
  return { ok: true }
}

export async function editarCliente(id: string, formData: FormData) {
  const usuario = await getUsuarioComEmpresa()
  if (!usuario) return { erro: 'Não autenticado' }

  const nome       = (formData.get('nome') as string)?.trim()
  const telefone   = (formData.get('telefone') as string)?.replace(/\D/g, '')
  const email      = (formData.get('email') as string)?.trim() || null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null

  if (!nome || nome.length < 2) return { erro: 'Nome inválido' }
  if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .update({ nome, telefone, email, observacoes })
    .eq('id', id)
    .eq('empresa_id', usuario.empresa_id)

  if (error) {
    if (error.code === '23505') return { erro: 'Já existe um cliente com este telefone' }
    return { erro: error.message }
  }

  revalidatePath('/clientes')
  return { ok: true }
}

const escapeIlike = (s: string) => s.replace(/[\\%_]/g, c => `\\${c}`)

export async function buscarClientes(q: string, empresaId: string) {
  const supabase = await createClient()
  const eq = escapeIlike(q)

  const { data } = await supabase
    .from('clientes')
    .select('id, nome, telefone, email')
    .eq('empresa_id', empresaId)
    .or(`nome.ilike.%${eq}%,telefone.ilike.%${eq}%`)
    .order('nome')
    .limit(10)

  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICO: Registro e login de clientes (sem senha — OTP por e-mail)
// ─────────────────────────────────────────────────────────────────────────────

import {
  _solicitarOtpImpl,
  _verificarOtpImpl,
  _cadastrarClienteOtpImpl,
} from '@/lib/auth-otp'

export async function solicitarOtp(slug: string, formData: FormData) {
  return _solicitarOtpImpl(slug, formData)
}

export async function verificarOtp(slug: string, formData: FormData) {
  return _verificarOtpImpl(slug, formData, `/${slug}`)
}

export async function cadastrarClienteOtp(slug: string, formData: FormData) {
  return _cadastrarClienteOtpImpl(slug, formData)
}

export async function logoutCliente(slug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${slug}/entrar`)
}

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICO: Dados do cliente logado
// ─────────────────────────────────────────────────────────────────────────────

export async function getClienteAutenticado(empresaId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nome, telefone, email')
    .eq('auth_user_id', user.id)
    .eq('empresa_id', empresaId)
    .single()

  return cliente
}

export async function getAgendamentosCliente(clienteId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('agendamentos')
    .select(`
      id, servico_id, barbeiro_id, data_hora_inicio, data_hora_fim, status, preco_cobrado,
      barbeiros(nome),
      servicos(nome)
    `)
    .eq('cliente_id', clienteId)
    .order('data_hora_inicio', { ascending: false })

  return (data ?? []) as any[]
}

export async function cancelarAgendamentoCliente(agendamentoId: string, slug: string, basePath?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!cliente) return { erro: 'Cliente não encontrado' }

  const admin = createAdminClient()
  const { data: agendamento } = await admin
    .from('agendamentos')
    .select('id, status')
    .eq('id', agendamentoId)
    .eq('cliente_id', cliente.id)
    .single()

  if (!agendamento) return { erro: 'Agendamento não encontrado' }

  if (!['pendente', 'confirmado'].includes(agendamento.status)) {
    return { erro: 'Este agendamento não pode ser cancelado' }
  }

  const { error } = await admin
    .from('agendamentos')
    .update({ status: 'cancelado', cancelado_em: new Date().toISOString() })
    .eq('id', agendamentoId)

  if (error) return { erro: 'Erro ao cancelar agendamento' }

  revalidatePath(basePath ? `${basePath}/meus-agendamentos` : `/${slug}/meus-agendamentos`)
  return { ok: true }
}
