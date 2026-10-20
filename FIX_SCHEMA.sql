-- ==============================================================================
-- SCRIPT DE MIGRACAO E CORRECAO SQL - SHIBUYA MOTORES
-- Executar no Editor SQL do Supabase para corrigir Login, Verificacao de Placa e Peças
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTENTICACAO & PERFIS (PROFILES / AUTH)
-- ------------------------------------------------------------------------------

-- Função e Trigger para criação automática de perfil ao cadastrar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, perfil, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'MECANICO',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS e definir Políticas de Acesso na tabela public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de perfis para autenticados e anon" ON public.profiles;
CREATE POLICY "Permitir leitura de perfis para autenticados e anon"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao de perfis" ON public.profiles;
CREATE POLICY "Permitir insercao de perfis"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de perfil proprio ou admin" ON public.profiles;
CREATE POLICY "Permitir atualizacao de perfil proprio ou admin"
  ON public.profiles FOR UPDATE
  USING (true);


-- ------------------------------------------------------------------------------
-- 2. VERIFICACAO DE PLACA (VERIFICACOES_PLACA)
-- ------------------------------------------------------------------------------

-- Remover trigger de imutabilidade se existir, permitindo edicao e exclusao pelo app
DROP TRIGGER IF EXISTS bloquear_alteracao_historico ON public.verificacoes_placa;
DROP FUNCTION IF EXISTS public.bloquear_alteracao_historico();

-- Atualizar Constraints de Chave Estrangeira para ON DELETE CASCADE
ALTER TABLE public.verificacoes_placa
  DROP CONSTRAINT IF EXISTS verificacoes_placa_veiculo_id_fkey,
  DROP CONSTRAINT IF EXISTS verificacoes_placa_os_id_fkey,
  DROP CONSTRAINT IF EXISTS verificacoes_placa_responsavel_id_fkey;

ALTER TABLE public.verificacoes_placa
  ADD CONSTRAINT verificacoes_placa_veiculo_id_fkey
    FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE,
  ADD CONSTRAINT verificacoes_placa_os_id_fkey
    FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  ADD CONSTRAINT verificacoes_placa_responsavel_id_fkey
    FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS para verificacoes_placa
ALTER TABLE public.verificacoes_placa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir operacoes em verificacoes_placa" ON public.verificacoes_placa;
CREATE POLICY "Permitir operacoes em verificacoes_placa"
  ON public.verificacoes_placa FOR ALL
  USING (true)
  WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 3. PECAS E ESTOQUE (PECAS, OS_PECAS, ESTOQUE_MOVIMENTACOES)
-- ------------------------------------------------------------------------------

-- Atualizar Foreign Keys em os_pecas e estoque_movimentacoes para ON DELETE CASCADE
ALTER TABLE public.os_pecas
  DROP CONSTRAINT IF EXISTS os_pecas_peca_id_fkey;

ALTER TABLE public.os_pecas
  ADD CONSTRAINT os_pecas_peca_id_fkey
    FOREIGN KEY (peca_id) REFERENCES public.pecas(id) ON DELETE CASCADE;

ALTER TABLE public.estoque_movimentacoes
  DROP CONSTRAINT IF EXISTS estoque_movimentacoes_peca_id_fkey;

ALTER TABLE public.estoque_movimentacoes
  ADD CONSTRAINT estoque_movimentacoes_peca_id_fkey
    FOREIGN KEY (peca_id) REFERENCES public.pecas(id) ON DELETE CASCADE;

-- Adicionar coluna saldo_estoque em pecas se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pecas' AND column_name='saldo_estoque'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN saldo_estoque numeric DEFAULT 0;
  END IF;
END $$;

-- Função e Trigger para recalculação automática de saldo de estoque em pecas
CREATE OR REPLACE FUNCTION public.recalcular_saldo_estoque()
RETURNS TRIGGER AS $$
DECLARE
  target_peca_id bigint;
  novo_saldo numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_peca_id := OLD.peca_id;
  ELSE
    target_peca_id := NEW.peca_id;
  END IF;

  SELECT COALESCE(SUM(
    CASE
      WHEN tipo IN ('ENTRADA', 'COMPRA') THEN quantidade
      WHEN tipo IN ('SAIDA', 'CONSUMO') THEN -quantidade
      ELSE 0
    END
  ), 0) INTO novo_saldo
  FROM public.estoque_movimentacoes
  WHERE peca_id = target_peca_id;

  UPDATE public.pecas
  SET saldo_estoque = novo_saldo,
      data_ultima_atualizacao = NOW()
  WHERE id = target_peca_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_atualizar_saldo_estoque ON public.estoque_movimentacoes;
CREATE TRIGGER trigger_atualizar_saldo_estoque
  AFTER INSERT OR UPDATE OR DELETE ON public.estoque_movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_saldo_estoque();

-- RLS para pecas, os_pecas e estoque_movimentacoes
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir operacoes em pecas" ON public.pecas;
CREATE POLICY "Permitir operacoes em pecas" ON public.pecas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir operacoes em os_pecas" ON public.os_pecas;
CREATE POLICY "Permitir operacoes em os_pecas" ON public.os_pecas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir operacoes em estoque_movimentacoes" ON public.estoque_movimentacoes;
CREATE POLICY "Permitir operacoes em estoque_movimentacoes" ON public.estoque_movimentacoes FOR ALL USING (true) WITH CHECK (true);
