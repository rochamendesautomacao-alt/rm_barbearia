'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantPorSlug } from '@/lib/tenant'

export async function _solicitarOtpImpl(
  slug: string,
  formData: FormData,
): Promise<{ email: string } | { erro: string; naoEncontrado?: boolean }> {
  const modo     = formData.get('modo') as 'telefone' | 'email'
  const telefone = (formData.get('telefone') as string)?.replace(/\D/g, '')
  const emailRaw = (formData.get('email') as string)?.trim()

  const empresa = await getTenantPorSlug(slug)
  if (!empresa) return { erro: 'Barbearia não encontrada' }

  let emailDestino: string
  let nomeCliente: string | undefined
  let criarUsuario = false

  const admin = createAdminClient()

  if (modo === 'telefone') {
    if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }

    const { data: cliente } = await admin
      .from('clientes')
      .select('email, nome, auth_user_id')
      .eq('telefone', telefone)
      .eq('empresa_id', empresa.id)
      .single()

    if (!cliente?.email) {
      return { erro: 'Número não cadastrado. Deseja se cadastrar?', naoEncontrado: true }
    }
    emailDestino = cliente.email
    nomeCliente  = cliente.nome
    criarUsuario = !cliente.auth_user_id
  } else {
    if (!emailRaw || !emailRaw.includes('@')) return { erro: 'E-mail inválido' }

    const { data: cliente } = await admin
      .from('clientes')
      .select('nome, auth_user_id')
      .eq('email', emailRaw)
      .eq('empresa_id', empresa.id)
      .single()

    if (!cliente) {
      return { erro: 'E-mail não encontrado. Verifique ou crie uma conta.', naoEncontrado: true }
    }
    emailDestino = emailRaw
    nomeCliente  = cliente.nome
    criarUsuario = !cliente.auth_user_id
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: emailDestino,
    options: {
      shouldCreateUser: criarUsuario,
      ...(criarUsuario && nomeCliente ? { data: { nome: nomeCliente, tipo: 'cliente' } } : {}),
    },
  })

  if (error) {
    return { erro: 'E-mail não encontrado. Verifique ou crie uma conta.', naoEncontrado: true }
  }

  return { email: emailDestino }
}

export async function _verificarOtpImpl(
  slug: string,
  formData: FormData,
  basePath: string,
): Promise<{ erro: string }> {
  const email = (formData.get('email') as string)?.trim()
  const token = (formData.get('token') as string)?.replace(/\D/g, '').slice(0, 8)

  if (!email || !token || token.length < 6) {
    return { erro: 'Código inválido' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) return { erro: 'Código incorreto ou expirado. Tente novamente.' }

  const user = data.user
  if (!user) return { erro: 'Erro ao autenticar' }

  const tipo = user.user_metadata?.tipo
  if (tipo && tipo !== 'cliente') {
    await supabase.auth.signOut()
    return { erro: 'Use o painel administrativo para acessar sua conta.' }
  }

  const empresa = await getTenantPorSlug(slug)
  if (empresa) {
    const admin = createAdminClient()
    await admin
      .from('clientes')
      .update({ auth_user_id: user.id })
      .eq('email', email)
      .eq('empresa_id', empresa.id)
      .is('auth_user_id', null)
  }

  redirect(`${basePath}/meus-agendamentos`)
}

export async function _cadastrarClienteOtpImpl(
  slug: string,
  formData: FormData,
): Promise<{ email: string } | { erro: string }> {
  const nome     = (formData.get('nome') as string)?.trim()
  const email    = (formData.get('email') as string)?.trim()
  const telefone = (formData.get('telefone') as string)?.replace(/\D/g, '')

  if (!nome || nome.length < 2)          return { erro: 'Nome inválido' }
  if (!email || !email.includes('@'))    return { erro: 'E-mail inválido' }
  if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }

  const empresa = await getTenantPorSlug(slug)
  if (!empresa) return { erro: 'Barbearia não encontrada' }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('clientes')
    .select('id, email')
    .eq('telefone', telefone)
    .eq('empresa_id', empresa.id)
    .single()

  if (existente) {
    if (existente.email) {
      return { erro: 'Este telefone já está cadastrado. Faça login.' }
    }
    // Telefone cadastrado pelo admin sem e-mail — atualiza com o e-mail informado
    await admin
      .from('clientes')
      .update({ nome, email })
      .eq('id', existente.id)
  } else {
    const { error: insertError } = await admin
      .from('clientes')
      .insert({ nome, email, telefone, empresa_id: empresa.id })

    if (insertError) {
      if (insertError.code === '23505') return { erro: 'Telefone ou e-mail já cadastrado.' }
      return { erro: insertError.message }
    }
  }

  const supabase = await createClient()
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { nome, tipo: 'cliente' },
    },
  })

  if (otpError) return { erro: otpError.message }

  return { email }
}
