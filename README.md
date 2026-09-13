<div align="center">

# 🌿 Horta Fácil

### Modernização do Sistema de Escalonamento Agrícola

[![IFPE](https://img.shields.io/badge/IFPE-Projeto_Integrador-058837?style=for-the-badge)](https://www.ifpe.edu.br/)
[![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/ifpebj-ti/gestao-uep-vegetais/ci.yml?branch=main&style=for-the-badge&label=CI%2FCD)](https://github.com/ifpebj-ti/gestao-uep-vegetais/actions)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-blue?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange?style=for-the-badge)](#)

**Uma solução Web/PWA contemporânea para auxiliar pequenos produtores, horticultores e estudantes no planejamento, organização e escalonamento contínuo da produção hortícola.**

</div>

---

# 📌 Sobre o Projeto

O **Horta Fácil** consiste na reconstrução e modernização do sistema acadêmico originalmente desenvolvido pela **UFLA/UFSJ em 2011**, transformando uma aplicação desktop legada em uma solução moderna baseada em tecnologias Web e PWA (*Progressive Web App*).

A proposta do projeto é oferecer uma ferramenta acessível para auxiliar no planejamento agrícola, permitindo que produtores e estudantes organizem ciclos de cultivo, escalonem produções e tenham maior controle sobre o processo produtivo.

A nova versão busca trazer:

- 🌱 Interface moderna e responsiva;
- 📱 Funcionamento como aplicação PWA;
- 🔌 Suporte ao modelo **offline-first**;
- ☁️ Arquitetura preparada para ambientes web modernos;
- 📊 Melhor organização das informações agrícolas;
- 🔒 Boas práticas de desenvolvimento e segurança.

---

# 🎯 Objetivos

## Objetivo Geral

Modernizar o sistema Horta Fácil, migrando sua estrutura tradicional para uma aplicação Web/PWA capaz de atender às necessidades atuais de pequenos produtores e usuários acadêmicos.

## Objetivos Específicos

- Reestruturar a aplicação utilizando tecnologias atuais;
- Melhorar a experiência do usuário através de uma interface intuitiva;
- Permitir utilização mesmo em ambientes com baixa conectividade;
- Facilitar o planejamento e escalonamento da produção agrícola;
- Aplicar boas práticas de engenharia de software durante o desenvolvimento.

---

# 👥 Equipe

| Integrante | Responsabilidades |
|------------|------------------|
| **Isabela** | Frontend, UX/UI e Prototipagem |
| **Ítalo Ruan** | Backend, Banco de Dados e Levantamento de Requisitos |
| **Antonio Macédo** | DevSecOps, Infraestrutura e QA |

---
=======
# 📑 Documentação e Acompanhamento

Para acompanhar o andamento do desenvolvimento, consultar a estrutura técnica e visualizar os relatórios e entregas, acesse os links abaixo:

- 📖 **Wiki do Projeto:** [Acessar GitHub Wiki](https://github.com/ifpebj-ti/gestao-uep-vegetais/wiki)
- 🧠 **Apresentação / Sprint Report:** [Visualizar no Canva](https://canva.link/jgi9ied9fzkyfas)
- 🎨 **Protótipo das Telas:** [Visualizar Protótipo no Canva](https://canva.link/73re71vjj12jskb)
---


# 🏗️ Tecnologias

*(Adicionar conforme o desenvolvimento evoluir)*

### Frontend
- React / Next.js
- TypeScript
- PWA
- Design Responsivo

### Backend
- API REST
- Banco de Dados Relacional

### Infraestrutura
- CI/CD
- Controle de versão com Git
- Boas práticas DevSecOps

---

# 📂 Estrutura do Projeto

```text
gestao-uep-vegetais/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                 # Pipeline automatizada de CI/CD (GitHub Actions)
│   ├── issue_template.md          # Template padronizado para Issues
│   └── pull_request_template.md   # Template padronizado para Pull Requests
├── backend/
│   ├── Dockerfile                 # Multi-stage build da API (Node.js/Alpine)
│   ├── package.json               # Dependências e scripts do backend
│   └── package-lock.json
├── frontend/
│   ├── Dockerfile                 # Multi-stage build do Frontend (Node.js + Nginx Alpine)
│   ├── nginx.conf                 # Configuração do servidor web Nginx
│   ├── package.json               # Dependências e scripts do frontend
│   └── package-lock.json
├── config/                        # Arquivos e configurações gerais do ambiente
├── .env.example                   # Modelo de variáveis de ambiente
├── .gitignore                     # Regras de exclusão de arquivos no Git
├── docker-compose.yml             # Orquestração local dos contêineres e volumes
├── LICENSE                        # Licença de uso do projeto
└── README.md                      # Documentação principal da aplicação 

```
---

## 🚀 Pipeline de CI/CD (GitHub Actions)

O projeto possui uma esteira automatizada de integração contínua (`.github/workflows/ci.yml`) que contempla:

- Verificação estática de código (**Lint**) e testes automatizados.
- Build multi-arquitetura para **linux/amd64** e **linux/arm64** com QEMU e Docker Buildx.
- Análise de segurança com **Aqua Security Trivy**, bloqueando imagens com vulnerabilidades críticas (`CRITICAL`).
- Publicação automática das imagens homologadas no **GitHub Container Registry (GHCR)**.
=======

*(Atualizar conforme o repositório for definido)*
=======
