## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `nome` | `text` |  |
| `email` | `text` |  Unique |
| `perfil` | `perfil_usuario` |  |
| `ativo` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `clientes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `nome` | `text` |  |
| `telefone` | `text` |  |
| `cpf` | `text` |  Nullable |
| `endereco` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `veiculos`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `cliente_id` | `int8` |  |
| `placa` | `text` |  Unique |
| `modelo` | `text` |  |
| `cor` | `text` |  Nullable |
| `ano` | `int2` |  Nullable |
| `observacoes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `ordens_servico`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `numero_os` | `text` |  Unique |
| `cliente_id` | `int8` |  |
| `veiculo_id` | `int8` |  |
| `data_entrada` | `timestamptz` |  |
| `previsao_entrega` | `timestamptz` |  Nullable |
| `responsavel_id` | `uuid` |  |
| `status` | `status_os` |  |
| `valor_mao_obra` | `numeric` |  |
| `placa_verificada` | `bool` |  |
| `data_entrega` | `timestamptz` |  Nullable |
| `criado_por` | `uuid` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `verificacoes_placa`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `veiculo_id` | `int8` |  |
| `os_id` | `int8` |  Nullable |
| `data_hora` | `timestamptz` |  |
| `responsavel_id` | `uuid` |  |
| `observacao` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `os_tipos_servico`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `os_id` | `int8` | Primary |
| `tipo` | `tipo_servico` | Primary |

## Table `os_servicos`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `os_id` | `int8` |  |
| `descricao` | `text` |  |
| `valor` | `numeric` |  |
| `created_at` | `timestamptz` |  |

## Table `pecas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `codigo_interno` | `text` |  Unique |
| `nome` | `text` |  |
| `modelo_compativel` | `text` |  Nullable |
| `preco_min` | `numeric` |  Nullable |
| `preco_medio` | `numeric` |  Nullable |
| `preco_max` | `numeric` |  Nullable |
| `data_ultima_atualizacao` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |

## Table `os_pecas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `os_id` | `int8` |  |
| `peca_id` | `int8` |  |
| `quantidade` | `numeric` |  |
| `preco_unitario` | `numeric` |  |
| `fornecedor` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `estoque_movimentacoes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `peca_id` | `int8` |  |
| `tipo` | `tipo_movimentacao` |  |
| `quantidade` | `numeric` |  |
| `os_id` | `int8` |  Nullable |
| `fornecedor` | `text` |  Nullable |
| `usuario_id` | `uuid` |  |
| `created_at` | `timestamptz` |  |

## Table `os_atualizacoes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `os_id` | `int8` |  |
| `usuario_id` | `uuid` |  |
| `status_anterior` | `status_os` |  Nullable |
| `status_novo` | `status_os` |  Nullable |
| `observacao` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Custom Types / Enums

### `perfil_usuario`

`ADMINISTRADOR` | `MECANICO`

### `status_os`

`RECEBIDO` | `EM_DIAGNOSTICO` | `AGUARDANDO_APROVACAO` | `AGUARDANDO_PECAS` | `EM_FUNILARIA` | `EM_MECANICA` | `TESTE_QUALIDADE` | `PRONTO_PARA_ENTREGA` | `ENTREGUE`

### `tipo_servico`

`MECANICA` | `FUNILARIA`

### `tipo_movimentacao`

`COMPRA` | `CONSUMO`

## RLS Policies

### `profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `profiles_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `profiles_select` | SELECT | authenticated | PERMISSIVE | `((auth.uid() = id) OR is_admin())` | — |

### `clientes`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `clientes_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |

### `veiculos`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `veiculos_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `veiculos_mecanico_read` | SELECT | authenticated | PERMISSIVE | `(is_admin() OR is_mecanico())` | — |

### `ordens_servico`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `os_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |

### `verificacoes_placa`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `verificacoes_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |

### `os_tipos_servico`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ostipos_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `ostipos_mecanico_read` | SELECT | authenticated | PERMISSIVE | `(is_admin() OR is_mecanico())` | — |

### `os_servicos`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `osservicos_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `osservicos_mecanico_read` | SELECT | authenticated | PERMISSIVE | `(is_admin() OR is_mecanico())` | — |

### `pecas`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `pecas_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `pecas_read` | SELECT | authenticated | PERMISSIVE | `(is_admin() OR is_mecanico())` | — |

### `os_pecas`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `ospecas_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |

### `estoque_movimentacoes`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `estoque_admin` | ALL | authenticated | PERMISSIVE | `is_admin()` | `is_admin()` |
| `estoque_read` | SELECT | authenticated | PERMISSIVE | `(is_admin() OR is_mecanico())` | — |

### `os_atualizacoes`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `osatual_insert` | INSERT | authenticated | PERMISSIVE | — | `(is_admin() OR is_mecanico())` |
| `osatual_read` | SELECT | authenticated | PERMISSIVE | `(is_admin() OR is_mecanico())` | — |

----------------------------------------------------------------

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
