'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantPorSlug } from '@/lib/tenant'

const base = (slug: string) => `/b/${slug}`

export async function loginClienteB(slug: string, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const senha = formData.get('senha') as string

  if (!email || !senha) return { erro: 'Preencha e-mail e senha' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) return { erro: 'E-mail ou senha inválidos' }

  const tipo = data.user?.user_metadata?.tipo
  if (tipo && tipo !== 'cliente') {
    await supabase.auth.signOut()
    return { erro: 'Use o painel administrativo para acessar sua conta.' }
  }

  redirect(`${base(slug)}/meus-agendamentos`)
}

export async function loginClientePorTelefoneB(slug: string, formData: FormData) {
  const telefone = (formData.get('telefone') as string)?.replace(/\D/g, '')
  const senha    = formData.get('senha') as string

  if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }
  if (!senha) return { erro: 'Preencha a senha' }

  const empresa = await getTenantPorSlug(slug)
  if (!empresa) return { erro: 'Barbearia não encontrada' }

  const admin = createAdminClient()
  const { data: cliente } = await admin
    .from('clientes')
    .select('email')
    .eq('telefone', telefone)
    .eq('empresa_id', empresa.id)
    .single()

  if (!cliente?.email) return { erro: 'Telefone não cadastrado. Verifique ou crie uma conta.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cliente.email,
    password: senha,
  })

  if (error) return { erro: 'Telefone ou senha inválidos' }

  const tipo = data.user?.user_metadata?.tipo
  if (tipo && tipo !== 'cliente') {
    await supabase.auth.signOut()
    return { erro: 'Use o painel administrativo para acessar sua conta.' }
  }

  redirect(`${base(slug)}/meus-agendamentos`)
}

export async function cadastrarClienteB(slug: string, formData: FormData) {
  const nome     = (formData.get('nome') as string)?.trim()
  const email    = (formData.get('email') as string)?.trim()
  const telefone = (formData.get('telefone') as string)?.replace(/\D/g, '')
  const senha    = formData.get('senha') as string

  if (!nome || nome.length < 2)          return { erro: 'Nome inválido' }
  if (!email || !email.includes('@'))    return { erro: 'E-mail inválido' }
  if (!telefone || telefone.length < 10) return { erro: 'Telefone inválido' }
  if (!senha || senha.length < 6)        return { erro: 'Senha deve ter ao menos 6 caracteres' }

  const empresa = await getTenantPorSlug(slug)
  if (!empresa) return { erro: 'Barbearia não encontrada' }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, tipo: 'cliente' } },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { erro: 'E-mail já cadastrado. Faça login.' }
    }
    return { erro: authError.message }
  }

  const userId = authData.user?.id
  if (!userId) return { erro: 'Erro ao criar conta' }

  const admin = createAdminClient()
  const { error: clienteError } = await admin
    .from('clientes')
    .upsert(
      { nome, email, telefone, empresa_id: empresa.id, auth_user_id: userId },
      { onConflict: 'telefone,empresa_id' }
    )

  if (clienteError) return { erro: clienteError.message }

  redirect(`${base(slug)}/meus-agendamentos`)
}

export async function logoutClienteB(slug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`${base(slug)}/entrar`)
}
