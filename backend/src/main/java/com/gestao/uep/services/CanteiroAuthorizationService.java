package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.CanteiroResponsavelRepository;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class CanteiroAuthorizationService {

    private final CanteiroResponsavelRepository responsavelRepository;

    public CanteiroAuthorizationService(CanteiroResponsavelRepository responsavelRepository) {
        this.responsavelRepository = responsavelRepository;
    }

    public boolean eProfessor(Usuario usuario) {
        return usuario != null
                && (usuario.getRole() == UsuarioRole.PROFESSOR || usuario.getRole() == UsuarioRole.ADMIN);
    }

    public boolean podeEditar(String canteiroId, Usuario usuario) {
        return eProfessor(usuario)
                || (usuario != null
                && usuario.getRole() == UsuarioRole.ALUNO
                && responsavelRepository.existsByCanteiroIdAndUsuarioId(canteiroId, usuario.getId()));
    }

    public void exigirLeitura(String canteiroId, Usuario usuario) {
        if (usuario == null || (!eProfessor(usuario)
                && (usuario.getRole() != UsuarioRole.ALUNO
                || !responsavelRepository.existsByCanteiroIdAndUsuarioId(canteiroId, usuario.getId())))) {
            throw new AccessDeniedException("Usuario nao possui acesso a este canteiro");
        }
    }

    public void exigirEdicao(String canteiroId, Usuario usuario) {
        if (!podeEditar(canteiroId, usuario)) {
            throw new AccessDeniedException("Usuario nao possui permissao para editar este canteiro");
        }
    }

    public void exigirProfessor(Usuario usuario) {
        if (!eProfessor(usuario)) {
            throw new AccessDeniedException("Somente professores podem administrar equipes de canteiros");
        }
    }
}
