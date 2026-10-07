-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  perfil USER-DEFINED NOT NULL DEFAULT 'MECANICO'::perfil_usuario,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.clientes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  cpf text,
  endereco text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.veiculos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  cliente_id bigint NOT NULL,
  placa text NOT NULL UNIQUE CHECK (placa ~* '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'::text),
  modelo text NOT NULL,
  cor text,
  ano smallint CHECK (ano >= 1950 AND ano <= 2100),
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT veiculos_pkey PRIMARY KEY (id),
  CONSTRAINT veiculos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.ordens_servico (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  numero_os text NOT NULL UNIQUE,
  cliente_id bigint NOT NULL,
  veiculo_id bigint NOT NULL,
  data_entrada timestamp with time zone NOT NULL DEFAULT now(),
  previsao_entrega timestamp with time zone,
  responsavel_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'RECEBIDO'::status_os,
  valor_mao_obra numeric NOT NULL DEFAULT 0 CHECK (valor_mao_obra >= 0::numeric),
  placa_verificada boolean NOT NULL DEFAULT false,
  data_entrega timestamp with time zone,
  criado_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ordens_servico_pkey PRIMARY KEY (id),
  CONSTRAINT ordens_servico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT ordens_servico_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id),
  CONSTRAINT ordens_servico_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id),
  CONSTRAINT ordens_servico_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.profiles(id)
);
CREATE TABLE public.verificacoes_placa (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  veiculo_id bigint NOT NULL,
  os_id bigint,
  data_hora timestamp with time zone NOT NULL DEFAULT now(),
  responsavel_id uuid NOT NULL,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT verificacoes_placa_pkey PRIMARY KEY (id),
  CONSTRAINT verificacoes_placa_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id),
  CONSTRAINT verificacoes_placa_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id),
  CONSTRAINT verificacoes_placa_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.os_tipos_servico (
  os_id bigint NOT NULL,
  tipo USER-DEFINED NOT NULL,
  CONSTRAINT os_tipos_servico_pkey PRIMARY KEY (os_id, tipo),
  CONSTRAINT os_tipos_servico_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id)
);
CREATE TABLE public.os_servicos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  os_id bigint NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0 CHECK (valor >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT os_servicos_pkey PRIMARY KEY (id),
  CONSTRAINT os_servicos_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id)
);
CREATE TABLE public.pecas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  codigo_interno text NOT NULL UNIQUE,
  nome text NOT NULL,
  modelo_compativel text,
  preco_min numeric CHECK (preco_min IS NULL OR preco_min >= 0::numeric),
  preco_medio numeric CHECK (preco_medio IS NULL OR preco_medio >= 0::numeric),
  preco_max numeric CHECK (preco_max IS NULL OR preco_max >= 0::numeric),
  data_ultima_atualizacao timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pecas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.os_pecas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  os_id bigint NOT NULL,
  peca_id bigint NOT NULL,
  quantidade numeric NOT NULL DEFAULT 1 CHECK (quantidade > 0::numeric),
  preco_unitario numeric NOT NULL CHECK (preco_unitario >= 0::numeric),
  fornecedor text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT os_pecas_pkey PRIMARY KEY (id),
  CONSTRAINT os_pecas_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id),
  CONSTRAINT os_pecas_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.pecas(id)
);
CREATE TABLE public.estoque_movimentacoes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  peca_id bigint NOT NULL,
  tipo USER-DEFINED NOT NULL,
  quantidade numeric NOT NULL CHECK (quantidade > 0::numeric),
  os_id bigint,
  fornecedor text,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT estoque_movimentacoes_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_movimentacoes_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.pecas(id),
  CONSTRAINT estoque_movimentacoes_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id),
  CONSTRAINT estoque_movimentacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.os_atualizacoes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  os_id bigint NOT NULL,
  usuario_id uuid NOT NULL,
  status_anterior USER-DEFINED,
  status_novo USER-DEFINED,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT os_atualizacoes_pkey PRIMARY KEY (id),
  CONSTRAINT os_atualizacoes_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico(id),
  CONSTRAINT os_atualizacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.profiles(id)
);
