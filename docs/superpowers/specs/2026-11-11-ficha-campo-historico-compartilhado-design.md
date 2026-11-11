# Ficha de campo compartilhada e histórico de alterações

## Objetivo

Garantir que professor e alunos responsáveis usem a mesma ficha de campo persistida no PostgreSQL. Cada alteração efetiva deverá aparecer na linha do tempo do canteiro, identificando autor, perfil, horário e os valores anterior e novo de cada campo alterado.

As mudanças devem ficar visíveis para todos os usuários autorizados quando eles abrirem ou atualizarem a tela do canteiro. Atualização em tempo real de telas já abertas não faz parte do escopo.

## Contexto atual

- `fichas_campo` é a fonte persistida lida e atualizada pelos endpoints do canteiro.
- Professor já carrega e salva a ficha pela API.
- O perfil de aluno ainda mantém a ficha e os eventos de edição em `localStorage`, sem compartilhar essas alterações com o professor ou outros alunos.
- O histórico/linha do tempo de atividades dos alunos também usa `localStorage`.
- A autorização de leitura e edição já existe no backend: professor pode ler/editar canteiros; aluno só pode ler/editar canteiros dos quais é responsável.
- A entidade da ficha registra a última atualização, mas não mantém versões anteriores nem diferenças por campo.

## Decisões de arquitetura

### Fonte única da ficha

A ficha atual no banco será a única fonte de verdade para os dois perfis. Tanto professor como aluno responsável carregarão a ficha pelo endpoint existente `GET /api/canteiros/{id}/ficha` e salvarão por `PUT /api/canteiros/{id}/ficha`.

O frontend do aluno não gravará a ficha em `localStorage` como alternativa. Em falha de rede ou autorização, deverá manter os valores na tela e apresentar erro, sem indicar que a atualização foi persistida. Depois de salvar, a interface atualizará seu estado com a resposta do backend.

### Histórico persistente e atômico

Será criada uma estrutura de histórico de ficha no banco. Cada evento conterá:

- canteiro;
- usuário autenticado que fez a alteração, com nome e papel registrados para exibição histórica;
- data e hora do evento;
- conjunto de alterações, cada uma com identificador/nome do campo e valor anterior e novo.

O backend comparará a ficha persistida com os novos valores e calculará as diferenças. Não confiará em autor, nome ou papel recebidos do frontend. Alterações à ficha, atualização de `updated_at`/`updated_by` e gravação do evento ocorrerão na mesma transação. Se não houver diferença em campos de domínio, nenhum evento novo será criado.

O evento registrará valores de ficha legíveis e pertinentes ao cultivo, incluindo seleção de cultura/modelo e dados derivados que efetivamente mudarem. Metadados técnicos de atualização não serão listados como campos alterados. Valores ausentes serão representados como `null` na API e exibidos como `—` na interface.

### Leitura e autorização

Será adicionado `GET /api/canteiros/{id}/historico`, ordenado do mais recente para o mais antigo. A rota exigirá a mesma autorização de leitura já usada pela ficha: professores e alunos responsáveis poderão consultar; alunos sem vínculo com o canteiro receberão `403`.

O DTO do evento terá identificador, nome/papel do autor, horário e uma lista de diferenças `{ campo, valorAnterior, valorNovo }`. O frontend poderá traduzir os identificadores de campo para rótulos em português.

## Linha do tempo existente

As telas de professor e aluno buscarão os eventos persistidos de ficha e os exibirão na linha do tempo do canteiro em ordem cronológica. Os eventos de tarefas existentes, hoje armazenados em `localStorage`, serão preservados e exibidos junto aos novos eventos de ficha onde já são apresentados.

A migração dos eventos antigos de tarefas para o banco não faz parte desta mudança. Esta especificação cobre a sincronização e auditoria das alterações da ficha; não pretende tornar as tarefas atuais multi-dispositivo.

## Migração e compatibilidade

Uma migração Flyway posterior às migrações atuais criará a estrutura de histórico e seus índices/chaves estrangeiras. Fichas existentes permanecerão inalteradas; não será inventado histórico retroativo.

Os endpoints atuais de ficha e os identificadores existentes de canteiro serão mantidos. O novo endpoint complementará a API sem mudar a regra atual de acesso.

## Interface e comportamento de erro

- A tela do aluno carregará a ficha persistida pela API ao entrar no canteiro.
- A tela do professor continuará usando a API e passará a atualizar/recarregar o histórico depois de salvar.
- A tela do aluno também atualizará/recarregará o histórico após um salvamento bem-sucedido.
- Ambos os perfis apresentarão autor, papel, data/hora e diferenças anterior/novo.
- Erros de API não serão silenciosamente convertidos em salvamento local.
- Usuários com acesso somente de leitura poderão ver ficha e histórico, mas não salvar alterações.

## Concorrência e atualização

O banco garante a ordem e persistência dos eventos. Outros usuários verão o estado atualizado ao fazer uma nova leitura, recarregar ou reabrir a tela. Edição simultânea com resolução de conflitos, polling, notificações push e WebSockets estão fora do escopo.

## Testes

### Backend

- professor salva alteração e cria evento com valores anterior/novo, autor, papel e horário;
- aluno responsável salva a mesma ficha e gera evento compartilhado;
- salvamento sem diferenças não cria evento;
- ficha e evento são atômicos;
- professor e aluno responsável consultam o histórico;
- aluno não responsável recebe `403` ao consultar e ao tentar alterar;
- eventos retornam em ordem decrescente de data;
- migração funciona com banco existente e não altera fichas antigas.

### Frontend

- perfil de aluno carrega a ficha da API, não do `localStorage`;
- salvar como aluno e professor atualiza a ficha com a resposta do servidor;
- ambos os perfis carregam e exibem os eventos persistidos de ficha;
- mudança de cultura exibe valores anterior e novo no histórico;
- falha de API mostra erro e preserva os valores ainda não salvos;
- atividades já registradas no histórico local de tarefas continuam aparecendo.

## Critérios de aceite

1. Professor e alunos responsáveis leem e alteram a mesma ficha armazenada no banco.
2. Após salvar, recarregar a tela em outro perfil/dispositivo apresenta os dados mais recentes.
3. Uma mudança de cultura, por exemplo, aparece no cabeçalho do canteiro após a próxima leitura.
4. Cada salvamento com mudanças cria um evento com autor, perfil, horário e diferenças campo a campo.
5. O professor e todos os alunos responsáveis podem consultar os mesmos eventos da ficha.
6. Usuário não autorizado não consegue ler o histórico nem alterar a ficha via chamada direta à API.
7. Falha ao salvar não deixa o frontend afirmar que a alteração foi persistida.
8. A linha do tempo de tarefas existente permanece funcional, sem migração de dados antigos nesta etapa.
9. Testes backend/frontend e migrações passam.

## Fora do escopo

- sincronização em tempo real para telas já abertas;
- migração do histórico de tarefas antigo do `localStorage`;
- edição offline-first;
- resolução automática de conflitos de edição simultânea;
- notificações por e-mail ou push;
- histórico retroativo anterior à instalação da migração.
