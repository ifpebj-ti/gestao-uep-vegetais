# Login com Google para contas institucionais

## Objetivo

Permitir login com Google no Terrarium sem liberar contas pessoais. O backend
continua sendo a autoridade para validar a identidade, classificar o papel e
emitir o JWT usado pela aplicacao.

## Regras

- Aceitar somente `@discente.ifpe.edu.br` e `@belojardim.ifpe.edu.br`.
- Recusar contas pessoais, incluindo `@gmail.com`.
- Validar no backend assinatura, emissor, audiencia, expiracao,
  `email_verified` e dominio hospedado (`hd`) do ID token.
- Inferir `ALUNO` ou `PROFESSOR` pelo dominio institucional.
- Criar automaticamente o usuario institucional ainda inexistente, ja
  verificado, com senha aleatoria inutilizavel para o fluxo Google.
- Vincular a conta ao `sub` estavel do Google e reutilizar o JWT interno.
- Se ja existir uma conta local com o mesmo e-mail, vincular o Google apos a
  validacao; o papel existente nao e alterado.

## Fluxo

1. O frontend usa o Google Identity Services para obter o ID token.
2. O frontend envia o token para `POST /api/auth/login/google`.
3. O backend valida o token com `GoogleIdTokenVerifier` e confere os dominios.
4. O backend localiza ou cria o usuario e vincula o `google_subject`.
5. O backend retorna o mesmo formato de resposta do login por senha.

## Configuracao

O mesmo Client ID Web deve ser configurado em `GOOGLE_CLIENT_ID` no backend e
`VITE_GOOGLE_CLIENT_ID` no frontend. As origens autorizadas precisam incluir a
origem local e a origem de producao.
