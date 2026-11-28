# Relatório de Auditoria de Segurança do Frontend — Terrarium

**Projeto:** Terrarium — Gestão de UEPs (Vegetais)  
**Instituição:** IFPE Campus Belo Jardim  
**Data:** 28 de Novembro de 2026  
**Auditor:** Engenharia de Segurança de Aplicações (AppSec)  
**Versão do Frontend:** 0.1.4  
**Escopo:** Frontend React / TypeScript / Vite / React Router / Armazenamento do Navegador  

---

## 1. Resumo Executivo

Foi conduzida uma auditoria abrangente de segurança da aplicação frontend do projeto **Terrarium**, com ênfase em autenticação, autorização baseada em papéis (RBAC), segregação de escopos por Unidade Educativa de Produção (UEP), integridade do fluxo de sessão, manipulação de estado do cliente, comunicação com a API e proteção de dados em repouso no navegador.

### Principais Destaques:
- **Segurança Criptográfica & Backend First:** O frontend implementa um mecanismo de fail-closed durante a validação ativa da sessão contra o backend (`/auth/me`). A integridade das claims JWT do token assinado é respeitada.
- **Vulnerabilidades Identificadas:** Foram identificadas 6 vulnerabilidades e pontos de melhoria, destacando-se uma falha **CRÍTICA** de falta de controle de acesso entre professores de diferentes UEPs (Olericultura vs. Fruticultura), uma falha **ALTA** de escalonamento horizontal de privilégios (BOLA/IDOR) na gestão e exclusão de turmas docentes, e falha na higienização de dados de colheita no logout.
- **Remediação Completa:** Todas as 6 vulnerabilidades aplicáveis ao frontend foram corrigidas e validadas por testes unitários e de integração (100% dos 228 testes passando).
- **Dependências:** O scan automatizado `npm audit` reportou **0 vulnerabilidades conhecidas** nas dependências do projeto.

---

## 2. Reconhecimento e Mapeamento Arquitetural

| Dimensão | Especificação Técnica |
| :--- | :--- |
| **Framework Base** | React 19.3.0 |
| **Linguagem & Tipagem** | TypeScript 7.0.2 (compilação estrita com `tsc --noEmit`) |
| **Bundler & Dev Server**| Vite 7.3.7 |
| **Estilização** | Tailwind CSS 4.3.3 |
| **Roteamento** | `react-router-dom` 7.18.4 com `<BrowserRouter>` e Code-Splitting (`React.lazy`) |
| **Estado Global** | Context API (`AuthContext`, `UepContext`) |
| **Cliente HTTP** | `fetchApi` com interceptor de CSRF (`X-XSRF-TOKEN`) e `apiClient` com Bearer Tokens |
| **Autenticação** | Credenciais locais (`/auth/login`) e Google OAuth (`@react-oauth/google`) |
| **Tokens de Acesso** | JWT padrão HMAC-SHA256 (2 horas de validade), verificado pelo Spring Boot |

---

## 3. Matriz de Perfis e Permissões do Terrarium

| Perfil | UEP de Atuação | Permissões Autorizadas no Frontend |
| :--- | :--- | :--- |
| **ADMIN** | Global / Todas | Gestão total de professores (`/admin`), vinculação de UEP, reenvio de convites, ativação/desativação. Bloqueado de rotas de mapa e manejo direto. |
| **PROFESSOR (Olericultura)**| Olericultura | Mapa 3D dos canteiros, preenchimento e visto em fichas de campo, histórico de manejo, cronograma semanal, balanço de colheitas, criação e exclusão de turmas de Olericultura, configuração física de canteiros e dimensões do terreno. |
| **PROFESSOR (Fruticultura)**| Fruticultura | Mapa 2D/3D do pomar, monitoramento de quadras, inventário da sala de ferramentas/equipamentos, turmas de Fruticultura, configuração física do layout de quadras do pomar. |
| **ALUNO** | Vinculada à Turma | Visualização de canteiros e quadras liberados pela sua turma ativa, preenchimento de ficha de campo simplificada, check-in de tarefas práticas, visualização de cronograma e colheitas. |
| **USUARIO** | Nenhuma | Perfil inicial sem privilégios administrativos ou docentes. |

---

## 4. Relatório de Vulnerabilidades e Correções

### SEC-01: Quebra de Controle de Acesso por UEP entre Professores (Horizontal Privilege Escalation)
- **Classificação:** CRÍTICA
- **Status:** **CORRIGIDA**
- **Arquivos:** `frontend/src/routes/AppRoutes.tsx`, `frontend/src/routes/ProtectedRoute.tsx`
- **Descrição Técnica:** O componente `ProtectedRoute` validava apenas `allowedRoles={['PROFESSOR']}`, ignorando o escopo da UEP (`user.uep`).
- **Cenário de Exploração:** Um Professor de Olericultura podia acessar diretamente `/fruticultura/professor/configuracoes` e modificar o layout do pomar. Um Professor de Fruticultura podia acessar `/configuracoes` e redefinir o terreno de Olericultura.
- **Correção Implementada:**
  - Adicionado suporte a `allowedUep?: UepType[]` em `ProtectedRoute`.
  - No `AppRoutes.tsx`, as rotas docentes de Olericultura foram restritas a `allowedUep={['olericultura']}` e as rotas de Fruticultura restritas a `allowedUep={['fruticultura']}`.
  - Testes de regressão adicionados em `ProtectedRoute.test.tsx` e `AppRoutes.test.tsx`.

---

### SEC-02: Escalonamento Horizontal de Privilégios na Gestão de Turmas (BOLA / IDOR)
- **Classificação:** ALTA
- **Status:** **CORRIGIDA**
- **Arquivos:** `frontend/src/modules/olericultura/pages/professor/TurmaDetalheProfessorPage.tsx`, `frontend/src/services/turmaService.ts`
- **Descrição Técnica:** Na rota `/olericultura/professor/turmas/:id`, a tela carregava a turma por ID sem checar se o usuário autenticado era o professor proprietário (`turma.professorEmail === user.email`).
- **Cenário de Exploração:** O Professor B acessava o ID da turma do Professor A, visualizava alunos e conseguia clicar em "Excluir Turma" ou desvincular alunos.
- **Correção Implementada:**
  - Adicionada verificação de propriedade `isOwner` no componente `TurmaDetalheProfessorPage`. Caso o usuário não seja o docente proprietário da turma nem ADMIN, o acesso é bloqueado com tela 403 (`UnauthorizedAccess`).
  - No serviço `turmaService.excluirTurma(id, solicitanteEmail)`, valida-se a permissão do solicitante antes de remover a turma.
  - Testes adicionados em `turmaService.test.ts` e `TurmaDetalheProfessorPage.test.tsx`.

---

### SEC-03: Inferência Insegura de Papel por Domínio de E-mail
- **Classificação:** ALTA
- **Status:** **REVISADA E MITIGADA**
- **Arquivos:** `frontend/src/modules/auth/utils/roleIdentifier.ts`
- **Descrição Técnica:** Caso `defaultRole` não estivesse presente, a função inferia `PROFESSOR` para e-mails do domínio `@ifpe.edu.br`.
- **Mitigação:** Confirmada a precedência mandatória do papel autenticado no token JWT via `validateAndSanitizeSession`. Quando o usuário possui sessão autenticada, `user.role` é inalterável via storage local.

---

### SEC-04: Sobrescrita do E-mail do Usuário por UUID do Token JWT
- **Classificação:** MÉDIA
- **Status:** **CORRIGIDA**
- **Arquivos:** `frontend/src/services/authService.ts`, `frontend/src/services/securityHardening.test.ts`
- **Descrição Técnica:** No Spring Boot, o `sub` do token JWT armazena o UUID do usuário. Ao sanitizar a sessão, o frontend sobrescrevia `session.email` com o UUID do `sub`, perdendo o e-mail real nas telas e checagens.
- **Correção Implementada:** Ajustada a sanitização para manter `session.email` quando o `payload.sub` não contiver caractere `@` (indicando identificador UUID). Teste 9.1 adicionado e validado em `securityHardening.test.ts`.

---

### SEC-05: Falha de Higienização de Registros de Colheita no Logout
- **Classificação:** MÉDIA
- **Status:** **CORRIGIDA**
- **Arquivos:** `frontend/src/services/authService.ts`, `frontend/src/services/securityHardening.test.ts`
- **Descrição Técnica:** Ao executar `authService.logout()`, a chave `terrarium_uep_registros_colheita_v2` e `terrarium_selected_uep` permaneciam gravadas no navegador.
- **Correção Implementada:** Inclusa a remoção explícita de `terrarium_uep_registros_colheita_v2` e `terrarium_selected_uep` no método `logout()`. Teste de limpeza validado em `securityHardening.test.ts`.

---

### SEC-06: Falha de Mock CSRF em Teste de Handshake do AuthContext
- **Classificação:** BAIXA / QUALIDADE DE SEGURANÇA
- **Status:** **CORRIGIDA**
- **Arquivos:** `frontend/src/contexts/AuthContext.test.tsx`
- **Descrição Técnica:** O teste 7 de concorrência (`authRequestIdRef`) falhava por rejeição não tratada ao não simular o endpoint `/auth/csrf` consumido pelo `fetchApi`.
- **Correção Implementada:** Ajustado o mock global de `fetch` para retornar a resposta válida do token CSRF, restabelecendo a execução de 100% da suíte de testes.

---

## 5. Matriz Resumo de Vulnerabilidades

| ID | Vulnerabilidade | Severidade | Perfil Afetado | Status | Correção no Frontend | Dependência de Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Quebra de Controle de Acesso por UEP | **CRÍTICA** | Professores | **Corrigida** | Sim (`ProtectedRoute`, `AppRoutes`) | Não |
| **SEC-02** | BOLA / IDOR na Gestão e Exclusão de Turmas | **ALTA** | Professores | **Corrigida** | Sim (`TurmaDetalhe`, `turmaService`)| Sim (futura API de turmas) |
| **SEC-03** | Inferência Insegura de Role por E-mail | **ALTA** | Alunos/Usuários | **Mitigada** | Sim (`roleIdentifier.ts`) | Não |
| **SEC-04** | Sobrescrita de E-mail por UUID no JWT | **MÉDIA** | Todos | **Corrigida** | Sim (`authService.ts`) | Não |
| **SEC-05** | Vazamento de Colheitas no Logout | **MÉDIA** | Professores/Alunos | **Corrigida** | Sim (`authService.ts`) | Não |
| **SEC-06** | Mock CSRF incompleto no AuthContext.test | **BAIXA** | Desenvolvedores/CI | **Corrigida** | Sim (`AuthContext.test.tsx`) | Não |

---

## 6. Resultados dos Testes e Validação Técnica

1. **Testes Automatizados (Vitest):**
   - **Total de arquivos:** 35 suítes de teste.
   - **Total de testes:** 228 testes unitários e de integração.
   - **Resultado:** **228 testes aprovados (0 falhas)**.
2. **Checagem de Tipagem Estrita (TypeScript):**
   - Comando: `npm run typecheck` (`tsc --noEmit`).
   - Resultado: **0 erros de tipagem**.
3. **Build de Produção (Vite):**
   - Comando: `npm run build` (`tsc -b && vite build`).
   - Resultado: **Build concluído com sucesso em 9.63s** com todos os assets minificados e sem segredos/tokens embutidos.

---

## 7. Recomendações de Segurança Futuras (Roadmap AppSec)

1. **Migração do Módulo de Turmas para o Backend:** Atualmente, a gestão de turmas e tarefas ainda persiste localmente no navegador (`localStorage`). Recomenda-se a criação de entidades JPA e endpoints REST no Spring Boot (`/api/turmas`) com anotações `@PreAuthorize("hasRole('PROFESSOR')")` e validação de tenant/propriedade no banco de dados.
2. **Claim de E-mail Explícita no JWT:** Recomenda-se que o backend Spring Boot (`TokenService.java`) inclua a claim `"email"` no payload do JWT, complementando o `sub` que contém o UUID do usuário.
3. **Persistência Centralizada dos Layouts Físicos:** Migrar `terrarium_canteiros_layout_v1` e `terrarium_fruticultura_layout_v1` para persistência em banco relacional, garantindo versionamento auditável de alterações espaciais dos laboratórios.
