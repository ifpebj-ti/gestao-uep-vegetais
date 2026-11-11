# Task 4 — Eventos nas linhas do tempo

**Status:** DONE

## Implementação

- Adicionados os tipos `HistoricoFichaCampoApi` / `AlteracaoFichaCampoApi` e a chamada `canteiroService.getHistorico(canteiroId)` para `GET /api/canteiros/{id}/historico`.
- Professor e aluno carregam eventos ao abrir o canteiro e atualizam o histórico após salvamento confirmado da ficha. Falha no endpoint mostra aviso sem remover eventos locais de tarefas nem substituir o estado da ficha.
- Criado `HistoricoFichaTimeline`, compartilhado pelas páginas, exibindo autor, papel, data/hora, diferenças com rótulos conhecidos em português, valores nulos como `—` e eventos em ordem decrescente.
- O histórico local de tarefas/intervenções segue no lugar, sem migração e sem sincronização em tempo real.

## Verificação

- `npm run test:run -- src/services/canteiroService.test.ts src/modules/olericultura/components/HistoricoFichaTimeline.test.tsx src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx src/modules/olericultura/pages/professor/CanteiroDetailPage.test.tsx` — 4 arquivos, 23 testes passaram.
- `npm run typecheck` — passou.
- `npm run build` — passou.
- `git diff --check` — passou.

## Arquivos

- `frontend/src/services/canteiroService.ts`
- `frontend/src/services/canteiroService.test.ts`
- `frontend/src/modules/olericultura/components/HistoricoFichaTimeline.tsx`
- `frontend/src/modules/olericultura/components/HistoricoFichaTimeline.test.tsx`
- `frontend/src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.tsx`
- `frontend/src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx`
- `frontend/src/modules/olericultura/pages/professor/CanteiroDetailPage.tsx`
- `frontend/src/modules/olericultura/pages/professor/CanteiroDetailPage.test.tsx`

## Revisão própria e observações

- A recarga do histórico não participa do sucesso/falha do salvamento da ficha: falha de leitura é apresentada separadamente; eventos locais permanecem intocados.
- Sem preocupações funcionais conhecidas. O build mantém o aviso do Vite de chunk acima de 500 kB (`three-vendor`), independente desta alteração.
- `docs/superpowers/plans/` já estava não rastreado antes do trabalho e foi preservado, fora do commit.
