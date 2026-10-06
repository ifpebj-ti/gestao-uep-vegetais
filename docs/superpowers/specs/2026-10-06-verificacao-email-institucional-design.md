# Verificação de usuários por e-mail institucional

## Status

Proposta aprovada em conversa para revisão do usuário.

## Objetivo

Permitir o cadastro seguro de alunos e professores do IFPE, verificando a posse do e-mail institucional por meio de um link de confirmação enviado por e-mail. O sistema deverá identificar automaticamente o papel do usuário pelo domínio:

- `@discente.ifpe.edu.br` → `ALUNO`;
- `@belojardim.ifpe.edu.br` → `PROFESSOR`.

Contas com outros domínios não poderão ser criadas pelo cadastro público. O papel nunca será aceito do cliente como autoridade de acesso.

## Contexto atual

O projeto já possui parte da experiência no frontend:

- o cadastro valida atualmente domínios acadêmicos de forma ampla;
- existe a rota `/confirm-email`;
- `authService` já chama `GET /auth/confirmar-email?token=...`;
- `authService` já chama `POST /auth/reenviar-confirmacao`;
- o cadastro exibe uma tela orientando o usuário a verificar o e-mail.

No backend, porém:

- `UsuarioRole` possui apenas `ADMIN` e `USUARIO`;
- o cadastro público salva todo usuário como `USUARIO`;
- não existe estado de e-mail confirmado;
- `Usuario.isEnabled()` sempre retorna `true`;
- não existe envio de e-mail nem persistência de token;
- login ainda não bloqueia conta não confirmada.

## Decisões de arquitetura

### Verificação por link com token

O backend gerará um token criptograficamente aleatório, enviará um link para o endereço informado e armazenará apenas o hash do token. O token bruto aparecerá somente no link enviado ao usuário.

O token terá:

- uso único;
- validade de 24 horas;
- invalidação quando um novo token for emitido;
- rejeição após expiração, uso ou invalidação.

Essa abordagem aproveita a tela de confirmação que já existe e evita enviar senha ou qualquer informação sensível por e-mail.

### Identificação do papel pelo domínio

O backend será a fonte de verdade. O endereço será normalizado com `trim()` e letras minúsculas antes da validação. A parte após `@` deverá ser comparada por igualdade exata:

| Domínio | Papel atribuído |
|---|---|
| `discente.ifpe.edu.br` | `ALUNO` |
| `belojardim.ifpe.edu.br` | `PROFESSOR` |

O domínio genérico `ifpe.edu.br` não será aceito para novos cadastros, pois não permite distinguir aluno de professor. Contas administrativas existentes continuarão sendo administradas fora do cadastro público.

### Estado da conta

A entidade `Usuario` receberá o campo booleano persistido `emailVerificado`. O método `isEnabled()` deverá retornar esse valor, de modo que o próprio Spring Security impeça a autenticação antes da confirmação.

Para novos cadastros, o valor inicial será `false`. Usuários administrativos ou contas legadas deverão receber uma migração explícita, evitando bloquear contas já existentes sem confirmação registrada.

## Modelo de dados

### `Usuario`

Alterações previstas:

- adicionar `ALUNO` e `PROFESSOR` ao enum de papéis;
- adicionar `emailVerificado` com valor padrão controlado pela migração;
- manter `ADMIN` para administração interna;
- deixar de aceitar `role` como campo confiável no DTO público de registro;
- incluir o papel na resposta de login para o frontend.

### `EmailVerificationToken`

Nova entidade persistida, relacionada a um usuário, contendo:

- identificador;
- usuário associado;
- hash do token;
- data de criação;
- data de expiração;
- data de uso ou invalidação;
- índice para busca segura pelo hash e para consultas por usuário.

Deverá existir no máximo um token ativo por usuário. A emissão de um novo token invalida o anterior.

## Contrato da API

### `POST /api/auth/registrar`

Entrada: nome, e-mail e senha. O campo `role` não será usado como fonte de autorização e deverá ser removido do DTO público ou ignorado explicitamente.

Fluxo:

1. normalizar o e-mail;
2. validar o formato e o domínio;
3. atribuir `ALUNO` ou `PROFESSOR`;
4. rejeitar e-mail já cadastrado;
5. criar usuário desabilitado;
6. gerar e persistir token de confirmação;
7. enviar o link por e-mail;
8. retornar resposta sem token e sem senha.

### `GET /api/auth/confirmar-email?token=...`

Validará o hash, a validade e o estado do token. Em caso de sucesso, marcará o usuário como verificado, invalidará o token e retornará uma mensagem de confirmação.

Tokens ausentes, inválidos, expirados ou já utilizados deverão retornar erro controlado, sem stack trace ou detalhes internos.

### `POST /api/auth/reenviar-confirmacao`

Entrada: e-mail. A resposta deverá ser genérica, sem revelar se a conta existe, já está confirmada ou pertence a um domínio válido. Para contas pendentes, o endpoint emitirá novo token e enviará outro link.

Deverá existir uma proteção mínima contra abuso: intervalo entre reenvios e limite de tentativas por e-mail e/ou endereço de origem.

### `POST /api/auth/login`

O login continuará usando JWT, mas só será concluído para contas habilitadas. A resposta deverá incluir o papel efetivo (`ALUNO`, `PROFESSOR` ou `ADMIN`) para que o frontend não precise inferi-lo pelo texto do e-mail.

## Envio de e-mail

O backend deverá encapsular o envio na classe `EmailService`, separando a regra de confirmação do provedor de e-mail.

Configuração exclusivamente por variáveis de ambiente:

- host SMTP;
- porta SMTP;
- usuário SMTP;
- senha SMTP;
- endereço remetente;
- URL pública do frontend usada no link de confirmação.

Nenhuma credencial será incluída no código, no `.env` versionado ou na documentação pública. Para desenvolvimento e testes, o serviço poderá ser substituído por mock ou servidor SMTP local.

## Frontend

O frontend deverá:

- aceitar somente os dois domínios definidos pelo produto;
- remover o envio de `role` no cadastro;
- manter a tela de confirmação existente;
- tratar a resposta de conta não confirmada no login;
- usar o `role` devolvido pelo backend para decidir telas e permissões;
- remover a inferência de perfil baseada em partes do endereço, como `aluno` ou `discente`;
- permitir novo pedido de confirmação com mensagens genéricas e limites respeitados pelo backend.

## Segurança e privacidade

- armazenar somente o hash do token;
- usar token aleatório e não previsível;
- nunca incluir senha, papel administrativo ou dados internos no e-mail;
- não permitir que o cliente escolha `ADMIN`, `ALUNO` ou `PROFESSOR`;
- evitar enumeração de contas no reenvio;
- invalidar tokens usados e antigos;
- registrar eventos relevantes sem registrar o token bruto;
- usar HTTPS em ambientes publicados;
- manter o segredo JWT e as credenciais SMTP fora do repositório;
- revisar o segredo padrão de desenvolvimento antes de disponibilizar o sistema em produção.

## Testes de aceite

### Backend

- domínio de aluno atribui `ALUNO`;
- domínio de professor atribui `PROFESSOR`;
- domínio genérico ou externo é rejeitado;
- e-mail é normalizado antes da comparação;
- cadastro cria usuário não verificado;
- senha é armazenada com hash;
- token válido confirma a conta;
- token expirado, usado ou inválido é rejeitado;
- novo token invalida o anterior;
- login de conta não confirmada é bloqueado;
- login de conta confirmada retorna JWT e papel;
- reenvio não revela se o e-mail existe;
- reenvio respeita limite de frequência;
- cadastro nunca cria ou altera `ADMIN`.

### Frontend

- formulário aceita aluno e professor pelos domínios corretos;
- formulário rejeita `@ifpe.edu.br` sem classificação e outros domínios;
- cadastro exibe orientação de confirmação;
- confirmação automática pelo link funciona;
- confirmação manual funciona;
- mensagens de token inválido e expirado são exibidas;
- login orienta o usuário não confirmado;
- menus e rotas usam o papel retornado pela API.

### Integração

- subir backend, banco e serviço SMTP de desenvolvimento;
- cadastrar um aluno e confirmar pelo link recebido;
- cadastrar um professor e confirmar pelo link recebido;
- comprovar bloqueio do login antes da confirmação;
- comprovar acesso correspondente ao papel após a confirmação;
- verificar que nenhum token ou credencial aparece nos logs.

## Sequência de implementação

1. Ajustar papéis, domínio e estado de confirmação no modelo de usuário.
2. Criar entidade, repositório e serviço de tokens.
3. Criar serviço de e-mail e configuração SMTP por ambiente.
4. Implementar registro com atribuição automática e conta desabilitada.
5. Implementar confirmação e reenvio.
6. Bloquear login não confirmado e retornar o papel no JWT/resposta.
7. Alinhar frontend aos domínios exatos e ao papel retornado pela API.
8. Criar migração para dados existentes e tratar contas legadas.
9. Adicionar testes unitários, de controller e de integração.
10. Atualizar documentação, variáveis de ambiente e pipeline.

## Critérios de conclusão

A funcionalidade será considerada concluída quando um aluno e um professor conseguirem se cadastrar com seus respectivos domínios, receberem e confirmarem o link institucional, forem classificados automaticamente, conseguirem fazer login somente após a confirmação e receberem apenas as permissões correspondentes ao papel. Os testes automatizados e o fluxo integrado deverão passar sem expor tokens, senhas ou informações sobre a existência de contas.
