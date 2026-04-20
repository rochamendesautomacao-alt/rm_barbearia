import { redirect } from 'next/navigation'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const u = await getUsuarioComEmpresa()

  if (!u) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar
        nomeEmpresa={(u as any).empresas?.nome ?? 'Minha Barbearia'}
        nomeUsuario={(u as any).nome}
      />

      {/* conteúdo desloca para direita no desktop, sobe do bottom nav no mobile */}
      <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
