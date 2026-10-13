# Fichas de campo persistentes e interativas por canteiro

## Objetivo

Transformar a ficha de campo de cada canteiro em um recurso interativo e persistente, permitindo que professores editem qualquer ficha e que cada aluno edite somente as fichas dos canteiros aos quais está associado.

Os dados devem permanecer disponíveis após reinicialização, queda ou desligamento do servidor, utilizando o PostgreSQL já empregado pela aplicação.

## Contexto atual

- Os canteiros são definidos em `frontend/src/data/horticulturaData.ts`.
- A ficha é renderizada por `FichaCampoOlericultura`.
- Os dados editáveis da ficha são mantidos em `localStorage`.
- O perfil da tela de detalhes está fixado como professor.
- O backend possui usuários, papéis `ALUNO` e `PROFESSOR`, autenticação por senha/Google e JWT.
- Ainda não existem entidades, tabelas ou endpoints para canteiros, equipes ou fichas.

## Decisões de arquitetura

### Persistência relacional

Serão criadas entidades e tabelas relacionais para:

1. `canteiros`: cadastro persistido do canteiro e seus dados principais.
2. `canteiro_responsaveis`: associação entre um canteiro e seus alunos responsáveis.
3. `fichas_campo`: uma ficha atual por canteiro.

Os campos da ficha serão colunas explícitas, e não um JSONB. A ficha possui uma estrutura conhecida, e colunas individuais permitem validação, evolução controlada, consultas e testes mais claros.

### Associação dos alunos

Cada canteiro poderá possuir no máximo três alunos responsáveis. A associação deverá:

- aceitar somente usuários com papel `ALUNO`;
- impedir o mesmo aluno duplicado no mesmo canteiro;
- ser mantida pelo professor por endpoint próprio;
- ser persistida no banco para que a autorização não dependa do frontend.

A tela de gerenciamento permitirá ao professor selecionar três alunos cadastrados, preferencialmente por nome e e-mail institucional.

### Autorização no backend

A autorização será aplicada no serviço de domínio, além de ser refletida na interface:

- `PROFESSOR`: pode consultar e alterar qualquer canteiro, equipe e ficha;
- `ALUNO`: pode consultar fichas e alterar somente as fichas dos canteiros em que está associado;
- outros papéis: não poderão alterar fichas; a permissão de leitura será definida como somente leitura quando a tela for integrada ao restante do sistema.

O backend deverá obter o usuário autenticado a partir do JWT e ignorar qualquer identificador de usuário enviado pelo frontend para decidir permissões.

### Ficha atual e auditoria básica

Haverá uma única ficha atual por canteiro, com os campos da ficha existente:

- grupo;
- código do canteiro;
- cultura;
- data de plantio;
- espaçamento;
- plantas por canteiro;
- plantas por hectare;
- previsão de colheita;
- adubação;
- controle de pragas;
- limpa/capina;
- observações;
- status da entrega;
- data da entrega;
- visto do professor, data do visto e parecer.

A tabela também registrará `updated_at` e `updated_by`, permitindo identificar a última alteração. Histórico completo de versões não faz parte desta etapa.

## API proposta

As rotas exigirão JWT, exceto as rotas públicas de autenticação já existentes.

### Canteiros e fichas

- `GET /api/canteiros`: lista canteiros visíveis ao usuário autenticado.
- `GET /api/canteiros/{id}`: consulta os dados do canteiro, equipe e ficha.
- `GET /api/canteiros/{id}/ficha`: consulta a ficha atual.
- `PUT /api/canteiros/{id}/ficha`: atualiza os valores permitidos da ficha.

### Equipe do canteiro

- `GET /api/canteiros/{id}/responsaveis`: lista os alunos associados.
- `PUT /api/canteiros/{id}/responsaveis`: substitui a equipe por até três alunos; permitido somente para professor.
- `GET /api/usuarios/alunos`: lista alunos institucionais disponíveis para associação; permitido somente para professor.

O endpoint de atualização da ficha deverá retornar `403` quando o usuário não possuir autorização para o canteiro e `404` quando o canteiro não existir.

## Frontend

### Tela de detalhes

`CanteiroDetailPage` deverá:

- utilizar o usuário real do `AuthContext`, sem perfil fixo;
- carregar o canteiro e a ficha pela API;
- exibir carregamento, erro e estado vazio;
- passar a permissão calculada para `FichaCampoOlericultura`.

### Componente da ficha

`FichaCampoOlericultura` deverá:

- trocar o armazenamento principal em `localStorage` por leitura e gravação via API;
- permitir a edição de todos os valores da ficha para professor e alunos responsáveis;
- exibir os campos em modo somente leitura para usuários sem permissão;
- manter a impressão da ficha;
- mostrar feedback de salvamento e erro;
- evitar sobrescrever alterações com valores padrão depois que os dados forem carregados.

O `localStorage` não será usado como fonte de verdade. Se for mantido temporariamente para rascunho, deverá ser separado da ficha persistida e nunca substituir os dados do servidor.

### Gestão da equipe

Será adicionada uma interface visível somente para professor, permitindo selecionar até três alunos e salvar a equipe do canteiro. A interface deverá informar quando a equipe estiver incompleta ou quando o limite de três alunos for atingido.

## Banco de dados e migração

Será criada uma migração Flyway posterior às migrações existentes, contendo:

- tabela de canteiros;
- tabela de associação de responsáveis;
- tabela de fichas;
- chaves estrangeiras;
- restrições de unicidade;
- índices para consultas por canteiro e usuário.

Os canteiros atualmente definidos no frontend deverão ser carregados no banco por uma estratégia de seed controlada. Os identificadores atuais, como `c-01`, deverão ser preservados para não quebrar links existentes.

## Concorrência e consistência

- A atualização deverá ocorrer em transação.
- A relação de responsáveis será validada novamente no backend antes de salvar.
- A ficha deverá ter restrição de unicidade por canteiro.
- O primeiro escopo não inclui edição colaborativa em tempo real nem resolução avançada de conflitos.

## Testes

### Backend

Adicionar testes para:

- criação e consulta de canteiros;
- persistência e atualização da ficha;
- professor editando qualquer ficha;
- aluno responsável editando a própria ficha;
- aluno não responsável recebendo `403`;
- usuário sem papel permitido recebendo `403`;
- associação de no máximo três alunos;
- rejeição de aluno duplicado ou usuário que não seja aluno;
- carregamento dos dados após reinicialização da aplicação;
- migração e restrições do banco.

### Frontend

Adicionar testes para:

- carregar a ficha da API;
- renderizar os campos editáveis para professor;
- renderizar os campos editáveis para aluno responsável;
- renderizar modo somente leitura para aluno não responsável;
- salvar alterações e atualizar a mensagem de sucesso;
- exibir erro de API sem apagar os valores carregados;
- selecionar e salvar os três responsáveis na interface do professor.

## Critérios de aceite

1. Uma alteração feita por um usuário autorizado permanece após recarregar a página.
2. A alteração permanece após reiniciar o backend e o container do banco.
3. Um professor consegue editar qualquer ficha.
4. Cada um dos três alunos associados consegue editar a ficha do seu canteiro.
5. Um aluno não associado não consegue alterar a ficha mesmo chamando a API diretamente.
6. A interface não depende de perfil fixo nem de dados salvos apenas no navegador.
7. As migrações e os testes automatizados passam em ambiente local e no pipeline existente.

## Fora do escopo desta etapa

- modo offline-first;
- histórico completo de versões;
- edição simultânea em tempo real;
- notificações por e-mail sobre cada alteração;
- redefinição da estrutura visual da ficha para além dos controles necessários à edição.
