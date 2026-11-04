# Decisões de hardening

## Backend

- A API usa JWT no cabeçalho `Authorization` e `SessionCreationPolicy.STATELESS`; por isso o CSRF é desabilitado explicitamente. A aplicação não autentica por cookie.
- CORS aceita somente as origens definidas em `CORS_ALLOWED_ORIGINS`, não aceita `*`, não permite credenciais e limita métodos e cabeçalhos à API.
- A cadeia aplica `X-Content-Type-Options`, `X-Frame-Options: DENY`, HSTS, uma política de referrer restritiva e CSP sem conteúdo por padrão.
- `SecurityConfigurationsTest` verifica a lista de origens, rejeição de origem não autorizada, ausência de credenciais e limites de métodos/cabeçalhos. A configuração da cadeia é declarativa e revisada junto ao código.

## CI/CD e Code Scanning

- Todos os workflows têm `permissions` explícitas. O CI usa `contents: read`; publicação no GHCR é o único motivo para `packages: write`.
- O workflow versionado executa CodeQL em pushes e pull requests da `main`, além de uma varredura semanal, para Java/Kotlin e JavaScript/TypeScript, usando as consultas `security-and-quality`. Como o repositório mantém o CodeQL default setup ativo, esse workflow não publica SARIF (`upload: never`); o default setup permanece como fonte oficial dos alertas.
- O job CodeQL é um check obrigatório da proteção de branch da `main`. Após o processamento, o job `security-gate` consulta os alertas da `main` e falha quando há alerta aberto de severidade alta ou crítica; exceções exigem descarte formal no alerta e aprovação do responsável pela segurança.
- Trivy permanece como gate de imagem para vulnerabilidades críticas corrigidas.

## Exceções

Não há exceções de segurança aprovadas nesta alteração. Falhas de análise, testes backend/frontend, build frontend e varredura de imagem interrompem a pipeline.
