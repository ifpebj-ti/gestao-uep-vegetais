package com.gestao.uep.infra.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class SecurityConfigurationsTest {

    private final SecurityConfigurations configuration =
            new SecurityConfigurations(mock(SecurityFilter.class));

    @Test
    void corsAceitaSomenteOrigensConfiguradasESemCredenciais() {
        var source = configuration.corsConfigurationSource(
                "https://app.example.edu.br, https://admin.example.edu.br");
        CorsConfiguration cors = source.getCorsConfiguration(
                new MockHttpServletRequest("GET", "/api/usuarios"));

        assertThat(cors).isNotNull();
        assertThat(cors.checkOrigin("https://app.example.edu.br")).isEqualTo("https://app.example.edu.br");
        assertThat(cors.checkOrigin("https://evil.example")).isNull();
        assertThat(cors.getAllowCredentials()).isFalse();
        assertThat(cors.getAllowedMethods()).containsExactly("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        assertThat(cors.getAllowedHeaders()).containsExactly("Authorization", "Content-Type", "Accept", "Origin");
        assertThat(cors.getMaxAge()).isEqualTo(3600L);
    }

    @Test
    void corsRejeitaOrigemCuringa() {
        assertThatThrownBy(() -> configuration.corsConfigurationSource("*"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("wildcard");
    }
}
