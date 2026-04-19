-- =============================================================
-- Migration 003: Trigger de criação automática de usuário
-- Executa quando um novo registro é inserido em auth.users
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id  UUID;
  v_empresa_nome TEXT;
  v_slug        TEXT;
  v_plano_id    UUID;
BEGIN
  -- dados passados via raw_user_meta_data no momento do signup
  v_empresa_nome := NEW.raw_user_meta_data->>'empresa_nome';
  v_slug         := NEW.raw_user_meta_data->>'empresa_slug';

  -- só cria empresa se os metadados de cadastro estiverem presentes
  IF v_empresa_nome IS NOT NULL AND v_slug IS NOT NULL THEN

    -- plano Starter por padrão
    SELECT id INTO v_plano_id FROM planos WHERE nome = 'Starter' LIMIT 1;

    -- cria a empresa (tenant)
    INSERT INTO empresas (nome, slug, email)
    VALUES (v_empresa_nome, v_slug, NEW.email)
    RETURNING id INTO v_empresa_id;

    -- cria assinatura trial
    INSERT INTO assinaturas (empresa_id, plano_id, status, data_fim)
    VALUES (v_empresa_id, v_plano_id, 'trial', CURRENT_DATE + INTERVAL '14 days');

    -- cria o registro do usuário como admin
    INSERT INTO usuarios (id, empresa_id, nome, email, role)
    VALUES (
      NEW.id,
      v_empresa_id,
      COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
      NEW.email,
      'admin'
    );

  ELSE
    -- login de usuário já existente — apenas garante que o registro existe
    -- (caso o usuário seja convidado por outro meio no futuro)
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dispara após inserção em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
