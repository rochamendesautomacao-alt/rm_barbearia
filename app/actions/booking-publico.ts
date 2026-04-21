'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  _solicitarOtpImpl,
  _verificarOtpImpl,
  _cadastrarClienteOtpImpl,
} from '@/lib/auth-otp'

const base = (slug: string) => `/b/${slug}`

export async function solicitarOtpB(slug: string, formData: FormData) {
  return _solicitarOtpImpl(slug, formData)
}

export async function verificarOtpB(slug: string, formData: FormData) {
  return _verificarOtpImpl(slug, formData, base(slug))
}

export async function cadastrarClienteOtpB(slug: string, formData: FormData) {
  return _cadastrarClienteOtpImpl(slug, formData)
}

export async function logoutClienteB(slug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`${base(slug)}/entrar`)
}
