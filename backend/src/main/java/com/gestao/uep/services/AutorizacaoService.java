package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Serviço de autorização que integra o Spring Security com o banco de dados.
 * Implementa UserDetailsService para que o AuthenticationManager
 * consiga consultar o usuário durante o processo de login.
 */
@Service
public class AutorizacaoService implements UserDetailsService {

    private final UsuarioRepository repository;

    public AutorizacaoService(UsuarioRepository repository) {
        this.repository = repository;
    }

    /**
     * Carrega os dados do usuário pelo e-mail para autenticação.
     *
     * @param username e-mail do usuário (utilizado como identificador de login)
     * @return UserDetails do usuário encontrado
     * @throws UsernameNotFoundException se o e-mail não for encontrado
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails usuario = repository.findByEmail(username);
        if (usuario == null) {
            throw new UsernameNotFoundException("Usuário não encontrado com o e-mail: " + username);
        }
        return usuario;
    }
}
