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

- 🌱 **Mapeamento 3D e Planta Baixa 2D Interativa:** Navegação imersiva e responsiva pelos canteiros da UEP com Three.js e GSAP;
- 📋 **Fichas de Campo Oficiais:** Preenchimento de dados agronômicos, manejo fitossanitário e visto de aprovação docente;
- 👥 **Perfis de Acesso Acadêmicos:** Fluxos segmentados e dedicados para Professores e Estudantes;
- 📱 **Progressive Web App (PWA):** Interface responsiva projetada para uso em campo;
- 🔌 **Arquitetura Resiliente & Offline-First:** Tratamento inteligente de falhas de conectividade;
- 🔒 **Blindagem de Segurança & DevSecOps:** Headers HTTP recomendados pela OWASP, JWT com expiração e varredura estática de vulnerabilidades;
- 📊 **Otimização do Escalonamento:** Acompanhamento dinâmico do ciclo fenológico e previsões de colheita.

---

# 🎯 Objetivos

## Objetivo Geral

Desenvolver o sistema **Terrarium**, uma aplicação Web/PWA de gestão agrícola inspirada no legado do Horta Fácil, visando otimizar o planejamento, o escalonamento e a administração espacial das Unidades de Ensino e Produção (UEPs) Vegetais do **IFPE - Campus Belo Jardim**.

## Objetivos Específicos

- **Projetar uma arquitetura segura:** Aplicar práticas de integração contínua (CI/CD) e diretrizes OWASP no desenvolvimento;
- **Modernizar o planejamento agrícola:** Adaptar a lógica de escalonamento do software original para as atuais demandas operacionais e pedagógicas;
- **Desenvolver interfaces interativas:** Implementar mapas 3D interativos e fichas de campo digitais para otimizar o monitoramento espacial dos canteiros;
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
- 🧠 **Apresentação / Sprint Report:** [Visualizar no Canva](https://canva.link/jgi9ied9fzkyfas)
- 🎨 **Protótipo das Telas:** [Visualizar Protótipo no Canva Overview](https://canva.link/73re71vjj12jskb) e [Visualizar Protótipo no Figma](https://www.figma.com/design/zlMQSyhaPWFB7oUfQeCiCE/Desktop-sign-up-and-login-pages-by-EditorM--Community-?node-id=0-1&m=dev&t=L2Z2sFGH00jeQenz-1)
---

# 🏗️ Tecnologias e Arquitetura

### 💻 Frontend
- **Framework & Core:** [React 19](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool:** [Vite 7](https://vitejs.dev/) com *Code Splitting* (`React.lazy` + `manualChunks`)
- **Renderização Gráfica & 3D:** [Three.js](https://threejs.org/) (WebGL acelerado, iluminação suave, controles orbitais) e [GSAP](https://greensock.com/gsap/) (interpolação e transições de câmera)
- **Estilização & Design System:** [TailwindCSS v4](https://tailwindcss.com/) com paleta agronômica personalizada e ícones do [Lucide React](https://lucide.dev/)
- **Roteamento & Proteção:** [React Router DOM v7](https://reactrouter.com/) com guarda de rotas privadas (`ProtectedRoute`)
- **Cliente HTTP Centralizado:** `apiClient` com injeção automática de `Bearer Token`, timeout com `AbortController` e interceptor de sessão expirada (`401`)
- **Testes & Qualidade:** [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/) e JSDOM (61 testes unitários automatizados)

### ⚙️ Backend
- **Linguagem & Plataforma:** Java 21 (LTS)
- **Framework:** [Spring Boot 3.5](https://spring.io/projects/spring-boot)
- **Persistência de Dados:** Spring Data JPA e Hibernate ORM
- **Banco de Dados:** PostgreSQL 16
- **Segurança & Autenticação:** Spring Security 6 com autenticação stateless, tokens JWT ([Auth0 java-jwt](https://github.com/auth0/java-jwt)) e criptografia BCrypt
- **Métricas e Diagnóstico:** Spring Boot Actuator
- **Produtividade:** Project Lombok

### 🛡️ Infraestrutura, Contêineres & DevSecOps
- **Contêineres Multi-Stage:**
  - **Frontend:** Build Node 20 Alpine servido via Nginx 1.27 Alpine.
  - **Backend:** Compilação Maven 3.9 Temurin 21 empacotada em JRE 21 Alpine non-root.
- **Servidor Web (Nginx):** Compactação gzip, cache de assets imutáveis e cabeçalhos de segurança OWASP (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `server_tokens off`).
- **Orquestração:** Docker Compose com rede em bridge isolada (`gestao-uep-network`) e volume nomeado (`pgdata`).
- **Pipeline de CI/CD (GitHub Actions):**
  - Checagem estática de tipagem e integridade (`npm run lint`).
  - Execução contínua da suíte de testes (`npm run test:run`).
  - Verificação de build de produção (`npm run build`).
  - Compilação Multi-Arquitetura (`amd64` / `arm64`) com QEMU e Buildx.
  - Varredura de segurança com **Aqua Security Trivy** (bloqueio de vulnerabilidades `CRITICAL`).
  - Publicação automática das imagens no **GitHub Container Registry (GHCR)**.

---

# 📂 Estrutura do Projeto

```text
gestao-uep-vegetais/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                 # Pipeline automatizada de CI/CD (Lint, Test, Build, Trivy, GHCR)
│   ├── issue_template.md          # Template padronizado para Issues
│   └── pull_request_template.md   # Template padronizado para Pull Requests
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/gestao/uep/
│   │       │   ├── controllers/   # Controllers REST (/api/auth)
│   │       │   ├── domain/        # Entidades JPA, Enums e DTOs
│   │       │   ├── infra/         # Segurança Spring Security e Filtro JWT
│   │       │   ├── services/      # Regras de negócio e geração de tokens
│   │       │   └── GestaoUepApplication.java
│   │       └── resources/
│   │           └── application.yml# Configuração de portas, datasource e JWT
│   ├── Dockerfile                 # Multi-stage build (Maven 3.9 + JRE 21 Alpine non-root)
│   └── pom.xml                    # Dependências e plugins Maven do backend
├── frontend/
│   ├── public/                    # Favicons e manifestos estáticos
│   ├── src/
│   │   ├── components/            # Componentes reutilizáveis (TerrariumMap 3D, TerrariumMenu, FichaCampo, etc.)
│   │   ├── config/                # Constantes e resolvedor de URL da API
│   │   ├── contexts/              # Provedor global de autenticação (AuthContext)
│   │   ├── data/                  # Modelagem de dados agronômicos e canteiros (C01 a C12)
│   │   ├── pages/                 # Páginas da aplicação (Login, Register, Mapa, CanteiroDetail, etc.)
│   │   ├── routes/                # Roteamento central com lazy loading e ProtectedRoute
│   │   └── services/              # Serviços de comunicação (apiClient e authService)
│   ├── .dockerignore              # Exclusão de segredos e node_modules no contexto Docker
│   ├── Dockerfile                 # Multi-stage build (Node 20 Alpine + Nginx 1.27 Alpine)
│   ├── nginx.conf                 # Configuração SPA do Nginx com cabeçalhos OWASP
│   ├── package.json               # Dependências, scripts (lint, test, build) e tipo ESM
│   ├── tsconfig.json              # Configurações do compilador TypeScript
│   └── vite.config.ts             # Configuração do Vite, Vitest e divisão de chunks
├── .env.example                   # Modelo das variáveis de ambiente necessárias
├── docker-compose.yml             # Orquestração local dos serviços (PostgreSQL, Backend, Frontend)
├── LICENSE                        # Licença de uso do projeto
└── README.md                      # Documentação técnica e visão geral
```

---

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

Para habilitar o botao **Entrar com Google**, crie um cliente OAuth do tipo
aplicativo Web no Google Cloud e configure as origens JavaScript autorizadas
(`http://localhost:5173` durante o desenvolvimento e a URL do frontend em
producao). Use o mesmo Client ID nas variaveis `GOOGLE_CLIENT_ID` e
`VITE_GOOGLE_CLIENT_ID`. O backend valida o token e aceita somente contas dos
dominios `@discente.ifpe.edu.br` e `@belojardim.ifpe.edu.br`; contas pessoais
`@gmail.com` sao recusadas.

### 3. Subir Toda a Aplicação com Docker Compose
```bash
docker compose up -d --build
```

### 4. Acessar os Serviços
- **Frontend (Terrarium):** [http://localhost](http://localhost)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **Status do Backend (Actuator Health):** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

# 🧪 Executando Testes e Qualidade (Frontend)

Dentro da pasta `frontend/`:
```bash
# Instalar dependências
npm ci

# Verificação estática de tipos (Lint)
npm run lint

# Execução da suíte de testes unitários com Vitest
npm run test:run

# Build de produção e validação dos pacotes
npm run build
```
