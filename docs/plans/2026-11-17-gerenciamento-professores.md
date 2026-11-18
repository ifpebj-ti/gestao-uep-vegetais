# Plano: gerenciamento de contas de professores

## Objetivo

Fazer o painel administrativo gerenciar contas reais de professores via API e PostgreSQL: listar, convidar para definir senha, editar nome/e-mail/UEP, reenviar convite, desativar e reativar. Somente usuários ADMIN podem usar as rotas de gestão. Desativação preserva canteiros e histórico e bloqueia tanto novos logins quanto JWTs já emitidos.

**Concluído quando:** o ADMIN provisionado entra pela API; a lista do painel vem do banco; criar professor gera convite que permite definir senha; mudanças de e-mail seguem as regras aprovadas; desativar bloqueia o acesso sem apagar histórico; a interface não depende de professores/login de demonstração no `localStorage`.

## Fora do escopo

Exclusão física, gerenciamento de alunos, redesign, importação dos dados simulados locais ou configuração de SMTP externo de produção.

## Estado atual mapeado

- `frontend/src/modules/admin/pages/AdminDashboardPage.tsx`: operações síncronas de lista/criação/edição/remoção pelo serviço local.
- `frontend/src/services/adminService.ts`: lista de exemplo em `localStorage`, CRUD local e autenticação simulada.
- `frontend/src/services/authService.ts`: tenta login local antes da API e obtém UEP do serviço local.
- `frontend/src/routes/AppRoutes.tsx` e `frontend/src/routes/ProtectedRoute.tsx`: rotas e controle de papel no cliente.
- `backend/src/main/java/com/gestao/uep/domain/usuario/Usuario.java`, `UsuarioRepository.java` e `UsuarioRole.java`: entidade, persistência e papéis existentes.
- `backend/src/main/java/com/gestao/uep/controllers/AuthController.java` e DTOs de usuário: login, cadastro e confirmação atuais.
- `backend/src/main/java/com/gestao/uep/infra/security/SecurityConfigurations.java` e `SecurityFilter.java`: segurança JWT atual; hoje não há regra de papel por rota nem bloqueio do usuário desativado no filtro.
- `backend/src/main/java/com/gestao/uep/services/EmailService.java` e `EmailVerificationTokenService.java`: envio e confirmação existentes, que informam os padrões para convites.
- `backend/src/main/resources/db/migration`: migrações Flyway até V8; `application.yml` usa PostgreSQL e Flyway.
- `docker-compose.yml`: backend, PostgreSQL e Mailpit local. Convites de desenvolvimento ficam visíveis em `localhost:8025`.
- Cobertura existente relacionada: `backend/src/test/java/com/gestao/uep/controllers/AuthControllerTest.java`, `backend/src/test/java/com/gestao/uep/infra/security/SecurityConfigurationsTest.java`, `backend/src/test/java/com/gestao/uep/services/EmailVerificationTokenServiceTest.java`, `frontend/src/modules/admin/pages/AdminDashboardPage.test.tsx` e `frontend/src/services/authService.test.ts`.

## Decisões aprovadas

- Reutilizar `Usuario`; acrescentar UEP e estado ativo com migração aditiva. Professores já existentes no banco recebem UEP Olericultura; outros papéis ficam sem UEP.
- Convidar por e-mail para definir senha; token de uso único com validade de 24h, armazenado somente como hash.
- Desativar preserva relações e autoria. Conta desativada perde acesso mesmo com JWT previamente emitido.
- Reativar fica disponível no painel. Conta pendente não pode ser desativada como se já estivesse ativa.
- Alteração de e-mail em conta ativa exige confirmar o endereço novo e bloqueia o acesso até essa confirmação.
- Alteração de e-mail em convite pendente invalida o token antigo e envia convite novo ao endereço atualizado.
- Provisionar o primeiro ADMIN a partir de `ADMIN_BOOTSTRAP_EMAIL` e `ADMIN_BOOTSTRAP_PASSWORD`, somente se ainda não houver ADMIN, com hash BCrypt e sem credencial padrão no repositório.
- Não migrar os registros de demonstração do navegador; o banco passa a ser a fonte de verdade.
- Alinhar validação do servidor aos domínios aceitos hoje pelo formulário (`belojardim.ifpe.edu.br`, `ifpe.edu.br` e a exceção institucional existente).

## Abordagem

Estender o modelo de usuários e o fluxo de autenticação existente, adicionando API administrativa protegida e fluxo separado para aceitar convite. Evita identidade duplicada e garante que UI, login e autorização consultem os mesmos registros.

## Tasks

### Task 1: Persistência e migração

Acrescentar `ativo`, UEP e data de criação a `Usuario`, métodos de estado/alteração de e-mail e migração Flyway aditiva com valor inicial apenas para PROFESSOR. Para linhas antigas, `criado_em` usa o instante da migração como aproximação. **Checagem:** compilar o backend e conferir a migração aplicada sem remover ou alterar FKs de canteiro/histórico.

### Task 2: Convite e confirmação

Implementar token de convite hash/expiração/uso único, serviço de convite e mensagem no `EmailService`; incluir aceitação pública que valida o token, define senha com BCrypt e confirma a conta. Reutilizar a confirmação existente para novo e-mail de conta ativada. **Checagem:** compilar backend; confirmar pelo fluxo local que token só funciona uma vez e que e-mail pendente/alterado segue bloqueado até confirmar.

### Task 3: API administrativa e autorização

Criar endpoints para listar, criar, editar, reenviar convite e mudar estado; validar dados e papel/domínio; devolver UEP/status no DTO; restringir `/api/admin/**` a ADMIN. **Checagem:** chamadas com ADMIN funcionam; sem JWT e com papel diferente recebem 401/403; conflitos e IDs inexistentes retornam erro HTTP claro.

### Task 4: Acesso e bootstrap reais

Rejeitar usuários inativos no login e no `SecurityFilter`; provisionar o ADMIN inicial uma única vez pelas variáveis de ambiente; incluir variáveis sem segredos no `.env.example` e orientar o Compose. Remover fallback de login local e enriquecimento de sessão vindo de dados locais; usar UEP retornada pela API. **Checagem:** `mvn -DskipTests package`; login falso deixa de entrar, credenciais provisionadas entram, JWT de professor desativado é rejeitado.

### Task 5: Painel conectado

Tornar `adminService` um cliente assíncrono de API; adaptar montagem da lista, modal, busca e ações a carregamento/erro; mostrar convite pendente/ativo/inativo; incluir reenvio e reativação; preservar feedbacks em português. **Checagem:** `npm run build`; página busca os registros do backend e exibe erro de API sem fingir sucesso.

### Task 6: Aceite do convite

Adicionar formulário público de senha/confirmar senha, rota para token de convite e chamada da API; definir a senha e encaminhar para login após sucesso. **Checagem:** fluxo de convite aberto pelo link do Mailpit completa e habilita login; token expirado/inválido mostra erro útil.

### Task 7: Integração local e documentação

Atualizar documentação de inicialização/ADMIN; subir stack local, abrir painel, criar professor, abrir convite no Mailpit, definir senha, editar dados, desativar, verificar acesso bloqueado e reativar. **Checagem:** a sequência ponta a ponta usa banco e SMTP local e mantém canteiros/histórico.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Sessão antiga sobrevive à desativação | `SecurityFilter` consulta e valida o estado atual no banco em cada requisição; não manter cache de usuário. |
| Token expõe/toma conta da conta | Persistir hash, validade de 24h, uso único, invalidar tokens anteriores e nunca registrar token bruto em logs/respostas. |
| E-mail falha após salvar conta | Manter estado pendente e permitir reenvio; mostrar ao ADMIN que o convite precisa ser reenviado. |
| Mudança de e-mail bloqueia conta ativa | Exibir estado aguardando confirmação e enviar confirmação para o novo endereço; confirmar ativa de novo. |
| Migração altera dados existentes | Migração aditiva; atribuir UEP só a professores; não remover FKs nem registros. |
| Credencial de bootstrap é exposta | Não definir senha padrão nem logar segredo; ler do `.env` local não versionado. |
| Docker local continua indisponível por armazenamento | Antes da etapa ponta a ponta, confirmar Docker/Compose; se falhar, registrar o bloqueio ambiental e concluir compilação/inspeção de API no ambiente disponível. |

## Rollback

Reverter frontend e backend mantendo colunas/tabela novas (migração compatível e aditiva). Não apagar usuários convidados, convites, dados ou relacionamentos. Antes de reverter, parar de aceitar convites se a API antiga não reconhecer o novo formato; o frontend antigo só volta a mostrar o armazenamento local de demonstração.

## Verificação da implementação

- Compilação backend: `cd backend; mvn -DskipTests package`.
- Build/typecheck frontend: `cd frontend; npm run build`.
- Fluxo integrado no Compose e Mailpit, conforme etapa 7.
- Não adicionar nem executar suítes automatizadas sem solicitação explícita; se o usuário pedir, priorizar os testes existentes listados acima e cobrir autorização, convites e desativação.

## Progresso

- [x] Desenho aprovado pelo usuário em 2026-11-17.
- [x] Plano aprovado pelo usuário em 2026-11-17.
- [x] Task 1 — persistência/migração (revisada estaticamente; compilação e banco local pendentes).
- [x] Task 2 — convite/CSRF (revisada estaticamente; compilação e fluxo no navegador pendentes).
- [x] Task 3 — API administrativa/autorização (revisão estática; compilação e HTTP ainda pendentes).
- [x] Task 4 — JWT por UUID/revogação durável e bootstrap ADMIN (typecheck frontend; backend ainda sem runtime).
- [x] Task 5 — painel conectado à API (inclui correção da troca rápida de UEP).`n- [ ] Tasks 6–7 — em andamento.

## Decisões adicionais aprovadas durante a execução

- CSRF continua habilitado. O backend fornece token para o SPA via cookie/header; o frontend envia o token em todas as operações mutáveis e `credentials: include`; CORS permite credenciais apenas nas origens explícitas. Confirmação por e-mail fica pública para abrir o link.
- O JWT passa a usar UUID imutável como sujeito. Tokens antigos baseados em e-mail deixam de funcionar e exigem novo login.
- Para evitar que JWTs voltem a funcionar após reativação ou confirmação de e-mail, persistir uma versão de sessão no usuário, incluí-la no token e compará-la no filtro. Desativar ou trocar e-mail incrementa essa versão; o usuário precisa fazer login novamente após reativar/confirmar.
