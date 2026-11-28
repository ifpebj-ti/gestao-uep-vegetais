import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { authService, UserSession } from './authService';
import { APP_CONFIG } from '../config/constants';

describe('AppSec Hardening — Testes de Auditoria Independente', () => {
  const STORAGE_KEY = APP_CONFIG.storageKeys.session;

  // Helper para construir JWT estruturado
  const buildJwt = (payloadObj: Record<string, unknown>, signature = 'assinatura-valida') => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(payloadObj));
    return `${header}.${payload}.${signature}`;
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1. JWT com payload role: ADMIN e assinatura falsa deve ser rejeitado no backend', async () => {
    const fakeAdminJwt = buildJwt(
      {
        sub: 'invasor@belojardim.ifpe.edu.br',
        role: 'ADMIN',
        nome: 'Invasor',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'assinatura-falsa'
    );

    const fakeSession: UserSession = {
      token: fakeAdminJwt,
      nome: 'Invasor',
      email: 'invasor@belojardim.ifpe.edu.br',
      role: 'ADMIN',
    };

    authService.saveSession(fakeSession);

    // Backend Spring Security rejeita a assinatura com 403 Forbidden
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ erro: 'Assinatura inválida' }),
      })
    );

    const validada = await authService.validarSessaoAtiva(fakeSession);
    expect(validada).toBeNull();
    // A sessão fraudulenta deve ter sido expurgada do storage
    expect(authService.getSession()).toBeNull();
  });

  it('2. JWT legítimo de ALUNO com tentativa de alteração do perfil para ADMIN no localStorage', () => {
    const alunoJwt = buildJwt({
      sub: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
      nome: 'Aluno Real',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    // Invasor salva session com role ADMIN no localStorage
    const tampered = {
      token: alunoJwt,
      nome: 'Aluno Real',
      email: 'admin@belojardim.ifpe.edu.br',
      role: 'ADMIN',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tampered));

    // getSession() deve neutralizar a elevação e forçar ALUNO com base no JWT
    const session = authService.getSession();
    expect(session).not.toBeNull();
    expect(session?.role).toBe('ALUNO');
    expect(session?.email).toBe('aluno@discente.ifpe.edu.br');
  });

  it('3. JWT sem claim role deve ser tratado como sessão inválida', () => {
    const jwtSemRole = buildJwt({
      sub: 'usuario@ifpe.edu.br',
      nome: 'Sem Role',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const sessionSemRole: UserSession = {
      token: jwtSemRole,
      nome: 'Sem Role',
      email: 'usuario@ifpe.edu.br',
    };

    expect(() => authService.saveSession(sessionSemRole)).toThrow('Sessão inválida para armazenamento.');
  });

  it('4. JWT expirado deve ser invalidado automaticamente', () => {
    const expiredJwt = buildJwt({
      sub: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
      nome: 'Expirado',
      exp: Math.floor(Date.now() / 1000) - 100, // expirou há 100 segundos
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: expiredJwt,
        nome: 'Expirado',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
      })
    );

    const session = authService.getSession();
    expect(session).toBeNull();
  });

  it('5. JWT malformado deve ser rejeitado', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: 'token.invalido.malformado!!!',
        nome: 'Invasor',
        email: 'invasor@ifpe.edu.br',
        role: 'ADMIN',
      })
    );

    const session = authService.getSession();
    expect(session).toBeNull();
  });

  it('6. Backend retornando 401 deve expurgar a sessão', async () => {
    const session: UserSession = {
      token: buildJwt({ sub: 'prof@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 }),
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
    };
    authService.saveSession(session);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })
    );

    const validada = await authService.validarSessaoAtiva(session);
    expect(validada).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('7. Backend retornando 403 deve expurgar a sessão', async () => {
    const session: UserSession = {
      token: buildJwt({ sub: 'prof@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 }),
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
    };
    authService.saveSession(session);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      })
    );

    const validada = await authService.validarSessaoAtiva(session);
    expect(validada).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('8. Backend indisponível por falha de rede não deve conceder novos privilégios', async () => {
    const session: UserSession = {
      token: buildJwt({ sub: 'prof@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 }),
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch (offline)'))
    );

    const validada = await authService.validarSessaoAtiva(session);
    expect(validada).toBeNull();
  });

  it('9. Sessão adulterada no localStorage é reparada ou descartada', () => {
    const validJwt = buildJwt({
      sub: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
      nome: 'Prof George',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: validJwt,
        nome: 'Nome Falso',
        email: 'admin@belojardim.ifpe.edu.br',
        role: 'ADMIN',
      })
    );

    const session = authService.getSession();
    expect(session?.role).toBe('PROFESSOR');
    expect(session?.email).toBe('george@belojardim.ifpe.edu.br');
  });

  it('9.1. Backend JWT com subject em formato UUID preserva o e-mail da sessão', () => {
    const backendUuidJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'PROFESSOR',
      uep: 'olericultura',
      nome: 'Prof George',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    authService.saveSession({
      token: backendUuidJwt,
      nome: 'Prof George',
      email: 'george@belojardim.ifpe.edu.br',
      role: 'PROFESSOR',
      uep: 'olericultura',
    });

    const session = authService.getSession();
    expect(session).not.toBeNull();
    expect(session?.email).toBe('george@belojardim.ifpe.edu.br');
    expect(session?.role).toBe('PROFESSOR');
    expect(session?.uep).toBe('olericultura');
  });

  it('9.2. UEP adulterada no localStorage é descartada quando divergente do JWT assinado', () => {
    const backendUuidJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'PROFESSOR',
      uep: 'olericultura',
      nome: 'Prof George',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    // Invasor adultera o localStorage injetando "uep": "fruticultura"
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: backendUuidJwt,
        nome: 'Prof George',
        email: 'george@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
        uep: 'fruticultura', // tentativa de manipulação
      })
    );

    const session = authService.getSession();
    expect(session).not.toBeNull();
    // A UEP deve ser a do JWT ('olericultura'), e o storage deve ser higienizado
    expect(session?.uep).toBe('olericultura');

    const storageRaw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(storageRaw.uep).toBe('olericultura');
  });

  it('9.3. Sessão com JWT sem claim de UEP resulta em uep undefined (fail-closed, sem fallback para storage)', () => {
    const jwtSemUep = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'ALUNO',
      nome: 'Aluno Teste',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: jwtSemUep,
        nome: 'Aluno Teste',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'olericultura', // valor injetado no storage sem respaldo no token
      })
    );

    const session = authService.getSession();
    expect(session).not.toBeNull();
    // A UEP NÃO pode ser aceita do storage local
    expect(session?.uep).toBeUndefined();
  });

  it('9.4. Tentativa de adulteração da UEP no sessionStorage é descartada e higienizada', () => {
    const backendUuidJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'ALUNO',
      nome: 'Aluno Teste',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    // Invasor adultera o sessionStorage injetando "uep": "fruticultura"
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: backendUuidJwt,
        nome: 'Aluno Teste',
        email: 'aluno@discente.ifpe.edu.br',
        role: 'ALUNO',
        uep: 'fruticultura', // tentativa de manipulação no sessionStorage
      })
    );

    const session = authService.getSession();
    expect(session).not.toBeNull();
    // UEP não é aceita do sessionStorage
    expect(session?.uep).toBeUndefined();

    const sessionRaw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    expect(sessionRaw.uep).toBeUndefined();
  });

  it('10. Logout seguido de novo acesso deve retornar nulo', () => {
    authService.saveSession({
      token: buildJwt({ sub: 'aluno@discente.ifpe.edu.br', role: 'ALUNO', exp: Math.floor(Date.now() / 1000) + 3600 }),
      nome: 'Aluno',
      email: 'aluno@discente.ifpe.edu.br',
      role: 'ALUNO',
    });

    expect(authService.isAuthenticated()).toBe(true);

    authService.logout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getSession()).toBeNull();
  });

  it('11. Verificação de limpeza dos dados cadastrais e temporários no logout com preservação de layouts 3D', () => {
    localStorage.setItem(STORAGE_KEY, '{"token":"123"}');
    sessionStorage.setItem('temp_data', '123');
    localStorage.setItem('terrarium_admin_professores', '[{"id":"1"}]');
    localStorage.setItem('terrarium_admin_professores_seed_migrations', '["prof-seed-3"]');
    localStorage.setItem('terrarium_turmas', '[{"id":"turma-1"}]');
    localStorage.setItem('terrarium_turmas_seed_migrations', '["turma-seed-1"]');
    localStorage.setItem('terrarium_aluno_turma_vinculo', '{"aluno":"turma-1"}');
    localStorage.setItem('terrarium_aluno_turma_ativa', 'turma-1');
    localStorage.setItem('terrarium_tarefas_alunos', '[{"id":"t1"}]');
    localStorage.setItem('terrarium_tarefas_turma', '[{"id":"t2"}]');
    localStorage.setItem('terrarium_historico_alunos', '[{"id":"h1"}]');
    localStorage.setItem('terrarium_uep_registros_colheita_v2', '[{"id":"col-1"}]');
    localStorage.setItem('terrarium_selected_uep', 'fruticultura');

    // Configurações físicas visuais que DEVEM ser estritamente preservadas:
    localStorage.setItem('terrarium_canteiro_layout', '{"canteiros":[]}');
    localStorage.setItem('terrarium_canteiro_terreno', '{"largura":50}');
    localStorage.setItem('terrarium_pomar_layout', '{"quadras":[]}');

    authService.logout();

    // Verificações de limpeza completa de dados sensíveis e cadastrais
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem('temp_data')).toBeNull();
    expect(localStorage.getItem('terrarium_admin_professores')).toBeNull();
    expect(localStorage.getItem('terrarium_admin_professores_seed_migrations')).toBeNull();
    expect(localStorage.getItem('terrarium_turmas')).toBeNull();
    expect(localStorage.getItem('terrarium_turmas_seed_migrations')).toBeNull();
    expect(localStorage.getItem('terrarium_aluno_turma_vinculo')).toBeNull();
    expect(localStorage.getItem('terrarium_aluno_turma_ativa')).toBeNull();
    expect(localStorage.getItem('terrarium_tarefas_alunos')).toBeNull();
    expect(localStorage.getItem('terrarium_tarefas_turma')).toBeNull();
    expect(localStorage.getItem('terrarium_historico_alunos')).toBeNull();
    expect(localStorage.getItem('terrarium_uep_registros_colheita_v2')).toBeNull();
    expect(localStorage.getItem('terrarium_selected_uep')).toBeNull();

    // Verificação de preservação do layout 3D físico das UEPs
    expect(localStorage.getItem('terrarium_canteiro_layout')).toBe('{"canteiros":[]}');
    expect(localStorage.getItem('terrarium_canteiro_terreno')).toBe('{"largura":50}');
    expect(localStorage.getItem('terrarium_pomar_layout')).toBe('{"quadras":[]}');
  });

  it('12. Cancelamento com AbortSignal em validarSessaoAtiva repassa AbortError', async () => {
    const session: UserSession = {
      token: buildJwt({ sub: 'prof@ifpe.edu.br', role: 'PROFESSOR', exp: Math.floor(Date.now() / 1000) + 3600 }),
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
    };

    const controller = new AbortController();
    controller.abort();

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await expect(authService.validarSessaoAtiva(session, controller.signal)).rejects.toThrow('The operation was aborted');
  });

  it('13. SEGURANÇA NO BUILD: ausência do mecanismo de autenticação local no bundle de produção', () => {
    const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
    if (!fs.existsSync(distAssetsDir)) {
      // Se dist ainda não foi gerado, ignora
      return;
    }

    const jsFiles = fs.readdirSync(distAssetsDir).filter((file: string) => file.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    const termosProibidos = [
      'local-admin-',
      'local-prof-',
      'local-aluno-',
      'VITE_ENABLE_LOCAL_AUTH',
      'mockAuthDev',
    ];

    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
      for (const termo of termosProibidos) {
        expect(
          content.includes(termo),
          `VULNERABILIDADE: Termo sensível '${termo}' encontrado no bundle de produção '${file}'`
        ).toBe(false);
      }
    }
  });

  it('14. Resposta 404 de /api/auth/me expurga a sessão e mantém fail-closed (não aceita sessão local)', async () => {
    const session: UserSession = {
      token: buildJwt({ sub: 'prof@ifpe.edu.br', role: 'PROFESSOR', uep: 'olericultura', exp: Math.floor(Date.now() / 1000) + 3600 }),
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
      uep: 'olericultura',
    };
    authService.saveSession(session);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    const validada = await authService.validarSessaoAtiva(session);
    expect(validada).toBeNull();
    // Sessão deve ter sido expurgada para garantir fail-closed
    expect(authService.getSession()).toBeNull();
  });

  it('15. Recarregar a aplicação não restaura uma UEP adulterada no storage', () => {
    const validJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'PROFESSOR',
      uep: 'olericultura',
      nome: 'Prof George',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    // Simula adulteração no localStorage antes do reload
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: validJwt,
        nome: 'Prof George',
        email: 'george@belojardim.ifpe.edu.br',
        role: 'PROFESSOR',
        uep: 'fruticultura', // Atacante adulterou para tentar acessar Fruticultura
      })
    );

    // Na inicialização da aplicação (reload), getSession() sanitiza contra o token assinado
    const restoredSession = authService.getSession();
    expect(restoredSession).not.toBeNull();
    // A UEP restaurada é estritamente a do JWT assinado ('olericultura')
    expect(restoredSession?.uep).toBe('olericultura');

    // O storage é reparado
    const storageAtualizado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(storageAtualizado.uep).toBe('olericultura');
  });

  it('16. Alteração de e-mail no storage não altera a identidade validada pelo backend', async () => {
    const validJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'ALUNO',
      uep: 'olericultura',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const tamperedSession: UserSession = {
      token: validJwt,
      nome: 'Aluno Manipulador',
      email: 'admin.falso@belojardim.ifpe.edu.br', // e-mail adulterado no cliente
      role: 'ALUNO',
      uep: 'olericultura',
    };

    // Backend retorna o e-mail real autenticado
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'aluno.real@discente.ifpe.edu.br',
          nome: 'Aluno Real',
          role: 'ALUNO',
          uep: 'olericultura',
        }),
      })
    );

    const validada = await authService.validarSessaoAtiva(tamperedSession);
    expect(validada).not.toBeNull();
    // Prevalece exclusivamente o e-mail do backend
    expect(validada?.email).toBe('aluno.real@discente.ifpe.edu.br');
  });

  it('17. Resposta incompleta do /auth/me (sem role ou sem email) é rejeitada com fail-closed', async () => {
    const validJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'PROFESSOR',
      uep: 'olericultura',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const session: UserSession = {
      token: validJwt,
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
      uep: 'olericultura',
    };
    authService.saveSession(session);

    // Backend responde 200 mas sem campo de role
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          email: 'prof@ifpe.edu.br',
          nome: 'Professor',
          // sem role!
        }),
      })
    );

    const validada = await authService.validarSessaoAtiva(session);
    expect(validada).toBeNull();
    expect(authService.getSession()).toBeNull();
  });

  it('18. Token sem perfil válido no backend (retorno nulo ou vazio) não libera acesso', async () => {
    const validJwt = buildJwt({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'PROFESSOR',
      uep: 'olericultura',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const session: UserSession = {
      token: validJwt,
      nome: 'Professor',
      email: 'prof@ifpe.edu.br',
      role: 'PROFESSOR',
      uep: 'olericultura',
    };
    authService.saveSession(session);

    // Backend responde com JSON vazio
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => null,
      })
    );

    const validada = await authService.validarSessaoAtiva(session);
    expect(validada).toBeNull();
    expect(authService.getSession()).toBeNull();
  });
});
