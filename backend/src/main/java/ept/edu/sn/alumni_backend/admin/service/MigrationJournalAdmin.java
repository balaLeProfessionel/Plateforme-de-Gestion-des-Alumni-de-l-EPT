package ept.edu.sn.alumni_backend.admin.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Bases créées avant TypeActionAdminConverter : retire l'ancienne contrainte CHECK figée sur les quatre
 * premiers types de décision. Idempotent (IF EXISTS) ; sans effet sur une base créée depuis.
 */
@Component
@RequiredArgsConstructor
public class MigrationJournalAdmin implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments arguments) {
        jdbcTemplate.execute("alter table actions_admin drop constraint if exists actions_admin_type_check");
    }
}
