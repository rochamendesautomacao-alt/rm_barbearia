import { listarHorarios } from '@/app/actions/horarios'
import GerenciarHorarios from '@/components/dashboard/GerenciarHorarios'

export default async function HorariosPage() {
  const horarios = await listarHorarios()

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-white text-xl font-bold">Horários de Funcionamento</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Defina os dias e horários em que a barbearia atende
        </p>
      </div>

      <GerenciarHorarios horarios={horarios} />
    </div>
  )
}
