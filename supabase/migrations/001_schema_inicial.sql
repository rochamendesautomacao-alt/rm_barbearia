-- =============================================================
-- SaaS Barbearia — Migration 001: Schema Inicial
-- =============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- necessário para EXCLUDE com UUID + tstzrange

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE role_usuario AS ENUM ('admin', 'barbeiro');
CREATE TYPE status_agendamento AS ENUM (
  'pendente',
  'confirmado',
  'em_andamento',
  'concluido',
  'cancelado',
  'no_show'
);
CREATE TYPE status_assinatura AS ENUM ('ativa', 'cancelada', 'suspensa', 'trial');
CREATE TYPE dia_semana AS ENUM ('0','1','2','3','4','5','6'); -- 0=Dom, 6=Sab

-- =============================================================
-- PLANOS (sem empresa_id — é global da plataforma)
-- =============================================================

CREATE TABLE planos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                  TEXT NOT NULL,                     -- 'Básico', 'Pro', 'Premium'
  preco_mensal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_barbeiros         INT NOT NULL DEFAULT 1,
  max_agendamentos_mes  INT NOT NULL DEFAULT 100,
  recursos              JSONB NOT NULL DEFAULT '{}',       -- feature flags por plano
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- EMPRESAS (tenants)
-- =============================================================

CREATE TABLE empresas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,                    -- usado na URL /[slug]
  email          TEXT,
  telefone       TEXT,
  endereco       TEXT,
  cidade         TEXT,
  estado         CHAR(2),
  logo_url       TEXT,
  cor_primaria   CHAR(7) DEFAULT '#000000',               -- hex para white-label
  ativo          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- =============================================================
-- ASSINATURAS
-- =============================================================

CREATE TABLE assinaturas (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id             UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id               UUID NOT NULL REFERENCES planos(id),
  status                 status_assinatura NOT NULL DEFAULT 'trial',
  data_inicio            DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim               DATE,                            -- NULL = renovação automática
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USUÁRIOS (espelha auth.users do Supabase)
-- =============================================================

CREATE TABLE usuarios (
  id          UUID PRIMARY KEY,                           -- mesmo ID do auth.users
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        role_usuario NOT NULL DEFAULT 'barbeiro',
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (email, empresa_id)
);

-- =============================================================
-- BARBEIROS
-- =============================================================

CREATE TABLE barbeiros (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- pode ser null (barbeiro sem login)
  nome        TEXT NOT NULL,
  foto_url    TEXT,
  bio         TEXT,
  telefone    TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SERVIÇOS
-- =============================================================

CREATE TABLE servicos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  descricao         TEXT,
  duracao_minutos   INT NOT NULL CHECK (duracao_minutos > 0 AND duracao_minutos <= 480),
  preco             NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  ativo             BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CLIENTES
-- =============================================================

CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  email       TEXT,
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (telefone, empresa_id)                           -- mesmo telefone = mesmo cliente por barbearia
);

-- =============================================================
-- HORÁRIOS DE FUNCIONAMENTO
-- =============================================================

CREATE TABLE horarios_funcionamento (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  barbeiro_id UUID REFERENCES barbeiros(id) ON DELETE CASCADE, -- NULL = regra da empresa toda
  dia_semana  dia_semana NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim    TIME NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT hora_valida CHECK (hora_fim > hora_inicio),
  UNIQUE (empresa_id, barbeiro_id, dia_semana)
);

-- =============================================================
-- BLOQUEIOS DE HORÁRIO (folga, feriado, intervalo)
-- =============================================================

CREATE TABLE horarios_bloqueados (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  barbeiro_id  UUID REFERENCES barbeiros(id) ON DELETE CASCADE, -- NULL = bloqueia toda a barbearia
  data_inicio  TIMESTAMPTZ NOT NULL,
  data_fim     TIMESTAMPTZ NOT NULL,
  motivo       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT periodo_valido CHECK (data_fim > data_inicio)
);

-- =============================================================
-- AGENDAMENTOS (tabela central)
-- =============================================================

CREATE TABLE agendamentos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id       UUID NOT NULL REFERENCES clientes(id),
  barbeiro_id      UUID NOT NULL REFERENCES barbeiros(id),
  servico_id       UUID NOT NULL REFERENCES servicos(id),

  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim    TIMESTAMPTZ NOT NULL,              -- calculado: inicio + servico.duracao_minutos

  status           status_agendamento NOT NULL DEFAULT 'pendente',
  preco_cobrado    NUMERIC(10,2) NOT NULL,             -- snapshot do preço no momento do agendamento
  observacoes      TEXT,

  cancelado_em     TIMESTAMPTZ,
  cancelado_motivo TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT periodo_agendamento_valido CHECK (data_hora_fim > data_hora_inicio),

  -- impede duplo agendamento do mesmo barbeiro no mesmo horário
  EXCLUDE USING gist (
    barbeiro_id WITH =,
    tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelado', 'no_show'))
);

-- =============================================================
-- ÍNDICES
-- =============================================================

-- empresas
CREATE INDEX idx_empresas_slug ON empresas(slug);
CREATE INDEX idx_empresas_ativo ON empresas(ativo) WHERE ativo = true;

-- usuarios
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- barbeiros
CREATE INDEX idx_barbeiros_empresa ON barbeiros(empresa_id);
CREATE INDEX idx_barbeiros_usuario ON barbeiros(usuario_id);
CREATE INDEX idx_barbeiros_ativo ON barbeiros(empresa_id, ativo) WHERE ativo = true;

-- servicos
CREATE INDEX idx_servicos_empresa ON servicos(empresa_id);
CREATE INDEX idx_servicos_ativo ON servicos(empresa_id, ativo) WHERE ativo = true;

-- clientes
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_telefone ON clientes(empresa_id, telefone);

-- agendamentos — os mais críticos para performance
CREATE INDEX idx_agendamentos_empresa ON agendamentos(empresa_id);
CREATE INDEX idx_agendamentos_barbeiro_data ON agendamentos(barbeiro_id, data_hora_inicio);
CREATE INDEX idx_agendamentos_empresa_data ON agendamentos(empresa_id, data_hora_inicio);
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_status ON agendamentos(empresa_id, status);
CREATE INDEX idx_agendamentos_data_range ON agendamentos
  USING gist (tstzrange(data_hora_inicio, data_hora_fim, '[)'));

-- horarios
CREATE INDEX idx_horarios_func_empresa ON horarios_funcionamento(empresa_id);
CREATE INDEX idx_horarios_func_barbeiro ON horarios_funcionamento(barbeiro_id);
CREATE INDEX idx_horarios_bloq_barbeiro ON horarios_bloqueados(barbeiro_id, data_inicio, data_fim);
CREATE INDEX idx_horarios_bloq_empresa ON horarios_bloqueados(empresa_id, data_inicio, data_fim);

-- assinaturas
CREATE INDEX idx_assinaturas_empresa ON assinaturas(empresa_id);
CREATE INDEX idx_assinaturas_status ON assinaturas(status) WHERE status = 'ativa';

-- =============================================================
-- TRIGGERS — atualiza updated_at automaticamente
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_barbeiros_updated_at
  BEFORE UPDATE ON barbeiros
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_servicos_updated_at
  BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_agendamentos_updated_at
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TRIGGER — calcula data_hora_fim automaticamente no agendamento
-- =============================================================

CREATE OR REPLACE FUNCTION calcular_fim_agendamento()
RETURNS TRIGGER AS $$
DECLARE
  duracao INT;
BEGIN
  SELECT duracao_minutos INTO duracao
  FROM servicos WHERE id = NEW.servico_id;

  NEW.data_hora_fim = NEW.data_hora_inicio + (duracao || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agendamento_calcular_fim
  BEFORE INSERT OR UPDATE OF servico_id, data_hora_inicio ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION calcular_fim_agendamento();

-- =============================================================
-- TRIGGER — snapshot do preço no momento do agendamento
-- =============================================================

CREATE OR REPLACE FUNCTION snapshot_preco_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.preco_cobrado IS NULL OR NEW.preco_cobrado = 0 THEN
    SELECT preco INTO NEW.preco_cobrado
    FROM servicos WHERE id = NEW.servico_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agendamento_snapshot_preco
  BEFORE INSERT ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION snapshot_preco_agendamento();

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE empresas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros             ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_funcionamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_bloqueados   ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos                ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna empresa_id do usuário logado
CREATE OR REPLACE FUNCTION minha_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- planos: leitura pública (qualquer um pode ver os planos)
CREATE POLICY planos_leitura ON planos
  FOR SELECT USING (ativo = true);

-- empresas: usuário vê apenas a sua empresa
CREATE POLICY empresa_propria ON empresas
  FOR ALL USING (id = minha_empresa_id());

-- empresas: leitura pública do slug (para a página de agendamento do cliente)
CREATE POLICY empresa_slug_publico ON empresas
  FOR SELECT USING (ativo = true);

-- demais tabelas: isolamento total por empresa_id
CREATE POLICY isolamento_assinaturas ON assinaturas
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_usuarios ON usuarios
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_barbeiros ON barbeiros
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_servicos ON servicos
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_clientes ON clientes
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_agendamentos ON agendamentos
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_horarios_func ON horarios_funcionamento
  FOR ALL USING (empresa_id = minha_empresa_id());

CREATE POLICY isolamento_horarios_bloq ON horarios_bloqueados
  FOR ALL USING (empresa_id = minha_empresa_id());

-- leitura pública de barbeiros, serviços e horários (para a página de agendamento)
CREATE POLICY barbeiros_publico ON barbeiros
  FOR SELECT USING (ativo = true);

CREATE POLICY servicos_publico ON servicos
  FOR SELECT USING (ativo = true);

CREATE POLICY horarios_func_publico ON horarios_funcionamento
  FOR SELECT USING (ativo = true);

-- =============================================================
-- SEED — Planos iniciais da plataforma
-- =============================================================

INSERT INTO planos (nome, preco_mensal, max_barbeiros, max_agendamentos_mes, recursos) VALUES
  ('Starter',   0.00,  1,   50,  '{"relatorios": false, "whatsapp": false, "personalizar_cores": false}'),
  ('Pro',       49.90, 5,   500, '{"relatorios": true,  "whatsapp": false, "personalizar_cores": true}'),
  ('Premium',   99.90, 20,  9999,'{"relatorios": true,  "whatsapp": true,  "personalizar_cores": true}');
