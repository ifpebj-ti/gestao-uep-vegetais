# Design: gerenciamento administrativo de professores

Data: 2026-11-17

## Intenção

Permitir que uma pessoa autenticada como administradora gerencie contas reais de professores pela página administrativa. A conta é criada com convite por e-mail para que o próprio professor defina a senha. Remover significa desativar o acesso, mantendo os vínculos de canteiros e a autoria dos registros históricos.

**Concluído quando:** a lista, criação, edição da UEP e desativação/refativação operam sobre PostgreSQL pela API; somente ADMIN pode chamar as rotas administrativas; um convite válido permite definir senha e entrar; usuário desativado perde acesso mesmo com JWT anterior.

## Estado atual

- `frontend/src/modules/admin/pages/AdminDashboardPage.tsx` usa `adminService` sincronamente para listar, criar, editar UEP/e-mail e remover.
- `frontend/src/services/adminService.ts` persiste professores de exemplo em `localStorage` e também simula logins de admin, aluno e professor.
- `frontend/src/services/authService.ts` tenta o login local antes da API, e enriquece a sessão consultando a lista local.
- `backend/src/main/java/com/gestao/uep/domain/usuario/Usuario.java` já persiste papel, senha BCrypt e confirmação de e-mail. Ainda não guarda UEP nem estado de desativação.
- `backend/src/main/java/com/gestao/uep/controllers/AuthController.java` já autentica, cadastra usuários e confirma e-mail; `UsuarioRepository` consulta por papel.
- `backend/src/main/java/com/gestao/uep/infra/security/SecurityConfigurations.java` permite autenticação nas rotas `/api/auth/**`, mas todas as demais rotas exigem somente estar autenticado; não há autorização ADMIN por rota.
- `SecurityFilter` relê o usuário do banco para cada JWT, mas atualmente não recusa uma conta desativada.
- `EmailService` e a configuração SMTP/Mailpit do `docker-compose.yml` já suportam e-mail local; Mailpit expõe as mensagens de desenvolvimento em `localhost:8025`.
- Professores podem estar ligados a canteiros por `CanteiroResponsavel`; por isso a remoção física pode quebrar referências e apagar autoria. A desativação evita esse risco.
- O backend não reconhece hoje o domínio genérico `ifpe.edu.br`, embora o formulário frontend o aceite. As contas de professor atuais são identificadas por `belojardim.ifpe.edu.br`, com exceção explícita de `ifl1@discente.ifpe.edu.br`.
- Não há provisionamento de administrador real. O login local de admin aceita qualquer senha não vazia, logo não pode permanecer ativo neste fluxo.

## Abordagens

| Opção | Troca | Decisão |
|---|---|---|
| Usar `Usuario` existente e completar o modelo/API | Reaproveita identidade, BCrypt, JWT, papéis e banco; requer alterações coordenadas em API, segurança, e-mail e frontend | **Escolhida pelo usuário** |
| Criar cadastro separado de professores | Separa campos, mas duplica a identidade e exige sincronizar cadastro, senha e estado de acesso | Rejeitada por duplicar o cadastro usado pelo login |

## Escopo

### Inclui

- Persistir UEP (`olericultura` ou `fruticultura`) e estado `ativo` em `Usuario`, com migração Flyway. Usuários PROFESSOR já existentes recebem UEP inicial `olericultura`; demais papéis ficam sem UEP.
- Criar API ADMIN para listar professores, criar convite/conta, editar nome/e-mail/UEP, reenviar convite e desativar ou reativar uma conta.
- Restringir `/api/admin/**` ao papel `ROLE_ADMIN` no backend. Checagem do frontend é apenas apresentação, nunca controle de acesso.
- Criar token de convite de uso único, com hash persistido, validade limitada e invalidação após uso/reenvio. A página pública de definir senha aceita token + senha e ativa a conta; senhas são armazenadas somente com BCrypt.
- Incluir UEP nos dados de login da API, para que o frontend não precise buscar essa informação em `localStorage`.
- Alterar o painel para carregar e alterar dados de forma assíncrona pela API, apresentar estados de carregamento/erro, mostrar estado ativo/convite pendente e permitir reativar conta.
- Remover autenticação simulada por `localStorage`; o login administrativo e de professor usa a API. Os dados semente do navegador não serão convertidos em contas, pois não têm credenciais verificáveis; a administradora poderá cadastrar as contas reais pelo painel.
- Provisionar o primeiro administrador por variáveis de ambiente, por exemplo `ADMIN_BOOTSTRAP_EMAIL` e `ADMIN_BOOTSTRAP_PASSWORD`: criar apenas se ainda não existir usuário ADMIN, armazenar a senha com BCrypt e nunca imprimir a senha em logs. Não inserir credencial padrão no repositório.
- Alinhar a validação de domínio da API à regra explicitamente oferecida pelo formulário (`belojardim.ifpe.edu.br`, `ifpe.edu.br` e a exceção existente), normalizando o e-mail no servidor. O backend permanece como autoridade final.

### Não inclui

- Exclusão física de usuários, desvinculação automática de canteiros ou remoção de autoria histórica.
- Gestão de alunos, papéis administrativos adicionais ou redesign do painel.
- Importação automática de professores falsos/exemplos do `localStorage`.
- Serviço de e-mail externo de produção; no ambiente local, os convites serão vistos no Mailpit. Para produção, as credenciais SMTP seguem a configuração existente.

## Comportamento e contrato propostos

- `GET /api/admin/professores`: lista nome, e-mail, UEP, data de criação, ativo e estado de confirmação/convite.
- `POST /api/admin/professores`: valida domínio e campos, cria PROFESSOR inativo/não confirmado e envia convite; resposta não contém token bruto.
- `PUT /api/admin/professores/{id}`: atualiza nome, e-mail e UEP, sem alterar papel ou estado.
- Ao trocar o e-mail de uma conta ativa, marcar o e-mail como não confirmado, bloquear o acesso até a confirmação do novo endereço e enviar um link de confirmação para esse endereço.
- Ao trocar o e-mail de uma conta com convite pendente, invalidar o token anterior e enviar um novo convite ao novo endereço.
- `POST /api/admin/professores/{id}/reenviar-convite`: invalida convite anterior e envia novo para conta ainda não ativada.
- `PATCH /api/admin/professores/{id}/status`: altera ativo/inativo; apenas contas já ativadas podem ser desativadas/reativadas. Conta pendente permanece sem acesso até aceitar convite.
- `POST /api/auth/convites-professor/aceitar`: recebe token e senha; valida validade/uso, salva senha BCrypt, confirma e-mail e ativa a conta.
- Conta desativada deixa de autenticar no login e em chamadas que apresentem JWT já emitido. Reativação permite novo acesso normal.
- Criar uma conta não prova que o e-mail foi entregue. Se o SMTP falhar, manter a conta pendente e permitir reenvio; informar isso claramente no painel.
- Não permitir que uma ação administrativa altere o próprio usuário ADMIN para PROFESSOR ou desative a última conta ADMIN.

## Restrições e chamadas do projeto

- Usar Spring Boot/Spring Security, JPA, Flyway, PostgreSQL e React/TypeScript já presentes; sem dependências novas previstas.
- Mover a página de convite exige uma nova rota pública frontend, sem enfraquecer as rotas protegidas existentes.
- `apiClient` já adiciona JWT e converte erros HTTP em `ApiError`.
- `ProtectedRoute` confere o papel no frontend, enquanto a autorização real deve ser aplicada no Spring Security.
- A desativação preserva `CanteiroResponsavel` e os campos de autoria, sem precisar apagar relacionamentos.
- IDs das contas usam UUID, como o modelo existente.

## Riscos e mitigação

| Risco | Impacto | Mitigação / detecção |
|---|---|---|
| Rota administrativa protegida apenas na interface | Acesso não autorizado a contas | Matcher `hasRole("ADMIN")`; teste HTTP: sem JWT/usuário comum recebe 401/403 |
| JWT antigo continua válido após desativar | Conta desativada ainda acessa dados | Revalidar `isEnabled()` no filtro, que já consulta usuário no banco por requisição; teste com token anterior |
| Token de convite reutilizado ou vazado | Tomada de conta | Token aleatório, salvar somente hash, expirar, uso único e nunca incluir em resposta/log |
| E-mail falha depois da persistência | Convite não chega | Manter convite pendente e dar feedback/reenvio; teste de falha do Mailpit/serviço |
| UEP ausente nos usuários antigos | Tela mostra informação inválida | Migração atribui `olericultura` somente a professores existentes |
| Admin simulado conflita com API real | Login falso e interface inconsistente | Remover fallback local; provisionar ADMIN via variáveis de ambiente e documentar acesso local |
| Domínio aceito pelo frontend é recusado pela API | Cadastro falha apesar do formulário aceitar | Regra central no backend e testes para cada domínio permitido/rejeitado |

## Verificação prevista

- Backend: testes de serviço e controller para criação, domínio/duplicidade, convite, senha BCrypt, expiração/reuso do token, autorização ADMIN e login/bloqueio de JWT após desativação.
- Frontend: testes do painel para carregamento, cadastro, erro de API, convite pendente, edição, desativação e reativação; teste de login que confirma ausência de fallback local.
- Migração: subir o banco vazio e banco com usuários/professores existentes; confirmar papéis, UEP inicial e relações preservadas.
- Integração local: subir Compose, provisionar ADMIN pelas variáveis documentadas, entrar no painel, cadastrar professor e verificar convite no Mailpit (`localhost:8025`), definir senha, autenticar e confirmar bloqueio após desativação.
- Não executar migração destrutiva nem excluir registros; rollback do deploy consiste em reverter código mantendo colunas/tabela aditivas. A migração deve ser compatível com o código atual.

## Chamadas deixadas ao implementador

- Nome final dos DTOs, componentes e tabela de tokens, seguindo os padrões do repositório.
- Duração do convite: usar 24 horas, alinhada ao token atual de confirmação de e-mail, salvo uma configuração existente melhor.
- Validar estado ativo no filtro e na autenticação; não adicionar cache de usuário que permita manter JWT ativo depois da desativação.
- Colocar variáveis de bootstrap no `.env.example`/documentação; não commitar `.env` nem credenciais.
- Decisão do usuário: mudança de e-mail em conta ativa exige nova confirmação; convite pendente é invalidado e reemitido ao novo endereço.
