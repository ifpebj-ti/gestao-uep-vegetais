<div align="center">

# 🌿 Terrarium

### Sistema de Gestão Espacial e Escalonamento Agrícola das UEPs

[![IFPE](https://img.shields.io/badge/IFPE-Campus_Belo_Jardim-058837?style=for-the-badge)](https://www.ifpe.edu.br/)
[![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/ifpebj-ti/gestao-uep-vegetais/ci.yml?branch=main&style=for-the-badge&label=CI%2FCD)](https://github.com/ifpebj-ti/gestao-uep-vegetais/actions)
[![React](https://img.shields.io/badge/React_19-Vite_7-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange?style=for-the-badge)](#)

**Uma solução Web e PWA de alta fidelidade visual para auxiliar professores, técnicos e estudantes no planejamento contínuo, mapeamento 3D e escalonamento da produção das Unidades de Ensino e Produção (UEPs) Vegetais.**

</div>

---

# 📌 Sobre o Projeto

O **Terrarium** é um sistema moderno de gestão e planejamento agrícola, desenvolvido e adaptado especificamente para a realidade das Unidades de Ensino e Produção (UEPs) Vegetais do **IFPE - Campus Belo Jardim**.

## 💡 Sobre o Projeto e Inspiração

Este projeto **não é uma cópia**, mas sim uma evolução moderna inspirada nas principais funcionalidades do **Hortafácil** — um software legado criado em 2010 (UFLA/UFSJ) que se destacava, principalmente, pelo seu eficiente sistema de escalonamento de plantio.

O objetivo do Terrarium é resgatar essa capacidade de gestão e escalonamento, modernizando a arquitetura com as tecnologias atuais e ajustando as regras de negócio para atender de forma exata às necessidades operacionais e educacionais do Campus Belo Jardim nos dias de hoje.

A proposta do projeto é oferecer uma ferramenta acessível para auxiliar no planejamento agrícola, permitindo que professores, técnicos e estudantes organizem ciclos de cultivo, escalonem produções e tenham maior controle sobre o processo produtivo.

A nova versão traz:

- 🌱 **Mapeamento 3D e Planta Baixa 2D Interativa:** Navegação imersiva, otimizada e responsiva pelos canteiros da UEP com Three.js e GSAP;
- 📋 **Fichas de Campo Oficiais:** Preenchimento de dados agronômicos, manejo fitossanitário, registro de colheita do canteiro (`kg`) e visto de aprovação docente;
- ⚖️ **Gestão de Colheita e Produtividade Real (`kg`):** Consolidação de quilos produzidos por vegetal, comparativo entre rendimento real na balança e meta prevista pelo modelo agronômico e histórico de destinação;
- 👥 **Perfis de Acesso Acadêmicos:** Fluxos segmentados e dedicados para Professores e Estudantes;
- 📱 **Progressive Web App (PWA):** Interface responsiva projetada para uso em campo;
- 🔌 **Arquitetura Resiliente & Offline-First:** Tratamento inteligente de falhas de conectividade;
- 🔒 **Blindagem de Segurança & DevSecOps:** Headers HTTP recomendados pela OWASP, JWT com expiração e varredura estática de vulnerabilidades;
- 📊 **Otimização do Escalonamento:** Acompanhamento dinâmico do ciclo fenológico, cronograma semanal e previsões de colheita.

---

# 🎯 Objetivos

## Objetivo Geral

Desenvolver o sistema **Terrarium**, uma aplicação Web/PWA de gestão agrícola inspirada no legado do Horta Fácil, visando otimizar o planejamento, o escalonamento e a administração espacial das Unidades de Ensino e Produção (UEPs) Vegetais do **IFPE - Campus Belo Jardim**.

## Objetivos Específicos

- **Projetar uma arquitetura segura:** Aplicar práticas de integração contínua (CI/CD) e diretrizes OWASP no desenvolvimento;
- **Modernizar o planejamento agrícola:** Adaptar a lógica de escalonamento do software original para as atuais demandas operacionais e pedagógicas;
- **Desenvolver interfaces interativas:** Implementar mapas 3D interativos, cronogramas semanais, painel de colheita e fichas de campo digitais para otimizar o monitoramento espacial e produtivo dos canteiros;
- **Garantir uso em campo:** Estruturar o sistema como Progressive Web App (PWA) para viabilizar o funcionamento em áreas de baixa conectividade;
- **Estruturar acessos acadêmicos:** Implementar controle de perfis (professores e estudantes) para adequar o sistema às dinâmicas de ensino e extensão.

---

# 👥 Equipe

| Integrante | Responsabilidades |
|------------|------------------|
| **Isabela** | Frontend, UX/UI e Prototipagem |
| **Ítalo Ruan** | Backend, Banco de Dados e Levantamento de Requisitos |
| **Antonio Macédo** | DevSecOps, Infraestrutura e QA |

---

# 📑 Documentação e Acompanhamento

Para acompanhar o andamento do desenvolvimento, consultar a estrutura técnica e visualizar os relatórios e entregas, acesse os links abaixo:

- 📖 **Wiki do Projeto:** [Acessar GitHub Wiki](https://github.com/ifpebj-ti/gestao-uep-vegetais/wiki)
- 🧪 **Estratégia de Testes:** [Consultar estratégia de testes](docs/testing-strategy.md)
- 🧠 **Apresentação / Sprint Report:** [Visualizar no Canva](https://canva.link/jgi9ied9fzkyfas)
- 🎨 **Protótipo das Telas:** [Visualizar Protótipo no Canva Overview](https://canva.link/73re71vjj12jskb) e [Visualizar Protótipo no Figma](https://www.figma.com/design/zlMQSyhaPWFB7oUfQeCiCE/Desktop-sign-up-and-login-pages-by-EditorM--Community-?node-id=0-1&m=dev&t=L2Z2sFGH00jeQenz-1)
---

# 🏗️ Tecnologias e Arquitetura

### 💻 Frontend
- **Framework & Core:** [React 19](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool:** [Vite 7](https://vitejs.dev/) com *Code Splitting* (`React.lazy` + `manualChunks`)
- **Renderização Gráfica & 3D:** [Three.js](https://threejs.org/) (WebGL acelerado, iluminação suave, raycasting otimizado com hitboxes e controles orbitais) e [GSAP](https://greensock.com/gsap/) (interpolação e transições de câmera)
- **Estilização & Design System:** [TailwindCSS v4](https://tailwindcss.com/) com paleta agronômica personalizada e ícones do [Lucide React](https://lucide.dev/)
- **Roteamento & Proteção:** [React Router DOM v7](https://reactrouter.com/) com guarda de rotas privadas (`ProtectedRoute`)
- **Cliente HTTP Centralizado:** `apiClient` com injeção automática de `Bearer Token`, timeout com `AbortController` e interceptor de sessão expirada (`401`)
- **Testes & Qualidade:** [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/) e JSDOM (**98 testes unitários automatizados em 19 suítes**)

### ⚙️ Backend
- **Linguagem & Plataforma:** Java 21 (LTS)
- **Framework:** [Spring Boot](https://spring.io/projects/spring-boot)
- **Persistência de Dados:** Spring Data JPA, Hibernate ORM e migrações versionadas com Flyway
- **Banco de Dados:** PostgreSQL 16
- **Segurança & Autenticação:** Spring Security 6 com autenticação stateless, tokens JWT ([Auth0 java-jwt](https://github.com/auth0/java-jwt)), OAuth 2.0 Google Institucional e criptografia BCrypt
- **Métricas e Diagnóstico:** Spring Boot Actuator
- **Testes Automatizados:** JUnit 5 e Spring MockMvc (**47 testes automatizados em 11 suítes**)
- **Produtividade:** Project Lombok

### 🛡️ Infraestrutura, Contêineres & DevSecOps
- **Contêineres Multi-Stage:**
  - **Frontend:** Build Node 24 Alpine servido via Nginx 1.27 Alpine com pacotes de segurança atualizados.
  - **Backend:** Compilação Maven 3.9 Temurin 21 empacotada em JRE 21 Alpine non-root (`appuser`) com pacotes de segurança atualizados.
- **Servidor Web (Nginx):** Compactação gzip, cache de assets imutáveis e cabeçalhos de segurança OWASP (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `server_tokens off`).
- **Orquestração:** Docker Compose com rede em bridge isolada (`gestao-uep-network`) e volume nomeado (`pgdata`).
- **Pipeline de CI/CD (GitHub Actions):**
  - Execução dos testes automatizados do Backend (`mvn --batch-mode test`).
  - Checagem estática de tipagem e integridade do Frontend (`npm run lint`).
  - Execução contínua da suíte de testes do Frontend (`npm run test:run`).
  - Verificação de build de produção (`npm run build`).
  - Compilação Multi-Arquitetura (`amd64` / `arm64`) com QEMU e Buildx.
  - Varredura de segurança com **Aqua Security Trivy** (bloqueio de vulnerabilidades corrigíveis `HIGH` e `CRITICAL`, mantendo `ignore-unfixed`).
  - Publicação automática das imagens no **GitHub Container Registry (GHCR)**.

---

# 📂 Estrutura do Projeto

```text
gestao-uep-vegetais/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # Pipeline automatizada de CI/CD (Lint, Test, Build, Trivy, GHCR)
│   │   ├── require-linked-issue.yml   # Validação de Issue vinculada ao Pull Request
│   │   ├── release-please.yml         # Automação de PRs, tags e releases semânticas
│   ├── dependabot.yml                 # Gestão automatizada de dependências (npm, Maven, Actions)
│   ├── issue_template.md              # Template padronizado para Issues
│   └── pull_request_template.md       # Template padronizado para Pull Requests
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/gestao/uep/
│   │       │   ├── controllers/       # Controllers REST (Auth, Canteiros, Modelos de Cultivo, Usuários)
│   │       │   ├── domain/            # Entidades JPA, Enums, Repositories e DTOs
│   │       │   ├── infra/             # Segurança Spring Security e Filtro JWT
│   │       │   ├── services/          # Regras de negócio, cálculo de previsão de colheita e tokens
│   │       │   └── GestaoUepApplication.java
│   │       └── resources/
│   │           ├── db/migration/      # Migrações SQL versionadas com Flyway
│   │           └── application.yml    # Configuração de portas, datasource e JWT
│   ├── Dockerfile                     # Multi-stage build (Maven 3.9 + JRE 21 Alpine non-root)
│   └── pom.xml                        # Dependências e plugins Maven do backend
├── frontend/
│   ├── public/                        # Fontes institucionais (Libra Serif Modern) e assets estáticos
│   ├── src/
│   │   ├── components/                # Componentes do Design System (Button, Input, BackButton, UnauthorizedAccess)
│   │   ├── config/                    # Constantes e resolvedor de URL da API
│   │   ├── contexts/                  # Contextos globais da aplicação (AuthContext, UepContext)
│   │   ├── modules/                   # Módulos de domínio desacoplados e escaláveis
│   │   │   ├── auth/                  # Autenticação e jornada de entrada
│   │   │   │   ├── components/        # Layouts e botões de login (AuthLayout, GoogleLoginButton)
│   │   │   │   ├── pages/             # Telas de pré-login (SelectUepPage), Login, Cadastro, Confirmação e Recuperação
│   │   │   │   └── utils/             # Identificação automática de perfil por e-mail institucional
│   │   │   ├── olericultura/          # Módulo UEP 1: Olericultura (hortaliças e canteiros)
│   │   │   │   ├── components/        # Mapa 3D interativo (TerrariumMap), Menu lateral, Ficha de Campo e Cronograma Semanal
│   │   │   │   ├── data/              # Modelagem de dados agronômicos, canteiros (C01 a C24) e registros de colheita
│   │   │   │   └── pages/
│   │   │   │       └── professor/     # Telas de Mapa 3D, Detalhe do Canteiro, Gestão de Canteiros e Colheita (kg)
│   │   │   └── fruticultura/          # Módulo UEP 2: Fruticultura (pomares e parcelas)
│   │   ├── routes/                    # Roteamento central com lazy loading, aliases e RBAC (ProtectedRoute)
│   │   ├── services/                  # Serviços de comunicação HTTP (apiClient, authService e canteiroService)
│   │   └── types/                     # Definições centrais de tipos TypeScript (auth.ts, uep.ts)
│   ├── .dockerignore                  # Exclusão de segredos e node_modules no contexto Docker
│   ├── Dockerfile                     # Multi-stage build (Node 24 Alpine + Nginx 1.27 Alpine)
│   ├── nginx.conf                     # Configuração SPA do Nginx com cabeçalhos OWASP
│   ├── package.json                   # Dependências, scripts (lint, test, build) e tipo ESM
│   ├── tsconfig.json                  # Configurações do compilador TypeScript
│   └── vite.config.ts                 # Configuração do Vite, Vitest e divisão de chunks
├── .env.example                       # Modelo das variáveis de ambiente necessárias
├── CHANGELOG.md                       # Histórico estruturado de entregas e versões do projeto
├── VERSION                            # Versão atual do projeto
├── release-please-config.json         # Configuração do versionamento e CHANGELOG
├── .release-please-manifest.json     # Versão atual controlada pelo Release Please
├── docker-compose.yml                 # Orquestração local dos serviços (PostgreSQL, Backend, Frontend)
├── LICENSE                            # Licença de uso do projeto
└── README.md                          # Documentação técnica e visão geral
```

---

# 🚀 Versionamento e Releases

O projeto utiliza Versionamento Semântico no formato `vMAJOR.MINOR.PATCH`:

- `MAJOR`: mudanças incompatíveis;
- `MINOR`: novas funcionalidades compatíveis;
- `PATCH`: correções, documentação e melhorias sem quebra.

A versão inicial controlada pelo projeto é `v0.1.0`. A automação usa o [Release Please](https://github.com/googleapis/release-please-action) e funciona somente após alterações chegarem à `main`.

As mensagens de commit devem seguir Conventional Commits:

- `fix:` gera uma versão `PATCH`;
- `feat:` gera uma versão `MINOR`;
- `feat!:` ou `BREAKING CHANGE:` gera uma versão `MAJOR`;
- `docs:`, `chore:` e outras alterações sem impacto funcional não geram release por padrão.

O workflow `.github/workflows/release-please.yml` mantém uma Pull Request de release revisável. Ao incorporar essa PR, o Release Please atualiza o `CHANGELOG.md`, sincroniza a versão e cria a tag `vX.Y.Z` com a GitHub Release correspondente. Não há mais acumulação de alterações em uma release fixa chamada `vNext`.

O workflow usa o secret opcional `RELEASE_PLEASE_TOKEN` quando configurado. Um token próprio permite que os workflows de CI sejam disparados também para a Pull Request criada automaticamente; sem ele, o `GITHUB_TOKEN` padrão continua suficiente para criar a PR, a tag e a release conforme as permissões do repositório.

Para uma alteração que deve entrar em uma versão, use um título de PR compatível com Conventional Commits, por exemplo:

```text
feat: permitir edição da ficha de campo
fix: corrigir cálculo de previsão de colheita
```

Para uma alteração sem release, use `docs:` ou `chore:`. A criação da versão continua sujeita à revisão e aprovação da Pull Request de release.

# 🚀 Como Executar Localmente

### Pré-requisitos
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) e Docker Compose instalados e em execução

### 1. Clonar o Repositório
```bash
git clone https://github.com/ifpebj-ti/gestao-uep-vegetais.git
cd gestao-uep-vegetais
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo para criar o seu `.env`:
```bash
cp .env.example .env
```

Para habilitar o botão **Entrar com Google**, crie um cliente OAuth do tipo
aplicativo Web no Google Cloud e configure as origens JavaScript autorizadas
(`http://localhost:5173` durante o desenvolvimento e a URL do frontend em
produção). Use o mesmo Client ID nas variáveis `GOOGLE_CLIENT_ID` e
`VITE_GOOGLE_CLIENT_ID`. O backend valida o token e aceita somente contas dos
domínios `@discente.ifpe.edu.br` e `@belojardim.ifpe.edu.br`; contas pessoais
`@gmail.com` são recusadas.

### 3. Subir Toda a Aplicação com Docker Compose
```bash
docker compose up -d --build
```

### 4. Acessar os Serviços
- **Frontend (Terrarium):** [http://localhost](http://localhost)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **Status do Backend (Actuator Health):** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

# 🧪 Executando Testes e Qualidade

## Cobertura de Testes

O CI mede a cobertura de linhas do backend com JaCoCo e do frontend com Vitest/V8.
A integração é bloqueada quando a cobertura de linhas de qualquer uma das aplicações
fica abaixo de 70%. As métricas de funções, declarações e branches também são exibidas
no relatório para orientar a evolução da suíte. Os relatórios HTML, JSON e XML são
publicados como artefatos das execuções do GitHub Actions.

### Frontend (`Vitest` + `TypeScript`)
Dentro da pasta `frontend/`:
```bash
# Instalar dependências
npm ci

# Verificação estática de tipos (Lint)
npm run lint

# Execução da suíte de testes unitários com Vitest (19 suítes / 98 testes)
npm run test:run

# Execução dos testes com relatório e gate de cobertura
npm run test:coverage

# Build de produção e validação dos pacotes
npm run build
```

### Backend (`Maven` + `JUnit 5`)
Dentro da pasta `backend/`:
```bash
# Execução da suíte de testes e da verificação de cobertura do backend
mvn --batch-mode verify

# Testes unitários + integração com PostgreSQL e migrations Flyway
mvn --batch-mode verify -Pintegration
```

O perfil `integration` executa os testes `*IT.java` contra um PostgreSQL real. No CI,
o banco é criado como serviço temporário do próprio job, sem depender de dados ou
serviços externos permanentes. O teste de integração verifica a aplicação das
migrations Flyway e um fluxo de escrita e leitura de canteiro.
