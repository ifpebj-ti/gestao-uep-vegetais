# Estratégia de Testes

## 1. Objetivo

Esta documentação define como a qualidade do backend, frontend e pipeline de CI/CD é verificada. A estratégia prioriza testes rápidos e determinísticos no ciclo de desenvolvimento e mantém os gates automatizados alinhados ao código realmente executado no projeto.

## 2. Níveis de teste

### 2.1 Backend

O backend utiliza principalmente testes unitários e testes de camada web:

- serviços são testados isoladamente com JUnit 5 e Mockito;
- regras de autorização, validações e transformações são verificadas por cenários positivos e negativos;
- controllers são exercitados diretamente ou com Spring MockMvc;
- filtros e configurações de segurança possuem testes específicos quando o comportamento depende do Spring Security;
- repositórios e PostgreSQL não fazem parte da suíte unitária padrão.

Os testes do backend não dependem de um banco PostgreSQL em execução. Testes de integração com banco, migrations Flyway ou serviços externos devem ser adicionados separadamente quando o fluxo exigir validação de infraestrutura real.

### 2.2 Frontend

O frontend utiliza testes de unidade e de componentes:

- Vitest executa a suíte em ambiente `jsdom`;
- React Testing Library verifica comportamento observável dos componentes;
- `@testing-library/user-event` simula interações do usuário;
- mocks e fixtures isolam chamadas HTTP e dependências externas;
- TypeScript verifica tipos durante o lint e o build.

Atualmente não há uma suíte automatizada de testes end-to-end em navegador. Fluxos completos envolvendo navegador, backend, banco e autenticação devem ser tratados como uma evolução da estratégia, sem serem confundidos com os testes unitários atuais.

### 2.3 Imagens e segurança

O pipeline também verifica as imagens Docker com Trivy. O gate bloqueia vulnerabilidades corrigíveis `HIGH` e `CRITICAL`, mantendo `--ignore-unfixed` para vulnerabilidades sem correção disponível. Essa verificação é complementar aos testes funcionais e não substitui a cobertura de código.

## 3. Ferramentas

| Área | Ferramentas | Responsabilidade |
| --- | --- | --- |
| Backend | Java 21, Maven, JUnit 5, Mockito, Spring MockMvc | Testes de regras, serviços, controllers e segurança |
| Frontend | TypeScript, Vitest, V8, React Testing Library, jsdom | Testes de componentes, hooks, serviços e interações |
| Cobertura backend | JaCoCo | Relatório e gate de cobertura de linhas |
| Cobertura frontend | `@vitest/coverage-v8` | Relatórios e gate de cobertura de linhas |
| CI/CD | GitHub Actions | Execução automatizada e publicação dos relatórios |
| Segurança de imagens | Trivy 0.75.0 | Bloqueio de vulnerabilidades corrigíveis HIGH/CRITICAL |

## 4. Cobertura

### Backend

O comando `mvn verify` executa os testes, gera o relatório JaCoCo em `backend/target/site/jacoco` e bloqueia a execução quando a cobertura de linhas fica abaixo de 70%.

### Frontend

O comando `npm run test:coverage` executa o Vitest com o provider V8. São gerados relatórios em `frontend/coverage` nos formatos texto, JSON e HTML. O gate mínimo configurado é de 70% para linhas; branches, funções e statements continuam disponíveis nos relatórios para acompanhamento e evolução da suíte.

O limite é uma proteção mínima de qualidade, não uma meta para produzir testes artificiais. Novos testes devem representar comportamento relevante da aplicação.

## 5. Execução local

### Backend

Com Java 21 e Maven disponíveis:

```bash
cd backend
mvn verify
```

Para executar somente os testes sem o gate de cobertura:

```bash
mvn test
```

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run test:coverage
npm run build
```

Para executar o Vitest em modo interativo durante o desenvolvimento:

```bash
npm test
```

## 6. Execução no CI

O workflow `.github/workflows/ci.yml` executa, no job `Lint & Automated Tests`:

1. `mvn --batch-mode verify` no backend;
2. `npm ci` no frontend;
3. auditoria das dependências frontend;
4. `npm run lint`;
5. `npm run test:coverage`;
6. `npm run build`.

Os relatórios de cobertura são publicados como artefatos `backend-coverage` e `frontend-coverage`, com retenção de 14 dias. Se qualquer teste, gate de cobertura, lint ou build falhar, o job de qualidade falha e o pipeline não deve ser integrado.

## 7. Critérios de aprovação

Uma alteração é considerada aprovada quando:

- os testes existentes passam sem falhas, erros ou testes ignorados sem justificativa;
- o backend mantém pelo menos 70% de cobertura de linhas no JaCoCo;
- o frontend mantém pelo menos 70% de cobertura de linhas no Vitest;
- lint, type-check e build frontend passam;
- a imagem Docker correspondente passa no gate do Trivy;
- novos comportamentos relevantes possuem testes que cubram sucesso, validação e falhas esperadas;
- os artefatos e relatórios do CI ficam disponíveis para revisão.

## 8. Tratamento de falhas

- Falhas de teste devem ser reproduzidas localmente antes de uma nova tentativa no CI.
- Uma redução legítima de cobertura deve vir acompanhada de testes adicionais ou de uma justificativa técnica revisada; não se deve remover módulos do JaCoCo apenas para contornar o gate.
- Falhas do Trivy devem ser corrigidas atualizando a dependência ou imagem vulnerável. Vulnerabilidades sem correção permanecem sujeitas a `ignore-unfixed` e devem ser acompanhadas.
- Falhas intermitentes devem ser identificadas e corrigidas; reexecutar o job não substitui a investigação da causa.
- Alterações que dependem de PostgreSQL, Flyway ou serviços externos devem possuir uma estratégia de integração explícita antes de serem classificadas como cobertas pela suíte unitária.

## 9. Evolução da estratégia

Esta página deve ser atualizada quando novas camadas de teste, ferramentas, gates ou ambientes forem adicionados. Em especial, a criação de testes de integração com PostgreSQL e de testes end-to-end deverá registrar ferramenta, ambiente, dados necessários e critérios de execução no CI.
