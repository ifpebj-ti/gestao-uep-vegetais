package com.gestao.uep.controllers;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import com.gestao.uep.domain.usuario.dto.LoginDTO;
import com.gestao.uep.domain.usuario.dto.RegistroDTO;
import com.gestao.uep.domain.usuario.dto.ReenvioConfirmacaoDTO;
import com.gestao.uep.services.EmailInstitucionalService;
import com.gestao.uep.services.EmailService;
import com.gestao.uep.services.EmailVerificationTokenService;
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
import static org.mockito.ArgumentMatchers.any;
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

    @Mock
    private EmailInstitucionalService emailInstitucionalService;

    @Mock
    private EmailVerificationTokenService verificationTokenService;

    @Mock
    private EmailService emailService;

    private AuthController controller;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        controller = new AuthController(
                authenticationManager,
                usuarioRepository,
                tokenService,
                passwordEncoder,
                emailInstitucionalService,
                verificationTokenService,
                emailService
        );

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setValidator(validator)
                .build();
    }

    @Test
    void deveAutenticarUsuarioERetornarTokenEPapel() {
        Usuario usuario = usuarioComum();
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                usuario,
                null,
                usuario.getAuthorities()
        );
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-de-teste");

        var response = controller.login(new LoginDTO(usuario.getEmail(), "senha"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isEqualTo("jwt-de-teste");
        assertThat(response.getBody().role()).isEqualTo(UsuarioRole.USUARIO);
    }

    @Test
    void deveRejeitarCredenciaisInvalidas() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Credenciais invalidas"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        controller.login(new LoginDTO("maria@discente.ifpe.edu.br", "senha-incorreta")))
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
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenService.gerarToken(usuario)).thenReturn("jwt-de-teste");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"maria@discente.ifpe.edu.br\",\"senha\":\"senha\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-de-teste"))
                .andExpect(jsonPath("$.role").value("USUARIO"));
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
    void deveCadastrarAlunoComSenhaCriptografadaEEnviarConfirmacao() {
        RegistroDTO dados = new RegistroDTO(
                "Maria",
                " Maria@DISCENTE.IFPE.EDU.BR ",
                "senha-segura"
        );
        when(emailInstitucionalService.normalizar(dados.email()))
                .thenReturn("maria@discente.ifpe.edu.br");
        when(emailInstitucionalService.identificarPapel("maria@discente.ifpe.edu.br"))
                .thenReturn(java.util.Optional.of(UsuarioRole.ALUNO));
        when(usuarioRepository.findByEmail("maria@discente.ifpe.edu.br")).thenReturn(null);
        when(passwordEncoder.encode(dados.senha())).thenReturn("hash-da-senha");
        when(verificationTokenService.emitir(any(Usuario.class), org.mockito.ArgumentMatchers.eq(false)))
                .thenReturn("token-bruto");

        var response = controller.registrar(dados);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getNome()).isEqualTo("Maria");
        assertThat(captor.getValue().getEmail()).isEqualTo("maria@discente.ifpe.edu.br");
        assertThat(captor.getValue().getPassword()).isEqualTo("hash-da-senha");
        assertThat(captor.getValue().getRole()).isEqualTo(UsuarioRole.ALUNO);
        assertThat(captor.getValue().isEnabled()).isFalse();
        verify(emailService).enviarConfirmacao("maria@discente.ifpe.edu.br", "token-bruto");
    }

    @Test
    void deveRecusarCadastroComDominioNaoInstitucional() {
        RegistroDTO dados = new RegistroDTO("Maria", "maria@gmail.com", "senha-segura");
        when(emailInstitucionalService.normalizar(dados.email())).thenReturn(dados.email());
        when(emailInstitucionalService.identificarPapel(dados.email()))
                .thenReturn(java.util.Optional.empty());

        var response = controller.registrar(dados);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        verifyNoInteractions(usuarioRepository, passwordEncoder, emailService);
    }

    @Test
    void deveRecusarCadastroComEmailDuplicado() {
        RegistroDTO dados = new RegistroDTO(
                "Maria",
                "maria@discente.ifpe.edu.br",
                "senha-segura"
        );
        when(emailInstitucionalService.normalizar(dados.email())).thenReturn(dados.email());
        when(emailInstitucionalService.identificarPapel(dados.email()))
                .thenReturn(java.util.Optional.of(UsuarioRole.ALUNO));
        when(usuarioRepository.findByEmail(dados.email())).thenReturn(usuarioComum());

        var response = controller.registrar(dados);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(passwordEncoder, emailService);
    }

    @Test
    void deveConfirmarEmailComTokenValido() {
        when(verificationTokenService.confirmar("token-valido")).thenReturn(usuarioComum());

        var response = controller.confirmarEmail("token-valido");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(verificationTokenService).confirmar("token-valido");
    }

    @Test
    void deveReenviarConfirmacaoParaContaPendente() {
        Usuario pendente = new Usuario(
                "Maria",
                "maria@discente.ifpe.edu.br",
                "hash",
                UsuarioRole.ALUNO,
                false
        );
        when(emailInstitucionalService.normalizar(pendente.getEmail())).thenReturn(pendente.getEmail());
        when(emailInstitucionalService.identificarPapel(pendente.getEmail()))
                .thenReturn(java.util.Optional.of(UsuarioRole.ALUNO));
        when(usuarioRepository.findByEmail(pendente.getEmail())).thenReturn(pendente);
        when(verificationTokenService.emitir(pendente, true)).thenReturn("novo-token");

        var response = controller.reenviarConfirmacao(
                new ReenvioConfirmacaoDTO(pendente.getEmail())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        verify(emailService).enviarConfirmacao(pendente.getEmail(), "novo-token");
    }

    @Test
    void deveResponderDeFormaGenericaParaEmailNaoCadastrado() {
        when(emailInstitucionalService.normalizar("desconhecido@discente.ifpe.edu.br"))
                .thenReturn("desconhecido@discente.ifpe.edu.br");
        when(emailInstitucionalService.identificarPapel("desconhecido@discente.ifpe.edu.br"))
                .thenReturn(java.util.Optional.of(UsuarioRole.ALUNO));
        when(usuarioRepository.findByEmail("desconhecido@discente.ifpe.edu.br"))
                .thenReturn(null);

        var response = controller.reenviarConfirmacao(
                new ReenvioConfirmacaoDTO("desconhecido@discente.ifpe.edu.br")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        org.mockito.Mockito.verifyNoInteractions(emailService, verificationTokenService);
    }

    @Test
    void deveValidarCamposObrigatoriosDosDtos() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        assertThat(validator.validate(new LoginDTO("", ""))).isNotEmpty();
        assertThat(validator.validate(new RegistroDTO("", "email-invalido", "123")))
                .isNotEmpty();
    }

    private Usuario usuarioComum() {
        return new Usuario(
                "Maria",
                "maria@discente.ifpe.edu.br",
                "hash",
                UsuarioRole.USUARIO
        );
    }
}
