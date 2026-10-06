# Shibuya Motores — Backlog de Tarefas

> Quebra da spec em tarefas implementáveis. Cada tarefa referencia os requisitos funcionais (RF) e não funcionais (RNF) correspondentes. Banco de dados já disponível: `shibuya_motores_supabase.sql` (Supabase/PostgreSQL com RLS, triggers e RPCs).
>
> Convenção de prioridade: 🔴 Alta · 🟡 Média · 🟢 Baixa

---

## Épico 1 — Setup do Projeto e Autenticação (RF-001 a RF-004, RNF-001/002)

- [ ] **T-01.1** — Inicializar projeto web (recomendado: Next.js/React + Supabase JS SDK), configurar variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) e client do Supabase.
  - *Aceite:* app roda localmente e conecta ao projeto Supabase; `.env.local` no `.gitignore`.

- [ ] **T-01.2** — Implementar telas de login/cadastro usando `auth.signInWithPassword` / `auth.signUp` do Supabase.
  - *Aceite:* usuário autentica e recebe sessão válida; logout funciona.

- [ ] **T-01.3** — Implementar controle de perfis: após login, ler `profiles.perfil` do usuário e montar o menu/rotas conforme o perfil (`ADMINISTRADOR` ou `MECANICO`). Usuário novo nasce como `MECANICO` (trigger `handle_new_user`); dono é promovido manualmente via SQL.
  - *Aceite:* mecânico nunca enxerga rotas de admin (ex.: `/admin/financeiro` redireciona); admin enxerga tudo.

- [ ] **T-01.4** — Criar componente de layout responsivo (RF-001/RNF-001/RNF-004): navegação com botões grandes, pensada para tablet e mãos sujas na oficina.
  - *Aceite:* layout usável em 768px+ (tablet) e desktop sem zoom; navegação com ≤ 2 toques para as ações principais.

- [ ] **T-01.5** — Middleware/guard de rotas verificando sessão + perfil antes de liberar páginas sensíveis.
  - *Aceite:* acesso direto por URL a rota restrita sem sessão redireciona ao login.

---

## Épico 2 — Clientes e Veículos (RF-005, RF-006, RF-002/003)

- [ ] **T-02.1** — Tela de listagem de clientes (admin): tabela com nome, telefone, CPF e ações; paginação ou busca simples.
  - *Aceite:* admin lista todos os clientes; mecânico não acessa esta rota (RLS já bloqueia a API — confirmar 403 no front).

- [ ] **T-02.2** — Formulário de cadastro/edição de cliente: nome* (obrigatório), telefone* (obrigatório), CPF (opcional), endereço (opcional).
  - *Aceite:* validação de obrigatórios; CPF opcional aceito em branco; gravação persiste no Supabase.

- [ ] **T-02.3** — Cadastro de veículo vinculado a um cliente: placa* (com validação formato antigo `ABC-1234` e Mercosul `ABC1D23`), modelo*, cor, ano (opcional), observações (opcional).
  - *Aceite:* placa duplicada exibe erro amigável (constraint UNIQUE); veículo salvo aparece na ficha do cliente.

- [ ] **T-02.4** — Ficha do cliente com seus veículos e histórico de OS (links para as ordens).
  - *Aceite:* da ficha do cliente é possível ver todas as OS de cada veículo.

---

## Épico 3 — Verificação de Placa / Auditoria (RF-007, RF-004)

- [ ] **T-03.1** — Tela de registro de verificação de placa (somente admin): selecionar veículo, registrar data/hora automática, responsável logado automático (RF-004) e observação.
  - *Aceite:* registro visível na trilha de auditoria; mecânico não tem acesso à tela nem à tabela (RLS `verificacoes_admin`).

- [ ] **T-03.2** — Tela de trilha de auditoria: listagem de verificações por veículo/placa, com data, responsável e observação.
  - *Aceite:* admin filtra por placa; registros não podem ser editados/excluídos na UI.

- [ ] **T-03.3** — Integrar o bloqueio de fluxo: a UI deve impedir a criação/avaliação de OS sem verificação de placa registrada (o trigger `exigir_verificacao_placa` já protege o banco — o front deve capturar o erro e orientar o usuário).
  - *Aceite:* ao tentar avançar status sem verificação, mensagem clara "Registre a verificação de placa antes" com link para a tela T-03.1.

---

## Épico 4 — Ordens de Serviço (RF-008 a RF-012)

- [ ] **T-04.1** — Criação de OS vinculada a cliente + veículo: data de entrada (auto), previsão de entrega, responsável técnico (select de `profiles` com perfil MECANICO), status inicial `RECEBIDO`. Gerar `numero_os` sequencial (ex.: `OS-2026-00001`).
  - *Aceite:* OS criada aparece na listagem; `numero_os` único; `criado_por` preenchido automaticamente.

- [ ] **T-04.2** — Marcação de tipos de serviço: checkboxes "Mecânica" e "Funilaria" — pelo menos um obrigatório, ambos permitidos simultaneamente (RF-010, tabela `os_tipos_servico`).
  - *Aceite:* OS com os dois tipos marcados salva 2 linhas na associação.

- [ ] **T-04.3** — Lista de serviços da OS: adicionar/remover descrições + valores de mão de obra por serviço (`os_servicos`).
  - *Aceite:* serviços somam no total da OS (T-04.7); remoção pede confirmação.

- [ ] **T-04.4** — Fluxo de status (RF-011): botão/barra de progresso com os 9 estados na ordem — Recebido → Em Diagnóstico → Aguardando Aprovação → Aguardando Peça(s) → Em Funilaria → Em Mecânica → Teste/Qualidade → Pronto para Entrega → Entregue. Permite avançar e retroceder.
  - *Aceite:* mudança chama RPC `atualizar_status_os`; cada mudança cria registro em `os_atualizacoes`; status `ENTREGUE` grava `data_entrega`.

- [ ] **T-04.5** — Modal de observação opcional ao mudar status (RF-012).
  - *Aceite:* observação salva no mesmo registro do histórico; campo pode ficar vazio.

- [ ] **T-04.6** — Kanban ou lista filtrável de OS por status (RF-022): visão rápida "quais carros estão em funilaria agora?".
  - *Aceite:* filtro por status mostra placa, modelo, cliente e responsável; atrasadas destacadas (visual).

- [ ] **T-04.7** — Cálculo automático do valor total (RF-020): exibir soma de peças + serviços + mão de obra na ficha da OS (usar `v_os_totais`).
  - *Aceite:* ao alterar peças/serviços/mão de obra, o total atualiza na hora.

---

## Épico 5 — Feed de Atualizações (RF-013 a RF-015)

- [ ] **T-05.1** — Linha do tempo na ficha da OS: mostra quem fez, data/hora, status anterior → novo e observação (leitura de `os_atualizacoes`).
  - *Aceite:* timeline em ordem cronológica; sem botões de editar/excluir (imutável).

- [ ] **T-05.2** — Campo "Registrar atualização" na OS para mecânico e admin (RF-014): texto livre, via RPC `adicionar_atualizacao`.
  - *Aceite:* mecânico posta sem mudar status; atualização aparece imediatamente na timeline.

- [ ] **T-05.3** — (Opcional, RNF-005) Atualização em tempo real da timeline via Supabase Realtime (`alter publication supabase_realtime add table os_atualizacoes`).
  - *Aceite:* atualização feita por outro usuário aparece sem refresh.

---

## Épico 6 — Peças e Estoque (RF-016 a RF-020)

- [ ] **T-06.1** — CRUD do catálogo de peças (admin): nome*, código interno* (único), modelo compatível, preços de referência mín/méd/máx, data da última atualização (auto).
  - *Aceite:* código duplicado bloqueado; mecânico lê o catálogo mas não edita.

- [ ] **T-06.2** — Vincular peças à OS (RF-017): buscar no catálogo, quantidade, preço unitário sugerido pelo catálogo (editável — snapshot), fornecedor opcional.
  - *Aceite:* preço salvo em `os_pecas` não muda quando o catálogo é atualizado depois.

- [ ] **T-06.3** — Tabela de preços de referência para consulta rápida no orçamento (RF-019): painel lateral com faixa mín–méd–máx ao montar a OS.
  - *Aceite:* mecânico e admin veem a referência durante o orçamento.

- [ ] **T-06.4** — Entrada de estoque (COMPRA): registrar peça, quantidade, fornecedor.
  - *Aceite:* movimentação aparece no histórico com usuário logado e data.

- [ ] **T-06.5** — Saída de estoque (CONSUMO) vinculada à OS: baixa automática ao vincular peça à OS (ou baixa manual com vínculo à OS).
  - *Aceite:* CONSUMO sem OS é rejeitado (validação na aplicação).

- [ ] **T-06.6** — Tela de saldo de estoque (view `v_estoque_saldo`): lista com saldo por peça, destaque para saldo ≤ 0.
  - *Aceite:* saldo = compras − consumos, sempre consistente com as movimentações.

---

## Épico 7 — Relatórios, Dashboard e Busca (RF-021 a RF-023)

- [ ] **T-07.1** — Dashboard do admin (RF-021): cards com OS em aberto, OS atrasadas (passou da previsão), faturamento do dia/semana/mês e peças mais utilizadas.
  - *Aceite:* dados vindos das views `v_os_em_aberto`, `v_faturamento`, `v_pecas_mais_utilizadas`; filtro de período funcional.

- [ ] **T-07.2** — Visão em lista de veículos por status (RF-022) — pode reutilizar T-04.6, mas como página dedicada no dashboard.
  - *Aceite:* clicar num card de status (ex.: "Em Funilaria") lista os veículos.

- [ ] **T-07.3** — Busca global (RF-023): campo único buscando por placa, nome do cliente ou número da OS (view `v_busca_geral`).
  - *Aceite:* resultados clicáveis levando à ficha da OS.

---

## Épico 8 — Infraestrutura e Qualidade (RNF-001 a RNF-005)

- [ ] **T-08.1** — Deploy (Vercel/Netlify ou similar) com HTTPS; acesso exclusivamente via navegador (RNF-001).
- [ ] **T-08.2** — Confirmar que nenhuma senha é armazenada em texto plano — tudo via Supabase Auth (RNF-002). *Verificação, não desenvolvimento.*
- [ ] **T-08.3** — Configurar backup diário automático do banco: no plano Pro do Supabase há backups diários gerenciados; no Free, agendar `pg_dump` via GitHub Action cron (RNF-003).
  - *Aceite:* backup diário executando e artefato armazenado fora do Supabase.
- [ ] **T-08.4** — Revisão de UX para oficina (RNF-004): contrastes altos, botões grandes (≥ 44px), fluxos curtos.
  - *Aceite:* checklist de acessibilidade básica validado em tablet com luvas/tela suja.
- [ ] **T-08.5** — Suporte a baixa conectividade (RNF-005): estratégia de cache local (PWA/service worker) ou fila de operações offline com sincronização ao voltar a conexão (priorizar registro de atualizações T-05.2).
  - *Aceite:* com internet cortada, o mecânico consegue digitar uma atualização e ela sincroniza ao reconectar.

---

## Dependências sugeridas

1. T-01 (setup/auth) → tudo.
2. T-02 (clientes/veículos) → T-03 (verificação) → T-04 (OS).
3. T-06.1 (catálogo) → T-06.2 (vínculo) e T-04.7 (total com peças).
4. T-04 (OS) → T-05 (feed) → T-07 (dashboard/busca).

## Critérios de aceite gerais (vale para todas as tarefas)

- [ ] RF-004: toda ação de criar/editar/mudar status registra usuário logado e data/hora.
- [ ] RF-002/003: admin vê valores/CPF/endereço; mecânico nunca vê — validar no front E na API (RLS).
- [ ] RF-015: histórico de atualizações sem editar/apagar em nenhuma interface.
