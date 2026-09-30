package com.gestao.uep.controllers;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import com.gestao.uep.domain.usuario.dto.LoginDTO;
import com.gestao.uep.domain.usuario.dto.RegistroDTO;
import com.gestao.uep.services.TokenService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        controller = new AuthController(
                authenticationManager,
                usuarioRepository,
                tokenService,
                passwordEncoder
        );

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setValidator(validator)
                .build();
    }

    @Test
    void deveAutenticarUsuarioERetornarToken() {
        Usuario usuario = usuarioComum();
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                usuario,
                null,
                usuario.getAuthorities()
        );
        when(authenticationManager.authenticate(org.mockito.ArgumentMatchers.any()))
                .thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-de-teste");

        var response = controller.login(new LoginDTO(usuario.getEmail(), "senha"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isEqualTo("jwt-de-teste");
        assertThat(response.getBody().nome()).isEqualTo(usuario.getNome());
        assertThat(response.getBody().email()).isEqualTo(usuario.getEmail());

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertThat(captor.getValue()).isInstanceOf(UsernamePasswordAuthenticationToken.class);
        assertThat(captor.getValue().getPrincipal()).isEqualTo(usuario.getEmail());
        assertThat(captor.getValue().getCredentials()).isEqualTo("senha");
    }

    @Test
    void deveRejeitarCredenciaisInvalidas() {
        when(authenticationManager.authenticate(org.mockito.ArgumentMatchers.any()))
                .thenThrow(new BadCredentialsException("Credenciais inválidas"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        controller.login(new LoginDTO("maria@ifpe.edu.br", "senha-incorreta")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void deveRetornarRespostaJsonNoLoginHttp() throws Exception {
        Usuario usuario = usuarioComum();
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                usuario,
                null,
                usuario.getAuthorities()
        );
        when(authenticationManager.authenticate(org.mockito.ArgumentMatchers.any()))
                .thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-de-teste");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"maria@ifpe.edu.br\",\"senha\":\"senha\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-de-teste"))
                .andExpect(jsonPath("$.nome").value("Maria"))
                .andExpect(jsonPath("$.email").value("maria@ifpe.edu.br"));
    }

    @Test
    void deveRetornar400QuandoLoginRecebeDadosInvalidos() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"email-invalido\",\"senha\":\"\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authenticationManager);
    }

    @Test
    void deveRetornar400QuandoCadastroRecebeDadosInvalidos() throws Exception {
        mockMvc.perform(post("/api/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"email\":\"email-invalido\",\"senha\":\"123\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(usuarioRepository, passwordEncoder);
    }

    @Test
    void deveCadastrarUsuarioComSenhaCriptografada() {
        RegistroDTO dados = new RegistroDTO(
                "Maria",
                "maria@ifpe.edu.br",
                "senha-segura",
                UsuarioRole.USUARIO
        );
        when(usuarioRepository.findByEmail(dados.email())).thenReturn(null);
        when(passwordEncoder.encode(dados.senha())).thenReturn("hash-da-senha");

        var response = controller.registrar(dados);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getNome()).isEqualTo(dados.nome());
        assertThat(captor.getValue().getEmail()).isEqualTo(dados.email());
        assertThat(captor.getValue().getPassword()).isEqualTo("hash-da-senha");
        assertThat(captor.getValue().getRole()).isEqualTo(UsuarioRole.USUARIO);
    }

    @Test
    void deveIgnorarTentativaDeCriarAdministradorNoCadastroPublico() {
        RegistroDTO dados = new RegistroDTO(
                "Maria",
                "maria@ifpe.edu.br",
                "senha-segura",
                UsuarioRole.ADMIN
        );
        when(usuarioRepository.findByEmail(dados.email())).thenReturn(null);
        when(passwordEncoder.encode(dados.senha())).thenReturn("hash-da-senha");

        controller.registrar(dados);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(UsuarioRole.USUARIO);
    }

    @Test
    void deveRecusarCadastroComEmailDuplicado() {
        RegistroDTO dados = new RegistroDTO(
                "Maria",
                "maria@ifpe.edu.br",
                "senha-segura",
                UsuarioRole.USUARIO
        );
        when(usuarioRepository.findByEmail(dados.email())).thenReturn(usuarioComum());

        var response = controller.registrar(dados);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isEqualTo("{\"erro\": \"E-mail já cadastrado\"}");
        verifyNoInteractions(passwordEncoder);
        org.mockito.Mockito.verify(usuarioRepository, org.mockito.Mockito.never())
                .save(org.mockito.ArgumentMatchers.any(Usuario.class));
    }

    @Test
    void deveValidarCamposObrigatoriosDosDtos() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        assertThat(validator.validate(new LoginDTO("", ""))).isNotEmpty();
        assertThat(validator.validate(new RegistroDTO("", "email-invalido", "123", null)))
                .isNotEmpty();
    }

    private Usuario usuarioComum() {
        return new Usuario(
                "Maria",
                "maria@ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );
    }
}
