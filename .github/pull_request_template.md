## Tipo de alteração

- [ ] Nova funcionalidade (feature)
- [ ] Correção de bug (fix / bugfix)
- [ ] Documentação (docs)
- [ ] Refatoração (refactor)
- [ ] Performance (perf)
- [ ] Testes (test)
- [ ] Configuração, CI ou infraestrutura (chore / ci)

## Tipo de Release

Escolha o prefixo Conventional Commits no título da PR quando a alteração precisar gerar release:

- `fix:` para correções (`PATCH`);
- `feat:` para novas funcionalidades (`MINOR`);
- `feat!:` ou `BREAKING CHANGE:` para mudanças incompatíveis (`MAJOR`);
- `docs:` ou `chore:` para alterações que não geram release.

Exemplo de título: `feat: permitir edição da ficha de campo`.

## Issue relacionada

Closes #123

## Resumo da especificação SDD

### Problema ou objetivo

Descreva o resultado pretendido em poucas linhas.

### Critérios de aceite atendidos

- [ ] Critério 1:
- [ ] Critério 2:
- [ ] Critério 3:

### Fora do escopo

-

### Artefatos locais

Pasta SDD local: specs/<numero>-<slug>/

O diretório acima não é versionado. Cole aqui as decisões essenciais para que a revisão seja possível sem depender de arquivos locais.

## O que foi feito

Explique de forma resumida, mas clara, as alterações realizadas e os principais arquivos afetados. Este texto também será utilizado nas Notas de Release quando a PR gerar uma release.

## Validação

### Execução local

- [ ] Backend: mvn --batch-mode verify -Pintegration
- [ ] Frontend: npm run lint
- [ ] Frontend: npm run test:coverage
- [ ] Frontend: npm run build
- [ ] Auditoria de dependências executada quando aplicável

### Esteira GitHub Actions

- [ ] SDD Governance
- [ ] Require Linked Issue
- [ ] Lint & Automated Tests
- [ ] Docker Build, Trivy Scan & GHCR
- [ ] SAST & DAST Security Scans
- [ ] CodeQL

Links dos runs:

## Riscos, migração e rollback

Descreva impactos, migrações, incompatibilidades e como reverter a mudança.

## Atribuição e revisão

- Implementação:
- Revisão técnica:
- Revisão de segurança, quando aplicável:

## Checklist do autor

- [ ] A Issue está vinculada com Closes, Fixes, Resolves ou Related to.
- [ ] A especificação foi revisada antes da implementação.
- [ ] Os critérios de aceite foram verificados.
- [ ] Os testes relevantes foram executados.
- [ ] A documentação foi atualizada ou a ausência de impacto foi justificada.
- [ ] Não há segredos, dados pessoais ou artefatos locais no diff.
- [ ] O PR está focado em uma única Issue ou em um conjunto explicitamente relacionado.
