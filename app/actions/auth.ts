'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const senha = formData.get('senha') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(error.message)}`)
  }

  // Sincroniza claims no JWT para deixar o middleware muito mais rápido
  if (data?.user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id, role')
      .eq('id', data.user.id)
      .single()

    if (usuario && (data.user.user_metadata?.empresa_id !== usuario.empresa_id || data.user.user_metadata?.role !== usuario.role)) {
      await supabase.auth.updateUser({
        data: {
          empresa_id: usuario.empresa_id,
          role: usuario.role,
        }
      })
    }
  }

  redirect('/agenda')
}

// ------------------------------------------------------------
// CADASTRO (empresa + primeiro admin)
// ------------------------------------------------------------
export async function cadastrar(formData: FormData) {
  const supabase = await createClient()

  const nome        = formData.get('nome') as string
  const email       = formData.get('email') as string
  const senha       = formData.get('senha') as string
  const empresaNome = formData.get('empresa_nome') as string

  // gera slug a partir do nome da empresa
  const slug = empresaNome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  // raw_user_meta_data é lido pelo trigger handle_new_auth_user
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        empresa_nome: empresaNome,
        empresa_slug: slug,
      },
    },
  })

  if (error) {
    redirect(`/registro?erro=${encodeURIComponent(error.message)}`)
  }

  redirect('/agenda')
}

// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ------------------------------------------------------------
// SESSÃO ATUAL (helper para Server Components)
// ------------------------------------------------------------
export async function getSessao() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ------------------------------------------------------------
// USUÁRIO COM DADOS DA EMPRESA (helper para dashboard)
// ------------------------------------------------------------
export async function getUsuarioComEmpresa() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, empresas(*)')
    .eq('id', user.id)
    .single()

  return usuario
}
