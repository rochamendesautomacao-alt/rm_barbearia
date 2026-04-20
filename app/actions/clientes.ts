'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import { getTenantPorSlug } from '@/lib/tenant'

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

export async function buscarClientes(q: string, empresaId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('clientes')
    .select('id, nome, telefone, email')
    .eq('empresa_id', empresaId)
    .or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`)
    .order('nome')
    .limit(10)

  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// PÚBLICO: Registro e login de clientes
// ─────────────────────────────────────────────────────────────────────────────

export async function cadastrarCliente(
  slug: string,
  formData: FormData
) {
  const nome     = (formData.get('nome') as string)?.trim()
  const email    = (formData.get('email') as string)?.trim()
  const telefone = (formData.get('telefone') as string)?.replace(/\D/g, '')
  const senha    = formData.get('senha') as string

  if (!nome || nome.length < 2)        return { erro: 'Nome inválido' }
  if (!email || !email.includes('@'))  return { erro: 'E-mail inválido' }
  if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }
  if (!senha || senha.length < 6)      return { erro: 'Senha deve ter ao menos 6 caracteres' }

  const empresa = await getTenantPorSlug(slug)
  if (!empresa) return { erro: 'Barbearia não encontrada' }

  // Registra o usuário no Supabase Auth (sem empresa_nome → trigger não cria empresa)
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, tipo: 'cliente' },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { erro: 'Este e-mail já está cadastrado. Faça login.' }
    }
    return { erro: authError.message }
  }

  const userId = authData.user?.id
  if (!userId) return { erro: 'Erro ao criar conta' }

  // Vincula (upsert) o cliente à empresa com auth_user_id
  const admin = createAdminClient()
  const { error: clienteError } = await admin
    .from('clientes')
    .upsert(
      { nome, email, telefone, empresa_id: empresa.id, auth_user_id: userId },
      { onConflict: 'telefone,empresa_id' }
    )

  if (clienteError) return { erro: clienteError.message }

  redirect(`/${slug}/meus-agendamentos`)
}

export async function loginCliente(slug: string, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const senha = formData.get('senha') as string

  if (!email || !senha) return { erro: 'Preencha e-mail e senha' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) return { erro: 'E-mail ou senha inválidos' }

  // Garante que é um cliente (não um admin tentando usar o portal público)
  const tipo = data.user?.user_metadata?.tipo
  if (tipo && tipo !== 'cliente') {
    await supabase.auth.signOut()
    return { erro: 'Use o painel administrativo para acessar sua conta.' }
  }

  redirect(`/${slug}/meus-agendamentos`)
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
      id, data_hora_inicio, data_hora_fim, status, preco_cobrado,
      barbeiros(nome),
      servicos(nome)
    `)
    .eq('cliente_id', clienteId)
    .order('data_hora_inicio', { ascending: false })

  return (data ?? []) as any[]
}
