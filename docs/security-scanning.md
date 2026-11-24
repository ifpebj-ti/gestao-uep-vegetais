# Scans de segurança no CI

O workflow `.github/workflows/security-scans.yml` executa dois scans fora do
ambiente de produção:

- **Semgrep SAST:** analisa o backend, frontend e arquivos de código relevantes
  com a imagem `semgrep/semgrep:1.163.0`.
- **OWASP ZAP DAST:** inicia a aplicação com Docker Compose, usando apenas banco,
  e-mail e tokens descartáveis do próprio job, e executa o baseline scan com a
  imagem `zaproxy/zap-stable:2.16.1`.

## Gates

O Semgrep bloqueia a execução somente quando há um finding com severidade
`ERROR` e confiança `HIGH`. O ZAP bloqueia somente alertas de risco `MEDIUM` ou
`HIGH` com confiança `MEDIUM` ou `HIGH`. Esse limiar reduz falsos positivos não
triados sem ocultar os resultados menos confiáveis.

O código de saída bruto do baseline do ZAP não é usado sozinho como gate, pois
ele também pode ser diferente de zero quando há avisos que já foram filtrados.
O workflow exige um JSON válido e aplica o gate diretamente sobre seus alertas.

Os relatórios JSON do Semgrep e JSON/HTML do ZAP são publicados como artefatos
da execução por 14 dias. O resumo do gate também aparece no resumo do workflow.

## Triagem e exceções

1. Baixe o artefato correspondente e confirme o finding no código ou endpoint.
2. Corrija o problema quando possível e rode novamente o workflow.
3. Se for falso positivo ou risco aceito, registre a justificativa, o responsável,
   o prazo de revisão e a regra/alerta específico na Issue ou Pull Request.
4. Só depois de revisão de segurança ajuste uma regra de exclusão ou o limiar;
   não use `continue-on-error` para esconder um finding confirmado.

O workflow não usa secrets de produção, não faz login em serviços externos e não
publica `.env`, tokens ou dados persistentes. A aplicação DAST é removida com
`docker compose down -v` ao final do job.

## Validação local

Semgrep pode ser executado com a mesma imagem e sem gravar resultados no código:

```bash
mkdir -p ci-security
docker run --rm -v "$PWD:/src:ro" \
  semgrep/semgrep:1.163.0 semgrep scan --config p/default --json \
  --metrics=off /src > ci-security/semgrep-results.json
```

Para validar o DAST, suba a aplicação com um `.env` descartável e execute o
mesmo comando `zap-baseline.py` do workflow contra `http://127.0.0.1`. Nunca
aponte esse comando para produção.

Para testar o gate sem introduzir código vulnerável no repositório, use uma
branch temporária ou um fixture descartável local e remova-o antes do merge.
O caso seguro é o próprio código atual: o workflow deve concluir sem finding
acima do limiar. O caso controlado deve ser executado apenas em branch de teste,
confirmando que o job falha e publica o relatório antes de ser descartado.
