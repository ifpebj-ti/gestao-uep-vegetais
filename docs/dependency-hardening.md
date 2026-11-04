# Remediação de dependências, imagens e containers

## Validação desta Issue

- Dependabot: nenhum alerta aberto no repositório no momento da auditoria.
- Code Scanning e Secret Scanning: nenhum alerta aberto no momento da auditoria.
- Backend: Maven compila e a suíte passa com 49 testes.
- Frontend: `npm ci`, `npm audit --audit-level=high`, lint, build e 98 testes passaram.
- Trivy (`HIGH,CRITICAL`, `--ignore-unfixed`): as imagens reconstruídas `backend` e `frontend` ficaram com zero vulnerabilidades HIGH/CRITICAL.

## Correções aplicadas

- Jackson 2 foi atualizado para o BOM `2.21.7` e Jackson 3 para `3.1.7`, corrigindo vulnerabilidades transitivas reportadas no JAR do backend.
- A imagem final do backend executa `apk upgrade --no-cache` para receber correções da base Alpine, incluindo `libexpat`.
- A imagem final do frontend já atualiza os pacotes Alpine; a reconstrução confirmou as versões corrigidas de curl, OpenSSL, expat e tiff.
- Node foi atualizado de 20 para 22 no CI e no builder Docker, alinhando o ambiente aos requisitos atuais do Vitest e Testing Library.
- Dependabot passou a acompanhar também imagens referenciadas pelos Dockerfiles e pelo Compose.
- Vite foi atualizado de `7.1.7` para `7.3.7`, removendo os alertas HIGH reportados pelo `npm audit`.

## Validação da correção do Vite

- `npm ci --ignore-scripts`: concluído com sucesso.
- `npm audit --audit-level=high`: 0 vulnerabilidades.
- `npm run lint`: aprovado.
- `npm run test:run`: 19 arquivos e 98 testes aprovados.
- `npm run build`: aprovado com Vite 7.3.7.

## Validação Docker local

- `docker compose build --no-cache`: backend e frontend construídos com sucesso.
- `docker compose ps`: database, mailpit, backend e frontend saudáveis.
- Backend e frontend responderam HTTP 200 nos endpoints de healthcheck.
- Trivy 0.75.0 (`CRITICAL`, `--ignore-unfixed`, pacotes OS): 0 vulnerabilidades nas duas imagens.
- Testes Maven executados em `maven:3.9-eclipse-temurin-21`: 49 testes aprovados.

## Exceções

Nenhuma exceção HIGH/CRITICAL foi mantida. Não há justificativa ou prazo de reavaliação pendente nesta alteração.
