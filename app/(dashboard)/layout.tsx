import { redirect } from 'next/navigation'
import { getUsuarioComEmpresa } from '@/app/actions/auth'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioComEmpresa()

  if (!usuario) redirect('/login')

  const empresa = (usuario as any).empresas

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar
        nomeEmpresa={empresa?.nome ?? 'Minha Barbearia'}
        nomeUsuario={usuario.nome}
      />

      {/* conteúdo desloca para direita no desktop, sobe do bottom nav no mobile */}
      <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
