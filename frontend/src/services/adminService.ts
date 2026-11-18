import type { UepType } from '../types/uep';
import { apiClient } from './apiClient';

export interface ProfessorCadastrado {
  id: string;
  nome: string;
  email: string;
  uep: UepType;
  criadoEm: string;
  ativo: boolean;
  emailVerificado: boolean;
  convitePendente: boolean;
}

interface DadosProfessor {
  nome: string;
  email: string;
  uep: UepType;
}

export interface ResultadoAlteracaoProfessor {
  professor: ProfessorCadastrado;
  emailEnviado?: boolean | null;
  message?: string | null;
}

const PROFESSORES_ENDPOINT = '/admin/professores';

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

export const adminService = {
  listarProfessores(): Promise<ProfessorCadastrado[]> {
    return apiClient.get(PROFESSORES_ENDPOINT);
  },

  criarProfessor(input: DadosProfessor): Promise<ResultadoAlteracaoProfessor> {
    return apiClient.post(PROFESSORES_ENDPOINT, input);
  },

  atualizarProfessor(id: string, input: DadosProfessor): Promise<ResultadoAlteracaoProfessor> {
    return apiClient.put(`${PROFESSORES_ENDPOINT}/${id}`, input);
  },

  reenviarConvite(id: string): Promise<ResultadoAlteracaoProfessor> {
    return apiClient.post(`${PROFESSORES_ENDPOINT}/${id}/reenviar-convite`);
  },

  alterarStatus(id: string, ativo: boolean): Promise<ProfessorCadastrado> {
    return apiClient.request(`${PROFESSORES_ENDPOINT}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    });
  },
};
