# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased] - Em Desenvolvimento

### Adicionado
- Estrutura base de diretórios em monorepo separando `backend`, `frontend` e `config`.
- Arquivo `docker-compose.yml` para orquestração local dos serviços.
- `Dockerfile` configurado para o ambiente do backend.
- `Dockerfile` e arquivo `nginx.conf` configurados para o ambiente do frontend.
- Arquivo `.env.example` para mapeamento seguro de segredos e variáveis de ambiente.
- Pipeline de Integração Contínua (CI) no GitHub Actions (`.github/workflows/ci.yml`).
- Workflow para obrigatoriedade de vínculo de issues nos Pull Requests (`require-linked-issue.yml`).
- Configuração do GitHub Dependabot (`dependabot.yml`) para monitoramento de vulnerabilidades nas dependências.
- Templates padronizados para abertura de Issues (Bug Report, Feature Request e configuração geral).
- Template padronizado para Pull Requests (`pull_request_template.md`).
- Arquivos de governança globais: `.gitignore`, `LICENSE` e `README.md`.
