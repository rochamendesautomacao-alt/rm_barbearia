import { redirect } from 'next/navigation'
import { getUsuarioComEmpresa } from '@/app/actions/auth'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const u = await getUsuarioComEmpresa()
  if (!u) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
    </div>
  )
}
