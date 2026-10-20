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

