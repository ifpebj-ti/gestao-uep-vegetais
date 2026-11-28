# Política de Segurança

## Versões suportadas

Enquanto o projeto estiver em desenvolvimento, a referência de segurança é a
branch `main` e a release estável mais recente publicada pelo repositório.
Branches de trabalho, forks e versões sem release não recebem correções de
segurança de forma independente.

| Versão | Recebe correções de segurança |
| --- | --- |
| `main` | Sim |
| Release estável mais recente | Sim |
| Releases anteriores | Conforme a capacidade do projeto |

## Como reportar uma vulnerabilidade

Não abra uma Issue pública para relatar uma vulnerabilidade ainda não corrigida.
Use o recurso privado **Report a vulnerability** na aba **Security** do
repositório, criando um GitHub Private Vulnerability Report.

Inclua, quando possível:

- descrição do problema e do impacto;
- passos mínimos para reproduzir;
- endpoints, arquivos ou versões afetadas;
- evidências sem dados pessoais, tokens ou segredos;
- uma sugestão de correção ou mitigação, se disponível.

Se o recurso privado não estiver disponível para sua conta, solicite acesso a
um mantenedor do repositório por um canal privado já conhecido pela equipe.
Não envie credenciais, tokens, chaves privadas ou dados de usuários no corpo de
Issues, PRs, commits ou comentários.

## Processo de resposta

1. O reporte é triado de forma privada e sua reprodução é confirmada.
2. A equipe classifica impacto, escopo e versões afetadas.
3. A correção é implementada em uma branch protegida e validada pela esteira.
4. A publicação da correção e de um comunicado considera o risco de exploração
   e a disponibilidade de atualização para os usuários.

O prazo de resposta pode variar conforme a severidade e a capacidade da equipe.
Relatos de boa-fé não devem incluir exploração destrutiva, indisponibilidade,
exfiltração de dados ou acesso além do necessário para demonstrar o problema.

## Práticas obrigatórias

- Nunca versionar `.env`, credenciais, tokens ou dados reais.
- Não registrar senhas, tokens JWT, credenciais Google ou códigos de convite nos
  logs.
- Validar autorização no backend; dados de identidade enviados pelo navegador
  não são suficientes para decidir acesso.
- Corrigir dependências e imagens vulneráveis conforme os gates do CI.
- Vincular alterações de segurança a uma Issue e descrever os testes executados
  na PR.
