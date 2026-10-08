# Shibuya Motores — Credenciais & Acesso de Teste

Para acessar a aplicação web da **Shibuya Motores**, siga as instruções abaixo:

## 1. Como realizar o cadastro de novos usuários

1. Abra a aplicação web na tela de login (`/`).
2. Clique na opção **"Não tem conta? Cadastre-se como mecânico"**.
3. Preencha o **Nome Completo**, **E-mail** e **Senha** desejados.
4. Ao submeter, o usuário é cadastrado automaticamente com o perfil de **MECANICO** (operacional).

---

## 2. Promover um usuário para ADMINISTRADOR (Dono/Gerente)

Conforme a especificação do sistema, o perfil de **ADMINISTRADOR** tem privilégios totais (visualização de valores financeiros, relatórios no dashboard, auditoria de placas e edição de clientes).

Para promover um usuário existente para Administrador no Supabase:

1. Acesse o painel de SQL do Supabase.
2. Execute o seguinte comando SQL substituindo o e-mail do usuário:

```sql
UPDATE public.profiles
SET perfil = 'ADMINISTRADOR'
WHERE email = 'seu-email-admin@shibuya.com';
```

---

## 3. Credenciais Padrão de Teste (Sugestão)

Você pode registrar as seguintes contas de teste na tela inicial da aplicação:

### Conta de Administrador
- **E-mail:** `admin@shibuya.com`
- **Senha:** `12345678`
- **Perfil:** `ADMINISTRADOR` (promover via comando SQL acima no Supabase)

### Conta de Mecânico / Funileiro
- **E-mail:** `mecanico@shibuya.com`
- **Senha:** `12345678`
- **Perfil:** `MECANICO` (perfil atribuído automaticamente no cadastro)

---

## 4. Diferenças de Acesso por Perfil

| Funcionalidade / Tela | ADMINISTRADOR | MECÂNICO / FUNILEIRO |
| :--- | :---: | :---: |
| Ordens de Serviço (Visualização & Mudança de Status) | ✅ | ✅ |
| Registro de Atualizações Técnicas no Feed | ✅ | ✅ |
| Visualização de Valores Financeiros e Orçamentos | ✅ | ❌ (Oculto) |
| Leitura/Edição de Dados Pessoais (CPF/Telefone/Endereço) | ✅ | ❌ (Oculto) |
| Auditoria e Registro de Verificação de Placas | ✅ | ❌ (Restrito) |
| Dashboard com Faturamento e Métricas | ✅ | ❌ (Restrito) |
