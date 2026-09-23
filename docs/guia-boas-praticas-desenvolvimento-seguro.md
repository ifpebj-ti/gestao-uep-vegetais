# Guia de Boas Práticas de Desenvolvimento Seguro

**Projeto:** Horta Fácil — Gestão UEP Vegetais  
**Escopo:** código-fonte, infraestrutura local, revisão de mudanças e publicação da aplicação  
**Status:** guia inicial — revisar quando a arquitetura e os ambientes forem definidos

## 1. Objetivo

Este guia define práticas mínimas para desenvolver, revisar, testar e publicar o Horta Fácil com segurança. Ele deve ser utilizado por todas as pessoas que criam código, configuram a infraestrutura ou revisam Pull Requests.

O guia foi elaborado a partir dos controles já presentes no repositório. Quando uma prática ainda não está implementada, ela aparece como **próximo passo** e não como controle já existente.

## 2. Princípios

- **Segurança desde o início:** considerar abuso, falhas e dados sensíveis durante o levantamento da Issue e o desenho da solução.
- **Menor privilégio:** cada usuário, serviço, container e credencial deve possuir apenas o acesso necessário.
- **Não confiar na entrada:** toda entrada vinda do navegador, API, arquivo ou banco deve ser validada no servidor.
- **Falhar com segurança:** mensagens para o usuário não devem revelar segredos, stack traces, SQL ou detalhes internos.
- **Mudanças rastreáveis:** toda alteração deve estar ligada a uma Issue e passar por revisão antes de ser incorporada.
- **Dependências atualizadas:** bibliotecas e imagens devem ser mantidas em versões suportadas e corrigidas.

## 3. Controles já presentes no repositório

| Controle | Evidência | Como utilizar |
| --- | --- | --- |
| Proteção de arquivos de ambiente | `.gitignore` | Nunca versionar `.env`, credenciais ou logs. Usar `.env.example` somente com valores fictícios. |
| Modelo de variáveis | `.env.example` | Criar o `.env` localmente e substituir todos os placeholders antes de executar a aplicação. |
| Revisão padronizada | `.github/pull_request_template.md` | Preencher descrição, Issue relacionada, testes e impacto na documentação. |
| Rastreabilidade | `.github/workflows/require-linked-issue.yml` | Abrir PR somente com referência a uma Issue real, por exemplo `Closes #12`. |
| Isolamento de execução | `backend/Dockerfile` | Manter o backend executando como `appuser`, sem privilégios de root. |
| Imagens menores | Dockerfiles multi-stage | Usar a imagem final de produção e não incluir ferramentas ou dependências de desenvolvimento nela. |
| Verificação de disponibilidade | Dockerfiles e `docker-compose.yml` | Manter healthchecks simples e não usá-los como substituto de autenticação ou autorização. |
| Bloqueio de arquivos ocultos | `frontend/nginx.conf` | Não permitir acesso a arquivos iniciados por ponto no servidor web. |
| Persistência isolada | `docker-compose.yml` | Usar volume nomeado e rede interna para os serviços; revisar a exposição de portas antes de qualquer ambiente compartilhado. |

## 4. Fluxo seguro de trabalho

### 4.1 Antes de desenvolver

1. Criar ou atualizar uma Issue com objetivo, critérios de aceite, dependências e possíveis impactos de segurança.
2. Identificar os dados tratados: dados pessoais, credenciais, informações agrícolas, logs e dados de configuração.
3. Definir quem pode executar a operação e quais dados podem ser lidos, criados, alterados ou excluídos.
4. Para mudanças sensíveis, registrar na Issue os cenários de abuso considerados, como acesso indevido, alteração de dados de outra pessoa e repetição de requisições.

### 4.2 Durante a implementação

- Validar formato, tamanho, tipo e limites de todos os dados recebidos.
- Aplicar autorização no backend em toda operação protegida; não confiar em botões ou regras implementadas apenas no frontend.
- Usar consultas parametrizadas ou o mecanismo seguro do ORM. Nunca montar SQL por concatenação de entrada do usuário.
- Codificar a saída conforme o contexto para evitar XSS. Não renderizar HTML fornecido pelo usuário sem sanitização explícita.
- Usar mensagens genéricas para falhas externas e registrar detalhes somente em logs protegidos.
- Não colocar tokens, senhas, chaves JWT ou dados pessoais em código, commits, nomes de branch, screenshots ou mensagens de log.
- Armazenar senhas usando algoritmo de hash adaptativo aprovado pela stack, com salt individual. Nunca armazenar senha em texto puro ou usar hash rápido como substituto.
- Configurar cookies de sessão com `Secure`, `HttpOnly` e `SameSite` quando cookies forem adotados. Avaliar proteção contra CSRF para operações autenticadas por cookie.
- Definir expiração, rotação e revogação para tokens. O `JWT_SECRET` deve ser longo, aleatório e exclusivo por ambiente.
- Limitar tamanho de uploads, tipos MIME permitidos, nomes de arquivo e diretórios de destino. Não executar arquivos enviados.
- Evitar dados sensíveis no `localStorage` do navegador, especialmente tokens de longa duração.

### 4.3 Antes de abrir a Pull Request

- Executar os testes, lint e build disponíveis para a stack.
- Verificar se não foram adicionados `.env`, chaves privadas, tokens, dumps de banco, arquivos de log ou credenciais.
- Revisar alterações de autenticação, autorização, validação, consultas, uploads, CORS, headers e tratamento de erros.
- Confirmar que a documentação e o `.env.example` foram atualizados quando houver nova configuração.
- Preencher integralmente o template da PR e referenciar a Issue com `Closes #N`.

### 4.4 Durante a revisão

O revisor deve confirmar, no mínimo:

- A mudança atende somente ao escopo da Issue.
- Entradas não confiáveis são validadas no servidor.
- A autorização é verificada para o recurso específico, evitando IDOR/BOLA.
- Não há segredo ou dado sensível exposto.
- Erros e logs não vazam informações internas.
- Testes cobrem o caminho esperado e os casos de rejeição.
- Dependências e imagens alteradas são necessárias e confiáveis.
- A alteração não amplia portas, permissões, volumes ou acesso de rede sem justificativa.

## 5. Segredos e configurações

O arquivo `.env` é local e não deve ser commitado. O `.env.example` deve conter apenas nomes de variáveis e valores fictícios.

No estado atual, o Compose possui valores padrão de desenvolvimento para o PostgreSQL (`postgres`) e expõe portas configuráveis. Esses padrões **não devem ser usados em produção**. Antes de qualquer ambiente compartilhado:

- substituir usuário e senha padrão por credenciais fortes e gerenciadas fora do Git;
- evitar publicar a porta do banco para fora da rede interna;
- fornecer `JWT_SECRET` por um gerenciador de segredos ou mecanismo equivalente;
- separar configurações de desenvolvimento, homologação e produção;
- rotacionar imediatamente qualquer segredo que tenha sido exposto.

Se um segredo for commitado, não basta apagá-lo do arquivo: revogar ou rotacionar o segredo, verificar o histórico e registrar o incidente.

## 6. Dependências, imagens e pipeline

Os Dockerfiles usam `npm ci`, versões de imagem Alpine e build multi-stage. Ao adicionar manifests de dependências:

- versionar os lockfiles (`package-lock.json`, `yarn.lock` ou equivalente);
- preferir instalação reproduzível e revisar mudanças no lockfile;
- remover dependências não utilizadas;
- atualizar bibliotecas vulneráveis com prioridade conforme a severidade;
- fixar ou controlar versões de imagens base e revisar atualizações.

O arquivo `.github/dependabot.yml` já existe, mas seu `package-ecosystem` está vazio. Portanto, a atualização automática de dependências ainda precisa ser finalizada para cada ecossistema e diretório que realmente possua manifest.

**Próximos passos recomendados para o CI:**

1. adicionar verificação de secrets;
2. executar lint, testes e build em toda PR;
3. executar auditoria de dependências;
4. analisar Dockerfiles e imagens;
5. publicar somente artefatos aprovados e com versão identificável;
6. proteger a branch principal com revisão obrigatória e checks aprovados.

## 7. Segurança da API e do frontend

Quando a API for implementada:

- exigir HTTPS fora do ambiente local;
- configurar CORS com origens explícitas, sem `*` quando houver credenciais;
- aplicar autenticação e autorização no backend;
- limitar tentativas de login e endpoints sensíveis;
- definir limites de paginação, payload e tempo de requisição;
- retornar códigos HTTP consistentes sem revelar detalhes internos;
- registrar eventos de autenticação, autorização negada e alterações críticas sem registrar tokens ou senhas;
- configurar headers de segurança no Nginx, incluindo uma política de conteúdo adequada ao frontend.

No frontend PWA/offline-first, definir quais dados podem ser armazenados offline, por quanto tempo e como serão removidos. Dados sensíveis não devem permanecer no cache sem necessidade e sem proteção compatível com o risco.

## 8. Dados, privacidade e logs

- Coletar somente os dados necessários para a finalidade do sistema.
- Definir retenção e descarte para dados de negócio, cache e backups.
- Restringir acesso ao banco e aos volumes persistentes.
- Mascarar identificadores e dados pessoais nos logs.
- Não registrar senha, token, chave, cookie, conteúdo completo de requisições sensíveis ou dados pessoais desnecessários.
- Manter relógios e fuso horário consistentes; o projeto utiliza `America/Sao_Paulo` como configuração de referência.
- Documentar restauração de backup e testar a restauração periodicamente.

## 9. Tratamento de vulnerabilidades e incidentes

Vulnerabilidades não devem ser discutidas publicamente em uma Issue comum quando contiverem detalhes exploráveis. A pessoa que identificar um problema deve:

1. preservar evidências sem copiar segredos para a Issue;
2. comunicar o responsável técnico por canal privado definido pela equipe;
3. classificar impacto e alcance;
4. corrigir, testar e revisar a mudança;
5. rotacionar credenciais comprometidas;
6. registrar causa, correção e ações preventivas após a contenção.

## 10. Checklist de aceite de segurança

Uma mudança pode ser considerada pronta quando as respostas abaixo forem positivas ou houver justificativa registrada na PR:

- [ ] A Issue descreve o objetivo e o impacto da mudança.
- [ ] A PR está vinculada a uma Issue real.
- [ ] Nenhum segredo foi adicionado ao repositório.
- [ ] Entrada, autorização e tratamento de erro foram revisados.
- [ ] Testes cobrem sucesso, falha e acesso não autorizado quando aplicável.
- [ ] Dependências e imagens foram avaliadas.
- [ ] Logs não expõem dados sensíveis.
- [ ] Documentação e variáveis de ambiente foram atualizadas.
- [ ] O build e os checks do CI passaram.
- [ ] A implantação não usa credenciais padrão nem expõe o banco sem necessidade.

## 11. Referências do próprio projeto

- [README.md](../README.md)
- [.gitignore](../.gitignore)
- [.env.example](../.env.example)
- [Template de Pull Request](../.github/pull_request_template.md)
- [Workflow de Issue vinculada](../.github/workflows/require-linked-issue.yml)
- [Configuração do Dependabot](../.github/dependabot.yml)
- [Docker Compose](../docker-compose.yml)
- [Dockerfile do backend](../backend/Dockerfile)
- [Configuração do Nginx](../frontend/nginx.conf)

---

**Responsável pela revisão:** equipe do projeto  
**Periodicidade sugerida:** revisar a cada mudança relevante de arquitetura, autenticação, infraestrutura ou tratamento de dados.
