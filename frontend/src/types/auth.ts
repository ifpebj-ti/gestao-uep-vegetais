import { UepType } from './uep';

export type UserRole = 'PROFESSOR' | 'ALUNO' | 'ADMIN' | 'USUARIO';

export interface UserSession {
  token: string;
  nome: string;
  email: string;
  role?: UserRole | string;
  uep?: UepType | string;
}
