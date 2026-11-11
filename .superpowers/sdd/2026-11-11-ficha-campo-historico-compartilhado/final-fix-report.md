# Final-review fix wave

## Fixes

- Removed the student detail page's fallback to the first canteiro. An unmatched route now renders a not-found state and does not mount the detail component, preventing ficha, history, cultivation-model reads, or saves. Added a regression test for the no-I/O behavior.
- Added the history-event UUID to `HistoricoFichaCampoDTO`, verified its JSON response and service mapping, added it to `HistoricoFichaCampoApi`, and keyed timeline events by that UUID.
- Added a professor-page assertion that a successful ficha save causes a second `getHistorico` call.

## Tests and checks

- Command: `npm run test:run -- src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx src/modules/olericultura/pages/professor/CanteiroDetailPage.test.tsx src/services/canteiroService.test.ts src/modules/olericultura/components/HistoricoFichaTimeline.test.tsx`
  Output: `Test Files 4 passed (4); Tests 25 passed (25)`.
- Command: `npm run typecheck`
  Output: `tsc --noEmit` exited 0.
- Command: `& 'C:\Users\italo\Tools\maven\apache-maven-3.9.16\bin\mvn.cmd' '-Dtest=CanteiroControllerTest,CanteiroServiceTest' test`
  Output: `Tests run: 8, Failures: 0, Errors: 0, Skipped: 0; BUILD SUCCESS`.
- Command: `& 'C:\Users\italo\Tools\maven\apache-maven-3.9.16\bin\mvn.cmd' test`
  Output: `Tests run: 62, Failures: 0, Errors: 0, Skipped: 0; BUILD SUCCESS`.
- Command: `git diff --check`
  Output: exit 0; no whitespace errors. Git printed line-ending normalization notices for some modified files.

## Files changed

- `backend/src/main/java/com/gestao/uep/domain/canteiro/dto/HistoricoFichaCampoDTO.java`
- `backend/src/test/java/com/gestao/uep/controllers/CanteiroControllerTest.java`
- `backend/src/test/java/com/gestao/uep/services/CanteiroServiceTest.java`
- `frontend/src/modules/olericultura/components/HistoricoFichaTimeline.test.tsx`
- `frontend/src/modules/olericultura/components/HistoricoFichaTimeline.tsx`
- `frontend/src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.test.tsx`
- `frontend/src/modules/olericultura/pages/aluno/AlunoCanteiroDetailPage.tsx`
- `frontend/src/modules/olericultura/pages/professor/CanteiroDetailPage.test.tsx`
- `frontend/src/services/canteiroService.test.ts`
- `frontend/src/services/canteiroService.ts`

## Concerns and limitations

- Tests passed. Maven emitted existing compiler/deprecation/unchecked warnings and JDK/Mockito dynamic-agent warnings; no test failure resulted.
- The pre-existing untracked `docs/superpowers/plans/` content was not modified or included.
