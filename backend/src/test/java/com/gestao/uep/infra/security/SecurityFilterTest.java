package com.gestao.uep.infra.security;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import com.gestao.uep.services.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityFilterTest {

    @Mock
    private TokenService tokenService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private SecurityFilter securityFilter;

    @BeforeEach
    void setUp() {
        securityFilter = new SecurityFilter(tokenService, usuarioRepository);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deveContinuarSemAutenticarQuandoHeaderNaoExiste() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        securityFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void deveAutenticarUsuarioQuandoTokenEhValido() throws ServletException, IOException {
        Usuario usuario = new Usuario(
                "Maria",
                "maria@ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );
        when(request.getHeader("Authorization")).thenReturn("Bearer token-valido");
        when(tokenService.validarToken("token-valido")).thenReturn(usuario.getEmail());
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(usuario);

        securityFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getPrincipal()).isEqualTo(usuario);
        assertThat(authentication.getAuthorities())
                .extracting(authority -> authority.getAuthority())
                .containsExactly("ROLE_USUARIO");
    }

    @Test
    void deveContinuarSemAutenticarQuandoTokenEhInvalido() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer token-invalido");
        when(tokenService.validarToken("token-invalido")).thenReturn("");

        securityFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
