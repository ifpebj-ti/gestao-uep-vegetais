import { UepType } from '../types/uep';
import { UserSession } from './authService';

export interface ProfessorCadastrado {
  id: string;
  nome: string;
  email: string;
  uep: UepType;
  criadoEm: string;
}

export interface CriarProfessorInput {
  nome: string;
  email: string;
  uep: UepType;
}

export interface AtualizarProfessorInput {
  nome: string;
  email: string;
  uep: UepType;
}

const STORAGE_KEY = 'terrarium_admin_professores';

export const DEFAULT_ADMIN_PROFILE = {
  nome: 'Administrador Terrarium',
  email: 'admin@belojardim.ifpe.edu.br',
} as const;

export const DOMINIOS_DOCENTE_PERMITIDOS = [
  'belojardim.ifpe.edu.br',
  'ifpe.edu.br',
] as const;

export function isEmailInstitucionalDocente(email: string): boolean {
  const normalizado = email.trim().toLowerCase();
  if (normalizado === 'ifl1@discente.ifpe.edu.br') {
    return true;
  }
  const partes = normalizado.split('@');
  if (partes.length !== 2 || !partes[0]) return false;
  return DOMINIOS_DOCENTE_PERMITIDOS.includes(
    partes[1] as (typeof DOMINIOS_DOCENTE_PERMITIDOS)[number]
  );
}

const SEED_PROFESSORES: ProfessorCadastrado[] = [
  {
    id: 'prof-seed-1',
    nome: 'Prof. George Henrique',
    email: 'george@belojardim.ifpe.edu.br',
    uep: 'olericultura',
    criadoEm: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'prof-seed-2',
    nome: 'Profa. Carla Mendes',
    email: 'carla.mendes@belojardim.ifpe.edu.br',
    uep: 'fruticultura',
    criadoEm: '2026-02-15T14:30:00.000Z',
  },
];

function lerStorage(): ProfessorCadastrado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROFESSORES));
      return [...SEED_PROFESSORES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SEED_PROFESSORES];
  } catch {
    return [...SEED_PROFESSORES];
  }
}

function salvarStorage(lista: ProfessorCadastrado[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export const adminService = {
  listarProfessores(): ProfessorCadastrado[] {
    return lerStorage().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  buscarProfessorPorEmail(email: string): ProfessorCadastrado | null {
    if (!email) return null;
    const normalizado = email.trim().toLowerCase();
    const lista = lerStorage();
    return lista.find((p) => p.email.toLowerCase() === normalizado) ?? null;
  },

  obterUepDoProfessor(email: string, uepDaSessao?: string): UepType {
    if (uepDaSessao === 'fruticultura' || uepDaSessao === 'olericultura') {
      return uepDaSessao;
    }
    const cadastrado = this.buscarProfessorPorEmail(email);
    if (cadastrado) {
      return cadastrado.uep;
    }
    return 'olericultura';
  },

  criarProfessor(input: CriarProfessorInput): ProfessorCadastrado {
    const nome = input.nome.trim();
    const email = input.email.trim().toLowerCase();
    const uep = input.uep;

    if (!nome || !email) {
      throw new Error('Preencha o nome e o e-mail institucional do professor.');
    }

    if (!isEmailInstitucionalDocente(email)) {
      throw new Error(
        'Utilize apenas e-mail institucional docente (@belojardim.ifpe.edu.br ou @ifpe.edu.br).'
      );
    }

    const lista = lerStorage();
    if (lista.some((p) => p.email.toLowerCase() === email)) {
      throw new Error('Já existe um professor cadastrado com este e-mail.');
    }

    const novo: ProfessorCadastrado = {
      id: `prof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome,
      email,
      uep,
      criadoEm: new Date().toISOString(),
    };

    salvarStorage([...lista, novo]);
    return novo;
  },

  atualizarProfessor(id: string, input: AtualizarProfessorInput): ProfessorCadastrado {
    const nome = input.nome.trim();
    const email = input.email.trim().toLowerCase();
    const uep = input.uep;

    if (!nome || !email) {
      throw new Error('Nome e e-mail institucional são obrigatórios.');
    }

    if (!isEmailInstitucionalDocente(email)) {
      throw new Error(
        'Utilize apenas e-mail institucional docente (@belojardim.ifpe.edu.br ou @ifpe.edu.br).'
      );
    }

    const lista = lerStorage();
    const index = lista.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Professor não encontrado.');
    }

    const conflito = lista.find(
      (p) => p.email.toLowerCase() === email && p.id !== id
    );
    if (conflito) {
      throw new Error('Este e-mail já está vinculado a outro professor.');
    }

    const atual = lista[index];
    const atualizado: ProfessorCadastrado = {
      ...atual,
      nome,
      email,
      uep,
    };

    const novaLista = [...lista];
    novaLista[index] = atualizado;
    salvarStorage(novaLista);
    return atualizado;
  },

  removerProfessor(id: string): void {
    const lista = lerStorage();
    const filtrada = lista.filter((p) => p.id !== id);
    salvarStorage(filtrada);
  },

  autenticarLocal(email: string, senha: string): UserSession | null {
    const emailNormalizado = email.trim().toLowerCase();

    // 1. Conta do Administrador
    if (
      (emailNormalizado === DEFAULT_ADMIN_PROFILE.email ||
        emailNormalizado === 'admin@ifpe.edu.br') &&
      senha.trim().length > 0
    ) {
      return {
        token: `local-admin-jwt-${Date.now()}`,
        nome: DEFAULT_ADMIN_PROFILE.nome,
        email: emailNormalizado,
        role: 'ADMIN',
      };
    }

    // 2. Conta de Aluno (@discente.ifpe.edu.br) para homologação/testes locais
    if (emailNormalizado.endsWith('@discente.ifpe.edu.br') && senha.trim().length > 0) {
      const parteNome = emailNormalizado.split('@')[0].replace('.', ' ');
      const nomeFormatado = parteNome.charAt(0).toUpperCase() + parteNome.slice(1);
      return {
        token: `local-aluno-jwt-${Date.now()}`,
        nome: nomeFormatado || 'Estudante IFPE',
        email: emailNormalizado,
        role: 'ALUNO',
        uep: 'olericultura',
      };
    }

    // 3. Professores cadastrados no painel administrativo
    const prof = this.buscarProfessorPorEmail(emailNormalizado);
    if (prof && senha.trim().length > 0) {
      return {
        token: `local-prof-jwt-${Date.now()}`,
        nome: prof.nome,
        email: prof.email,
        role: 'PROFESSOR',
        uep: prof.uep,
      };
    }

    return null;
  },
};
