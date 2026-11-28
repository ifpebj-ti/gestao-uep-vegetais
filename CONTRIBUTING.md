# Como contribuir

Obrigado por contribuir com o Terrarium. O repositório usa Issues, SDD e Pull
Requests para manter requisitos, implementação e validação rastreáveis.

## Antes de começar

Instale Git, Docker com Docker Compose, Node.js compatível com o workflow e
Java 21. Copie `.env.example` para `.env` apenas no ambiente local e nunca
envie esse arquivo para o Git.

```bash
cp .env.example .env
docker compose config
```

No PowerShell, o primeiro comando pode ser substituído por:

```powershell
Copy-Item .env.example .env
```

## Fluxo SDD obrigatório

1. Abra ou identifique uma Issue com objetivo, contexto e critérios de aceite.
2. Para uma mudança relevante, mantenha os artefatos da especificação em
   `.specify/` ou em `specs/`, conforme o fluxo da feature.
3. Transforme a especificação em plano e tarefas verificáveis antes de alterar
   múltiplos módulos.
4. Crie uma branch a partir de `main` usando um prefixo coerente:
   `feat/`, `fix/`, `docs/`, `test/`, `security/` ou `chore/`.
5. Faça commits pequenos usando Conventional Commits.
6. Abra uma PR usando o template do repositório e inclua `Closes #<número>` ou
   `Refs #<número>` conforme o efeito desejado.
7. Aguarde os gates obrigatórios e a revisão dos CODEOWNERS antes do merge.

Não faça push direto para `main`. Uma PR sem Issue vinculada, sem testes
adequados ou com a esteira quebrada não deve ser integrada.

## Convenção de commits e PRs

Use títulos compatíveis com Conventional Commits, por exemplo:

```text
feat: permitir registro de colheita
fix: corrigir autorização de canteiro
docs: atualizar guia de execução
test: cobrir validação de convite
chore: atualizar ferramenta de build
```

O título da PR deve explicar a mudança principal. A descrição deve registrar a
Issue relacionada, escopo, decisões, testes executados e eventuais limitações.
Não inclua segredos, tokens, dados reais ou alterações não relacionadas.

## Validação local

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run test:coverage
npm run build
```

### Backend

```bash
cd backend
# Testes unitários rápidos
mvn --batch-mode test

# Gate completo alinhado ao CI, incluindo integração e cobertura
mvn --batch-mode verify -Pintegration
```

Antes de executar esse perfil, confirme que um PostgreSQL compatível está
acessível em `DB_HOST` e `DB_PORT`, com `DB_NAME`, `DB_USER` e `DB_PASS`
configurados quando necessário. A execução local simplificada e alinhada ao CI
é acompanhada pela [Issue #219](https://github.com/ifpebj-ti/gestao-uep-vegetais/issues/219).

### Esteira

A CI executa backend, integração, auditoria de dependências, lint, testes,
cobertura, build das imagens e Trivy. Não reduza thresholds ou desabilite gates
para fazer uma PR passar. Se uma falha for ambiental, registre a evidência e a
forma de reprodução na PR ou em uma Issue específica.

## Segurança e dados

Consulte a [Política de Segurança](SECURITY.md). Vulnerabilidades não corrigidas
devem ser reportadas de forma privada. Variáveis locais, JWTs, credenciais
Google, senhas e dados de usuários não pertencem ao repositório.

## Checklist rápido da PR

- [ ] Existe uma Issue vinculada e os critérios de aceite estão claros.
- [ ] A branch usa um prefixo permitido.
- [ ] O título e os commits seguem Conventional Commits.
- [ ] O template de PR foi preenchido.
- [ ] Testes, lint e build foram executados ou a limitação foi documentada.
- [ ] Nenhum segredo, token ou dado real foi incluído.
- [ ] A alteração está dentro do escopo da Issue.
