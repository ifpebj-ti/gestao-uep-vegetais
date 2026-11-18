import { apiClient } from './apiClient';

interface AcceptProfessorInvitationResponse {
  message: string;
}

export const invitationService = {
  acceptProfessorInvitation(token: string, senha: string): Promise<AcceptProfessorInvitationResponse> {
    return apiClient.post(
      '/auth/convites-professor/aceitar',
      { token, senha },
      { skipAuth: true }
    );
  },
};
