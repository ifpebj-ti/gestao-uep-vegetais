# Remediação de dependências, imagens e containers

## Validação desta Issue

- Dependabot: nenhum alerta aberto no repositório no momento da auditoria.
- Code Scanning e Secret Scanning: nenhum alerta aberto no momento da auditoria.
- Backend: Maven compila e a suíte passa com 47 testes.
- Frontend: `npm ci`, `npm audit --audit-level=high`, lint, build e 93 testes passaram.
- Trivy (`HIGH,CRITICAL`, `--ignore-unfixed`): as imagens reconstruídas `backend` e `frontend` ficaram com zero vulnerabilidades HIGH/CRITICAL.

## Correções aplicadas

- Jackson 2 foi atualizado para o BOM `2.21.7` e Jackson 3 para `3.1.7`, corrigindo vulnerabilidades transitivas reportadas no JAR do backend.
- A imagem final do backend executa `apk upgrade --no-cache` para receber correções da base Alpine, incluindo `libexpat`.
- A imagem final do frontend já atualiza os pacotes Alpine; a reconstrução confirmou as versões corrigidas de curl, OpenSSL, expat e tiff.
- Node foi atualizado de 20 para 22 no CI e no builder Docker, alinhando o ambiente aos requisitos atuais do Vitest e Testing Library.
- Dependabot passou a acompanhar também imagens referenciadas pelos Dockerfiles e pelo Compose.

## Exceções

Nenhuma exceção HIGH/CRITICAL foi mantida. Não há justificativa ou prazo de reavaliação pendente nesta alteração.
