package com.gestao.uep.integration;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.CanteiroRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("integration")
class PostgresPersistenceIT {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CanteiroRepository canteiroRepository;

    @Test
    void appliesFlywayMigrationsAndPersistsCanteiroInPostgres() {
        Integer appliedMigrations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = TRUE",
                Integer.class
        );

        assertThat(appliedMigrations).isGreaterThanOrEqualTo(10);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'canteiros'",
                Integer.class
        )).isEqualTo(1);

        Canteiro canteiro = new Canteiro("it-postgres", "ITPG", "Canteiro de integração");
        canteiroRepository.saveAndFlush(canteiro);

        assertThat(canteiroRepository.findById("it-postgres"))
                .isPresent()
                .get()
                .extracting(Canteiro::getCodigo, Canteiro::getNome)
                .containsExactly("ITPG", "Canteiro de integração");
    }
}
