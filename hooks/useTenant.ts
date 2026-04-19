'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TenantInfo {
  empresa_id:   string
  empresa_nome: string
  role:         'admin' | 'barbeiro'
  carregando:   boolean
}

// Lê contexto do tenant via Supabase client-side
// Usado em Client Components que precisam saber a empresa atual
export function useTenant(): TenantInfo {
  const [info, setInfo] = useState<TenantInfo>({
    empresa_id:   '',
    empresa_nome: '',
    role:         'barbeiro',
    carregando:   true,
  })

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setInfo(i => ({ ...i, carregando: false })); return }

      const { data } = await supabase
        .from('usuarios')
        .select('empresa_id, role, empresas(nome)')
        .eq('id', user.id)
        .single()

      if (!data) { setInfo(i => ({ ...i, carregando: false })); return }

      setInfo({
        empresa_id:   data.empresa_id,
        empresa_nome: (data.empresas as any)?.nome ?? '',
        role:         data.role,
        carregando:   false,
      })
    })
  }, [])

  return info
}
