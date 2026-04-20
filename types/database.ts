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
        Insert: {
          id?: string
          nome: string
          slug: string
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          logo_url?: string | null
          cor_primaria?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          logo_url?: string | null
          cor_primaria?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id: string
          empresa_id: string
          nome: string
          email: string
          role?: RoleUsuario
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          nome?: string
          email?: string
          role?: RoleUsuario
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          empresa_id: string
          usuario_id?: string | null
          nome: string
          foto_url?: string | null
          bio?: string | null
          telefone?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          usuario_id?: string | null
          nome?: string
          foto_url?: string | null
          bio?: string | null
          telefone?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          empresa_id: string
          nome: string
          descricao?: string | null
          duracao_minutos: number
          preco: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          nome?: string
          descricao?: string | null
          duracao_minutos?: number
          preco?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          telefone: string
          email: string | null
          observacoes: string | null
          auth_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          nome: string
          telefone: string
          email?: string | null
          observacoes?: string | null
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          nome?: string
          telefone?: string
          email?: string | null
          observacoes?: string | null
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          empresa_id: string
          cliente_id: string
          barbeiro_id: string
          servico_id: string
          data_hora_inicio: string
          data_hora_fim?: string
          status?: StatusAgendamento
          preco_cobrado: number
          observacoes?: string | null
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          cliente_id?: string
          barbeiro_id?: string
          servico_id?: string
          data_hora_inicio?: string
          data_hora_fim?: string
          status?: StatusAgendamento
          preco_cobrado?: number
          observacoes?: string | null
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          nome: string
          preco_mensal: number
          max_barbeiros: number
          max_agendamentos_mes: number
          recursos?: Json
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          preco_mensal?: number
          max_barbeiros?: number
          max_agendamentos_mes?: number
          recursos?: Json
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          empresa_id: string
          plano_id: string
          status?: StatusAssinatura
          data_inicio: string
          data_fim?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          plano_id?: string
          status?: StatusAssinatura
          data_inicio?: string
          data_fim?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          empresa_id: string
          barbeiro_id?: string | null
          dia_semana: string
          hora_inicio: string
          hora_fim: string
          ativo?: boolean
        }
        Update: {
          id?: string
          empresa_id?: string
          barbeiro_id?: string | null
          dia_semana?: string
          hora_inicio?: string
          hora_fim?: string
          ativo?: boolean
        }
        Relationships: []
      }
      horarios_bloqueados: {
        Row: {
          id: string
          empresa_id: string
          barbeiro_id: string | null
          data_inicio: string
          data_fim: string
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          barbeiro_id?: string | null
          data_inicio: string
          data_fim: string
          motivo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          barbeiro_id?: string | null
          data_inicio?: string
          data_fim?: string
          motivo?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Functions: {
      minha_empresa_id: { Args: Record<PropertyKey, never>; Returns: string }
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
    Enums: {
      role_usuario: RoleUsuario
      status_agendamento: StatusAgendamento
      status_assinatura: StatusAssinatura
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Empresa = Database['public']['Tables']['empresas']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Barbeiro = Database['public']['Tables']['barbeiros']['Row']
export type Servico = Database['public']['Tables']['servicos']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type Agendamento = Database['public']['Tables']['agendamentos']['Row']
export type Plano = Database['public']['Tables']['planos']['Row']
export type Assinatura = Database['public']['Tables']['assinaturas']['Row']
export type AgendamentoDia = Database['public']['Views']['vw_agenda_dia']['Row']
