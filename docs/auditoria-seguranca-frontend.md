# Relatório de Auditoria de Segurança do Frontend — Terrarium

**Projeto:** Terrarium — Gestão de UEPs (Vegetais)
**Instituição:** IFPE Campus Belo Jardim
**Data:** 28 de Novembro de 2026
**Auditor:** Engenharia de Segurança de Aplicações (AppSec)
**Versão do Frontend:** 0.1.5
**Escopo:** Frontend React / TypeScript / Vite / React Router / Armazenamento do Navegador

---

## 1. Resumo Executivo

Foi conduzida uma auditoria abrangente e revisão técnica de segurança da aplicação frontend do projeto **Terrarium**, com ênfase em autenticação, autorização baseada em papéis (RBAC), segregação de escopos por Unidade Educativa de Produção (UEP), integridade do fluxo de sessão, manipulação de estado do cliente, comunicação com a API e proteção de dados em repouso no navegador.

### Principais Destaques:
- **Segurança Criptográfica & Fail-Closed:** O frontend implementa um mecanismo estrito de fail-closed durante a validação ativa da sessão contra o backend (`/api/auth/me`). Sessões sem confirmação de identidade por fonte confiável têm acesso negado a rotas protegidas.
- **Eliminação de Confiança no Armazenamento Local:** A UEP gravada no `localStorage` ou `sessionStorage` foi desqualificada como fonte de autorização. O frontend extrai privilégios e escopo estritamente de claims assinadas no JWT (`payload.uep`) ou do perfil autenticado retornado pelo servidor (`/api/auth/me`).
- **Segregação por UEP em Todos os Perfis:** Tanto rotas docentes quanto rotas de estudantes foram segregadas estritamente por UEP (`allowedUep={['olericultura']}` e `allowedUep={['fruticultura']}`).
- **Transparência de Fronteiras de Segurança:** Verificações client-side (como propriedade de turmas e manipulação de layout do pomar) são documentadas como proteções defensivas de interface (UX), e não substitutas da autorização autoritativa no servidor (BOLA/IDOR).
- **Alinhamento do Módulo Fruticultura:** Pomar, layout 2D/3D e sala de equipamentos operam atualmente como protótipos funcionais com persistência local (`localStorage`), com integração backend dependente da Issue #217.

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
| **ALUNO (Olericultura)** | Olericultura | Visualização de canteiros da horta liberados pela turma, ficha simplificada de campo, check-in de tarefas práticas, visualização de cronograma e colheitas da Olericultura. Bloqueado de rotas da Fruticultura. |
| **ALUNO (Fruticultura)** | Fruticultura | Visualização do pomar e sala de equipamentos da Fruticultura. Bloqueado de rotas da Olericultura. |
| **USUARIO** | Nenhuma | Perfil inicial sem privilégios administrativos ou docentes. |

---

## 4. Relatório de Vulnerabilidades e Correções

### SEC-01: Quebra de Controle de Acesso por UEP entre Docentes e Discentes (Horizontal Privilege Escalation)
- **Classificação:** CRÍTICA
- **Status:** **CORRIGIDA NO FRONTEND**
- **Arquivos:** `frontend/src/routes/AppRoutes.tsx`, `frontend/src/routes/ProtectedRoute.tsx`
- **Descrição Técnica:** Anteriormente, o componente `ProtectedRoute` não segregava adequadamente as rotas de alunos por UEP (`allowedRoles={['ALUNO']}`), permitindo acesso cruzado direto por URL entre discentes de Olericultura e Fruticultura.
- **Cenário de Exploração:** Um aluno de Olericultura acessava `/fruticultura/aluno/pomar`. Um professor de Olericultura acessava `/fruticultura/professor/configuracoes`.
- **Correção Implementada:**
  - `ProtectedRoute` passou a exigir validação estrita de `allowedUep`, aplicando fail-closed: usuários sem UEP atribuída ou com UEP divergente recebem tela 403 (`UnauthorizedAccess`).
  - No `AppRoutes.tsx`, as rotas docentes e discentes de Olericultura foram restritas a `allowedUep={['olericultura']}` e as de Fruticultura a `allowedUep={['fruticultura']}`.
  - Testes de regressão adicionados em `ProtectedRoute.test.tsx` e `AppRoutes.test.tsx`.

---

### SEC-02: Exposição de Turmas e Ações de Exclusão no Frontend (Mitigação Defensiva contra BOLA / IDOR)
- **Classificação:** ALTA
- **Status:** **MITIGADA NO FRONTEND / DEPENDENTE DO BACKEND PARA SOLUÇÃO DEFINITIVA**
- **Arquivos:** `frontend/src/modules/olericultura/pages/professor/TurmaDetalheProfessorPage.tsx`, `frontend/src/services/turmaService.ts`
- **Descrição Técnica:** Na rota `/olericultura/professor/turmas/:id`, a interface carregava dados por ID sem validar propriedade.
- **Correção Implementada no Frontend:**
  - Adicionada verificação de propriedade `isOwner` no componente `TurmaDetalheProfessorPage`. Caso o usuário logado não seja o professor proprietário da turma nem ADMIN, a interface exibe tela 403 (`UnauthorizedAccess`).
  - No serviço `turmaService.excluirTurma(id, solicitanteEmail)`, valida-se o solicitante antes da remoção local.
- **Ressalva Arquitetural Mandatória:** O `localStorage` NÃO constitui fronteira de segurança. Esta verificação client-side é uma proteção defensiva de interface e UX para evitar vazamento acidental. A proteção autoritativa contra BOLA/IDOR na leitura, criação, alteração, exclusão e vinculação de turmas DEVE ser implementada nos endpoints REST do backend quando o módulo for migrado para a API.

---

### SEC-03: Inferência Insegura de Papel por Domínio de E-mail
- **Classificação:** ALTA
- **Status:** **REVISADA E MITIGADA**
- **Arquivos:** `frontend/src/modules/auth/utils/roleIdentifier.ts`
- **Descrição Técnica:** Caso `defaultRole` não estivesse presente, a função inferia papéis com base no domínio do e-mail.
- **Mitigação:** Confirmada a precedência mandatória do papel autenticado no token JWT via `validateAndSanitizeSession`. Quando o usuário possui sessão autenticada, `user.role` é inalterável via storage local. O papel ADMIN nunca é inferido por string de e-mail.

---

### SEC-04: Sobrescrita do E-mail do Usuário por UUID do Token JWT
- **Classificação:** MÉDIA
- **Status:** **CORRIGIDA NO FRONTEND**
- **Arquivos:** `frontend/src/services/authService.ts`, `frontend/src/services/securityHardening.test.ts`
- **Descrição Técnica:** No Spring Boot, o `sub` do token JWT armazena o UUID do usuário. Ao sanitizar a sessão, o frontend sobrescrevia `session.email` com o UUID do `sub`, perdendo o e-mail real nas telas e checagens.
- **Correção Implementada:** Ajustada a sanitização para manter `session.email` quando o `payload.sub` não contiver caractere `@` (indicando identificador UUID). Teste validado em `securityHardening.test.ts`.

---

### SEC-05: Falha de Higienização de Registros de Colheita no Logout
- **Classificação:** MÉDIA
- **Status:** **CORRIGIDA NO FRONTEND**
- **Arquivos:** `frontend/src/services/authService.ts`, `frontend/src/services/securityHardening.test.ts`
- **Descrição Técnica:** Ao executar `authService.logout()`, chaves de cache e seleção de UEP permaneciam gravadas no navegador.
- **Correção Implementada:** Inclusa a remoção explícita de `terrarium_uep_registros_colheita_v2` e `terrarium_selected_uep` no método `logout()`.

---

### SEC-06: Falha de Mock CSRF em Teste de Handshake do AuthContext
- **Classificação:** BAIXA / QUALIDADE DE SEGURANÇA
- **Status:** **CORRIGIDA NO FRONTEND**
- **Arquivos:** `frontend/src/contexts/AuthContext.test.tsx`
- **Descrição Técnica:** O teste de concorrência (`authRequestIdRef`) falhava por rejeição não tratada ao não simular o endpoint `/auth/csrf` consumido pelo `fetchApi`.
- **Correção Implementada:** Ajustado o mock global de `fetch` para retornar a resposta válida do token CSRF.

---

### SEC-07: Confiança Indevida em UEP no Navegador & Comportamento Fail-Closed do /auth/me
- **Classificação:** ALTA
- **Status:** **CORRIGIDA NO FRONTEND**
- **Arquivos:** `frontend/src/services/authService.ts`, `frontend/src/routes/ProtectedRoute.tsx`
- **Descrição Técnica:**
  1. A sanitização preservava `session.uep` do storage local caso ausente no token, permitindo que um usuário adulterasse a UEP no DevTools e tentasse acesso cruzado.
  2. O frontend aceitava sessão local quando `/api/auth/me` retornava 404 (modo de compatibilidade inseguro).
- **Correções Implementadas:**
  1. **Desqualificação do Storage:** `validateAndSanitizeSession` nunca utiliza `session.uep` de `localStorage` ou `sessionStorage`. A UEP autoritativa é extraída estritamente de claim assinada no JWT (`payload.uep`).
  2. **Higienização Ativa:** Se o storage for adulterado manualmente, `getSession()` descarta a UEP adulterada e sobrescreve o storage com a sessão sanitizada.
  3. **Comportamento Fail-Closed:** Em `validarSessaoAtiva()`, quando `/api/auth/me` retornar 404, 401, 403 ou qualquer erro de rede, o frontend executa `this.logout()` e nega o acesso.
  4. **Proteção de Rota:** `ProtectedRoute` rejeita acessos se `user.uep` for indefinido em rotas que exigem escopo.

---

## 5. Matriz Resumo de Vulnerabilidades e Pendências

| ID | Vulnerabilidade / Apontamento | Severidade | Status no Frontend | Responsabilidade Backend |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Quebra de Controle de Acesso por UEP (Docentes e Discentes) | **CRÍTICA** | **Corrigida** | Manter autorização no Spring Security |
| **SEC-02** | BOLA / IDOR na Gestão e Exclusão de Turmas | **ALTA** | **Mitigada (UX)** | **Pendente:** endpoints `/api/turmas` autoritativos |
| **SEC-03** | Inferência Insegura de Role por E-mail | **ALTA** | **Mitigada** | Manter claim `role` no JWT |
| **SEC-04** | Sobrescrita de E-mail por UUID no JWT | **MÉDIA** | **Corrigida** | Opcional: incluir claim `email` no JWT |
| **SEC-05** | Vazamento de Colheitas no Logout | **MÉDIA** | **Corrigida** | Nenhuma |
| **SEC-06** | Mock CSRF incompleto nos Testes | **BAIXA** | **Corrigida** | Nenhuma |
| **SEC-07** | Confiança Indevida em UEP no Navegador & Fail-Closed | **ALTA** | **Corrigida** | **Pendente:** implementar `GET /api/auth/me` |

---

## 6. Alinhamento de Escopo do Módulo Fruticultura (Issue #217)

A implementação das páginas de Fruticultura (`PomarPage.tsx`, `ConfiguracoesPomarLayoutPage.tsx` e `SalaEquipamentosPage.tsx`) apresenta a seguinte realidade técnica:

- **Protótipo de Interface e Persistência Local:** Todo o armazenamento de quadras, árvores, configurações e inventário da Sala de Equipamentos utiliza dados estáticos (`pomarData.ts`) e o serviço `pomarLayoutService.ts` com persistência em `localStorage`.
- **Inexistência de Persistência no Backend:** Não existem no backend Spring Boot tabelas Flyway, entidades JPA, DTOs, controllers ou endpoints para o domínio Fruticultura/Pomar.
- **Inexistência de Isolamento Multi-Tenant no Servidor:** Qualquer isolamento atual entre turmas ou usuários no módulo de Fruticultura ocorre exclusivamente na interface do navegador, não constituindo garantia de segurança no servidor.
- **Responsabilidade:** A implementação real do domínio de Fruticultura no backend permanece sob responsabilidade do desenvolvedor de backend (Ítalo), conforme escopo da Issue #217.

---

## 7. Contrato de Integração Recomendado para `/api/auth/me`

Para que o frontend confirme a identidade autoritativa de forma segura sem depender de fallbacks locais, o backend deve disponibilizar o seguinte contrato:

- **Método:** `GET`
- **Endpoint:** `/api/auth/me`
- **Autenticação:** Header HTTP `Authorization: Bearer <token-jwt>`
- **Códigos de Resposta:**
  - `200 OK`: Usuário autenticado e ativo.
  - `401 Unauthorized`: Token ausente, inválido ou expirado.
  - `403 Forbidden`: Usuário desativado ou sem permissão.
- **Payload de Resposta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "Professor George Henrique",
  "email": "george@belojardim.ifpe.edu.br",
  "role": "PROFESSOR",
  "uep": "olericultura"
}
```
Alternativamente, a claim `"uep"` pode ser assinada diretamente no token JWT pelo `TokenService.java` (`.withClaim("uep", usuario.getUep())`), permitindo validação criptográfica imediata no payload decodificado.
