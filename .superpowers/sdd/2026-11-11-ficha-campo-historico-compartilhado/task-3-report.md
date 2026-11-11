# Task 3 Report: Ficha do aluno via API

## Status

DONE — student ficha data is loaded and saved through the shared API. The API response is the only source used to initialize or refresh the ficha editor; ficha-specific `localStorage` persistence has been removed. Existing task and timeline local behavior remains unchanged.

## Implementation

- Added remote ficha loading state and visible loading/error states to `AlunoCanteiroDetailPage`.
- Mapped the API response into `FichaCampoData`, including turma, cultivation model, area, forecast, delivery status, persisted metadata, and teacher review fields.
- Saves now await `canteiroService.saveFicha`; the editor is updated from the server response only after success. Rejections propagate to the existing editor error UI, leaving edits in place and avoiding a success message.
- Kept the existing local task timeline action after a successful remote save.
- Added `variedade` to the ficha PUT payload so the existing API service sends that editable API field as well.
- Added student-page coverage for remote hydration, loading, load failure, save failure/edit retention, canonical save response, and absence of local ficha persistence. Added service GET/PUT payload tests.

## Verification

- `npm run test:run -- src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx src/services/canteiroService.test.ts` — passed, 2 files / 10 tests.
- `npm run typecheck` — passed.
- `npm run test:run` — passed, 27 files / 157 tests. The suite emitted a non-failing jsdom navigation notice from an existing test.
- `git diff --check` — passed.

## Files changed

- `frontend/src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.tsx`
- `frontend/src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx`
- `frontend/src/services/canteiroService.ts`
- `frontend/src/services/canteiroService.test.ts` (new)
- `.superpowers/sdd/2026-11-11-ficha-campo-historico-compartilhado/task-3-report.md` (this report)

## Self-review and concerns

- The page retains its pre-existing demonstration `CANTEIROS_DATA` fallback, as requested; ficha content itself is not shown as loaded until the API succeeds.
- No history API fetching or unrelated page redesign was added.
- The pre-existing untracked `docs/superpowers/plans/` content was left untouched.
- No correctness concerns identified. The full test suite's jsdom navigation notice was non-failing.

## Reviewer follow-up fix

The save callback now returns the canonical server ficha to the editor, which applies it directly after a successful save. A regression test submits a culture value with trailing whitespace, returns its server-normalized form, and verifies the editor displays the normalized value. Rejected saves still do not apply a response, preserving the user's edits.

- Regression test: `salva na API, mantém os edits em caso de erro e só atualiza a ficha após sucesso`.
- Command: `npm run test:run -- src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx`
- Output: `Test Files 1 passed (1); Tests 8 passed (8); Duration 7.68s`.
- Additional verification: `npm run test:run -- src/modules/olericultura/components/FichaCampoOlericultura.test.tsx` — 1 file / 8 tests passed; `npm run typecheck` — passed.
