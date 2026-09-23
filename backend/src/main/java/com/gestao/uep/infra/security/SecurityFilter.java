package com.gestao.uep.infra.security;

import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.services.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de segurança que intercepta todas as requisições HTTP.
 * Recupera o token JWT do cabeçalho Authorization, valida-o
 * e insere o usuário autenticado no SecurityContextHolder.
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;

    public SecurityFilter(TokenService tokenService, UsuarioRepository usuarioRepository) {
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = recuperarToken(request);

        if (token != null) {
            String subject = tokenService.validarToken(token);

            if (!subject.isEmpty()) {
                UserDetails usuario = usuarioRepository.findByEmail(subject);

                if (usuario != null) {
                    var autenticacao = new UsernamePasswordAuthenticationToken(
                            usuario,
                            null,
                            usuario.getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(autenticacao);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrai o token JWT do cabeçalho Authorization.
     * Formato esperado: "Bearer <token>"
     *
     * @param request requisição HTTP
     * @return token JWT sem o prefixo "Bearer " ou null se ausente
     */
    private String recuperarToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }
}
