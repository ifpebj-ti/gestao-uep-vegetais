# Documento de Visão do Produto

> **Status:** visão consolidada para a versão em desenvolvimento 0.1.x
> **Última revisão:** 28/11/2026
> **Fonte histórica:** [Documento de Visão da Wiki](https://github.com/ifpebj-ti/gestao-uep-vegetais/wiki/Documento-de-Vis%C3%A3o)

## 1. Contexto e problema

As Unidades de Ensino e Produção (UEPs) Vegetais precisam registrar o planejamento,
o manejo e a produção de forma rastreável. Fichas em papel, planilhas isoladas e
informações distribuídas dificultam o acompanhamento dos canteiros, a comunicação
entre professores, técnicos e estudantes e a comparação entre o planejado e o
realizado.

O Terrarium moderniza essa rotina como uma aplicação Web/PWA voltada ao IFPE -
Campus Belo Jardim. A solução organiza os dados das UEPs, apresenta o espaço de
produção de forma visual e apoia o registro contínuo das atividades de campo.

## 2. Stakeholders

| Stakeholder | Necessidade principal | Como o produto atende |
| --- | --- | --- |
| Estudantes | Consultar a UEP, acompanhar canteiros e registrar ou acompanhar atividades autorizadas | Área do aluno, fichas e histórico conforme as permissões do usuário |
| Professores | Planejar, revisar e acompanhar atividades e registros dos estudantes | Área docente, fichas de campo, cronograma, colheita e histórico |
| Técnicos das UEPs | Consultar o estado operacional dos canteiros e apoiar a execução em campo | Mapa, dados de cultivo e registros centralizados |
| Administração e coordenação | Administrar usuários, perfis, vínculos e acesso às UEPs | Painel administrativo e controle de papéis |
| IFPE - Campus Belo Jardim | Dispor de uma solução aderente ao contexto acadêmico e produtivo do campus | Domínios institucionais, rastreabilidade e governança do repositório |
| Desenvolvimento, QA e DevSecOps | Evoluir o sistema com segurança e qualidade verificável | CI/CD, testes, análise de segurança, documentação e PRs vinculadas a Issues |
| Operação e manutenção | Executar e atualizar a solução de forma reproduzível | Docker Compose, variáveis documentadas, migrations e Release Please |

## 3. Objetivos

### 3.1 Objetivo geral

Oferecer uma plataforma Web/PWA que centralize a gestão espacial e produtiva das
UEPs Vegetais, dando suporte ao planejamento agrícola, ao acompanhamento das
atividades e à rastreabilidade dos registros.

### 3.2 Objetivos específicos

- substituir registros dispersos por fichas e históricos digitais;
- permitir a visualização dos canteiros e de seu estado operacional;
- apoiar o planejamento de ciclos, cronogramas e colheitas;
- separar as jornadas de estudante, professor e administração por autorização;
- manter os dados protegidos por autenticação institucional e autorização no backend;
- sustentar evolução incremental com testes, CI/CD, varreduras de segurança e
  releases rastreáveis.

## 4. Escopo

### 4.1 Incluído na visão do produto

- autenticação institucional, incluindo o fluxo de login com Google, e controle de
  acesso por perfil;
- administração de usuários, convites, vínculos com UEPs e status de contas;
- mapa e dados da UEP de Olericultura, canteiros, fichas de campo, cronograma,
  histórico e registros de colheita;
- APIs REST, persistência relacional, migrations e integração entre frontend e
  backend;
- execução local conteinerizada e esteira de qualidade, testes e segurança;
- documentação pública, backlog de Issues e processo de revisão por Pull Request.

### 4.2 Fora do escopo atual

- gestão fiscal, vendas, faturamento ou emissão de notas fiscais;
- automação de bombas, sensores ou outros atuadores físicos por IoT;
- integração direta com ERPs corporativos;
- uso de um arquivo de design Community como fonte oficial de protótipo;
- decisão de negócio baseada somente em dados enviados pelo navegador, sem
  autorização correspondente no backend.

Itens futuros devem ser registrados como Issues e avaliados contra esta visão antes
de entrarem no planejamento.

## 5. Restrições e premissas

- o contexto institucional é o IFPE - Campus Belo Jardim;
- o acesso institucional depende do Google OAuth e dos domínios autorizados pelo
  backend; a disponibilidade desse provedor é uma dependência externa;
- o backend usa Java 21, Spring Boot 4.1.2, Spring Security 6.5.9, JPA/Hibernate,
  Flyway e PostgreSQL 16;
- o frontend usa React 19, TypeScript, Vite 7, Vitest e React Router DOM 7;
- o ambiente local e a entrega usam Docker, Docker Compose, Maven, Node 24 e
  Nginx conforme os arquivos versionados do projeto;
- `main` é integrada por Pull Request, com Issue vinculada, Conventional Commits,
  validações obrigatórias e revisão dos responsáveis pelo repositório;
- `VERSION`, `backend/pom.xml`, `frontend/package.json` e o Release Please são
  fontes coordenadas de versão e não devem ser atualizados de forma conflitante;
- segredos, tokens, credenciais Google, senhas e dados reais não pertencem ao
  repositório.

## 6. Riscos e respostas

| Risco | Impacto | Resposta esperada |
| --- | --- | --- |
| Configuração incorreta de papéis ou autorização | Usuário acessa dados de outra UEP ou função | Validar autorização no backend, cobrir Security com testes e revisar PRs de acesso |
| Dependência do Google OAuth | Login indisponível ou configuração divergente entre ambientes | Documentar variáveis, domínios e fallback operacional; nunca confiar apenas no frontend |
| Perda ou inconsistência de dados de campo | Histórico e decisões agrícolas ficam comprometidos | Usar migrations, validações, persistência transacional e testes de integração |
| Divergência entre frontend e backend | Funcionalidades exibidas não funcionam ou contratos quebram | Manter Issues de integração, revisar contratos e executar a esteira completa |
| Dependências ou imagens vulneráveis | Aumento da superfície de ataque | Dependabot, Semgrep, OWASP ZAP, Trivy e Issues de remediação |
| Documentação e versão desatualizadas | Releases e avaliações ficam difíceis de reproduzir | Revisar README, CHANGELOG e arquivos de versão junto com cada mudança relevante |

## 7. Critérios de sucesso

O produto será considerado alinhado a esta visão quando:

1. estudantes, professores, técnicos e administradores tiverem fluxos e permissões
   documentados e verificáveis no sistema;
2. os principais registros de UEP, canteiro, ficha, cronograma, histórico e
   colheita puderem ser rastreados até uma conta autorizada;
3. alterações de código passarem pelos testes, lint/build e gates de segurança
   aplicáveis, sem reduzir thresholds para ocultar falhas;
4. o ambiente local puder ser reproduzido a partir da documentação e dos arquivos
   Docker versionados;
5. cada release tiver versão, CHANGELOG e PR de release coerentes entre si;
6. as decisões pendentes e lacunas de implementação estiverem registradas no
   backlog oficial de Issues, com responsável e critérios de aceite.

## 8. Referências mantidas no projeto

- [README e arquitetura](../README.md)
- [Backlog e Issues](https://github.com/ifpebj-ti/gestao-uep-vegetais/issues)
- [Wiki do projeto](https://github.com/ifpebj-ti/gestao-uep-vegetais/wiki)
- [Estratégia de testes](testing-strategy.md)
- [Endurecimento de segurança](security-hardening.md)
- [Documento de Visão histórico da Wiki](https://github.com/ifpebj-ti/gestao-uep-vegetais/wiki/Documento-de-Vis%C3%A3o)
