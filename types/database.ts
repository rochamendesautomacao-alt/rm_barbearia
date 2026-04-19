export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type RoleUsuario = 'admin' | 'barbeiro'
export type StatusAgendamento = 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'no_show'
export type StatusAssinatura = 'ativa' | 'cancelada' | 'suspensa' | 'trial'

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nome: string
          slug: string
          email: string | null
          telefone: string | null
          endereco: string | null
          cidade: string | null
          estado: string | null
          logo_url: string | null
          cor_primaria: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Empresas['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Empresas['Insert']>
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          email: string
          role: RoleUsuario
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Usuarios['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Usuarios['Insert']>
      }
      barbeiros: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string | null
          nome: string
          foto_url: string | null
          bio: string | null
          telefone: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Barbeiros['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Barbeiros['Insert']>
      }
      servicos: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          descricao: string | null
          duracao_minutos: number
          preco: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Servicos['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Servicos['Insert']>
      }
      clientes: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          telefone: string
          email: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Clientes['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Clientes['Insert']>
      }
      agendamentos: {
        Row: {
          id: string
          empresa_id: string
          cliente_id: string
          barbeiro_id: string
          servico_id: string
          data_hora_inicio: string
          data_hora_fim: string
          status: StatusAgendamento
          preco_cobrado: number
          observacoes: string | null
          cancelado_em: string | null
          cancelado_motivo: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Agendamentos['Row'], 'id' | 'data_hora_fim' | 'created_at' | 'updated_at'>
        Update: Partial<Agendamentos['Insert']>
      }
      planos: {
        Row: {
          id: string
          nome: string
          preco_mensal: number
          max_barbeiros: number
          max_agendamentos_mes: number
          recursos: Json
          ativo: boolean
          created_at: string
        }
        Insert: Omit<Planos['Row'], 'id' | 'created_at'>
        Update: Partial<Planos['Insert']>
      }
      assinaturas: {
        Row: {
          id: string
          empresa_id: string
          plano_id: string
          status: StatusAssinatura
          data_inicio: string
          data_fim: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Assinaturas['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Assinaturas['Insert']>
      }
      horarios_funcionamento: {
        Row: {
          id: string
          empresa_id: string
          barbeiro_id: string | null
          dia_semana: string
          hora_inicio: string
          hora_fim: string
          ativo: boolean
        }
        Insert: Omit<HorariosFuncionamento['Row'], 'id'>
        Update: Partial<HorariosFuncionamento['Insert']>
      }
    }
    Views: {
      vw_agenda_dia: {
        Row: {
          id: string
          empresa_id: string
          data_hora_inicio: string
          data_hora_fim: string
          status: StatusAgendamento
          preco_cobrado: number
          observacoes: string | null
          cliente_nome: string
          cliente_telefone: string
          barbeiro_nome: string
          servico_nome: string
          duracao_minutos: number
        }
      }
    }
    Functions: {
      minha_empresa_id: { Args: Record<never, never>; Returns: string }
      horarios_disponiveis: {
        Args: {
          p_barbeiro_id: string
          p_data: string
          p_empresa_id: string
          p_duracao_min?: number
        }
        Returns: { hora_inicio: string; hora_fim: string; disponivel: boolean }[]
      }
    }
  }
}

// Atalhos de tipo usados no app
type Tables = Database['public']['Tables']
type Empresas = Tables['empresas']
type Usuarios = Tables['usuarios']
type Barbeiros = Tables['barbeiros']
type Servicos = Tables['servicos']
type Clientes = Tables['clientes']
type Agendamentos = Tables['agendamentos']
type Planos = Tables['planos']
type Assinaturas = Tables['assinaturas']
type HorariosFuncionamento = Tables['horarios_funcionamento']

export type Empresa = Empresas['Row']
export type Usuario = Usuarios['Row']
export type Barbeiro = Barbeiros['Row']
export type Servico = Servicos['Row']
export type Cliente = Clientes['Row']
export type Agendamento = Agendamentos['Row']
export type Plano = Planos['Row']
export type Assinatura = Assinaturas['Row']
export type AgendamentoDia = Database['public']['Views']['vw_agenda_dia']['Row']
