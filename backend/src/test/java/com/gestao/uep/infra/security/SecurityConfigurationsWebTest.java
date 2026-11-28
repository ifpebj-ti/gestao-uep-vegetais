package com.gestao.uep.infra.security;

import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.services.TokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = SecurityConfigurationsWebTest.SecurityProbeController.class)
@Import({SecurityConfigurations.class, SecurityConfigurationsWebTest.SecurityProbeController.class,
        SecurityConfigurationsWebTest.SecurityTestBeans.class})
@TestPropertySource(properties = "app.cors.allowed-origins=http://localhost:5173")
class SecurityConfigurationsWebTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void configuraMockMvcComSuporteDoSpringSecurityTest() {
        mockMvc = webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    void rejeitaRotaPrivadaSemAutenticacao() throws Exception {
        mockMvc.perform(get("/api/private"))
                .andExpect(status().isForbidden());
    }

    @Test
    void responde401ComBearerParaRotaAdministrativaSemAutenticacao() throws Exception {
        mockMvc.perform(get("/api/admin/probe"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"));
    }

    @Test
    @WithMockUser(roles = "USUARIO")
    void permiteRotaAutenticadaMasBloqueiaRotaAdministrativaParaUsuarioComum() throws Exception {
        mockMvc.perform(get("/api/private"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/probe"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void permiteRotaAdministrativaParaAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/probe"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USUARIO")
    void exigeCsrfParaOperacaoDeEscritaMesmoEmRotaPublica() throws Exception {
        mockMvc.perform(post("/api/private"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/private").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USUARIO")
    void enviaHeadersDeSegurancaETrataSessaoComoStateless() throws Exception {
        mockMvc.perform(get("/api/private").secure(true))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy",
                        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                .andExpect(header().string("Referrer-Policy",
                        "strict-origin-when-cross-origin"))
                .andExpect(header().string("Strict-Transport-Security",
                        "max-age=31536000 ; includeSubDomains"))
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    @WithMockUser(roles = "USUARIO")
    void aceitaCorsConfiguradoERejeitaOrigemNaoPermitida() throws Exception {
        mockMvc.perform(options("/api/private")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));

        mockMvc.perform(get("/api/private")
                        .header(HttpHeaders.ORIGIN, "https://evil.example"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @RestController
    static class SecurityProbeController {

        @GetMapping("/api/private")
        String privateRoute() {
            return "private";
        }

        @PostMapping("/api/private")
        String privatePostRoute() {
            return "private-post";
        }

        @GetMapping("/api/admin/probe")
        String adminRoute() {
            return "admin";
        }

        @PostMapping("/api/auth/login")
        String publicPostRoute() {
            return "login";
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class SecurityTestBeans {

        @Bean
        TokenService tokenService() {
            return mock(TokenService.class);
        }

        @Bean
        UsuarioRepository usuarioRepository() {
            return mock(UsuarioRepository.class);
        }

        @Bean
        SecurityFilter securityFilter(TokenService tokenService, UsuarioRepository usuarioRepository) {
            return new SecurityFilter(tokenService, usuarioRepository);
        }
    }
}
