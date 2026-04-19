-- =============================================================
-- Migration 001b: Corrige migration 001 — adiciona btree_gist
-- e cria tabela agendamentos que falhou por falta da extensão
-- =============================================================

-- extensão necessária para EXCLUDE com UUID (operador =) + tstzrange
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- cria tabela agendamentos com o EXCLUDE correto
CREATE TABLE IF NOT EXISTS agendamentos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id       UUID NOT NULL REFERENCES clientes(id),
  barbeiro_id      UUID NOT NULL REFERENCES barbeiros(id),
  servico_id       UUID NOT NULL REFERENCES servicos(id),
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim    TIMESTAMPTZ NOT NULL,
  status           status_agendamento NOT NULL DEFAULT 'pendente',
  preco_cobrado    NUMERIC(10,2) NOT NULL,
  observacoes      TEXT,
  cancelado_em     TIMESTAMPTZ,
  cancelado_motivo TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT periodo_agendamento_valido CHECK (data_hora_fim > data_hora_inicio),

  EXCLUDE USING gist (
    barbeiro_id WITH =,
    tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelado', 'no_show'))
);

-- índices do agendamento
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa     ON agendamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data ON agendamentos(barbeiro_id, data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa_data  ON agendamentos(empresa_id, data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente     ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status      ON agendamentos(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_range  ON agendamentos
  USING gist (tstzrange(data_hora_inicio, data_hora_fim, '[)'));

-- triggers da tabela agendamentos
CREATE TRIGGER trg_agendamentos_updated_at
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_agendamento_calcular_fim
  BEFORE INSERT OR UPDATE OF servico_id, data_hora_inicio ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION calcular_fim_agendamento();

CREATE TRIGGER trg_agendamento_snapshot_preco
  BEFORE INSERT ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION snapshot_preco_agendamento();

-- RLS para agendamentos
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- atualiza também a migration 001 para próximas instalações
-- (adiciona btree_gist no topo do arquivo original)
